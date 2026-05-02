/**
 * Tiingo provider — EOD history + real-time IEX quote + symbol search.  (H15)
 *
 * Endpoints used:
 *   Quote:   GET https://api.tiingo.com/iex?tickers={t}&token={key}
 *   History: GET https://api.tiingo.com/tiingo/daily/{t}/prices
 *              ?startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}&token={key}
 *   Search:  GET https://api.tiingo.com/tiingo/utilities/search
 *              ?query={q}&token={key}
 *
 * Free tier: 500 calls/hour per API key (Jan 2025).
 * CORS: Tiingo does NOT send CORS headers — all calls must go through the
 * proxy Worker (same pattern as Finnhub).
 *
 * The API key is injected by the Worker and never exposed to the browser.
 */
import type { DailyCandle } from "../types/domain";
import type { MarketDataProvider, ProviderHealth, Quote, SearchResult } from "./types";
import { FetchError, fetchWithRetry } from "../core/fetch";
import {
  safeParse,
  TiingoQuoteSchema,
  TiingoEodSchema,
  TiingoSearchSchema,
} from "../types/valibot-schemas";

const DEFAULT_BASE_URL = "https://api.tiingo.com";

export function createTiingoProvider(
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
      `${baseUrl}/iex?tickers=${encodeURIComponent(ticker.toUpperCase())}` +
      `&token=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const raw: unknown = await res.json();
      const parsed = safeParse(TiingoQuoteSchema, raw);
      if (!parsed.success || parsed.output.length === 0) {
        throw new FetchError(`Tiingo: no quote data for ${ticker}`);
      }
      const item = parsed.output[0]!;
      const price = item.last ?? item.close ?? 0;
      recordSuccess();
      return {
        ticker: ticker.toUpperCase(),
        price,
        open: item.open ?? price,
        high: item.high ?? price,
        low: item.low ?? price,
        previousClose: item.prevClose ?? price,
        volume: item.volume ?? 0,
        timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now(),
      };
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function getHistory(ticker: string, days: number): Promise<readonly DailyCandle[]> {
    const endDate = new Date().toISOString().slice(0, 10);
    const startMs = Date.now() - days * 24 * 60 * 60 * 1000;
    const startDate = new Date(startMs).toISOString().slice(0, 10);
    const url =
      `${baseUrl}/tiingo/daily/${encodeURIComponent(ticker.toUpperCase())}/prices` +
      `?startDate=${startDate}&endDate=${endDate}&token=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const raw: unknown = await res.json();
      const parsed = safeParse(TiingoEodSchema, raw);
      if (!parsed.success || parsed.output.length === 0) {
        throw new FetchError(`Tiingo: no history data for ${ticker}`);
      }
      const candles: DailyCandle[] = parsed.output
        .filter(
          (item) =>
            item.open !== undefined &&
            item.high !== undefined &&
            item.low !== undefined &&
            item.close !== undefined,
        )
        .map((item) => ({
          date: item.date.slice(0, 10),
          open: item.open!,
          high: item.high!,
          low: item.low!,
          close: item.close!,
          volume: item.volume ?? 0,
        }));
      if (candles.length === 0) throw new FetchError(`Tiingo: no valid candles for ${ticker}`);
      recordSuccess();
      return candles;
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function search(query: string): Promise<readonly SearchResult[]> {
    const url =
      `${baseUrl}/tiingo/utilities/search?query=${encodeURIComponent(query)}` +
      `&token=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const raw: unknown = await res.json();
      const parsed = safeParse(TiingoSearchSchema, raw);
      if (!parsed.success) return [];
      recordSuccess();
      return parsed.output.slice(0, 10).map((item) => ({
        symbol: item.ticker.toUpperCase(),
        name: item.name,
        exchange: item.exchange,
        type: item.assetType,
      }));
    } catch {
      recordError();
      return [];
    }
  }

  return {
    name: "tiingo",
    getQuote,
    getHistory,
    search,
    health(): ProviderHealth {
      return {
        name: "tiingo",
        available: consecutiveErrors < 5,
        lastSuccessAt,
        lastErrorAt,
        consecutiveErrors,
      };
    },
  };
}
