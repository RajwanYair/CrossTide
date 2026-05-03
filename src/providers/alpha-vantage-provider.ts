/**
 * Alpha Vantage provider — last-resort tertiary failover (§14.1).
 *
 * Endpoint: https://www.alphavantage.co/query
 * Free tier: 25 requests/day — extremely limited; used only when
 * all other providers are unavailable.
 *
 * Supported endpoints:
 * - GLOBAL_QUOTE: real-time quote for a single ticker
 * - TIME_SERIES_DAILY: daily OHLCV history
 * - SYMBOL_SEARCH: autocomplete/search
 *
 * Notes:
 * - API key required (free key via https://www.alphavantage.co/support/)
 * - Response is JSON with nested objects keyed by descriptive strings
 * - Rate limit: 25 requests/day (free), 5 requests/min
 * - Very slow responses (~1–3 seconds typical)
 * - CORS: Alpha Vantage returns CORS headers for browser fetch
 */
import type { DailyCandle } from "../types/domain";
import type { MarketDataProvider, Quote, SearchResult, ProviderHealth } from "./types";
import { fetchWithRetry, FetchError } from "../core/fetch";

const DEFAULT_BASE_URL = "https://www.alphavantage.co";

// ── Response types ───────────────────────────────────────────────────────

interface AvGlobalQuote {
  "Global Quote"?: {
    "01. symbol"?: string;
    "02. open"?: string;
    "03. high"?: string;
    "04. low"?: string;
    "05. price"?: string;
    "06. volume"?: string;
    "07. latest trading day"?: string;
    "08. previous close"?: string;
    "09. change"?: string;
    "10. change percent"?: string;
  };
  Note?: string;
  "Error Message"?: string;
}

interface AvTimeSeriesDaily {
  "Meta Data"?: { "2. Symbol"?: string };
  "Time Series (Daily)"?: Record<
    string,
    {
      "1. open": string;
      "2. high": string;
      "3. low": string;
      "4. close": string;
      "5. volume": string;
    }
  >;
  Note?: string;
  "Error Message"?: string;
}

interface AvSearchResponse {
  bestMatches?: Array<{
    "1. symbol": string;
    "2. name": string;
    "3. type": string;
    "4. region": string;
    "8. currency": string;
  }>;
  Note?: string;
}

// ── Error guard ──────────────────────────────────────────────────────────

function guardRateLimit(data: { Note?: string; "Error Message"?: string }): void {
  if (data.Note) {
    throw new FetchError(`Alpha Vantage rate limit: ${data.Note}`);
  }
  if (data["Error Message"]) {
    throw new FetchError(`Alpha Vantage error: ${data["Error Message"]}`);
  }
}

// ── Factory ──────────────────────────────────────────────────────────────

export function createAlphaVantageProvider(
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
    const params = new URLSearchParams({
      function: "GLOBAL_QUOTE",
      symbol: ticker,
      apikey: apiKey,
    });
    const url = `${baseUrl}/query?${params.toString()}`;

    try {
      const res = await fetchWithRetry(url, {}, 1, 1000);
      const data = (await res.json()) as AvGlobalQuote;
      guardRateLimit(data);

      const gq = data["Global Quote"];
      if (!gq?.["05. price"]) {
        throw new FetchError(`Alpha Vantage: no quote data for ${ticker}`);
      }

      recordSuccess();
      return {
        ticker: gq["01. symbol"] ?? ticker,
        price: parseFloat(gq["05. price"]),
        open: parseFloat(gq["02. open"] ?? gq["05. price"]),
        high: parseFloat(gq["03. high"] ?? gq["05. price"]),
        low: parseFloat(gq["04. low"] ?? gq["05. price"]),
        previousClose: parseFloat(gq["08. previous close"] ?? gq["05. price"]),
        volume: parseInt(gq["06. volume"] ?? "0", 10),
        timestamp: Date.now(),
      };
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function getHistory(ticker: string, days: number): Promise<readonly DailyCandle[]> {
    const outputsize = days > 100 ? "full" : "compact";
    const params = new URLSearchParams({
      function: "TIME_SERIES_DAILY",
      symbol: ticker,
      outputsize,
      apikey: apiKey,
    });
    const url = `${baseUrl}/query?${params.toString()}`;

    try {
      const res = await fetchWithRetry(url, {}, 1, 1000);
      const data = (await res.json()) as AvTimeSeriesDaily;
      guardRateLimit(data);

      const series = data["Time Series (Daily)"];
      if (!series) {
        throw new FetchError(`Alpha Vantage: no history data for ${ticker}`);
      }

      const candles: DailyCandle[] = Object.entries(series)
        .map(([date, vals]) => ({
          date,
          open: parseFloat(vals["1. open"]),
          high: parseFloat(vals["2. high"]),
          low: parseFloat(vals["3. low"]),
          close: parseFloat(vals["4. close"]),
          volume: parseInt(vals["5. volume"], 10),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      recordSuccess();
      return candles.slice(-days);
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function search(query: string): Promise<readonly SearchResult[]> {
    const params = new URLSearchParams({
      function: "SYMBOL_SEARCH",
      keywords: query,
      apikey: apiKey,
    });
    const url = `${baseUrl}/query?${params.toString()}`;

    try {
      const res = await fetchWithRetry(url, {}, 1, 1000);
      const data = (await res.json()) as AvSearchResponse;
      guardRateLimit(data);

      recordSuccess();
      return (data.bestMatches ?? []).map((m) => ({
        symbol: m["1. symbol"],
        name: m["2. name"],
        exchange: m["4. region"],
        type: m["3. type"],
      }));
    } catch (err) {
      recordError();
      throw err;
    }
  }

  function health(): ProviderHealth {
    return {
      name: "alpha-vantage",
      available: consecutiveErrors < 3,
      lastSuccessAt,
      lastErrorAt,
      consecutiveErrors,
    };
  }

  return { name: "alpha-vantage", getQuote, getHistory, search, health };
}
