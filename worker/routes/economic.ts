/**
 * /api/economic — Economic indicators endpoint.
 *
 * Returns key macro-economic metrics sourced from Yahoo Finance market summary.
 * Caches in KV with 30-minute TTL.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";

const ECONOMIC_TTL = 1800; // 30 min
const ECONOMIC_TICKERS = [
  "^TNX", // 10-Year Treasury Yield
  "^IRX", // 13-Week Treasury Bill
  "^TYX", // 30-Year Treasury Yield
  "^VIX", // CBOE Volatility Index
  "DX-Y.NYB", // US Dollar Index
  "CL=F", // Crude Oil
  "GC=F", // Gold
  "^GSPC", // S&P 500
];

interface EconomicIndicator {
  readonly symbol: string;
  readonly name: string;
  readonly price: number;
  readonly change: number;
  readonly changePercent: number;
}

interface EconomicResponse {
  readonly indicators: readonly EconomicIndicator[];
  readonly timestamp: number;
  readonly source: string;
}

function nameForSymbol(sym: string): string {
  const names: Record<string, string> = {
    "^TNX": "10-Year Treasury",
    "^IRX": "13-Week T-Bill",
    "^TYX": "30-Year Treasury",
    "^VIX": "VIX",
    "DX-Y.NYB": "US Dollar Index",
    "CL=F": "Crude Oil",
    "GC=F": "Gold",
    "^GSPC": "S&P 500",
  };
  return names[sym] ?? sym;
}

export async function handleEconomic(env: Env): Promise<Response> {
  const cacheKey = "economic:summary";

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<EconomicResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const symbols = ECONOMIC_TICKERS.join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CrossTide/1.0" },
    });

    if (!res.ok) {
      return Response.json({ error: "Upstream provider error" }, { status: 502 });
    }

    const json = (await res.json()) as {
      quoteResponse?: {
        result?: Array<{
          symbol?: string;
          regularMarketPrice?: number;
          regularMarketChange?: number;
          regularMarketChangePercent?: number;
        }>;
      };
    };

    const results = json.quoteResponse?.result ?? [];

    const indicators: EconomicIndicator[] = results
      .filter(
        (r): r is typeof r & { symbol: string; regularMarketPrice: number } =>
          typeof r.symbol === "string" && typeof r.regularMarketPrice === "number",
      )
      .map((r) => ({
        symbol: r.symbol,
        name: nameForSymbol(r.symbol),
        price: r.regularMarketPrice,
        change: r.regularMarketChange ?? 0,
        changePercent: r.regularMarketChangePercent ?? 0,
      }));

    const data: EconomicResponse = {
      indicators,
      timestamp: Date.now(),
      source: "yahoo",
    };

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, ECONOMIC_TTL);
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to fetch economic data" }, { status: 502 });
  }
}
