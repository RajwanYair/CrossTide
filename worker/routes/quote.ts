/**
 * GET /api/quote/:symbol
 *
 * Returns a real-time quote for the given symbol. In production, fetches from
 * Yahoo Finance with KV caching. Falls back to synthetic data in dev.
 *
 * P1: Wire real Yahoo Finance quote data.
 */

import { fetchYahooQuote, YahooApiError, type YahooQuoteResult } from "../providers/yahoo.js";
import { fetchFinnhubQuote } from "../providers/finnhub.js";
import { fetchMassiveQuote } from "../providers/massive.js";
import { fetchAlphaVantageQuote } from "../providers/alpha-vantage.js";
import { kvGet, kvPut, quoteTtl } from "../kv-cache.js";
import type { Env } from "../index.js";
import { createMarketDataEnvelope, type MarketDataEnvelope } from "../../src/types/market-data.js";

const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;

export async function handleQuote(symbol: string, env: Env): Promise<Response> {
  const ticker = (symbol ?? "").toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) {
    return json({ error: "Invalid or missing symbol" }, 400);
  }

  const cacheKey = `quote:${ticker}`;

  // Try KV cache
  if (env.QUOTE_CACHE) {
    const cached = normalizeCachedQuote(
      await kvGet<MarketDataEnvelope<YahooQuoteResult> | YahooQuoteResult>(
        env.QUOTE_CACHE,
        cacheKey,
      ),
    );
    if (cached) {
      return json(
        { ...cached, status: "cached", provenance: { ...cached.provenance, source: "cache" } },
        200,
        "public, max-age=15",
      );
    }
  }

  // Fetch from Yahoo Finance
  if (env.QUOTE_CACHE) {
    try {
      const quote = await fetchYahooQuote(ticker);
      const ttl = quoteTtl(quote.marketState);
      const envelope = quoteEnvelope(quote, "yahoo");
      await kvPut(env.QUOTE_CACHE, cacheKey, envelope, ttl);
      return json(envelope, 200, `public, max-age=${Math.min(ttl, 30)}`);
    } catch (error) {
      const tickerNotFound = error instanceof YahooApiError && error.status === 404;
      // Yahoo failed — try Finnhub as fallback
      if (env.FINNHUB_KEY) {
        try {
          const fhQuote = await fetchFinnhubQuote(ticker, env.FINNHUB_KEY);
          const mapped: YahooQuoteResult = {
            ticker: fhQuote.ticker,
            shortName: fhQuote.ticker,
            currency: "USD",
            price: fhQuote.price,
            change: fhQuote.change,
            changePercent: fhQuote.changePercent,
            previousClose: fhQuote.previousClose,
            open: fhQuote.open,
            dayHigh: fhQuote.high,
            dayLow: fhQuote.low,
            volume: 0,
            marketCap: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
            exchange: "FINNHUB",
            marketState: "REGULAR",
            source: "finnhub",
          };
          const ttl = quoteTtl("REGULAR");
          const envelope = quoteEnvelope(mapped, "finnhub");
          await kvPut(env.QUOTE_CACHE, cacheKey, envelope, ttl);
          return json(envelope, 200, `public, max-age=${Math.min(ttl, 30)}`);
        } catch {
          // Finnhub failed — try the remaining providers.
        }
      }

      const massiveKey = env.MASSIVE_KEY ?? env.POLYGON_KEY;
      if (massiveKey) {
        try {
          const quote = await fetchMassiveQuote(ticker, massiveKey);
          const previousClose = quote.previousClose;
          const change = quote.price - previousClose;
          const mapped: YahooQuoteResult = {
            ticker: quote.ticker,
            shortName: quote.ticker,
            currency: "USD",
            price: quote.price,
            change,
            changePercent: previousClose !== 0 ? (change / previousClose) * 100 : 0,
            previousClose,
            open: quote.open,
            dayHigh: quote.high,
            dayLow: quote.low,
            volume: quote.volume,
            marketCap: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
            exchange: "MASSIVE",
            marketState: "CLOSED",
            source: "massive",
          };
          const ttl = quoteTtl("CLOSED");
          const envelope = quoteEnvelope(mapped, "massive");
          await kvPut(env.QUOTE_CACHE, cacheKey, envelope, ttl);
          return json(envelope, 200, `public, max-age=${Math.min(ttl, 30)}`);
        } catch {
          // Massive failed — try the low-quota Alpha Vantage fallback.
        }
      }

      if (env.ALPHA_VANTAGE_KEY) {
        try {
          const quote = await fetchAlphaVantageQuote(ticker, env.ALPHA_VANTAGE_KEY);
          const change = quote.price - quote.previousClose;
          const mapped: YahooQuoteResult = {
            ticker: quote.ticker,
            shortName: quote.ticker,
            currency: "USD",
            price: quote.price,
            change,
            changePercent: quote.previousClose !== 0 ? (change / quote.previousClose) * 100 : 0,
            previousClose: quote.previousClose,
            open: quote.open,
            dayHigh: quote.high,
            dayLow: quote.low,
            volume: quote.volume,
            marketCap: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
            exchange: "ALPHA_VANTAGE",
            marketState: "CLOSED",
            source: "alpha-vantage",
          };
          const ttl = quoteTtl("CLOSED");
          const envelope = quoteEnvelope(mapped, "alpha-vantage");
          await kvPut(env.QUOTE_CACHE, cacheKey, envelope, ttl);
          return json(envelope, 200, `public, max-age=${Math.min(ttl, 30)}`);
        } catch {
          // All configured providers failed.
        }
      }
      return tickerNotFound
        ? json({ error: `Ticker not found: ${ticker}` }, 404)
        : json({ error: "Upstream provider error" }, 502);
    }
  }

  // Fallback demo quote
  return json(
    createMarketDataEnvelope(
      "quote",
      generateDemoQuote(ticker),
      {
        source: "demo",
        fetchedAt: new Date().toISOString(),
        timezone: "UTC",
        attribution: "CrossTide demo data",
        coverage: "Synthetic quote for local development and preview",
        marketStatus: "DEMO",
        adjustmentPolicy: "Synthetic values are not adjusted market data",
        limitations: [
          "Demo values are deterministic placeholders and must not inform investment decisions",
        ],
      },
      "demo",
    ),
    200,
    "public, max-age=60",
  );
}

function quoteEnvelope(
  quote: YahooQuoteResult,
  source: string,
): MarketDataEnvelope<YahooQuoteResult> {
  return createMarketDataEnvelope("quote", quote, {
    source,
    fetchedAt: new Date().toISOString(),
    timezone: "America/New_York",
    attribution: source === "yahoo" ? "Yahoo Finance" : source,
    coverage: "Real-time quote snapshot",
    marketStatus: quote.marketState,
    adjustmentPolicy:
      "Quote values are provider-reported; corporate-action policy may vary by provider",
    limitations: ["Coverage and delay depend on the selected provider and instrument"],
  });
}

function normalizeCachedQuote(
  value: MarketDataEnvelope<YahooQuoteResult> | YahooQuoteResult | null,
): MarketDataEnvelope<YahooQuoteResult> | null {
  if (!value) return null;
  if ("schemaVersion" in value && value.schemaVersion === "1" && "data" in value) {
    return value;
  }
  return createMarketDataEnvelope(
    "quote",
    value,
    { source: "cache", fetchedAt: new Date().toISOString() },
    "cached",
    ["Legacy cache entry migrated to schema version 1"],
  );
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
