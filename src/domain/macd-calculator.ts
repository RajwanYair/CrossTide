/**
 * MACD Calculator — Pure domain logic.
 * Ported from Dart: lib/src/domain/macd_calculator.dart
 *
 * MACD Line = EMA(fast) - EMA(slow)
 * Signal Line = EMA(signalPeriod) of MACD Line
 * Histogram = MACD Line - Signal Line
 */
import type { DailyCandle } from "../types/domain";
import { computeEmaSeries } from "./ema-calculator";
import { DEFAULTS } from "./technical-defaults";

export interface MacdPoint {
  readonly date: string;
  readonly macd: number | null;
  readonly signal: number | null;
  readonly histogram: number | null;
}

/**
 * Compute the full MACD + Signal + Histogram series.
 */
export function computeMacdSeries(
  candles: readonly DailyCandle[],
  fastPeriod: number = DEFAULTS.macdFastPeriod,
  slowPeriod: number = DEFAULTS.macdSlowPeriod,
  signalPeriod: number = DEFAULTS.macdSignalPeriod,
): MacdPoint[] {
  const fastSeries = computeEmaSeries(candles, fastPeriod);
  const slowSeries = computeEmaSeries(candles, slowPeriod);

  // Build MACD line where both fast and slow are available
  const macdValues: { date: string; value: number | null }[] = [];
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const fast = fastSeries[i];
    const slow = slowSeries[i];
    if (!candle || !fast || !slow) continue;
    const value = fast.value !== null && slow.value !== null ? fast.value - slow.value : null;
    macdValues.push({ date: candle.date, value });
  }

  // Extract non-null MACD values to compute Signal EMA
  const macdNullCount = macdValues.findIndex((v) => v.value !== null);
  if (macdNullCount < 0) {
    return candles.map((c) => ({
      date: c.date,
      macd: null,
      signal: null,
      histogram: null,
    }));
  }

  // Create virtual candles from MACD values for signal EMA computation
  const virtualCandles: DailyCandle[] = [];
  for (let i = macdNullCount; i < macdValues.length; i++) {
    const mv = macdValues[i];
    if (mv?.value !== null && mv?.value !== undefined) {
      virtualCandles.push({
        date: mv.date,
        open: mv.value,
        high: mv.value,
        low: mv.value,
        close: mv.value,
        volume: 0,
      });
    }
  }

  const signalSeries = computeEmaSeries(virtualCandles, signalPeriod);

  const result: MacdPoint[] = [];
  let signalIdx = 0;
  for (let i = 0; i < candles.length; i++) {
    const mv = macdValues[i];
    if (!mv || mv.value === null || mv.value === undefined || i < macdNullCount) {
      const candle = candles[i];
      if (candle) {
        result.push({ date: candle.date, macd: null, signal: null, histogram: null });
      }
      continue;
    }
    const sig = signalSeries[signalIdx];
    const sigVal = sig?.value ?? null;
    result.push({
      date: mv.date,
      macd: mv.value,
      signal: sigVal,
      histogram: sigVal !== null ? mv.value - sigVal : null,
    });
    signalIdx++;
  }

  return result;
}
