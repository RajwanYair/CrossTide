/**
 * GET /api/quotes?symbols=AAPL,MSFT,GOOG
 *
 * Batch quote fetch — returns real-time quotes for up to 10 symbols in a
 * single request. Each symbol is resolved in parallel, with individual KV
 * cache hits/misses. Errors per symbol are inlined rather than failing the
 * whole response, so clients can handle partial failures gracefully.
 *
 * Response shape:
 *   { quotes: { [symbol]: QuoteResult | { error: string } }, count: number }
 */

import { fetchYahooQuote, YahooApiError, type YahooQuoteResult } from "../providers/yahoo.js";
import { kvGet, kvPut, quoteTtl } from "../kv-cache.js";
import type { Env } from "../index.js";

const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;
const MAX_SYMBOLS = 10;

type QuoteEntry = (YahooQuoteResult & { source: string }) | { error: string };

export interface BatchQuotesResult {
  readonly quotes: Record<string, QuoteEntry>;
  readonly count: number;
}

export async function handleBatchQuotes(url: URL, env: Env): Promise<Response> {
  const raw = url.searchParams.get("symbols") ?? "";
  if (!raw) {
    return json({ error: "Missing required query param: symbols" }, 400);
  }

  const requested = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);

  if (requested.length === 0) {
    return json({ error: "No valid symbols provided" }, 400);
  }

  if (requested.length > MAX_SYMBOLS) {
    return json({ error: `Too many symbols — maximum is ${MAX_SYMBOLS}` }, 400);
  }

  // Validate each symbol before fetching
  const invalid = requested.filter((s) => !TICKER_RE.test(s));
  if (invalid.length > 0) {
    return json({ error: `Invalid symbol(s): ${invalid.join(", ")}` }, 400);
  }

  // Deduplicate
  const symbols = [...new Set(requested)];

  // Fetch all in parallel
  const entries = await Promise.all(
    symbols.map(async (ticker): Promise<[string, QuoteEntry]> => {
      const cacheKey = `quote:${ticker}`;

      // Try KV cache first
      if (env.QUOTE_CACHE) {
        const cached = await kvGet<YahooQuoteResult>(env.QUOTE_CACHE, cacheKey);
        if (cached) {
          return [ticker, { ...cached, source: "cache" }];
        }
      }

      // Fetch from Yahoo Finance (when cache available for storage)
      if (env.QUOTE_CACHE) {
        try {
          const quote = await fetchYahooQuote(ticker);
          const ttl = quoteTtl(quote.marketState);
          await kvPut(env.QUOTE_CACHE, cacheKey, quote, ttl);
          return [ticker, { ...quote, source: "yahoo" }];
        } catch (err) {
          if (err instanceof YahooApiError && err.status === 404) {
            return [ticker, { error: `Ticker not found: ${ticker}` }];
          }
          return [ticker, { error: "Upstream provider error" }];
        }
      }

      // Fallback demo quote
      return [ticker, { ...generateDemoQuote(ticker), source: "demo" } as QuoteEntry];
    }),
  );

  const quotes: Record<string, QuoteEntry> = {};
  for (const [symbol, entry] of entries) {
    quotes[symbol] = entry;
  }

  const result: BatchQuotesResult = { quotes, count: symbols.length };
  return json(result, 200, "public, max-age=15");
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
