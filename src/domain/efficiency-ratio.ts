/**
 * Kaufman Efficiency Ratio (ER) — measures how efficiently price moves
 * in a given direction relative to total path distance.
 *
 * ER = |Close(t) - Close(t-n)| / Σ |Close(i) - Close(i-1)| for i=t-n+1..t
 *
 * Values range from 0 (perfectly choppy/mean-reverting) to 1 (perfectly
 * trending). Used as input for KAMA (Kaufman Adaptive Moving Average)
 * and Adaptive RSI.
 *
 * @module domain/efficiency-ratio
 */

import type { DailyCandle } from "../types/domain";

export interface EfficiencyRatioPoint {
  readonly date: string;
  readonly er: number;
}

export interface EfficiencyRatioOptions {
  /** Lookback window. Default 10. */
  readonly period?: number;
}

/**
 * Compute rolling Kaufman Efficiency Ratio over a candle series.
 *
 * Requires at least `period + 1` data points.
 * Returns one ER value per candle starting from index `period`.
 */
export function computeEfficiencyRatio(
  candles: readonly DailyCandle[],
  options?: EfficiencyRatioOptions,
): EfficiencyRatioPoint[] | null {
  const period = options?.period ?? 10;

  if (period < 2) return null;
  if (candles.length < period + 1) return null;

  const result: EfficiencyRatioPoint[] = [];

  for (let i = period; i < candles.length; i++) {
    const netChange = Math.abs(candles[i]!.close - candles[i - period]!.close);

    let sumAbsChanges = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumAbsChanges += Math.abs(candles[j]!.close - candles[j - 1]!.close);
    }

    const er = sumAbsChanges === 0 ? 0 : netChange / sumAbsChanges;

    result.push({
      date: candles[i]!.date,
      er: Math.round(er * 1e8) / 1e8, // Avoid floating-point noise
    });
  }

  return result;
}
