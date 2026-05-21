/**
 * Alpaca Markets client provider — fetches via CrossTide Worker proxy.
 *
 * Q1: Co-primary data source for US equities alongside Yahoo.
 * The Worker holds API credentials; browser only calls our proxy endpoints.
 */
import type { DailyCandle } from "../types/domain";
import type { MarketDataProvider, ProviderHealth, Quote, SearchResult } from "./types";
import { FetchError, fetchWithRetry } from "../core/fetch";

const PROXY_BASE = "/api/alpaca";

export function createAlpacaProvider(baseUrl: string = PROXY_BASE): MarketDataProvider {
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
    const url = `${baseUrl}/quote/${encodeURIComponent(ticker)}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data: unknown = await res.json();
      if (!isQuoteResponse(data)) {
        throw new FetchError(`Alpaca: invalid quote response for ${ticker}`);
      }
      recordSuccess();
      return {
        ticker: data.ticker,
        price: data.price,
        open: data.open,
        high: data.high,
        low: data.low,
        previousClose: data.previousClose,
        volume: data.volume,
        timestamp: data.timestamp,
      };
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function getHistory(ticker: string, days: number): Promise<readonly DailyCandle[]> {
    const url = `${baseUrl}/bars/${encodeURIComponent(ticker)}?days=${days}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data: unknown = await res.json();
      if (!isBarsResponse(data)) {
        throw new FetchError(`Alpaca: invalid bars response for ${ticker}`);
      }
      recordSuccess();
      return data.candles.map((c) => ({
        date: c.date,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function search(_query: string): Promise<readonly SearchResult[]> {
    // Alpaca doesn't have a search endpoint in free tier.
    // Delegate search to Yahoo or Finnhub.
    return Promise.resolve([]);
  }

  function health(): ProviderHealth {
    return {
      name: "alpaca",
      available: consecutiveErrors < 3,
      lastSuccessAt,
      lastErrorAt,
      consecutiveErrors,
    };
  }

  return { name: "alpaca", getQuote, getHistory, search, health };
}

// ── Type guards ───────────────────────────────────────────────────────────────

interface AlpacaQuotePayload {
  ticker: string;
  price: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  timestamp: number;
}

function isQuoteResponse(v: unknown): v is AlpacaQuotePayload {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj["ticker"] === "string" &&
    typeof obj["price"] === "number" &&
    typeof obj["timestamp"] === "number"
  );
}

interface AlpacaBarsPayload {
  ticker: string;
  candles: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

function isBarsResponse(v: unknown): v is AlpacaBarsPayload {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return typeof obj["ticker"] === "string" && Array.isArray(obj["candles"]);
}
