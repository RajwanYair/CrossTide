/**
 * ADX Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/adx_method_detector.dart
 *
 * BUY: ADX > 25 AND +DI crosses above −DI.
 * SELL: ADX > 25 AND −DI crosses above +DI.
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeAdxSeries } from "./adx-calculator";
import { DEFAULTS } from "./technical-defaults";

const THRESHOLD = 25;

export function evaluate(
  ticker: string,
  candles: readonly DailyCandle[],
): MethodSignal | null {
  if (candles.length < 2 * DEFAULTS.period + 2) return null;

  const series = computeAdxSeries(candles, DEFAULTS.period);
  if (series.length < 2) return null;

  const curr = series[series.length - 1]!;
  const prev = series[series.length - 2]!;
  const lastCandle = candles[candles.length - 1]!;

  // BUY: +DI crosses above −DI with strong trend
  if (curr.adx > THRESHOLD && prev.plusDi <= prev.minusDi && curr.plusDi > curr.minusDi) {
    return sig(ticker, lastCandle, "BUY", `BUY: +DI crossed above −DI with ADX=${curr.adx.toFixed(1)}`);
  }

  // SELL: −DI crosses above +DI with strong trend
  if (curr.adx > THRESHOLD && prev.minusDi <= prev.plusDi && curr.minusDi > curr.plusDi) {
    return sig(ticker, lastCandle, "SELL", `SELL: −DI crossed above +DI with ADX=${curr.adx.toFixed(1)}`);
  }

  return sig(ticker, lastCandle, "NEUTRAL", "No ADX signal");
}

function sig(ticker: string, candle: DailyCandle, direction: SignalDirection, description: string): MethodSignal {
  return { ticker, method: "ADX", direction, description, currentClose: candle.close, evaluatedAt: candle.date };
}
