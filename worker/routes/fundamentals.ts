/**
 * /api/fundamentals/:symbol — Fundamental data endpoint (Q1).
 *
 * Returns P/E, EPS, revenue, margins, market cap etc. from Yahoo quoteSummary.
 * Caches in KV with 1-hour TTL (fundamental data changes infrequently).
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";
import { fetchYahooFundamentals, type YahooFundamentals } from "../providers/yahoo.js";
import { createMarketDataEnvelope, type MarketDataEnvelope } from "../../src/types/market-data.js";

const FUNDAMENTALS_TTL = 3600; // 1 hour

export async function handleFundamentals(symbol: string, env: Env): Promise<Response> {
  const key = `fundamentals:${symbol.toUpperCase()}`;

  // Try cache first
  if (env.QUOTE_CACHE) {
    const cached = await kvGet<YahooFundamentals>(env.QUOTE_CACHE, key);
    if (cached) {
      return Response.json(fundamentalsEnvelope(cached, "cache", "cached"));
    }
  }

  try {
    const data = await fetchYahooFundamentals(symbol);

    // Cache result
    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, key, data, FUNDAMENTALS_TTL);
    }

    return Response.json(fundamentalsEnvelope(data, "yahoo"));
  } catch {
    // Return empty fundamentals on error
    return Response.json(
      { error: "Failed to fetch fundamental data", symbol: symbol.toUpperCase() },
      { status: 502 },
    );
  }
}

function fundamentalsEnvelope(
  data: YahooFundamentals,
  source: string,
  status: "live" | "cached" = "live",
): MarketDataEnvelope<YahooFundamentals> {
  return createMarketDataEnvelope(
    "fundamentals",
    data,
    {
      source,
      fetchedAt: new Date().toISOString(),
      timezone: "America/New_York",
      attribution: source === "yahoo" ? "Yahoo Finance" : source,
      coverage: "Company valuation and financial metrics",
      adjustmentPolicy: "Provider-reported accounting values; reporting periods may be delayed",
      limitations: ["Metric availability varies by instrument and reporting history"],
    },
    status,
  );
}
