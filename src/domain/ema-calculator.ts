/**
 * EMA Calculator — Pure domain logic.
 * Ported from Dart: lib/src/domain/ema_calculator.dart
 *
 * EMA(t) = close(t) * k + EMA(t-1) * (1 - k), where k = 2 / (period + 1).
 * Seeds with SMA for the first value.
 */
import type { DailyCandle } from "../types/domain";

export interface EmaPoint {
  readonly date: string;
  readonly value: number | null;
}

/**
 * Compute a rolling EMA series aligned with candles.
 * The first `period - 1` entries have null values. Seed is SMA of first `period` closes.
 */
export function computeEmaSeries(candles: readonly DailyCandle[], period = 200): EmaPoint[] {
  if (candles.length < period) {
    return candles.map((c) => ({ date: c.date, value: null }));
  }

  const k = 2.0 / (period + 1);
  const result: EmaPoint[] = [];

  // Seed: SMA of first `period` closes
  const seedSlice = candles.slice(0, period);
  const seed = seedSlice.reduce((acc, c) => acc + c.close, 0) / period;

  for (let i = 0; i < period - 1; i++) {
    const candle = candles[i];
    if (candle) {
      result.push({ date: candle.date, value: null });
    }
  }

  const seedCandle = candles[period - 1];
  if (seedCandle) {
    result.push({ date: seedCandle.date, value: seed });
  }

  let prev = seed;
  for (let i = period; i < candles.length; i++) {
    const candle = candles[i];
    if (candle) {
      const ema = candle.close * k + prev * (1.0 - k);
      result.push({ date: candle.date, value: ema });
      prev = ema;
    }
  }

  return result;
}

/** Compute the current (latest) EMA value. Returns null if insufficient data. */
export function computeEma(candles: readonly DailyCandle[], period = 200): number | null {
  const series = computeEmaSeries(candles, period);
  for (let i = series.length - 1; i >= 0; i--) {
    const point = series[i];
    if (point?.value !== null && point?.value !== undefined) return point.value;
  }
  return null;
}
