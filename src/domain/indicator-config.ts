/**
 * Indicator configuration schema — per-indicator period/threshold/color (Q4 / RF9).
 *
 * Provides typed configuration objects for every core technical indicator.
 * Pure domain logic: no DOM, no fetch, no side-effects.
 *
 * Usage:
 *   const config = DEFAULT_INDICATOR_CONFIGS["RSI"];
 *   const validated = validateIndicatorConfig(config);
 */
import { DEFAULTS } from "./technical-defaults";

// ── Common types ──────────────────────────────────────────────────────────────

/** CSS hex colour string (7-char #RRGGBB or 4-char #RGB). */
export type HexColor = `#${string}`;

/** Shared base fields present on every indicator config. */
export interface IndicatorConfigBase {
  /** Whether this indicator is visible on the chart. */
  readonly enabled: boolean;
  /** Primary line / histogram colour. */
  readonly color: HexColor;
}

// ── Per-indicator config interfaces ──────────────────────────────────────────

export interface SmaConfig extends IndicatorConfigBase {
  readonly type: "SMA";
  /** Lookback period in bars. Range: 2–500. */
  readonly period: number;
}

export interface EmaConfig extends IndicatorConfigBase {
  readonly type: "EMA";
  /** Lookback period in bars. Range: 2–500. */
  readonly period: number;
}

export interface RsiConfig extends IndicatorConfigBase {
  readonly type: "RSI";
  /** Lookback period in bars. Range: 2–100. */
  readonly period: number;
  /** Lower band threshold (oversold). Range: 1–49. */
  readonly oversold: number;
  /** Upper band threshold (overbought). Range: 51–99. */
  readonly overbought: number;
}

export interface MacdConfig extends IndicatorConfigBase {
  readonly type: "MACD";
  /** Fast EMA period. Range: 2–50. */
  readonly fastPeriod: number;
  /** Slow EMA period. Range: fastPeriod+1–200. */
  readonly slowPeriod: number;
  /** Signal EMA period. Range: 2–50. */
  readonly signalPeriod: number;
  /** Signal line colour. */
  readonly signalColor: HexColor;
  /** Histogram colour (positive bars). */
  readonly histColorPositive: HexColor;
  /** Histogram colour (negative bars). */
  readonly histColorNegative: HexColor;
}

export interface BollingerConfig extends IndicatorConfigBase {
  readonly type: "Bollinger";
  /** Lookback period in bars. Range: 2–200. */
  readonly period: number;
  /** Standard-deviation multiplier for the bands. Range: 0.5–5.0. */
  readonly multiplier: number;
  /** Upper band colour. */
  readonly upperColor: HexColor;
  /** Lower band colour. */
  readonly lowerColor: HexColor;
}

export interface StochasticConfig extends IndicatorConfigBase {
  readonly type: "Stochastic";
  /** %K period in bars. Range: 2–100. */
  readonly kPeriod: number;
  /** %D smoothing period. Range: 1–50. */
  readonly dPeriod: number;
  /** Oversold threshold. Range: 1–49. */
  readonly oversold: number;
  /** Overbought threshold. Range: 51–99. */
  readonly overbought: number;
  /** %D signal line colour. */
  readonly dColor: HexColor;
}

export interface AdxConfig extends IndicatorConfigBase {
  readonly type: "ADX";
  /** Lookback period in bars. Range: 2–100. */
  readonly period: number;
  /** Trend-strength threshold. Range: 1–99. */
  readonly trendThreshold: number;
}

export interface AtrConfig extends IndicatorConfigBase {
  readonly type: "ATR";
  /** Lookback period in bars. Range: 2–200. */
  readonly period: number;
}

export interface VwapConfig extends IndicatorConfigBase {
  readonly type: "VWAP";
  /** Reset anchor: daily, weekly, or monthly. */
  readonly anchor: "daily" | "weekly" | "monthly";
}

// ── Discriminated union ───────────────────────────────────────────────────────

export type IndicatorConfig =
  | SmaConfig
  | EmaConfig
  | RsiConfig
  | MacdConfig
  | BollingerConfig
  | StochasticConfig
  | AdxConfig
  | AtrConfig
  | VwapConfig;

export type IndicatorType = IndicatorConfig["type"];

// ── Default configurations ────────────────────────────────────────────────────

export const DEFAULT_INDICATOR_CONFIGS = {
  SMA: {
    type: "SMA",
    period: DEFAULTS.sma200Period,
    enabled: true,
    color: "#2962ff",
  } satisfies SmaConfig,

  EMA: {
    type: "EMA",
    period: DEFAULTS.sma50Period,
    enabled: true,
    color: "#ff6d00",
  } satisfies EmaConfig,

  RSI: {
    type: "RSI",
    period: DEFAULTS.period,
    oversold: DEFAULTS.rsiOversold,
    overbought: DEFAULTS.rsiOverbought,
    enabled: true,
    color: "#7b1fa2",
  } satisfies RsiConfig,

  MACD: {
    type: "MACD",
    fastPeriod: DEFAULTS.macdFastPeriod,
    slowPeriod: DEFAULTS.macdSlowPeriod,
    signalPeriod: DEFAULTS.macdSignalPeriod,
    enabled: true,
    color: "#0288d1",
    signalColor: "#f57c00",
    histColorPositive: "#26a69a",
    histColorNegative: "#ef5350",
  } satisfies MacdConfig,

  Bollinger: {
    type: "Bollinger",
    period: DEFAULTS.bollingerPeriod,
    multiplier: DEFAULTS.bollingerMultiplier,
    enabled: true,
    color: "#1565c0",
    upperColor: "#1565c0",
    lowerColor: "#1565c0",
  } satisfies BollingerConfig,

  Stochastic: {
    type: "Stochastic",
    kPeriod: 14,
    dPeriod: 3,
    oversold: 20,
    overbought: 80,
    enabled: true,
    color: "#00796b",
    dColor: "#d32f2f",
  } satisfies StochasticConfig,

  ADX: {
    type: "ADX",
    period: DEFAULTS.period,
    trendThreshold: 25,
    enabled: true,
    color: "#558b2f",
  } satisfies AdxConfig,

  ATR: {
    type: "ATR",
    period: DEFAULTS.period,
    enabled: false,
    color: "#795548",
  } satisfies AtrConfig,

  VWAP: {
    type: "VWAP",
    anchor: "daily",
    enabled: true,
    color: "#e65100",
  } satisfies VwapConfig,
} as const satisfies Record<IndicatorType, IndicatorConfig>;

