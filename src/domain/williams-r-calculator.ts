/**
 * Williams %R — Pure domain logic.
 * Ported from Dart: lib/src/domain/williams_percent_r_calculator.dart
 *
 * %R = (highestHigh - close) / (highestHigh - lowestLow) * -100
 * Range: -100 to 0. Below -80 = oversold, above -20 = overbought.
 */
import type { DailyCandle } from "../types/domain";
import { DEFAULTS } from "./technical-defaults";

export interface WilliamsRPoint {
  readonly date: string;
  readonly value: number | null;
}

export function computeWilliamsRSeries(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): WilliamsRPoint[] {
  if (candles.length < period) {
    return candles.map((c) => ({ date: c.date, value: null }));
  }

  const results: WilliamsRPoint[] = [];

  for (let i = 0; i < period - 1; i++) {
    results.push({ date: candles[i]!.date, value: null });
  }

  for (let i = period - 1; i < candles.length; i++) {
    let highestHigh = candles[i]!.high;
    let lowestLow = candles[i]!.low;
    for (let j = i - period + 1; j < i; j++) {
      const c = candles[j]!;
      if (c.high > highestHigh) highestHigh = c.high;
      if (c.low < lowestLow) lowestLow = c.low;
    }
    const range = highestHigh - lowestLow;
    const wr = range > 0 ? ((highestHigh - candles[i]!.close) / range) * -100 : -50;
    results.push({ date: candles[i]!.date, value: wr });
  }
  return results;
}

export function computeWilliamsR(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): number | null {
  const series = computeWilliamsRSeries(candles, period);
  for (let i = series.length - 1; i >= 0; i--) {
    const p = series[i];
    if (p?.value != null) return p.value;
  }
  return null;
}
