/**
 * Stooq Worker provider — free end-of-day CSV history feed.
 *
 * Endpoint: https://stooq.com/q/d/l/?s={symbol}&i=d
 * No API key required. US tickers use ".us" suffix, crypto uses ".v".
 *
 * Limitations:
 *  - History only (no real-time quote, no search)
 *  - ~20 req/min per IP
 *  - Returns full history; caller trims to requested range
 */

const STOOQ_BASE = "https://stooq.com";

// ── Error ─────────────────────────────────────────────────────────────────────

export class StooqApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "StooqApiError";
    this.status = status;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StooqCandle {
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface StooqChartResult {
  readonly ticker: string;
  readonly candles: readonly StooqCandle[];
  readonly source: string;
}

// ── Symbol Mapping ────────────────────────────────────────────────────────────

/** Known crypto base symbols that use ".v" suffix on Stooq. */
const CRYPTO_SYMBOLS = new Set([
  "btc",
  "eth",
  "xrp",
  "ltc",
  "ada",
  "sol",
  "doge",
  "bnb",
  "usdt",
  "avax",
  "dot",
  "matic",
  "link",
  "uni",
  "shib",
]);

/**
 * Map a CrossTide ticker to the Stooq symbol format.
 * - US equities: "AAPL" → "aapl.us"
 * - Crypto: "BTC" → "btc.v"
 * - Indices (^DJI): strip caret, lowercase
 * - Already suffixed: pass through
 */
export function toStooqSymbol(ticker: string): string {
  const t = ticker.toLowerCase();
  if (t.includes(".")) return t;
  if (CRYPTO_SYMBOLS.has(t)) return `${t}.v`;
  if (t.startsWith("^")) return t.slice(1);
  return `${t}.us`;
}

// ── CSV Parser ────────────────────────────────────────────────────────────────

/**
 * Parse Stooq CSV into candles. Stooq returns newest first; we reverse to oldest-first.
 * Format: Date,Open,High,Low,Close,Volume
 */
export function parseStooqCsv(csv: string, ticker: string): StooqCandle[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) {
    throw new StooqApiError(`Stooq: no data returned for ${ticker}`, 404);
  }

  const header = lines[0]?.toLowerCase().trim() ?? "";
  if (!header.startsWith("date")) {
    throw new StooqApiError(`Stooq: unexpected CSV format for ${ticker}`, 502);
  }

  const candles: StooqCandle[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]?.split(",");
    if (!parts || parts.length < 5) continue;
    const [date, open, high, low, close, volume] = parts;
    if (!date || !open || !high || !low || !close) continue;
    const o = parseFloat(open);
    const h = parseFloat(high);
    const l = parseFloat(low);
    const c = parseFloat(close);
    if (!Number.isFinite(o) || !Number.isFinite(h) || !Number.isFinite(l) || !Number.isFinite(c)) {
      continue;
    }
    candles.push({
      date: date.trim(),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: volume ? Math.round(parseFloat(volume)) || 0 : 0,
    });
  }

  if (candles.length === 0) {
    throw new StooqApiError(`Stooq: no valid candles for ${ticker}`, 404);
  }

  // Stooq returns newest-first; reverse to oldest-first
  return candles.reverse();
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Map a range string to number of days for trimming.
 */
function rangeToDays(range: string): number {
  const map: Record<string, number> = {
    "1d": 1,
    "5d": 5,
    "1mo": 30,
    "3mo": 90,
    "6mo": 180,
    "1y": 365,
    "2y": 730,
    "5y": 1825,
    max: 0, // 0 = no trim
  };
  return map[range] ?? 365;
}

/**
 * Fetch end-of-day candle history from Stooq.
 * Returns candles trimmed to the requested range (oldest-first).
 */
export async function fetchStooqHistory(
  ticker: string,
  range: string = "1y",
): Promise<StooqChartResult> {
  const symbol = toStooqSymbol(ticker);
  const url = `${STOOQ_BASE}/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;

  const res = await fetch(url, {
    headers: { "User-Agent": "CrossTide/1.0" },
  });

  if (!res.ok) {
    throw new StooqApiError(`Stooq returned ${res.status}`, res.status);
  }

  const csv = await res.text();
  const allCandles = parseStooqCsv(csv, ticker);

  const days = rangeToDays(range);
  const candles = days > 0 ? allCandles.slice(-days) : allCandles;

  return {
    ticker: ticker.toUpperCase(),
    candles,
    source: "stooq",
  };
}
