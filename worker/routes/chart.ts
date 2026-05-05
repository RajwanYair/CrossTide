/**
 * GET /api/chart?ticker=AAPL&range=1y&interval=1d
 *
 * Returns OHLCV candlestick data. In production (QUOTE_CACHE binding present),
 * fetches from Yahoo Finance and caches in KV. Falls back to deterministic
 * synthetic data when no KV binding (local dev, preview deploys without secrets).
 *
 * P1: Wire real Yahoo Finance chart data.
 * P2: KV caching with market-hours-aware TTL (integrated).
 */

import { fetchYahooChart, YahooApiError } from "../providers/yahoo.js";
import { kvGet, kvPut, chartTtl } from "../kv-cache.js";
import type { Env } from "../index.js";

export interface CandleRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** P4: Split factor on this date (e.g. 0.5 for a 2-for-1 forward split). */
  readonly splitFactor?: number;
  /** P4: Dividend per share paid on this date. */
  readonly dividendAmount?: number;
}

export interface ChartResponse {
  ticker: string;
  currency: string;
  candles: CandleRecord[];
  source: "yahoo" | "cache" | "demo";
}

const RANGE_DAYS: Record<string, number> = {
  "1d": 1,
  "5d": 5,
  "1mo": 30,
  "3mo": 90,
  "6mo": 180,
  "1y": 365,
  "2y": 730,
  "5y": 1825,
  max: 3650,
};

const VALID_RANGES = new Set(Object.keys(RANGE_DAYS));
const VALID_INTERVALS = new Set(["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"]);
const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;

export async function handleChart(url: URL, env: Env): Promise<Response> {
  const ticker = (url.searchParams.get("ticker") ?? "").toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) {
    return json({ error: "Invalid or missing ticker" }, 400);
  }

  const range = url.searchParams.get("range") ?? "1y";
  if (!VALID_RANGES.has(range)) {
    return json({ error: `Invalid range. Valid: ${[...VALID_RANGES].join(", ")}` }, 400);
  }

  const interval = url.searchParams.get("interval") ?? "1d";
  if (!VALID_INTERVALS.has(interval)) {
    return json({ error: `Invalid interval. Valid: ${[...VALID_INTERVALS].join(", ")}` }, 400);
  }

  // Try KV cache first
  const cacheKey = `chart:${ticker}:${range}:${interval}`;
  if (env.QUOTE_CACHE) {
    const cached = await kvGet<ChartResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return json({ ...cached, source: "cache" as const }, 200, "public, max-age=60");
    }
  }

  // Fetch from Yahoo Finance (production) or fall back to demo data
  if (env.QUOTE_CACHE) {
    try {
      const result = await fetchYahooChart(ticker, range, interval);
      const body: ChartResponse = { ...result, source: "yahoo" };

      // Cache with market-hours-aware TTL
      const ttl = chartTtl(range);
      await kvPut(env.QUOTE_CACHE, cacheKey, body, ttl);

      return json(body, 200, `public, max-age=${Math.min(ttl, 300)}`);
    } catch (err) {
      if (err instanceof YahooApiError && err.status === 404) {
        return json({ error: `Ticker not found: ${ticker}` }, 404);
      }
      // On Yahoo failure, fall through to demo data with a warning header
      const response = json(generateDemoResponse(ticker, range), 200, "public, max-age=60");
      response.headers.set("X-Data-Source", "demo-fallback");
      return response;
    }
  }

  // No KV binding — local dev / preview: serve demo data
  return json(generateDemoResponse(ticker, range), 200, "public, max-age=300");
}

// ── Demo data fallback ──────────────────────────────────────────────────────

function generateDemoResponse(ticker: string, range: string): ChartResponse {
  const days = RANGE_DAYS[range] ?? 365;
  return { ticker, currency: "USD", candles: generateCandles(ticker, days), source: "demo" };
}

/** Mulberry32 PRNG — deterministic, seedable. */
function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function strToSeed(str: string): number {
  let h = 0x12345678;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
  }
  return h >>> 0;
}

function generateCandles(ticker: string, days: number): CandleRecord[] {
  const rand = mulberry32(strToSeed(ticker));
  const candles: CandleRecord[] = [];
  let price = 100 + rand() * 400;

  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;

    const change = (rand() - 0.48) * price * 0.03;
    const open = Math.max(1, price);
    const close = Math.max(1, price + change);
    const high = Math.max(open, close) * (1 + rand() * 0.015);
    const low = Math.min(open, close) * (1 - rand() * 0.015);
    const volume = Math.round(1_000_000 + rand() * 50_000_000);

    candles.push({
      date: d.toISOString().slice(0, 10),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });

    price = close;
  }
  return candles;
}

// ── Response helpers ─────────────────────────────────────────────────────────

function json(body: unknown, status: number, cacheControl?: string): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cacheControl) headers["Cache-Control"] = cacheControl;
  return new Response(JSON.stringify(body), { status, headers });
}
