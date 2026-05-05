/**
 * /api/crypto/:id — Cryptocurrency quote endpoint.
 *
 * Returns price, market cap, volume, and 24h change for a cryptocurrency
 * from CoinGecko. Caches in KV with 2-minute TTL.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";

const CRYPTO_TTL = 120; // 2 minutes
const ID_RE = /^[a-z0-9-]{1,50}$/;

interface CryptoQuote {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly price: number;
  readonly marketCap: number;
  readonly volume24h: number;
  readonly change24h: number;
  readonly changePercent24h: number;
  readonly high24h: number;
  readonly low24h: number;
  readonly ath: number;
  readonly athChangePercent: number;
  readonly circulatingSupply: number;
  readonly totalSupply: number | null;
  readonly lastUpdated: string;
  readonly source: string;
}

export async function handleCrypto(id: string, env: Env): Promise<Response> {
  const coinId = id.toLowerCase();

  if (!ID_RE.test(coinId)) {
    return Response.json({ error: "Invalid coin ID" }, { status: 400 });
  }

  const cacheKey = `crypto:${coinId}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<CryptoQuote>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "CrossTide/1.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return Response.json({ error: "Coin not found" }, { status: 404 });
      }
      return Response.json({ error: "Upstream provider error" }, { status: 502 });
    }

    const json = (await res.json()) as {
      id?: string;
      symbol?: string;
      name?: string;
      market_data?: {
        current_price?: { usd?: number };
        market_cap?: { usd?: number };
        total_volume?: { usd?: number };
        price_change_24h?: number;
        price_change_percentage_24h?: number;
        high_24h?: { usd?: number };
        low_24h?: { usd?: number };
        ath?: { usd?: number };
        ath_change_percentage?: { usd?: number };
        circulating_supply?: number;
        total_supply?: number | null;
      };
      last_updated?: string;
    };

    const md = json.market_data;

    const data: CryptoQuote = {
      id: json.id ?? coinId,
      symbol: json.symbol ?? coinId,
      name: json.name ?? coinId,
      price: md?.current_price?.usd ?? 0,
      marketCap: md?.market_cap?.usd ?? 0,
      volume24h: md?.total_volume?.usd ?? 0,
      change24h: md?.price_change_24h ?? 0,
      changePercent24h: md?.price_change_percentage_24h ?? 0,
      high24h: md?.high_24h?.usd ?? 0,
      low24h: md?.low_24h?.usd ?? 0,
      ath: md?.ath?.usd ?? 0,
      athChangePercent: md?.ath_change_percentage?.usd ?? 0,
      circulatingSupply: md?.circulating_supply ?? 0,
      totalSupply: md?.total_supply ?? null,
      lastUpdated: json.last_updated ?? new Date().toISOString(),
      source: "coingecko",
    };

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, CRYPTO_TTL);
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to fetch cryptocurrency data" }, { status: 502 });
  }
}
