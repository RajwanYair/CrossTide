/**
 * Pairs trading signals — z-score based entry/exit for cointegrated pairs.
 * Generates trading signals from the spread between two cointegrated assets.
 */

export interface PairsSignal {
  readonly spread: readonly number[];
  readonly zScore: readonly number[];
  readonly signals: readonly PairsTradeSignal[];
  readonly hedgeRatio: number;
  readonly meanSpread: number;
  readonly spreadStd: number;
}

export interface PairsTradeSignal {
  readonly index: number;
  readonly action: "long-spread" | "short-spread" | "close";
  readonly zScore: number;
}

export interface PairsConfig {
  readonly entryZ?: number; // z-score to enter (default 2.0)
  readonly exitZ?: number; // z-score to exit (default 0.5)
  readonly stopZ?: number; // z-score stop loss (default 3.5)
  readonly lookback?: number; // rolling window for mean/std (default: all)
}

/**
 * Compute hedge ratio via OLS regression (Y = β·X + ε).
 */
export function hedgeRatio(seriesY: readonly number[], seriesX: readonly number[]): number {
  const n = Math.min(seriesY.length, seriesX.length);
  if (n < 2) return 1;

  let sumX = 0,
    sumY = 0,
    sumXX = 0,
    sumXY = 0;
  for (let i = 0; i < n; i++) {
    const x = seriesX[i]!;
    const y = seriesY[i]!;
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumXY += x * y;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 1;
  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Compute spread: Y - β·X.
 */
export function pairsSpread(
  seriesY: readonly number[],
  seriesX: readonly number[],
  beta?: number,
): number[] {
  const n = Math.min(seriesY.length, seriesX.length);
  const b = beta ?? hedgeRatio(seriesY, seriesX);
  const spread: number[] = [];
  for (let i = 0; i < n; i++) {
    spread.push(seriesY[i]! - b * seriesX[i]!);
  }
  return spread;
}

/**
 * Compute rolling z-score of spread.
 */
export function spreadZScore(spread: readonly number[], lookback?: number): number[] {
  const n = spread.length;
  if (n === 0) return [];

  const lb = lookback ?? n;
  const zScores: number[] = [];

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - lb + 1);
    const window = spread.slice(start, i + 1);
    const mean = window.reduce((s, v) => s + v, 0) / window.length;
    let variance = 0;
    for (const v of window) variance += (v - mean) ** 2;
    const std = Math.sqrt(variance / window.length);
    zScores.push(std > 0 ? (spread[i]! - mean) / std : 0);
  }

  return zScores;
}

/**
 * Generate pairs trading signals from z-scores.
 */
export function pairsSignals(
  seriesY: readonly number[],
  seriesX: readonly number[],
  config: PairsConfig = {},
): PairsSignal {
  const { entryZ = 2.0, exitZ = 0.5, stopZ = 3.5, lookback } = config;
  const beta = hedgeRatio(seriesY, seriesX);
  const spread = pairsSpread(seriesY, seriesX, beta);
  const zScore = spreadZScore(spread, lookback);
  const n = spread.length;

  const meanSpread = spread.reduce((s, v) => s + v, 0) / n;
  let ssq = 0;
  for (const v of spread) ssq += (v - meanSpread) ** 2;
  const spreadStd = Math.sqrt(ssq / n);

  const signals: PairsTradeSignal[] = [];
  let position: "long-spread" | "short-spread" | "flat" = "flat";

  for (let i = 0; i < n; i++) {
    const z = zScore[i]!;

    if (position === "flat") {
      if (z <= -entryZ) {
        position = "long-spread";
        signals.push({ index: i, action: "long-spread", zScore: z });
      } else if (z >= entryZ) {
        position = "short-spread";
        signals.push({ index: i, action: "short-spread", zScore: z });
      }
    } else if (position === "long-spread") {
      if (z >= -exitZ || z <= -stopZ) {
        position = "flat";
        signals.push({ index: i, action: "close", zScore: z });
      }
    } else if (position === "short-spread") {
      if (z <= exitZ || z >= stopZ) {
        position = "flat";
        signals.push({ index: i, action: "close", zScore: z });
      }
    }
  }

  return { spread, zScore, signals, hedgeRatio: beta, meanSpread, spreadStd };
}
