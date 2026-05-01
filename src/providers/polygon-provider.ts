/**
 * Polygon.io provider — fetches quotes and history via Polygon REST API.
 * Free tier: 5 API calls/minute, delayed data. API key in Cloudflare Worker env.
 */
import type { DailyCandle } from "../types/domain";
import type { MarketDataProvider, Quote, SearchResult, ProviderHealth } from "./types";
import { fetchWithRetry, FetchError } from "../core/fetch";

const DEFAULT_BASE_URL = "https://api.polygon.io";

interface PolygonPrevCloseResponse {
  results?: Array<{
    T: string;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    t: number; // Unix ms
  }>;
  status?: string;
}

interface PolygonAggsResponse {
  results?: Array<{
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    t: number; // Unix ms
  }>;
  status?: string;
}

interface PolygonTickersResponse {
  results?: Array<{
    ticker: string;
    name: string;
    primary_exchange?: string;
    type?: string;
  }>;
  status?: string;
}

export function createPolygonProvider(
  apiKey: string,
  baseUrl: string = DEFAULT_BASE_URL,
): MarketDataProvider {
  let lastSuccessAt: number | null = null;
  let lastErrorAt: number | null = null;
  let consecutiveErrors = 0;

  function recordSuccess(): void {
    lastSuccessAt = Date.now();
    consecutiveErrors = 0;
  }

  function recordError(): void {
    lastErrorAt = Date.now();
    consecutiveErrors++;
  }

  async function getQuote(ticker: string): Promise<Quote> {
    const url = `${baseUrl}/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev?adjusted=true&apiKey=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data = (await res.json()) as PolygonPrevCloseResponse;
      const result = data.results?.[0];
      if (!result) throw new FetchError("No result from Polygon for " + ticker);

      recordSuccess();
      return {
        ticker: result.T ?? ticker,
        price: result.c,
        open: result.o,
        high: result.h,
        low: result.l,
        previousClose: result.c,
        volume: result.v,
        timestamp: result.t,
      };
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function getHistory(ticker: string, days: number): Promise<readonly DailyCandle[]> {
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
    const from = fromDate.toISOString().slice(0, 10);
    const to = toDate.toISOString().slice(0, 10);
    const url = `${baseUrl}/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=${days}&apiKey=${encodeURIComponent(apiKey)}`;

    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data = (await res.json()) as PolygonAggsResponse;
      if (!data.results || data.results.length === 0) {
        throw new FetchError("No history from Polygon for " + ticker);
      }
      recordSuccess();
      return data.results.map((r) => ({
        date: new Date(r.t).toISOString().slice(0, 10),
        open: r.o,
        high: r.h,
        low: r.l,
        close: r.c,
        volume: r.v,
      }));
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function search(query: string): Promise<readonly SearchResult[]> {
    const url = `${baseUrl}/v3/reference/tickers?search=${encodeURIComponent(query)}&market=stocks&limit=10&apiKey=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetchWithRetry(url, {}, 1, 500);
      const data = (await res.json()) as PolygonTickersResponse;
      recordSuccess();
      return (data.results ?? []).map((r): SearchResult => {
        const base = { symbol: r.ticker, name: r.name };
        if (r.primary_exchange !== undefined && r.type !== undefined)
          return { ...base, exchange: r.primary_exchange, type: r.type };
        if (r.primary_exchange !== undefined) return { ...base, exchange: r.primary_exchange };
        if (r.type !== undefined) return { ...base, type: r.type };
        return base;
      });
    } catch (err) {
      recordError();
      throw err;
    }
  }

  function health(): ProviderHealth {
    return {
      name: "polygon",
      available: consecutiveErrors < 3,
      lastSuccessAt,
      lastErrorAt,
      consecutiveErrors,
    };
  }

  return { name: "polygon", getQuote, getHistory, search, health };
}
