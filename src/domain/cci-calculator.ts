/**
 * CCI (Commodity Channel Index) — Pure domain logic.
 * Ported from Dart: lib/src/domain/cci_calculator.dart
 *
 * CCI = (TP - SMA(TP)) / (0.015 * Mean Deviation)
 * TP = (high + low + close) / 3
 */
import type { DailyCandle } from "../types/domain";

export interface CciPoint {
  readonly date: string;
  readonly value: number | null;
}

export function computeCciSeries(candles: readonly DailyCandle[], period = 20): CciPoint[] {
  if (candles.length < period) {
    return candles.map((c) => ({ date: c.date, value: null }));
  }

  const results: CciPoint[] = [];

  for (let i = 0; i < period - 1; i++) {
    results.push({ date: candles[i]!.date, value: null });
  }

  for (let i = period - 1; i < candles.length; i++) {
    const tps: number[] = [];
    let sumTp = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const c = candles[j]!;
      const tp = (c.high + c.low + c.close) / 3;
      tps.push(tp);
      sumTp += tp;
    }
    const smaTp = sumTp / period;

    let sumDev = 0;
    for (const tp of tps) sumDev += Math.abs(tp - smaTp);
    const meanDev = sumDev / period;

    const cci = meanDev !== 0 ? (tps[tps.length - 1]! - smaTp) / (0.015 * meanDev) : 0;
    results.push({ date: candles[i]!.date, value: cci });
  }
  return results;
}

export function computeCci(candles: readonly DailyCandle[], period = 20): number | null {
  const series = computeCciSeries(candles, period);
  for (let i = series.length - 1; i >= 0; i--) {
    const p = series[i];
    if (p?.value != null) return p.value;
  }
  return null;
}
