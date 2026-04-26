/**
 * SuperTrend — Pure domain logic.
 * Ported from Dart: lib/src/domain/supertrend_calculator.dart
 *
 * Uses ATR to determine trend: upper/lower bands around median price.
 * Default: 10-period ATR, 3x multiplier.
 */
import type { DailyCandle } from "../types/domain";
import { computeAtrSeries } from "./atr-calculator";

export interface SuperTrendPoint {
  readonly date: string;
  readonly superTrend: number;
  readonly isUpTrend: boolean;
}

export function computeSuperTrendSeries(
  candles: readonly DailyCandle[],
  atrPeriod = 10,
  multiplier = 3.0,
): SuperTrendPoint[] {
  const atrSeries = computeAtrSeries(candles, atrPeriod);
  if (atrSeries.length === 0) return [];

  const atrMap = new Map<string, number>();
  for (const a of atrSeries) atrMap.set(a.date, a.atr);

  const results: SuperTrendPoint[] = [];
  let prevUpperBand = Infinity;
  let prevLowerBand = -Infinity;
  let prevIsUp = true;
  // eslint-disable-next-line no-useless-assignment
  let prevSuperTrend = 0;
  let initialized = false;

  for (let i = atrPeriod; i < candles.length; i++) {
    const c = candles[i]!;
    const atr = atrMap.get(c.date);
    if (atr == null) continue;

    const mid = (c.high + c.low) / 2;
    let upperBand = mid + multiplier * atr;
    let lowerBand = mid - multiplier * atr;

    if (!initialized) {
      prevUpperBand = upperBand;
      prevLowerBand = lowerBand;
      prevIsUp = c.close <= upperBand;
      prevSuperTrend = prevIsUp ? lowerBand : upperBand;
      initialized = true;
      results.push({ date: c.date, superTrend: prevSuperTrend, isUpTrend: prevIsUp });
      continue;
    }

    // Band clamping
    if (!(lowerBand > prevLowerBand || candles[i - 1]!.close < prevLowerBand)) {
      lowerBand = prevLowerBand;
    }
    if (!(upperBand < prevUpperBand || candles[i - 1]!.close > prevUpperBand)) {
      upperBand = prevUpperBand;
    }

    let isUp: boolean;
    let st: number;
    if (prevIsUp) {
      if (c.close < lowerBand) { isUp = false; st = upperBand; }
      else { isUp = true; st = lowerBand; }
    } else {
      if (c.close > upperBand) { isUp = true; st = lowerBand; }
      else { isUp = false; st = upperBand; }
    }

    results.push({ date: c.date, superTrend: st, isUpTrend: isUp });
    prevUpperBand = upperBand;
    prevLowerBand = lowerBand;
    // eslint-disable-next-line no-useless-assignment
    prevSuperTrend = st;
    prevIsUp = isUp;
  }
  return results;
}

export function computeSuperTrend(
  candles: readonly DailyCandle[],
  atrPeriod = 10,
  multiplier = 3.0,
): SuperTrendPoint | null {
  const series = computeSuperTrendSeries(candles, atrPeriod, multiplier);
  return series.length > 0 ? series[series.length - 1]! : null;
}
