/**
 * /api/crypto/:id — Cryptocurrency quote endpoint.
 *
 * Returns price, market cap, volume, and 24h change for a cryptocurrency
 * from CoinGecko. Caches in KV with 2-minute TTL.
 *
 * P8: Delegates to worker/providers/coingecko.ts instead of inline fetch.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";
import {
  fetchCoinGeckoQuote,
  CoinGeckoApiError,
  type CoinGeckoQuoteResult,
} from "../providers/coingecko.js";

const CRYPTO_TTL = 120; // 2 minutes
const ID_RE = /^[a-z0-9-]{1,50}$/;

export async function handleCrypto(id: string, env: Env): Promise<Response> {
  const coinId = id.toLowerCase();

  if (!ID_RE.test(coinId)) {
    return Response.json({ error: "Invalid coin ID" }, { status: 400 });
  }

  const cacheKey = `crypto:${coinId}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<CoinGeckoQuoteResult>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const data = await fetchCoinGeckoQuote(coinId);

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, CRYPTO_TTL);
    }

    return Response.json(data);
  } catch (err) {
    if (err instanceof CoinGeckoApiError && err.status === 404) {
      return Response.json({ error: "Coin not found" }, { status: 404 });
    }
    return Response.json({ error: "Failed to fetch cryptocurrency data" }, { status: 502 });
  }
}
