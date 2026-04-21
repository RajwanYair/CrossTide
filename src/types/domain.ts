/**
 * CrossTide Domain Types — Pure type definitions, no runtime code.
 *
 * Ported from the Dart domain layer. These are the canonical types shared
 * across all modules.
 */

/** A single daily OHLCV price candle. */
export interface DailyCandle {
  readonly date: string; // ISO 8601 date (YYYY-MM-DD)
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

/** Signal direction for trading methods. */
export type SignalDirection = "BUY" | "SELL" | "NEUTRAL";

/** Which trading method produced the signal. */
export type MethodName =
  | "Micho"
  | "RSI"
  | "MACD"
  | "Bollinger"
  | "Stochastic"
  | "OBV"
  | "ADX"
  | "CCI"
  | "SAR"
  | "WilliamsR"
  | "MFI"
  | "SuperTrend"
  | "Consensus";

/** A signal emitted by a single trading method detector. */
export interface MethodSignal {
  readonly ticker: string;
  readonly method: MethodName;
  readonly direction: SignalDirection;
  readonly description: string;
  readonly currentClose: number;
  readonly evaluatedAt: string; // ISO 8601
}

/** Consensus evaluation result for one ticker. */
export interface ConsensusResult {
  readonly ticker: string;
  readonly direction: SignalDirection;
  readonly buyMethods: readonly MethodSignal[];
  readonly sellMethods: readonly MethodSignal[];
  readonly strength: number; // 0–1 ratio of buy or sell signals to total
}

/** SMA periods the app monitors. */
export const SMA_PERIODS = [50, 150, 200] as const;
export type SmaPeriod = (typeof SMA_PERIODS)[number];

/** Watchlist entry stored in the reactive state. */
export interface WatchlistEntry {
  readonly ticker: string;
  readonly addedAt: string; // ISO 8601
}

/** User-facing config. */
export interface AppConfig {
  readonly theme: "dark" | "light";
  readonly watchlist: readonly WatchlistEntry[];
}
