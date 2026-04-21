/**
 * OBV (On-Balance Volume) — Pure domain logic.
 * Ported from Dart: lib/src/domain/obv_calculator.dart
 *
 * If close > prevClose: OBV += volume
 * If close < prevClose: OBV -= volume
 */
import type { DailyCandle } from "../types/domain";

export interface ObvPoint {
  readonly date: string;
  readonly obv: number;
}

export function computeObvSeries(candles: readonly DailyCandle[]): ObvPoint[] {
  if (candles.length < 2) return [];

  const results: ObvPoint[] = [{ date: candles[0]!.date, obv: 0 }];
  let obv = 0;

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i]!;
    const prev = candles[i - 1]!;
    if (curr.close > prev.close) obv += curr.volume;
    else if (curr.close < prev.close) obv -= curr.volume;
    results.push({ date: curr.date, obv });
  }
  return results;
}

export function computeObv(candles: readonly DailyCandle[]): number | null {
  const series = computeObvSeries(candles);
  const last = series[series.length - 1];
  return last?.obv ?? null;
}
