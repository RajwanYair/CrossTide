/**
 * Parabolic SAR Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/sar_method_detector.dart
 *
 * BUY: SAR flips from downtrend to uptrend.
 * SELL: SAR flips from uptrend to downtrend.
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeSarSeries } from "./parabolic-sar-calculator";

export function evaluate(ticker: string, candles: readonly DailyCandle[]): MethodSignal | null {
  if (candles.length < 5) return null;

  const series = computeSarSeries(candles);
  if (series.length < 2) return null;

  const curr = series[series.length - 1]!;
  const prev = series[series.length - 2]!;
  const lastCandle = candles[candles.length - 1]!;

  // BUY: SAR flips to uptrend
  if (!prev.isUpTrend && curr.isUpTrend) {
    return sig(ticker, lastCandle, "BUY", `BUY: SAR flipped bullish (SAR=${curr.sar.toFixed(2)})`);
  }

  // SELL: SAR flips to downtrend
  if (prev.isUpTrend && !curr.isUpTrend) {
    return sig(
      ticker,
      lastCandle,
      "SELL",
      `SELL: SAR flipped bearish (SAR=${curr.sar.toFixed(2)})`,
    );
  }

  return sig(ticker, lastCandle, "NEUTRAL", "No SAR signal");
}

function sig(
  ticker: string,
  candle: DailyCandle,
  direction: SignalDirection,
  description: string,
): MethodSignal {
  return {
    ticker,
    method: "SAR",
    direction,
    description,
    currentClose: candle.close,
    evaluatedAt: candle.date,
  };
}
