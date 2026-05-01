/**
 * Finnhub provider — quote / history / symbol search via Finnhub REST API.
 *
 * Free tier: 60 requests/minute. API key is supplied by the proxy Worker
 * (never sent from the browser).
 */
import type { DailyCandle } from "../types/domain";
import type {
  MarketDataProvider,
  ProviderHealth,
  Quote,
  SearchResult,
} from "./types";
import { FetchError, fetchWithRetry } from "../core/fetch";

const DEFAULT_BASE_URL = "https://finnhub.io/api/v1";

interface FinnhubQuoteResponse {
  c?: number; // current
  o?: number; // open
  h?: number; // high
  l?: number; // low
  pc?: number; // previous close
  t?: number; // unix s
}

interface FinnhubCandleResponse {
  s?: "ok" | "no_data";
  t?: readonly number[];
  o?: readonly number[];
  h?: readonly number[];
  l?: readonly number[];
  c?: readonly number[];
  v?: readonly number[];
}

interface FinnhubSearchResponse {
  result?: ReadonlyArray<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export function createFinnhubProvider(
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
    const url =
      `${baseUrl}/quote?symbol=${encodeURIComponent(ticker)}` +
      `&token=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data = (await res.json()) as FinnhubQuoteResponse;
      if (
        typeof data.c !== "number" ||
        typeof data.o !== "number" ||
        typeof data.h !== "number" ||
        typeof data.l !== "number" ||
        typeof data.pc !== "number"
      ) {
        throw new FetchError(`Finnhub: malformed quote for ${ticker}`);
      }
      recordSuccess();
      return {
        ticker,
        price: data.c,
        open: data.o,
        high: data.h,
        low: data.l,
        previousClose: data.pc,
        volume: 0,
        timestamp: (data.t ?? Math.floor(Date.now() / 1000)) * 1000,
      };
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function getHistory(
    ticker: string,
    days: number,
  ): Promise<readonly DailyCandle[]> {
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 24 * 60 * 60;
    const url =
      `${baseUrl}/stock/candle?symbol=${encodeURIComponent(ticker)}` +
      `&resolution=D&from=${from}&to=${to}` +
      `&token=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data = (await res.json()) as FinnhubCandleResponse;
      if (data.s !== "ok" || !data.t || !data.o || !data.h || !data.l || !data.c) {
        throw new FetchError(`Finnhub: no candles for ${ticker}`);
      }
      const out: DailyCandle[] = [];
      for (let i = 0; i < data.t.length; i++) {
        const ts = data.t[i];
        const o = data.o[i];
        const h = data.h[i];
        const l = data.l[i];
        const c = data.c[i];
        const v = data.v?.[i] ?? 0;
        if (
          ts === undefined ||
          o === undefined ||
          h === undefined ||
          l === undefined ||
          c === undefined
        )
          continue;
        out.push({
          date: new Date(ts * 1000).toISOString().slice(0, 10),
          open: o,
          high: h,
          low: l,
          close: c,
          volume: v,
        });
      }
      recordSuccess();
      return out;
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function search(query: string): Promise<readonly SearchResult[]> {
    const url =
      `${baseUrl}/search?q=${encodeURIComponent(query)}` +
      `&token=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data = (await res.json()) as FinnhubSearchResponse;
      recordSuccess();
      return (data.result ?? []).map((r) => ({
        symbol: r.symbol,
        name: r.description,
        type: r.type,
      }));
    } catch (err) {
      recordError();
      throw err;
    }
  }

  function health(): ProviderHealth {
    return {
      name: "finnhub",
      available: consecutiveErrors < 3,
      lastSuccessAt,
      lastErrorAt,
      consecutiveErrors,
    };
  }

  return { name: "finnhub", getQuote, getHistory, search, health };
}
