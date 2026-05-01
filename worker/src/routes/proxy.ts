import type { Env } from "../index";

const YAHOO_BASE = "https://query1.finance.yahoo.com";
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const TWELVE_BASE = "https://api.twelvedata.com";

const CACHE_TTL_QUOTE = 60; // seconds
const CACHE_TTL_HISTORY = 3600;

async function proxyFetch(url: string, cacheSeconds?: number): Promise<Response> {
  const headers: Record<string, string> = {
    "User-Agent": "CrossTide/1.0",
    Accept: "application/json",
  };

  const res = await fetch(url, { headers });
  const body = await res.text();

  const responseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cacheSeconds) {
    responseHeaders["Cache-Control"] = `public, max-age=${cacheSeconds}`;
  }

  return new Response(body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export async function handleQuote(symbol: string, env: Env): Promise<Response> {
  const base = env.YAHOO_BASE_URL ?? YAHOO_BASE;
  const url = `${base}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  return proxyFetch(url, CACHE_TTL_QUOTE);
}

export async function handleHistory(symbol: string, days: number, env: Env): Promise<Response> {
  const base = env.YAHOO_BASE_URL ?? YAHOO_BASE;
  const range =
    days <= 5
      ? "5d"
      : days <= 30
        ? "1mo"
        : days <= 90
          ? "3mo"
          : days <= 180
            ? "6mo"
            : days <= 365
              ? "1y"
              : "2y";
  const url = `${base}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
  return proxyFetch(url, CACHE_TTL_HISTORY);
}

export async function handleSearch(query: string, _env: Env): Promise<Response> {
  const url = `${YAHOO_BASE}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
  return proxyFetch(url, 300);
}

export async function handleCrypto(id: string): Promise<Response> {
  const params = new URLSearchParams({
    ids: id,
    vs_currencies: "usd",
    include_24hr_change: "true",
    include_24hr_vol: "true",
    include_last_updated_at: "true",
  });
  const url = `${COINGECKO_BASE}/simple/price?${params.toString()}`;
  return proxyFetch(url, CACHE_TTL_QUOTE);
}

export async function handleTwelve(
  symbol: string,
  searchParams: URLSearchParams,
  env: Env,
): Promise<Response> {
  if (!env.TWELVE_DATA_API_KEY) {
    return new Response(JSON.stringify({ error: "Twelve Data not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const endpoint = searchParams.get("endpoint") ?? "quote";
  const params = new URLSearchParams({ symbol, apikey: env.TWELVE_DATA_API_KEY });

  // Forward additional params (e.g. interval, outputsize)
  for (const [k, v] of searchParams.entries()) {
    if (k !== "endpoint") params.set(k, v);
  }

  const url = `${TWELVE_BASE}/${endpoint}?${params.toString()}`;
  return proxyFetch(url, endpoint === "time_series" ? CACHE_TTL_HISTORY : CACHE_TTL_QUOTE);
}
