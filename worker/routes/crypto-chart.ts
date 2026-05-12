/**
 * GET /api/crypto/:id/chart?days=30
 *
 * Returns OHLC candlestick data for a cryptocurrency from CoinGecko.
 * Caches in KV with 5-minute TTL.
 *
 * Q18: Complete crypto E2E — chart + search support.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";
import { fetchCoinGeckoOhlc, CoinGeckoApiError } from "../providers/coingecko.js";
import type { CoinGeckoChartResult } from "../providers/coingecko.js";

const CRYPTO_CHART_TTL = 300; // 5 minutes
const ID_RE = /^[a-z0-9-]{1,50}$/;
const VALID_DAYS = new Set([1, 7, 14, 30, 90, 180, 365]);

export async function handleCryptoChart(id: string, url: URL, env: Env): Promise<Response> {
  const coinId = id.toLowerCase();

  if (!ID_RE.test(coinId)) {
    return Response.json({ error: "Invalid coin ID" }, { status: 400 });
  }

  const daysParam = parseInt(url.searchParams.get("days") ?? "30", 10) || 30;
  const days = VALID_DAYS.has(daysParam) ? daysParam : 30;
  const cacheKey = `crypto-chart:${coinId}:${days}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<CoinGeckoChartResult>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const data = await fetchCoinGeckoOhlc(coinId, days);

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, CRYPTO_CHART_TTL);
    }

    return Response.json(data);
  } catch (err) {
    if (err instanceof CoinGeckoApiError && err.status === 404) {
      return Response.json({ error: "Coin not found" }, { status: 404 });
    }
    return Response.json({ error: "Failed to fetch crypto chart data" }, { status: 502 });
  }
}
