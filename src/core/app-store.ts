/**
 * App Store — reactive state shared between main.ts and all cards.
 *
 * Uses the internal signal primitive so cards can subscribe to updates
 * without importing main.ts (avoiding circular deps).
 */
import type { ConsensusResult, DailyCandle } from "../types/domain";
import { signal } from "./signals";

export interface TickerSnapshot {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  high52w: number;
  low52w: number;
  closes30d: readonly number[];
  consensus: ConsensusResult | null;
  candles: readonly DailyCandle[];
  error?: string;
}

/** Map of ticker → snapshot for all watchlist entries. */
export const tickerDataStore = signal<ReadonlyMap<string, TickerSnapshot>>(new Map());

/** Currently selected ticker (for consensus/chart views). */
export const selectedTickerStore = signal<string>("");

/** True while any fetch is in progress. */
export const loadingStore = signal<boolean>(false);
