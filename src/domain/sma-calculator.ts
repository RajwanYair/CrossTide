/**
 * SMA Calculator — Pure domain logic.
 * Ported from Dart: lib/src/domain/sma_calculator.dart
 *
 * Computes Simple Moving Average over N trading-day closes.
 */
import type { DailyCandle } from "../types/domain";

/**
 * Compute the SMA for the last `period` closes.
 * Returns null if fewer than `period` candles are available.
 * Candles must be sorted ascending by date.
 */
export function computeSma(candles: readonly DailyCandle[], period = 200): number | null {
  if (candles.length < period) return null;
  const slice = candles.slice(candles.length - period);
  const sum = slice.reduce((acc, c) => acc + c.close, 0);
  return sum / period;
}

/** A single SMA data point aligned to a candle date. */
export interface SmaPoint {
  readonly date: string;
  readonly value: number | null;
}

/**
 * Compute a rolling SMA series aligned with the input candles.
 * The first `period - 1` entries will have null values.
 */
export function computeSmaSeries(candles: readonly DailyCandle[], period = 200): SmaPoint[] {
  const result: SmaPoint[] = [];
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    if (!candle) {
      continue;
    }
    if (i < period - 1) {
      result.push({ date: candle.date, value: null });
    } else {
      const slice = candles.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, c) => acc + c.close, 0);
      result.push({ date: candle.date, value: sum / period });
    }
  }
  return result;
}
