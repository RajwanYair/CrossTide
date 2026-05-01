/**
 * Bollinger Bands Calculator — Pure domain logic.
 * Ported from Dart: lib/src/domain/bollinger_calculator.dart
 *
 * Middle = SMA(period), Upper/Lower = Middle ± multiplier * stddev.
 */
import type { DailyCandle } from "../types/domain";
import { DEFAULTS } from "./technical-defaults";

export interface BollingerPoint {
  readonly date: string;
  readonly middle: number | null;
  readonly upper: number | null;
  readonly lower: number | null;
  readonly bandwidth: number | null;
  readonly percentB: number | null;
}

export function computeBollingerSeries(
  candles: readonly DailyCandle[],
  period = DEFAULTS.bollingerPeriod,
  multiplier = DEFAULTS.bollingerMultiplier,
): BollingerPoint[] {
  const results: BollingerPoint[] = [];
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    if (!candle) continue;
    if (i < period - 1) {
      results.push({
        date: candle.date,
        middle: null,
        upper: null,
        lower: null,
        bandwidth: null,
        percentB: null,
      });
      continue;
    }
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, c) => a + c.close, 0) / period;
    const variance = slice.reduce((a, c) => a + (c.close - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    const upper = mean + multiplier * sd;
    const lower = mean - multiplier * sd;
    const bw = mean > 0 ? (upper - lower) / mean : null;
    const pb = upper - lower > 0 ? (candle.close - lower) / (upper - lower) : null;
    results.push({ date: candle.date, middle: mean, upper, lower, bandwidth: bw, percentB: pb });
  }
  return results;
}

export function computeBollinger(
  candles: readonly DailyCandle[],
  period = DEFAULTS.bollingerPeriod,
  multiplier = DEFAULTS.bollingerMultiplier,
): BollingerPoint | null {
  const series = computeBollingerSeries(candles, period, multiplier);
  for (let i = series.length - 1; i >= 0; i--) {
    const p = series[i];
    if (p?.upper != null) return p;
  }
  return null;
}
