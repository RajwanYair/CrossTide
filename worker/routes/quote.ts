/**
 * GET /api/quote/:symbol
 *
 * Returns a real-time quote for the given symbol. In production, fetches from
 * Yahoo Finance with KV caching. Falls back to synthetic data in dev.
 *
 * P1: Wire real Yahoo Finance quote data.
 */

import { fetchYahooQuote, YahooApiError, type YahooQuoteResult } from "../providers/yahoo.js";
import { kvGet, kvPut, quoteTtl } from "../kv-cache.js";
import type { Env } from "../index.js";

const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;

export async function handleQuote(symbol: string, env: Env): Promise<Response> {
  const ticker = (symbol ?? "").toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) {
    return json({ error: "Invalid or missing symbol" }, 400);
  }

  const cacheKey = `quote:${ticker}`;

  // Try KV cache
  if (env.QUOTE_CACHE) {
    const cached = await kvGet<YahooQuoteResult>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return json({ ...cached, source: "cache" }, 200, "public, max-age=15");
    }
  }

  // Fetch from Yahoo Finance
  if (env.QUOTE_CACHE) {
    try {
      const quote = await fetchYahooQuote(ticker);
      const ttl = quoteTtl(quote.marketState);
      await kvPut(env.QUOTE_CACHE, cacheKey, quote, ttl);
      return json({ ...quote, source: "yahoo" }, 200, `public, max-age=${Math.min(ttl, 30)}`);
    } catch (err) {
      if (err instanceof YahooApiError && err.status === 404) {
        return json({ error: `Ticker not found: ${ticker}` }, 404);
      }
      return json({ error: "Upstream provider error" }, 502);
    }
  }

  // Fallback demo quote
  return json(generateDemoQuote(ticker), 200, "public, max-age=60");
}

function generateDemoQuote(ticker: string): Record<string, unknown> {
  const seed = strToSeed(ticker);
  const price = 50 + (seed % 450);
  const change = ((seed % 200) - 100) / 100;
  return {
    ticker,
    shortName: ticker,
    currency: "USD",
    price,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round((change / price) * 10000) / 100,
    previousClose: price - change,
    open: price - change * 0.5,
    dayHigh: price * 1.02,
    dayLow: price * 0.98,
    volume: 1_000_000 + (seed % 50_000_000),
    marketCap: price * 1_000_000_000,
    fiftyTwoWeekHigh: price * 1.3,
    fiftyTwoWeekLow: price * 0.7,
    exchange: "DEMO",
    marketState: "CLOSED",
    source: "demo",
  };
}

function strToSeed(str: string): number {
  let h = 0x12345678;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
  }
  return h >>> 0;
}

function json(body: unknown, status: number, cacheControl?: string): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cacheControl) headers["Cache-Control"] = cacheControl;
  return new Response(JSON.stringify(body), { status, headers });
}
