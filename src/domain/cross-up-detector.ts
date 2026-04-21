/**
 * Cross-Up Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/cross_up_detector.dart
 *
 * Cross-up rule: close[t-1] <= SMA[t-1] AND close[t] > SMA[t]
 */
import type { DailyCandle } from "../types/domain";
import { computeSmaSeries, type SmaPoint } from "./sma-calculator";

export interface CrossUpResult {
  readonly isCrossUp: boolean;
  readonly currentClose: number;
  readonly previousClose: number;
  readonly currentSma: number;
  readonly previousSma: number;
  readonly date: string;
}

/**
 * Detect whether a cross-up occurred on the latest candle for the given SMA period.
 * Requires at least `period + 1` candles.
 */
export function detectCrossUp(
  candles: readonly DailyCandle[],
  period: number,
): CrossUpResult | null {
  if (candles.length < period + 1) return null;

  const smaSeries = computeSmaSeries(candles, period);
  const lastIdx = smaSeries.length - 1;
  const prevIdx = lastIdx - 1;

  const lastSma: SmaPoint | undefined = smaSeries[lastIdx];
  const prevSma: SmaPoint | undefined = smaSeries[prevIdx];
  const lastCandle: DailyCandle | undefined = candles[candles.length - 1];
  const prevCandle: DailyCandle | undefined = candles[candles.length - 2];

  if (!lastSma?.value || !prevSma?.value || !lastCandle || !prevCandle) {
    return null;
  }

  const isCrossUp = prevCandle.close <= prevSma.value && lastCandle.close > lastSma.value;

  return {
    isCrossUp,
    currentClose: lastCandle.close,
    previousClose: prevCandle.close,
    currentSma: lastSma.value,
    previousSma: prevSma.value,
    date: lastCandle.date,
  };
}
