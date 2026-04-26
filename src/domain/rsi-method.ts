/**
 * RSI Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/rsi_method_detector.dart
 *
 * BUY: RSI exits oversold (prev < 30, curr >= 30).
 * SELL: RSI exits overbought (prev > 70, curr <= 70).
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeRsiSeries } from "./rsi-calculator";
import { DEFAULTS } from "./technical-defaults";

export function evaluate(
  ticker: string,
  candles: readonly DailyCandle[],
): MethodSignal | null {
  if (candles.length < DEFAULTS.period + 2) return null;

  const series = computeRsiSeries(candles, DEFAULTS.period);
  const curr = series[series.length - 1];
  const prev = series[series.length - 2];
  if (curr?.value == null || prev?.value == null) return null;

  const currRsi = curr.value;
  const prevRsi = prev.value;
  const lastCandle = candles[candles.length - 1]!;

  if (prevRsi < DEFAULTS.rsiOversold && currRsi >= DEFAULTS.rsiOversold) {
    return sig(ticker, lastCandle, "BUY", `BUY: RSI exited oversold (${prevRsi.toFixed(1)} → ${currRsi.toFixed(1)})`);
  }
  if (prevRsi > DEFAULTS.rsiOverbought && currRsi <= DEFAULTS.rsiOverbought) {
    return sig(ticker, lastCandle, "SELL", `SELL: RSI exited overbought (${prevRsi.toFixed(1)} → ${currRsi.toFixed(1)})`);
  }
  return sig(ticker, lastCandle, "NEUTRAL", "No RSI signal");
}

function sig(ticker: string, candle: DailyCandle, direction: SignalDirection, description: string): MethodSignal {
  return { ticker, method: "RSI", direction, description, currentClose: candle.close, evaluatedAt: candle.date };
}
