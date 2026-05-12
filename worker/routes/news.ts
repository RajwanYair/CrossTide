/**
 * GET /api/news?ticker=AAPL&days=7&limit=20
 *
 * Returns company news from Finnhub. Requires FINNHUB_KEY binding.
 * Caches results in KV for 10 minutes to avoid API rate limits.
 *
 * Q19: Wire Finnhub company news to frontend news digest.
 */

import { fetchFinnhubNews, FinnhubApiError } from "../providers/finnhub.js";
import { kvGet, kvPut } from "../kv-cache.js";
import type { Env } from "../index.js";

const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;
const NEWS_CACHE_TTL = 600; // 10 minutes
const MAX_DAYS = 30;
const MAX_LIMIT = 50;

export interface NewsResponse {
  ticker: string;
  articles: NewsArticle[];
  source: "finnhub" | "cache";
}

export interface NewsArticle {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  category: string;
  image: string;
}

export async function handleNews(url: URL, env: Env): Promise<Response> {
  const ticker = (url.searchParams.get("ticker") ?? "").toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) {
    return json({ error: "Invalid or missing ticker" }, 400);
  }

  if (!env.FINNHUB_KEY) {
    return json({ error: "News service unavailable (no API key configured)" }, 503);
  }

  const days = Math.min(
    Math.max(parseInt(url.searchParams.get("days") ?? "7", 10) || 7, 1),
    MAX_DAYS,
  );
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1),
    MAX_LIMIT,
  );

  // Check KV cache
  const cacheKey = `news:${ticker}:${days}:${limit}`;
  if (env.QUOTE_CACHE) {
    const cached = await kvGet<NewsResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return json({ ...cached, source: "cache" as const }, 200, "public, max-age=120");
    }
  }

  try {
    const items = await fetchFinnhubNews(ticker, env.FINNHUB_KEY, days, limit);

    const body: NewsResponse = {
      ticker,
      articles: items.map((item) => ({
        id: item.id,
        headline: item.headline,
        summary: item.summary,
        source: item.source,
        url: item.url,
        datetime: item.datetime,
        category: item.category,
        image: item.image,
      })),
      source: "finnhub",
    };

    // Cache the result
    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, body, NEWS_CACHE_TTL);
    }

    return json(body, 200, "public, max-age=120");
  } catch (err) {
    if (err instanceof FinnhubApiError) {
      return json(
        { error: `News fetch failed: ${err.message}` },
        err.status >= 500 ? 502 : err.status,
      );
    }
    return json({ error: "Internal error fetching news" }, 500);
  }
}

function json(body: unknown, status: number, cacheControl?: string): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cacheControl) headers["Cache-Control"] = cacheControl;
  return new Response(JSON.stringify(body), { status, headers });
}