// ── Validation ────────────────────────────────────────────────────────────────

export interface ConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function assertPeriod(value: number, name: string, min: number, max: number): string | null {
  if (!Number.isInteger(value) || value < min || value > max) {
    return `${name} must be an integer between ${min} and ${max}, got ${value}`;
  }
  return null;
}

function assertColor(value: string, name: string): string | null {
  if (!HEX_COLOR_RE.test(value)) {
    return `${name} must be a valid hex color (#RGB or #RRGGBB), got "${value}"`;
  }
  return null;
}

function assertThreshold(value: number, name: string, min: number, max: number): string | null {
  if (typeof value !== "number" || value < min || value > max) {
    return `${name} must be between ${min} and ${max}, got ${value}`;
  }
  return null;
}

/**
 * Validate an indicator config object, returning a list of constraint violations.
 * Returns `{ valid: true, errors: [] }` when all constraints pass.
 */
export function validateIndicatorConfig(config: IndicatorConfig): ConfigValidationResult {
  const errors: string[] = [];

  const colorErr = assertColor(config.color, "color");
  if (colorErr) errors.push(colorErr);

  switch (config.type) {
    case "SMA":
    case "EMA": {
      const e = assertPeriod(config.period, "period", 2, 500);
      if (e) errors.push(e);
      break;
    }
    case "RSI": {
      const e1 = assertPeriod(config.period, "period", 2, 100);
      const e2 = assertThreshold(config.oversold, "oversold", 1, 49);
      const e3 = assertThreshold(config.overbought, "overbought", 51, 99);
      if (e1) errors.push(e1);
      if (e2) errors.push(e2);
      if (e3) errors.push(e3);
      if (!e2 && !e3 && config.oversold >= config.overbought) {
        errors.push("oversold must be less than overbought");
      }
      break;
    }
    case "MACD": {
      const e1 = assertPeriod(config.fastPeriod, "fastPeriod", 2, 50);
      const e2 = assertPeriod(config.slowPeriod, "slowPeriod", 3, 200);
      const e3 = assertPeriod(config.signalPeriod, "signalPeriod", 2, 50);
      if (e1) errors.push(e1);
      if (e2) errors.push(e2);
      if (e3) errors.push(e3);
      if (!e1 && !e2 && config.fastPeriod >= config.slowPeriod) {
        errors.push("fastPeriod must be less than slowPeriod");
      }
      const sc = assertColor(config.signalColor, "signalColor");
      const hcp = assertColor(config.histColorPositive, "histColorPositive");
      const hcn = assertColor(config.histColorNegative, "histColorNegative");
      if (sc) errors.push(sc);
      if (hcp) errors.push(hcp);
      if (hcn) errors.push(hcn);
      break;
    }
    case "Bollinger": {
      const e1 = assertPeriod(config.period, "period", 2, 200);
      if (e1) errors.push(e1);
      if (
        typeof config.multiplier !== "number" ||
        config.multiplier < 0.5 ||
        config.multiplier > 5.0
      ) {
        errors.push(`multiplier must be between 0.5 and 5.0, got ${config.multiplier}`);
      }
      const uc = assertColor(config.upperColor, "upperColor");
      const lc = assertColor(config.lowerColor, "lowerColor");
      if (uc) errors.push(uc);
      if (lc) errors.push(lc);
      break;
    }
    case "Stochastic": {
      const e1 = assertPeriod(config.kPeriod, "kPeriod", 2, 100);
      const e2 = assertPeriod(config.dPeriod, "dPeriod", 1, 50);
      const e3 = assertThreshold(config.oversold, "oversold", 1, 49);
      const e4 = assertThreshold(config.overbought, "overbought", 51, 99);
      if (e1) errors.push(e1);
      if (e2) errors.push(e2);
      if (e3) errors.push(e3);
      if (e4) errors.push(e4);
      const dc = assertColor(config.dColor, "dColor");
      if (dc) errors.push(dc);
      break;
    }
    case "ADX": {
      const e1 = assertPeriod(config.period, "period", 2, 100);
      const e2 = assertThreshold(config.trendThreshold, "trendThreshold", 1, 99);
      if (e1) errors.push(e1);
      if (e2) errors.push(e2);
      break;
    }
    case "ATR": {
      const e1 = assertPeriod(config.period, "period", 2, 200);
      if (e1) errors.push(e1);
      break;
    }
    case "VWAP": {
      const anchors = ["daily", "weekly", "monthly"];
      if (!anchors.includes(config.anchor)) {
        errors.push(`anchor must be one of ${anchors.join(", ")}, got "${config.anchor}"`);
      }
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}
