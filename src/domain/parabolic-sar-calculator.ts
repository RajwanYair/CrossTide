/**
 * Parabolic SAR — Pure domain logic.
 * Ported from Dart: lib/src/domain/parabolic_sar_calculator.dart
 *
 * Wilder SAR: AF starts at 0.02, increments by 0.02, max 0.20.
 * SAR(t) = SAR(t-1) + AF * (EP - SAR(t-1))
 */
import type { DailyCandle } from "../types/domain";

export interface SarPoint {
  readonly date: string;
  readonly sar: number;
  readonly isUpTrend: boolean;
}

export function computeSarSeries(
  candles: readonly DailyCandle[],
  afStart = 0.02,
  afStep = 0.02,
  afMax = 0.2,
): SarPoint[] {
  if (candles.length < 2) return [];

  const results: SarPoint[] = [];
  let isUpTrend = candles[1]!.close >= candles[0]!.close;
  let af = afStart;
  let ep = isUpTrend ? candles[0]!.high : candles[0]!.low;
  let sar = isUpTrend ? candles[0]!.low : candles[0]!.high;

  results.push({ date: candles[0]!.date, sar, isUpTrend });

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1]!;
    const curr = candles[i]!;

    sar = sar + af * (ep - sar);

    // Constrain SAR to prior bar's range
    if (isUpTrend) {
      if (sar > prev.low) sar = prev.low;
      if (i >= 2 && sar > candles[i - 2]!.low) sar = candles[i - 2]!.low;
    } else {
      if (sar < prev.high) sar = prev.high;
      if (i >= 2 && sar < candles[i - 2]!.high) sar = candles[i - 2]!.high;
    }

    // Check for reversal
    let reversed = false;
    if (isUpTrend && curr.low < sar) {
      isUpTrend = false;
      reversed = true;
      sar = ep;
      ep = curr.low;
      af = afStart;
    } else if (!isUpTrend && curr.high > sar) {
      isUpTrend = true;
      reversed = true;
      sar = ep;
      ep = curr.high;
      af = afStart;
    }

    if (!reversed) {
      if (isUpTrend) {
        if (curr.high > ep) {
          ep = curr.high;
          af = Math.min(af + afStep, afMax);
        }
      } else {
        if (curr.low < ep) {
          ep = curr.low;
          af = Math.min(af + afStep, afMax);
        }
      }
    }

    results.push({ date: curr.date, sar, isUpTrend });
  }
  return results;
}

export function computeSar(candles: readonly DailyCandle[]): SarPoint | null {
  const series = computeSarSeries(candles);
  return series.length > 0 ? series[series.length - 1]! : null;
}
