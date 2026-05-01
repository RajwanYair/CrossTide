/**
 * CoinGecko provider — fetches crypto quotes and history.
 * Public API: CORS-enabled, no API key required.
 * Uses CoinGecko coin IDs (ticker lowercased as coin ID).
 */
import type { DailyCandle } from "../types/domain";
import type { MarketDataProvider, Quote, SearchResult, ProviderHealth } from "./types";
import { fetchWithRetry, FetchError } from "../core/fetch";

const DEFAULT_BASE_URL = "https://api.coingecko.com/api/v3";

interface CoinGeckoSimplePrice {
  [id: string]: {
    usd?: number;
    usd_24h_change?: number;
    usd_24h_vol?: number;
    last_updated_at?: number;
  };
}

interface CoinGeckoSearch {
  coins?: Array<{
    id: string;
    name: string;
    symbol: string;
  }>;
}

export function createCoinGeckoProvider(baseUrl: string = DEFAULT_BASE_URL): MarketDataProvider {
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

  /** Convert ticker symbol to CoinGecko coin ID (lowercase). */
  function tickerToId(ticker: string): string {
    return ticker.toLowerCase();
  }

  async function getQuote(ticker: string): Promise<Quote> {
    const id = tickerToId(ticker);
    const params = new URLSearchParams({
      ids: id,
      vs_currencies: "usd",
      include_24hr_change: "true",
      include_24hr_vol: "true",
      include_last_updated_at: "true",
    });
    const url = `${baseUrl}/simple/price?${params.toString()}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data = (await res.json()) as CoinGeckoSimplePrice;
      const coinData = data[id];
      if (!coinData?.usd) throw new FetchError(`No price data from CoinGecko for ${ticker}`);

      const price = coinData.usd;
      const change24h = coinData.usd_24h_change ?? 0;
      const prevClose = change24h !== -100 ? price / (1 + change24h / 100) : price;

      recordSuccess();
      return {
        ticker: ticker.toUpperCase(),
        price,
        open: prevClose,
        high: Math.max(price, prevClose),
        low: Math.min(price, prevClose),
        previousClose: prevClose,
        volume: Math.round(coinData.usd_24h_vol ?? 0),
        timestamp:
          coinData.last_updated_at !== undefined ? coinData.last_updated_at * 1000 : Date.now(),
      };
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function getHistory(ticker: string, days: number): Promise<readonly DailyCandle[]> {
    const id = tickerToId(ticker);
    const url = `${baseUrl}/coins/${encodeURIComponent(id)}/ohlc?vs_currency=usd&days=${days}`;
    try {
      const res = await fetchWithRetry(url, {}, 2, 500);
      const data = (await res.json()) as number[][];
      if (!Array.isArray(data) || data.length === 0) {
        throw new FetchError(`No OHLC history from CoinGecko for ${ticker}`);
      }

      recordSuccess();
      // CoinGecko returns [timestamp_ms, open, high, low, close]; deduplicate to daily last entry
      const dayMap = new Map<string, DailyCandle>();
      for (const entry of data) {
        const [ts, open, high, low, close] = entry as [number, number, number, number, number];
        const date = new Date(ts).toISOString().slice(0, 10);
        dayMap.set(date, { date, open, high, low, close, volume: 0 });
      }
      return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      recordError();
      throw err;
    }
  }

  async function search(query: string): Promise<readonly SearchResult[]> {
    const url = `${baseUrl}/search?query=${encodeURIComponent(query)}`;
    try {
      const res = await fetchWithRetry(url, {}, 1, 500);
      const data = (await res.json()) as CoinGeckoSearch;
      recordSuccess();
      return (data.coins ?? []).slice(0, 10).map((c) => ({
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        exchange: "CoinGecko",
        type: "CRYPTO",
      }));
    } catch (err) {
      recordError();
      throw err;
    }
  }

  function health(): ProviderHealth {
    return {
      name: "coingecko",
      available: consecutiveErrors < 3,
      lastSuccessAt,
      lastErrorAt,
      consecutiveErrors,
    };
  }

  return { name: "coingecko", getQuote, getHistory, search, health };
}
