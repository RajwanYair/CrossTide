/**
 * Stooq provider — free end-of-day CSV history feed (F12).
 *
 * Endpoint: https://stooq.com/q/d/l/?s={symbol}&i=d
 * Response: CSV with header: Date,Open,High,Low,Close,Volume
 *           Date format: YYYY-MM-DD; newest rows first.
 *
 * Notes:
 * - No API key required.
 * - US equity tickers use ".us" suffix (AAPL → aapl.us).
 * - Crypto tickers use ".v" suffix (BTC → btc.v).
 * - CORS: Stooq serves with CORS headers — direct browser fetch works.
 * - Rate limit: ~20 req/min per IP; no documented limit.
 * - getQuote and search are not supported; they throw FetchError.
 */
import type { DailyCandle } from "../types/domain";
import type { MarketDataProvider, Quote, SearchResult, ProviderHealth } from "./types";
import { fetchWithTimeout, FetchError } from "../core/fetch";

const DEFAULT_BASE_URL = "https://stooq.com";

/**
 * Map a CrossTide ticker to the Stooq symbol format.
 *
 * - Standard US equities: "AAPL" → "aapl.us"
 * - Crypto tickers (BTC, ETH, etc.): "BTC" → "btc.v"
 * - Indices (^DJI, ^GSPC): keep as-is, lowercased
 * - International tickers already containing a "." are passed through.
 */
function toStooqSymbol(ticker: string): string {
  const t = ticker.toLowerCase();
  // Already has a Stooq-style suffix — pass through
  if (t.includes(".")) return t;
  // Known crypto base symbols
  const CRYPTO = new Set(["btc", "eth", "xrp", "ltc", "ada", "sol", "doge", "bnb", "usdt"]);
  if (CRYPTO.has(t)) return `${t}.v`;
  // Index symbols starting with "^" — strip caret, keep as-is
  if (t.startsWith("^")) return t.slice(1);
  // Default: US equity
  return `${t}.us`;
}

/**
 * Parse Stooq CSV response into DailyCandle array.
 * Stooq returns newest rows first; we reverse to oldest-first.
 */
function parseCsv(csv: string, ticker: string): DailyCandle[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) throw new FetchError(`Stooq: no data returned for ${ticker}`);

  const header = lines[0]?.toLowerCase().trim() ?? "";
  if (!header.startsWith("date"))
    throw new FetchError(`Stooq: unexpected CSV header for ${ticker}`);

  const candles: DailyCandle[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]?.split(",");
    if (!parts || parts.length < 5) continue;
    const [date, open, high, low, close, volume] = parts;
    if (!date || !open || !high || !low || !close) continue;
    const o = parseFloat(open);
    const h = parseFloat(high);
    const l = parseFloat(low);
    const c = parseFloat(close);
    if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c)) continue;
    candles.push({
      date: date.trim(),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: volume ? Math.round(parseFloat(volume)) : 0,
    });
  }

  if (candles.length === 0) throw new FetchError(`Stooq: no valid candles for ${ticker}`);
  // Stooq returns newest-first; reverse so callers get oldest-first
  return candles.reverse();
}

export function createStooqProvider(baseUrl: string = DEFAULT_BASE_URL): MarketDataProvider {
  let lastSuccessAt: number | null = null;
  let lastErrorAt: number | null = null;
  let consecutiveErrors = 0;

  function recordSuccess(): void {
    lastSuccessAt = Date.now();
    consecutiveErrors = 0;
  }

  function recordError(): void {
    lastErrorAt = Date.now();
    consecutiveErrors++;
  }

  async function getHistory(ticker: string, days: number): Promise<readonly DailyCandle[]> {
    const symbol = toStooqSymbol(ticker);
    // Stooq doesn't have a "last N days" param; we always fetch the full
    // available history and then trim to the requested window.
    const url = `${baseUrl}/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
    try {
      const res = await fetchWithTimeout(url, {}, 15000);
      const text = await res.text();
      const candles = parseCsv(text, ticker);
      recordSuccess();
      // Trim to requested window
      return days > 0 ? candles.slice(-days) : candles;
    } catch (err) {
      recordError();
      throw err;
    }
  }

  /** Stooq does not expose a quote endpoint — not supported. */
  function getQuote(_ticker: string): Promise<Quote> {
    recordError();
    return Promise.reject(new FetchError("Stooq: getQuote is not supported"));
  }

  /** Stooq does not expose a search endpoint — not supported. */
  function search(_query: string): Promise<readonly SearchResult[]> {
    recordError();
    return Promise.reject(new FetchError("Stooq: search is not supported"));
  }

  function health(): ProviderHealth {
    return {
      name: "stooq",
      available: consecutiveErrors < 3,
      lastSuccessAt,
      lastErrorAt,
      consecutiveErrors,
    };
  }

  return {
    name: "stooq",
    getQuote,
    getHistory,
    search,
    health,
  };
}
