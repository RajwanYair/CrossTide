/**
 * R2 cold OHLCV archival — store 20-year daily candle history in Cloudflare R2.
 *
 * Q15: Long-term OHLCV storage for top tickers. R2 provides:
 *  - Near-infinite retention at $0.015/GB/month
 *  - Failover data source when Yahoo/Finnhub/Stooq are down
 *  - Sub-100ms reads from edge (same CF data center as Worker)
 *
 * Object key format: `ohlcv/{TICKER}/daily.json`
 * Payload: JSON array of { date, open, high, low, close, volume } sorted oldest→newest
 *
 * Routes:
 *  GET  /api/archive/:ticker   — read archived candles (with optional date range filter)
 *
 * Cron:
 *  archiveTopTickers(env) — called from scheduled handler to refresh top tickers nightly
 */

import type { Env } from "../index.js";
import { fetchYahooChart } from "../providers/yahoo.js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArchivedCandle {
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

interface ArchiveMetadata {
  readonly ticker: string;
  readonly count: number;
  readonly firstDate: string;
  readonly lastDate: string;
  readonly updatedAt: string;
}

// ── R2Bucket interface ────────────────────────────────────────────────────────

interface R2ObjectBody {
  text(): Promise<string>;
  json<T>(): Promise<T>;
}

interface R2PutOptions {
  customMetadata?: Record<string, string>;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: string, options?: R2PutOptions): Promise<void>;
  head(key: string): Promise<{ customMetadata?: Record<string, string> } | null>;
  list(options?: { prefix?: string; limit?: number }): Promise<{
    objects: Array<{ key: string; customMetadata?: Record<string, string> }>;
  }>;
}

// ── Top tickers to archive ────────────────────────────────────────────────────

/** S&P 500 representative sample + major indices + popular ETFs. */
const TOP_TICKERS: readonly string[] = [
  // Mega-cap tech
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "META",
  "TSLA",
  "AVGO",
  "ORCL",
  "CRM",
  // Financials
  "JPM",
  "V",
  "MA",
  "BAC",
  "GS",
  "MS",
  "BLK",
  "AXP",
  "WFC",
  "C",
  // Healthcare
  "UNH",
  "JNJ",
  "LLY",
  "PFE",
  "ABBV",
  "MRK",
  "TMO",
  "ABT",
  "DHR",
  "AMGN",
  // Consumer
  "WMT",
  "PG",
  "KO",
  "PEP",
  "COST",
  "MCD",
  "NKE",
  "SBUX",
  "HD",
  "LOW",
  // Industrial + Energy
  "XOM",
  "CVX",
  "CAT",
  "BA",
  "UNP",
  "HON",
  "GE",
  "MMM",
  "DE",
  "LMT",
  // ETFs
  "SPY",
  "QQQ",
  "IWM",
  "DIA",
  "VTI",
  "VOO",
  "XLF",
  "XLK",
  "XLE",
  "XLV",
  // Indices (Yahoo format)
  "^GSPC",
  "^DJI",
  "^IXIC",
  "^RUT",
  "^VIX",
  // International
  "TSM",
  "ASML",
  "NVO",
  "SAP",
  "TM",
  // Crypto proxies (equity)
  "COIN",
  "MSTR",
  "RIOT",
  "MARA",
  "BITF",
  // Commodities ETFs
  "GLD",
  "SLV",
  "USO",
  "UNG",
  "COPX",
  // Bonds
  "TLT",
  "IEF",
  "SHY",
  "HYG",
  "LQD",
  // REITs
  "O",
  "AMT",
  "PLD",
  "EQIX",
  "SPG",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function objectKey(ticker: string): string {
  return `ohlcv/${ticker.toUpperCase()}/daily.json`;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────

/**
 * GET /api/archive/:ticker?from=2020-01-01&to=2025-01-01
 * Read archived candles from R2.
 */
export async function handleArchive(ticker: string, url: URL, env: Env): Promise<Response> {
  const bucket = (env as Env & { OHLCV_ARCHIVE?: R2Bucket }).OHLCV_ARCHIVE;
  if (!bucket) {
    return json({ error: "Archive storage not configured" }, 503);
  }

  const key = objectKey(ticker);
  const obj = await bucket.get(key);
  if (!obj) {
    return json({ error: `No archived data for ${ticker.toUpperCase()}` }, 404);
  }

  const candles = await obj.json<ArchivedCandle[]>();

  // Optional date range filter
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  let filtered = candles;
  if (from) {
    filtered = filtered.filter((c) => c.date >= from);
  }
  if (to) {
    filtered = filtered.filter((c) => c.date <= to);
  }

  return json({
    ticker: ticker.toUpperCase(),
    count: filtered.length,
    candles: filtered,
    source: "r2-archive",
  });
}

// ── Archive metadata listing ──────────────────────────────────────────────────

/**
 * GET /api/archive — list all archived tickers with metadata.
 */
export async function handleArchiveList(env: Env): Promise<Response> {
  const bucket = (env as Env & { OHLCV_ARCHIVE?: R2Bucket }).OHLCV_ARCHIVE;
  if (!bucket) {
    return json({ error: "Archive storage not configured" }, 503);
  }

  const list = await bucket.list({ prefix: "ohlcv/", limit: 200 });
  const tickers: ArchiveMetadata[] = list.objects.map((obj) => ({
    ticker: obj.key.split("/")[1] ?? obj.key,
    count: Number(obj.customMetadata?.["count"] ?? 0),
    firstDate: obj.customMetadata?.["firstDate"] ?? "",
    lastDate: obj.customMetadata?.["lastDate"] ?? "",
    updatedAt: obj.customMetadata?.["updatedAt"] ?? "",
  }));

  return json({ count: tickers.length, tickers });
}

// ── Cron: archive top tickers ─────────────────────────────────────────────────

/**
 * Nightly cron job: fetch max-range daily candles from Yahoo and store in R2.
 * Merges with existing data to avoid losing history when Yahoo truncates.
 *
 * Called from the `scheduled` handler in index.ts.
 * Processes tickers sequentially to respect rate limits.
 */
export async function archiveTopTickers(env: Env): Promise<{ archived: number; errors: string[] }> {
  const bucket = (env as Env & { OHLCV_ARCHIVE?: R2Bucket }).OHLCV_ARCHIVE;
  if (!bucket) {
    return { archived: 0, errors: ["OHLCV_ARCHIVE R2 binding not configured"] };
  }

  let archived = 0;
  const errors: string[] = [];

  for (const ticker of TOP_TICKERS) {
    try {
      // Fetch full history from Yahoo
      const result = await fetchYahooChart(ticker, "max", "1d");
      const newCandles: ArchivedCandle[] = result.candles.map((c) => ({
        date: c.date,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));

      // Merge with existing archived data
      const key = objectKey(ticker);
      const existing = await bucket.get(key);
      let merged: ArchivedCandle[];

      if (existing) {
        const old = await existing.json<ArchivedCandle[]>();
        // Build date→candle map, new data overwrites old for same dates
        const map = new Map<string, ArchivedCandle>();
        for (const c of old) map.set(c.date, c);
        for (const c of newCandles) map.set(c.date, c);
        merged = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
      } else {
        merged = newCandles;
      }

      // Write to R2 with metadata
      await bucket.put(key, JSON.stringify(merged), {
        customMetadata: {
          count: String(merged.length),
          firstDate: merged[0]?.date ?? "",
          lastDate: merged[merged.length - 1]?.date ?? "",
          updatedAt: new Date().toISOString(),
        },
      });

      archived++;

      // Rate limit: 200ms pause between tickers
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      errors.push(`${ticker}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { archived, errors };
}
