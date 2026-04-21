/**
 * VWAP Calculator — Volume-Weighted Average Price.
 * Ported from Dart: lib/src/domain/vwap_calculator.dart
 *
 * Cumulative: vwap[i] = Σ(TP * volume) / Σ(volume)
 * TP = (high + low + close) / 3
 */
import type { DailyCandle } from "../types/domain";

export interface VwapPoint {
  readonly date: string;
  readonly vwap: number;
}

export function computeVwapSeries(candles: readonly DailyCandle[]): VwapPoint[] {
  if (candles.length === 0) return [];

  const results: VwapPoint[] = [];
  let cumTpv = 0;
  let cumVol = 0;

  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3;
    cumTpv += tp * c.volume;
    cumVol += c.volume;
    results.push({ date: c.date, vwap: cumVol > 0 ? cumTpv / cumVol : tp });
  }
  return results;
}

export function computeVwap(candles: readonly DailyCandle[]): number | null {
  const series = computeVwapSeries(candles);
  const last = series[series.length - 1];
  return last?.vwap ?? null;
}
