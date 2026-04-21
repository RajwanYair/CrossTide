/**
 * RSI Calculator — Pure domain logic.
 * Ported from Dart: lib/src/domain/rsi_calculator.dart
 *
 * RSI = 100 - 100 / (1 + RS), where RS = avgGain / avgLoss (Wilder smoothing).
 */
import type { DailyCandle } from "../types/domain";
import { DEFAULTS } from "./technical-defaults";

export interface RsiPoint {
  readonly date: string;
  readonly value: number | null;
}

function rsi(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100.0;
  const rs = avgGain / avgLoss;
  return 100.0 - 100.0 / (1.0 + rs);
}

/**
 * Compute a rolling RSI series aligned with candles.
 * The first `period` entries have null values (warmup).
 */
export function computeRsiSeries(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): RsiPoint[] {
  if (candles.length <= period) {
    return candles.map((c) => ({ date: c.date, value: null }));
  }

  const result: RsiPoint[] = [];

  // Seed: average gain/loss of first `period` price changes
  let sumGain = 0;
  let sumLoss = 0;
  for (let i = 1; i <= period; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    if (!prev || !curr) continue;
    const change = curr.close - prev.close;
    if (change >= 0) {
      sumGain += change;
    } else {
      sumLoss -= change;
    }
  }
  let avgGain = sumGain / period;
  let avgLoss = sumLoss / period;

  // Null warmup
  for (let i = 0; i < period; i++) {
    const candle = candles[i];
    if (candle) {
      result.push({ date: candle.date, value: null });
    }
  }

  // First RSI
  const firstCandle = candles[period];
  if (firstCandle) {
    result.push({ date: firstCandle.date, value: rsi(avgGain, avgLoss) });
  }

  // Rolling Wilder smoothing
  for (let i = period + 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    if (!prev || !curr) continue;
    const change = curr.close - prev.close;
    const gain = change > 0 ? change : 0.0;
    const loss = change < 0 ? -change : 0.0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result.push({ date: curr.date, value: rsi(avgGain, avgLoss) });
  }

  return result;
}

/** Compute the current (latest) RSI value. Returns null if insufficient data. */
export function computeRsi(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): number | null {
  const series = computeRsiSeries(candles, period);
  for (let i = series.length - 1; i >= 0; i--) {
    const point = series[i];
    if (point?.value !== null && point?.value !== undefined) return point.value;
  }
  return null;
}
