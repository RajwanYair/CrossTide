/**
 * SuperTrend Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/supertrend_method_detector.dart
 *
 * BUY: SuperTrend flips from downtrend to uptrend.
 * SELL: SuperTrend flips from uptrend to downtrend.
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeSuperTrendSeries } from "./supertrend-calculator";

const ATR_PERIOD = 10;
const REQUIRED = ATR_PERIOD + 4;

export function evaluate(
  ticker: string,
  candles: readonly DailyCandle[],
): MethodSignal | null {
  if (candles.length < REQUIRED) return null;

  const series = computeSuperTrendSeries(candles, ATR_PERIOD, 3.0);
  if (series.length < 2) return null;

  const curr = series[series.length - 1]!;
  const prev = series[series.length - 2]!;
  const lastCandle = candles[candles.length - 1]!;

  // BUY: flip to uptrend
  if (!prev.isUpTrend && curr.isUpTrend) {
    return sig(ticker, lastCandle, "BUY", `BUY: SuperTrend flipped bullish (band=${curr.superTrend.toFixed(2)})`);
  }

  // SELL: flip to downtrend
  if (prev.isUpTrend && !curr.isUpTrend) {
    return sig(ticker, lastCandle, "SELL", `SELL: SuperTrend flipped bearish (band=${curr.superTrend.toFixed(2)})`);
  }

  return sig(ticker, lastCandle, "NEUTRAL", "No SuperTrend signal");
}

function sig(ticker: string, candle: DailyCandle, direction: SignalDirection, description: string): MethodSignal {
  return { ticker, method: "SuperTrend", direction, description, currentClose: candle.close, evaluatedAt: candle.date };
}
