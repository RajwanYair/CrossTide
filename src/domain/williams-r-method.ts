/**
 * Williams %R Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/williams_r_method_detector.dart
 *
 * BUY: %R exits oversold (prev < −80, curr >= −80).
 * SELL: %R exits overbought (prev > −20, curr <= −20).
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeWilliamsRSeries } from "./williams-r-calculator";
import { DEFAULTS } from "./technical-defaults";

export function evaluate(
  ticker: string,
  candles: readonly DailyCandle[],
): MethodSignal | null {
  if (candles.length < DEFAULTS.period + 1) return null;

  const series = computeWilliamsRSeries(candles, DEFAULTS.period);
  const curr = series[series.length - 1];
  const prev = series[series.length - 2];
  if (curr?.value == null || prev?.value == null) return null;

  const currWr = curr!.value!;
  const prevWr = prev!.value!;
  const lastCandle = candles[candles.length - 1]!;

  if (prevWr < DEFAULTS.williamsROversold && currWr >= DEFAULTS.williamsROversold) {
    return sig(ticker, lastCandle, "BUY", `BUY: Williams %R exited oversold (${prevWr.toFixed(1)} → ${currWr.toFixed(1)})`);
  }
  if (prevWr > DEFAULTS.williamsROverbought && currWr <= DEFAULTS.williamsROverbought) {
    return sig(ticker, lastCandle, "SELL", `SELL: Williams %R exited overbought (${prevWr.toFixed(1)} → ${currWr.toFixed(1)})`);
  }
  return sig(ticker, lastCandle, "NEUTRAL", "No Williams %R signal");
}

function sig(ticker: string, candle: DailyCandle, direction: SignalDirection, description: string): MethodSignal {
  return { ticker, method: "WilliamsR", direction, description, currentClose: candle.close, evaluatedAt: candle.date };
}
