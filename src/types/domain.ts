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
  /** Instrument type — auto-classified from Yahoo quoteType; overrideable. */
  readonly instrumentType?: InstrumentType;
  /** Company / fund display name populated from the first successful quote response. */
  readonly name?: string;
}

/**
 * Instrument classification for filter chips.
 * Derived from Yahoo Finance `quoteType`: EQUITY→stock, ETF→etf,
 * CRYPTOCURRENCY→crypto, any other/unknown→other.
 */
export type InstrumentType = "stock" | "etf" | "crypto" | "other";

/** User-facing config. */
export type MethodWeights = Partial<Record<MethodName, number>>;

/**
 * Default per-method consensus weights.
 * Micho retains its anchor role (3×); all other methods default to 1×.
 * A value of 0 disables the method from the consensus tally.
 */
export const DEFAULT_METHOD_WEIGHTS: Readonly<MethodWeights> = {
  Micho: 3,
  RSI: 1,
  MACD: 1,
  Bollinger: 1,
  Stochastic: 1,
  OBV: 1,
  ADX: 1,
  CCI: 1,
  SAR: 1,
  WilliamsR: 1,
  MFI: 1,
  SuperTrend: 1,
} as const;

/** User-facing config. */
export interface AppConfig {
  readonly theme: "dark" | "light" | "high-contrast";
  readonly watchlist: readonly WatchlistEntry[];
  /** Per-method consensus weights (0 = disabled, 3 = triple-weighted, default 1). */
  readonly methodWeights?: MethodWeights;
  /** Per-card isolated settings namespace (G24). */
  readonly cardSettings?: CardSettingsMap;
}

/** Cards that expose local, per-card settings in the global config. */
export type CardId =
  | "watchlist"
  | "chart"
  | "consensus"
  | "screener"
  | "heatmap"
  | "backtest"
  | "alerts"
  | "portfolio"
  | "risk";

export interface WatchlistCardSettings {
  readonly visibleColumns: readonly string[];
  readonly autoRefreshSec: number;
  readonly density: "compact" | "comfortable";
}

export interface ChartCardSettings {
  readonly defaultInterval: "1d" | "1w" | "1m";
  readonly indicatorSet: readonly string[];
  readonly crosshairSnap: boolean;
}

export interface ConsensusCardSettings {
  readonly methodsToDisplay: readonly MethodName[];
  readonly historyDepth: number;
}

export interface ScreenerCardSettings {
  readonly defaultPreset: "balanced" | "momentum" | "value";
  readonly maxResults: number;
  readonly sortColumn: "ticker" | "price" | "consensus";
}

export interface HeatmapCardSettings {
  readonly colorScale: "diverging" | "sequential";
  readonly cellLabelFormat: "ticker" | "ticker-change";
}

export interface BacktestCardSettings {
  readonly defaultStrategy: string;
  readonly lookbackWindow: number;
  readonly benchmark: string;
}

export interface AlertsCardSettings {
  readonly thresholdType: "percent" | "absolute";
  readonly notificationChannel: "toast" | "push";
}

export interface PortfolioCardSettings {
  readonly benchmarkTicker: string;
  readonly displayCurrency: "USD" | "EUR" | "ILS";
}

export interface RiskCardSettings {
  readonly varConfidence: number;
  readonly benchmark: string;
}

export interface CardSettingsMap {
  readonly watchlist?: WatchlistCardSettings;
  readonly chart?: ChartCardSettings;
  readonly consensus?: ConsensusCardSettings;
  readonly screener?: ScreenerCardSettings;
  readonly heatmap?: HeatmapCardSettings;
  readonly backtest?: BacktestCardSettings;
  readonly alerts?: AlertsCardSettings;
  readonly portfolio?: PortfolioCardSettings;
  readonly risk?: RiskCardSettings;
}

/** An alert that has been fired and persisted. */
export interface AlertRecord {
  readonly id: string;
  readonly ticker: string;
  readonly alertType: string;
  readonly direction: SignalDirection;
  readonly description: string;
  readonly firedAt: string; // ISO 8601
}

/** Fundamental financial data for a ticker (from quoteSummary). */
export interface FundamentalData {
  readonly peRatio?: number;
  readonly forwardPe?: number;
  readonly eps?: number;
  readonly revenue?: number;
  readonly marketCap?: number;
  readonly dividendYield?: number;
  readonly priceToBook?: number;
  readonly debtToEquity?: number;
  readonly returnOnEquity?: number;
  readonly profitMargin?: number;
  readonly fetchedAt: string; // ISO 8601
}

/** A single portfolio holding. */
export interface Holding {
  readonly ticker: string;
  readonly shares: number;
  readonly avgCost: number;
  readonly currentPrice: number;
  /** Annual dividend yield as a decimal (e.g. 0.035 = 3.5%). Optional. */
  readonly dividendYield?: number;
}
