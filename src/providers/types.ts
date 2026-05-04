/**
 * Data provider types — MarketDataProvider interface and related types.
 *
 * All providers implement this interface so they can be composed into a
 * fallback chain.
 */
import type { DailyCandle } from "../types/domain";

/** A quote snapshot for a single ticker. */
export interface Quote {
  readonly ticker: string;
  readonly price: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly previousClose: number;
  readonly volume: number;
  readonly timestamp: number; // Unix ms
}

/** Search result from provider autocomplete. */
export interface SearchResult {
  readonly symbol: string;
  readonly name: string;
  readonly exchange?: string;
  readonly type?: string;
}

/** Health status of a provider. */
export interface ProviderHealth {
  readonly name: string;
  readonly available: boolean;
  readonly lastSuccessAt: number | null;
  readonly lastErrorAt: number | null;
  readonly consecutiveErrors: number;
  /** Requests made in the current window (client-side tracking). */
  readonly requestsInWindow?: number;
  /** Maximum requests per window (configured capacity). */
  readonly requestCapacity?: number;
}

/** Canonical data provider interface. */
export interface MarketDataProvider {
  readonly name: string;

  /** Fetch a real-time quote. */
  getQuote(ticker: string): Promise<Quote>;

  /** Fetch daily OHLCV history. */
  getHistory(ticker: string, days: number): Promise<readonly DailyCandle[]>;

  /** Autocomplete search. */
  search(query: string): Promise<readonly SearchResult[]>;

  /** Check if the provider is reachable. */
  health(): ProviderHealth;
}
