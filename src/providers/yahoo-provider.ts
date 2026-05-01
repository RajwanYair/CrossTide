/**
 * Yahoo Finance provider — fetches quotes and history via Yahoo v8 chart API.
 *
 * In production this should go through a Cloudflare Worker proxy to avoid CORS.
 * The provider tracks its own health (consecutive errors).
 */
import type { DailyCandle } from "../types/domain";
import type { MarketDataProvider, Quote, SearchResult, ProviderHealth } from "./types";
import { fetchWithRetry, FetchError } from "../core/fetch";

const DEFAULT_BASE_URL = "https://query1.finance.yahoo.com";

interface YahooChartResult {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number; previousClose?: number; symbol?: string };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: number[];
          high?: number[];
          low?: number[];
          close?: number[];
          volume?: number[];
        }>;
      };
    }>;
  };
}

interface YahooSearchResult {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchDisp?: string;
    quoteType?: string;
  }>;
}

export function createYahooProvider(baseUrl: string = DEFAULT_BASE_URL): MarketDataProvider {
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
    const url = `${baseUrl}/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data = (await res.json()) as YahooChartResult;
      const result = data.chart?.result?.[0];
      if (!result?.meta) throw new FetchError("No chart result for " + ticker);

      const q = result.indicators?.quote?.[0];
      const meta = result.meta;
      const price = meta.regularMarketPrice ?? 0;
      const prevClose = meta.previousClose ?? price;
      const ts = result.timestamp;

      recordSuccess();
      return {
        ticker: meta.symbol ?? ticker,
        price,
        open: q?.open?.[0] ?? price,
        high: q?.high?.[0] ?? price,
        low: q?.low?.[0] ?? price,
        previousClose: prevClose,
        volume: q?.volume?.[0] ?? 0,
        timestamp: ts ? ts[ts.length - 1]! * 1000 : Date.now(),
      };
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function getHistory(ticker: string, days: number): Promise<readonly DailyCandle[]> {
    const range = days <= 30 ? "1mo" : days <= 90 ? "3mo" : days <= 180 ? "6mo" : "1y";
    const url = `${baseUrl}/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=1d`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data = (await res.json()) as YahooChartResult;
      const result = data.chart?.result?.[0];
      if (!result?.timestamp) throw new FetchError("No history for " + ticker);

      const q = result.indicators?.quote?.[0];
      if (!q) throw new FetchError("No OHLCV data for " + ticker);

      const candles: DailyCandle[] = [];
      for (let i = 0; i < result.timestamp.length; i++) {
        const o = q.open?.[i];
        const h = q.high?.[i];
        const l = q.low?.[i];
        const c = q.close?.[i];
        const v = q.volume?.[i];
        if (o == null || h == null || l == null || c == null) continue;

        candles.push({
          date: new Date(result.timestamp[i]! * 1000).toISOString().slice(0, 10),
          open: o,
          high: h,
          low: l,
          close: c,
          volume: v ?? 0,
        });
      }

      recordSuccess();
      return candles;
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function search(query: string): Promise<readonly SearchResult[]> {
    const url = `${baseUrl}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
    try {
      const res = await fetchWithRetry(url, {}, 1, 500);
      const data = (await res.json()) as YahooSearchResult;
      recordSuccess();
      return (
        data.quotes?.map((q): SearchResult => {
          const base = { symbol: q.symbol ?? "", name: q.longname ?? q.shortname ?? "" };
          if (q.exchDisp !== undefined && q.quoteType !== undefined)
            return { ...base, exchange: q.exchDisp, type: q.quoteType };
          if (q.exchDisp !== undefined) return { ...base, exchange: q.exchDisp };
          if (q.quoteType !== undefined) return { ...base, type: q.quoteType };
          return base;
        }) ?? []
      );
    } catch (err) {
      recordError();
      throw err;
    }
  }

  return {
    name: "yahoo",
    getQuote,
    getHistory,
    search,
    health: (): ProviderHealth => ({
      name: "yahoo",
      available: consecutiveErrors < 5,
      lastSuccessAt,
      lastErrorAt,
      consecutiveErrors,
    }),
  };
}
