/**
 * Stochastic Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/stochastic_method_detector.dart
 *
 * BUY: %K crosses above %D while both in oversold zone (< 20).
 * SELL: %K crosses below %D while both in overbought zone (> 80).
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeStochasticSeries } from "./stochastic-calculator";
import { DEFAULTS } from "./technical-defaults";

const OVERSOLD = 20;
const OVERBOUGHT = 80;

export function evaluate(ticker: string, candles: readonly DailyCandle[]): MethodSignal | null {
  const required = DEFAULTS.period + 3 + 3; // period + smoothK + smoothD
  if (candles.length < required) return null;

  const series = computeStochasticSeries(candles);
  if (series.length < 2) return null;

  const curr = series[series.length - 1]!;
  const prev = series[series.length - 2]!;
  const lastCandle = candles[candles.length - 1]!;

  // BUY: %K crosses above %D in oversold zone
  if (prev.percentK <= prev.percentD && curr.percentK > curr.percentD && curr.percentK < OVERSOLD) {
    return sig(
      ticker,
      lastCandle,
      "BUY",
      `BUY: %K crossed above %D in oversold zone (K=${curr.percentK.toFixed(1)}, D=${curr.percentD.toFixed(1)})`,
    );
  }

  // SELL: %K crosses below %D in overbought zone
  if (
    prev.percentK >= prev.percentD &&
    curr.percentK < curr.percentD &&
    curr.percentK > OVERBOUGHT
  ) {
    return sig(
      ticker,
      lastCandle,
      "SELL",
      `SELL: %K crossed below %D in overbought zone (K=${curr.percentK.toFixed(1)}, D=${curr.percentD.toFixed(1)})`,
    );
  }

  return sig(ticker, lastCandle, "NEUTRAL", "No Stochastic signal");
}

function sig(
  ticker: string,
  candle: DailyCandle,
  direction: SignalDirection,
  description: string,
): MethodSignal {
  return {
    ticker,
    method: "Stochastic",
    direction,
    description,
    currentClose: candle.close,
    evaluatedAt: candle.date,
  };
}
