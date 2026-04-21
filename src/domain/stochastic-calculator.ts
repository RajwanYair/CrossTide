/**
 * Stochastic Oscillator — Pure domain logic.
 * Ported from Dart: lib/src/domain/stochastic_calculator.dart
 *
 * %K = (close - lowestLow) / (highestHigh - lowestLow) * 100
 * %D = SMA(%K, smoothD)
 */
import type { DailyCandle } from "../types/domain";
import { DEFAULTS } from "./technical-defaults";

export interface StochasticPoint {
  readonly date: string;
  readonly percentK: number;
  readonly percentD: number;
}

export function computeStochasticSeries(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
  smoothK = 3,
  smoothD = 3,
): StochasticPoint[] {
  const minLen = period + smoothK + smoothD - 2;
  if (candles.length < minLen) return [];

  // Step 1: raw %K
  const rawK: { date: string; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let lowestLow = candles[i]!.low;
    let highestHigh = candles[i]!.high;
    for (let j = i - period + 1; j < i; j++) {
      const c = candles[j]!;
      if (c.low < lowestLow) lowestLow = c.low;
      if (c.high > highestHigh) highestHigh = c.high;
    }
    const range = highestHigh - lowestLow;
    const k = range > 0 ? ((candles[i]!.close - lowestLow) / range) * 100 : 50;
    rawK.push({ date: candles[i]!.date, value: k });
  }

  // Step 2: smooth %K with SMA(smoothK)
  const smoothedK: { date: string; value: number }[] = [];
  for (let i = smoothK - 1; i < rawK.length; i++) {
    let sum = 0;
    for (let j = i - smoothK + 1; j <= i; j++) sum += rawK[j]!.value;
    smoothedK.push({ date: rawK[i]!.date, value: sum / smoothK });
  }

  // Step 3: %D = SMA(smoothedK, smoothD)
  const results: StochasticPoint[] = [];
  for (let i = smoothD - 1; i < smoothedK.length; i++) {
    let sum = 0;
    for (let j = i - smoothD + 1; j <= i; j++) sum += smoothedK[j]!.value;
    results.push({
      date: smoothedK[i]!.date,
      percentK: smoothedK[i]!.value,
      percentD: sum / smoothD,
    });
  }
  return results;
}

export function computeStochastic(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
  smoothK = 3,
  smoothD = 3,
): StochasticPoint | null {
  const series = computeStochasticSeries(candles, period, smoothK, smoothD);
  return series.length > 0 ? series[series.length - 1]! : null;
}
