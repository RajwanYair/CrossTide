/**
 * GET /api/health
 *
 * Returns the worker status, API version, current timestamp, and provider
 * availability (which upstream data sources are configured).
 */

import type { Env } from "../index.js";

export interface ProviderStatus {
  readonly name: string;
  readonly available: boolean;
}

export interface HealthResponse {
  status: "ok";
  version: string;
  timestamp: string;
  environment: string;
  providers: readonly ProviderStatus[];
  bindings: {
    kvCache: boolean;
    d1: boolean;
    rateLimiter: boolean;
    tickerFanout: boolean;
  };
}

export function handleHealth(env: Env): Response {
  const providers: ProviderStatus[] = [
    { name: "yahoo", available: true }, // always available (no key)
    { name: "coingecko", available: true }, // always available (no key)
    { name: "stooq", available: true }, // always available (no key)
    {
      name: "finnhub",
      available: typeof env.FINNHUB_KEY === "string" && env.FINNHUB_KEY.length > 0,
    },
    { name: "fred-api", available: typeof env.FRED_KEY === "string" && env.FRED_KEY.length > 0 },
    { name: "fred-csv", available: true }, // always available (no key)
  ];

  const body: HealthResponse = {
    status: "ok",
    version: env.API_VERSION ?? "1",
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT ?? "production",
    providers,
    bindings: {
      kvCache: env.QUOTE_CACHE != null,
      d1: env.DB != null,
      rateLimiter: env.RATE_LIMITER != null,
      tickerFanout: env.TICKER_FANOUT != null,
    },
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
