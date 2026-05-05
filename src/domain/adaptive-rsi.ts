/**
 * Adaptive RSI — RSI with a dynamically adjusted lookback period based
 * on price efficiency (Kaufman-style). When the market is trending, the
 * effective period shortens (more responsive); in choppy markets it
 * lengthens (more smoothing).
 *
 * @module domain/adaptive-rsi
 */

import type { DailyCandle } from "../types/domain";

export interface AdaptiveRsiPoint {
  readonly date: string;
  readonly rsi: number;
  readonly effectivePeriod: number;
}

export interface AdaptiveRsiOptions {
  /** Shortest allowed RSI period. Default 6. */
  readonly minPeriod?: number;
  /** Longest allowed RSI period. Default 28. */
  readonly maxPeriod?: number;
  /** Lookback window for efficiency ratio calculation. Default 10. */
  readonly erPeriod?: number;
}

/**
 * Compute Adaptive RSI for a candle series.
 *
 * Uses the Kaufman efficiency ratio to scale the RSI period between
 * `minPeriod` and `maxPeriod`. The efficiency ratio (|net change| / sum
 * of |individual changes|) ranges from 0 (choppy) to 1 (trending).
 *
 * Requires at least `maxPeriod + erPeriod` data points.
 */
export function computeAdaptiveRsi(
  candles: readonly DailyCandle[],
  options?: AdaptiveRsiOptions,
): AdaptiveRsiPoint[] | null {
  const minPeriod = options?.minPeriod ?? 6;
  const maxPeriod = options?.maxPeriod ?? 28;
  const erPeriod = options?.erPeriod ?? 10;

  const required = maxPeriod + erPeriod;
  if (candles.length < required) return null;
  if (minPeriod < 2 || maxPeriod < minPeriod || erPeriod < 2) return null;

  // Pre-compute daily changes
  const changes: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    changes.push(candles[i]!.close - candles[i - 1]!.close);
  }

  const result: AdaptiveRsiPoint[] = [];

  for (let i = required - 1; i < candles.length; i++) {
    const changeIdx = i - 1; // changes[i-1] = candles[i] - candles[i-1]

    // Efficiency ratio over erPeriod ending at index i
    const er = efficiencyRatio(candles, i, erPeriod);

    // Map ER to period: ER=1 (trending) → minPeriod, ER=0 (choppy) → maxPeriod
    const effectivePeriod = Math.round(maxPeriod - er * (maxPeriod - minPeriod));

    // Compute RSI with the effective period ending at changeIdx
    const rsi = computeRsiAtIndex(changes, changeIdx, effectivePeriod);

    result.push({
      date: candles[i]!.date,
      rsi,
      effectivePeriod,
    });
  }

  return result;
}

/**
 * Kaufman efficiency ratio: |net price change| / sum of |individual changes|.
 * Returns 0-1 where 1 = perfectly trending, 0 = perfectly choppy.
 */
function efficiencyRatio(candles: readonly DailyCandle[], endIdx: number, period: number): number {
  const startIdx = endIdx - period;
  const netChange = Math.abs(candles[endIdx]!.close - candles[startIdx]!.close);
  let sumAbsChanges = 0;

  for (let j = startIdx + 1; j <= endIdx; j++) {
    sumAbsChanges += Math.abs(candles[j]!.close - candles[j - 1]!.close);
  }

  return sumAbsChanges === 0 ? 0 : netChange / sumAbsChanges;
}

/**
 * Standard RSI computation at a specific index in the changes array
 * using Wilder's smoothing for the given period.
 */
function computeRsiAtIndex(changes: readonly number[], endIdx: number, period: number): number {
  const startIdx = endIdx - period + 1;
  if (startIdx < 0) return 50; // Insufficient data fallback

  // Initial averages from first 'period' changes
  let avgGain = 0;
  let avgLoss = 0;

  for (let j = startIdx; j < startIdx + period; j++) {
    const c = changes[j]!;
    if (c > 0) avgGain += c;
    else avgLoss += Math.abs(c);
  }

  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) return 100;
  if (avgGain === 0) return 0;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}
