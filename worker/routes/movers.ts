/**
 * /api/movers — Market movers endpoint (gainers, losers, most active).
 *
 * Returns top gainers, losers, and most active stocks from Yahoo Finance.
 * Caches in KV with 5-minute TTL.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";

const MOVERS_TTL = 300; // 5 min

interface MoverEntry {
  readonly symbol: string;
  readonly name: string;
  readonly price: number;
  readonly change: number;
  readonly changePercent: number;
  readonly volume: number;
}

interface MoversResponse {
  readonly gainers: readonly MoverEntry[];
  readonly losers: readonly MoverEntry[];
  readonly active: readonly MoverEntry[];
  readonly timestamp: number;
  readonly source: string;
}

const SCREENER_IDS = [
  { id: "day_gainers", key: "gainers" as const },
  { id: "day_losers", key: "losers" as const },
  { id: "most_actives", key: "active" as const },
];

export async function handleMovers(url: URL, env: Env): Promise<Response> {
  const count = Math.min(
    Math.max(parseInt(url.searchParams.get("count") ?? "10", 10) || 10, 1),
    25,
  );

  const cacheKey = `movers:${count}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<MoversResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const results: Record<string, MoverEntry[]> = {
      gainers: [],
      losers: [],
      active: [],
    };

    for (const { id, key } of SCREENER_IDS) {
      const apiUrl = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=${id}&count=${count}`;

      const res = await fetch(apiUrl, {
        headers: { "User-Agent": "CrossTide/1.0" },
      });

      if (!res.ok) continue;

      const json = (await res.json()) as {
        finance?: {
          result?: Array<{
            quotes?: Array<{
              symbol?: string;
              shortName?: string;
              regularMarketPrice?: number;
              regularMarketChange?: number;
              regularMarketChangePercent?: number;
              regularMarketVolume?: number;
            }>;
          }>;
        };
      };

      const quotes = json.finance?.result?.[0]?.quotes ?? [];
      results[key] = quotes
        .filter(
          (q): q is typeof q & { symbol: string; regularMarketPrice: number } =>
            typeof q.symbol === "string" && typeof q.regularMarketPrice === "number",
        )
        .map((q) => ({
          symbol: q.symbol,
          name: q.shortName ?? q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChange ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
          volume: q.regularMarketVolume ?? 0,
        }));
    }

    const data: MoversResponse = {
      gainers: results.gainers ?? [],
      losers: results.losers ?? [],
      active: results.active ?? [],
      timestamp: Date.now(),
      source: "yahoo",
    };

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, MOVERS_TTL);
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to fetch market movers" }, { status: 502 });
  }
}
