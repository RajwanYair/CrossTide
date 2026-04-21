/**
 * Bollinger Bands Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/bollinger_method_detector.dart
 *
 * BUY: price crosses above lower band from below.
 * SELL: price crosses below upper band from above.
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeBollingerSeries } from "./bollinger-calculator";

const REQUIRED = 21; // period(20) + 1

export function evaluate(
  ticker: string,
  candles: readonly DailyCandle[],
): MethodSignal | null {
  if (candles.length < REQUIRED) return null;

  const series = computeBollingerSeries(candles);
  const curr = series[series.length - 1];
  const prev = series[series.length - 2];

  if (curr?.upper == null || curr?.lower == null || prev?.upper == null || prev?.lower == null) return null;

  const lastCandle = candles[candles.length - 1]!;
  const prevCandle = candles[candles.length - 2]!;

  // BUY: price crosses above lower band
  if (prevCandle.close <= prev!.lower! && lastCandle.close > curr!.lower!) {
    return sig(ticker, lastCandle, "BUY", `BUY: price crossed above lower Bollinger Band ($${lastCandle.close.toFixed(2)} > $${curr!.lower!.toFixed(2)})`);
  }

  // SELL: price crosses below upper band
  if (prevCandle.close >= prev!.upper! && lastCandle.close < curr!.upper!) {
    return sig(ticker, lastCandle, "SELL", `SELL: price crossed below upper Bollinger Band ($${lastCandle.close.toFixed(2)} < $${curr!.upper!.toFixed(2)})`);
  }

  return sig(ticker, lastCandle, "NEUTRAL", "No Bollinger signal");
}

function sig(ticker: string, candle: DailyCandle, direction: SignalDirection, description: string): MethodSignal {
  return { ticker, method: "Bollinger", direction, description, currentClose: candle.close, evaluatedAt: candle.date };
}
