/**
 * GET /api/earnings/:symbol — Earnings calendar endpoint.
 *
 * Returns upcoming and recent earnings events for a symbol via Yahoo
 * quoteSummary calendarEvents + earnings modules. Caches in KV with 6h TTL.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";
import { fetchYahooEarningsCalendar, type YahooEarningsCalendar } from "../providers/yahoo.js";

const EARNINGS_TTL = 21600; // 6 hours
const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;

export async function handleEarningsCalendar(symbol: string, env: Env): Promise<Response> {
  const ticker = (symbol ?? "").toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) {
    return Response.json({ error: "Invalid or missing symbol" }, { status: 400 });
  }

  const cacheKey = `earnings:${ticker}`;

  // Try cache first
  if (env.QUOTE_CACHE) {
    const cached = await kvGet<YahooEarningsCalendar>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const data = await fetchYahooEarningsCalendar(ticker);

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, EARNINGS_TTL);
    }

    return Response.json({ ...data, source: "yahoo" });
  } catch {
    return Response.json(
      { error: "Failed to fetch earnings data", symbol: ticker },
      { status: 502 },
    );
  }
}
