/**
 * MFI (Money Flow Index) — Pure domain logic.
 * Ported from Dart: lib/src/domain/mfi_calculator.dart
 *
 * Volume-weighted RSI: MFI = 100 - 100 / (1 + positive_flow / negative_flow)
 */
import type { DailyCandle } from "../types/domain";
import { DEFAULTS } from "./technical-defaults";

export interface MfiPoint {
  readonly date: string;
  readonly value: number | null;
}

export function computeMfiSeries(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): MfiPoint[] {
  if (candles.length <= period) {
    return candles.map((c) => ({ date: c.date, value: null }));
  }

  const tp: number[] = candles.map((c) => (c.high + c.low + c.close) / 3);
  const results: MfiPoint[] = [];

  for (let i = 0; i < period; i++) {
    results.push({ date: candles[i]!.date, value: null });
  }

  for (let i = period; i < candles.length; i++) {
    let posFlow = 0;
    let negFlow = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const mf = tp[j]! * candles[j]!.volume;
      if (tp[j]! > tp[j - 1]!) posFlow += mf;
      else if (tp[j]! < tp[j - 1]!) negFlow += mf;
    }
    const mfi = negFlow > 0 ? 100 - 100 / (1 + posFlow / negFlow) : 100;
    results.push({ date: candles[i]!.date, value: mfi });
  }
  return results;
}

export function computeMfi(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): number | null {
  const series = computeMfiSeries(candles, period);
  for (let i = series.length - 1; i >= 0; i--) {
    const p = series[i];
    if (p?.value != null) return p.value;
  }
  return null;
}
