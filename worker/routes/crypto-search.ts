/**
 * GET /api/crypto/search?q=bitcoin&limit=10
 *
 * Searches CoinGecko for cryptocurrencies by name or symbol.
 * Caches results in KV with 10-minute TTL.
 *
 * Q18: Complete crypto E2E — chart + search support.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";
import { fetchCoinGeckoSearch, CoinGeckoApiError } from "../providers/coingecko.js";
import type { CoinGeckoSearchHit } from "../providers/coingecko.js";

const SEARCH_CACHE_TTL = 600; // 10 minutes

export async function handleCryptoSearch(url: URL, env: Env): Promise<Response> {
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 1) {
    return Response.json({ error: "Missing search query (q parameter)" }, { status: 400 });
  }

  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "10", 10) || 10, 1),
    50,
  );
  const cacheKey = `crypto-search:${q.toLowerCase()}:${limit}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<CoinGeckoSearchHit[]>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ results: cached, source: "cache" });
    }
  }

  try {
    const results = await fetchCoinGeckoSearch(q, limit);

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, results, SEARCH_CACHE_TTL);
    }

    return Response.json({ results, source: "coingecko" });
  } catch (err) {
    if (err instanceof CoinGeckoApiError) {
      return Response.json({ error: `Search failed: ${err.message}` }, { status: 502 });
    }
    return Response.json({ error: "Internal error during crypto search" }, { status: 500 });
  }
}
