/**
 * Turtle Trading System — Donchian breakout trend-following with position sizing.
 * Based on the classic Richard Dennis turtle trader rules.
 */

export interface TurtleConfig {
  readonly entryPeriod?: number; // Donchian breakout period (default 20)
  readonly exitPeriod?: number; // Donchian exit period (default 10)
  readonly atrPeriod?: number; // ATR period for sizing (default 20)
  readonly riskPerTrade?: number; // Fraction of equity to risk (default 0.01)
  readonly maxUnits?: number; // Max pyramid units (default 4)
}

export interface TurtleSignal {
  readonly index: number;
  readonly action: "long" | "short" | "exit-long" | "exit-short" | "add-long" | "add-short";
  readonly price: number;
  readonly atr: number;
  readonly units: number;
}

export interface TurtleResult {
  readonly signals: readonly TurtleSignal[];
  readonly donchianHigh: readonly number[];
  readonly donchianLow: readonly number[];
  readonly atr: readonly number[];
  readonly positionSize: (equity: number, atr: number) => number;
}

/**
 * Compute Donchian channel (highest high / lowest low over period).
 */
export function donchianChannel(
  highs: readonly number[],
  lows: readonly number[],
  period: number,
): { upper: number[]; lower: number[] } {
  const n = Math.min(highs.length, lows.length);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - period + 1);
    let maxH = -Infinity;
    let minL = Infinity;
    for (let j = start; j <= i; j++) {
      if (highs[j]! > maxH) maxH = highs[j]!;
      if (lows[j]! < minL) minL = lows[j]!;
    }
    upper.push(maxH);
    lower.push(minL);
  }

  return { upper, lower };
}

/**
 * Compute Average True Range.
 */
export function computeATR(
  highs: readonly number[],
  lows: readonly number[],
  closes: readonly number[],
  period: number,
): number[] {
  const n = Math.min(highs.length, lows.length, closes.length);
  if (n === 0) return [];

  const tr: number[] = [highs[0]! - lows[0]!];
  for (let i = 1; i < n; i++) {
    const hl = highs[i]! - lows[i]!;
    const hc = Math.abs(highs[i]! - closes[i - 1]!);
    const lc = Math.abs(lows[i]! - closes[i - 1]!);
    tr.push(Math.max(hl, hc, lc));
  }

  // Wilder smoothing
  const atr: number[] = [];
  let sum = 0;
  for (let i = 0; i < Math.min(period, n); i++) sum += tr[i]!;
  atr.push(sum / Math.min(period, n));

  for (let i = 1; i < n; i++) {
    if (i < period) {
      atr.push(tr.slice(0, i + 1).reduce((s, v) => s + v, 0) / (i + 1));
    } else {
      atr.push((atr[atr.length - 1]! * (period - 1) + tr[i]!) / period);
    }
  }

  return atr;
}

/**
 * Run Turtle Trading system on OHLC data.
 */
export function turtleTrading(
  highs: readonly number[],
  lows: readonly number[],
  closes: readonly number[],
  config: TurtleConfig = {},
): TurtleResult {
  const {
    entryPeriod = 20,
    exitPeriod = 10,
    atrPeriod = 20,
    riskPerTrade = 0.01,
    maxUnits = 4,
  } = config;

  const n = Math.min(highs.length, lows.length, closes.length);
  const entry = donchianChannel(highs, lows, entryPeriod);
  const exit = donchianChannel(highs, lows, exitPeriod);
  const atr = computeATR(highs, lows, closes, atrPeriod);

  const signals: TurtleSignal[] = [];
  let position: "long" | "short" | "flat" = "flat";
  let units = 0;
  let lastEntryPrice = 0;

  for (let i = entryPeriod; i < n; i++) {
    const currentATR = atr[i]!;
    const high = highs[i]!;
    const low = lows[i]!;
    const close = closes[i]!;

    if (position === "flat") {
      // Entry on breakout above previous period's high
      if (high > entry.upper[i - 1]!) {
        position = "long";
        units = 1;
        lastEntryPrice = close;
        signals.push({ index: i, action: "long", price: close, atr: currentATR, units });
      } else if (low < entry.lower[i - 1]!) {
        position = "short";
        units = 1;
        lastEntryPrice = close;
        signals.push({ index: i, action: "short", price: close, atr: currentATR, units });
      }
    } else if (position === "long") {
      // Pyramid: add unit every 0.5 ATR above last entry
      if (units < maxUnits && close > lastEntryPrice + 0.5 * currentATR) {
        units++;
        lastEntryPrice = close;
        signals.push({ index: i, action: "add-long", price: close, atr: currentATR, units });
      }
      // Exit on breakdown below exit channel
      if (low < exit.lower[i - 1]!) {
        position = "flat";
        units = 0;
        signals.push({ index: i, action: "exit-long", price: close, atr: currentATR, units });
      }
    } else if (position === "short") {
      // Pyramid short
      if (units < maxUnits && close < lastEntryPrice - 0.5 * currentATR) {
        units++;
        lastEntryPrice = close;
        signals.push({ index: i, action: "add-short", price: close, atr: currentATR, units });
      }
      // Exit on breakout above exit channel
      if (high > exit.upper[i - 1]!) {
        position = "flat";
        units = 0;
        signals.push({ index: i, action: "exit-short", price: close, atr: currentATR, units });
      }
    }
  }

  const positionSize = (equity: number, currentATR: number): number => {
    if (currentATR === 0) return 0;
    return Math.floor((equity * riskPerTrade) / currentATR);
  };

  return {
    signals,
    donchianHigh: entry.upper,
    donchianLow: entry.lower,
    atr,
    positionSize,
  };
}
