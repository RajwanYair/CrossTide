/**
 * MACD Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/macd_method_detector.dart
 *
 * BUY: MACD crosses above signal line.
 * SELL: MACD crosses below signal line.
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeMacdSeries } from "./macd-calculator";

const REQUIRED = 36; // slowPeriod(26) + signalPeriod(9) + 1

export function evaluate(
  ticker: string,
  candles: readonly DailyCandle[],
): MethodSignal | null {
  if (candles.length < REQUIRED) return null;

  const series = computeMacdSeries(candles);

  // Find last two consecutive bars with complete MACD + Signal
  let curr: (typeof series)[number] | undefined;
  let prev: (typeof series)[number] | undefined;
  for (let i = series.length - 1; i >= 1; i--) {
    if (series[i]!.macd != null && series[i]!.signal != null && series[i - 1]!.macd != null && series[i - 1]!.signal != null) {
      curr = series[i];
      prev = series[i - 1];
      break;
    }
  }
  if (!curr || !prev) return null;

  const lastCandle = candles[candles.length - 1]!;
  const cm = curr.macd!;
  const cs = curr.signal!;
  const pm = prev.macd!;
  const ps = prev.signal!;

  if (pm <= ps && cm > cs) {
    return sig(ticker, lastCandle, "BUY", `BUY: MACD crossed above signal (${cm.toFixed(2)} > ${cs.toFixed(2)})`);
  }
  if (pm >= ps && cm < cs) {
    return sig(ticker, lastCandle, "SELL", `SELL: MACD crossed below signal (${cm.toFixed(2)} < ${cs.toFixed(2)})`);
  }
  return sig(ticker, lastCandle, "NEUTRAL", "No MACD signal");
}

function sig(ticker: string, candle: DailyCandle, direction: SignalDirection, description: string): MethodSignal {
  return { ticker, method: "MACD", direction, description, currentClose: candle.close, evaluatedAt: candle.date };
}
