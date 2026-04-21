/**
 * Micho Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/micho_method_detector.dart
 *
 * BUY: price crosses above SMA150, within 5%, MA rising.
 * SELL: price crosses below SMA150.
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeSmaSeries } from "./sma-calculator";
import { DEFAULTS } from "./technical-defaults";

const PERIOD = DEFAULTS.sma150Period;
const MAX_ABOVE_RATIO = 0.05;

export function evaluate(
  ticker: string,
  candles: readonly DailyCandle[],
): MethodSignal | null {
  if (candles.length < PERIOD + 1) return null;

  const series = computeSmaSeries(candles, PERIOD);
  const lastSma = series[series.length - 1];
  const prevSma = series[series.length - 2];
  const lastCandle = candles[candles.length - 1]!;
  const prevCandle = candles[candles.length - 2]!;

  if (lastSma?.value == null || prevSma?.value == null) return null;

  const smaT = lastSma!.value!;
  const smaTm1 = prevSma!.value!;
  const closeT = lastCandle.close;
  const closeTm1 = prevCandle.close;

  // BUY: cross-up + within 5% + MA flat/rising
  const isCrossUp = closeTm1 <= smaTm1 && closeT > smaT;
  const ratio = (closeT - smaT) / smaT;
  const isNearMa = ratio >= 0 && ratio <= MAX_ABOVE_RATIO;
  const slope = smaT - smaTm1;
  const isMaRising = slope >= 0;

  if (isCrossUp && isNearMa && isMaRising) {
    return signal(ticker, lastCandle, "BUY", `BUY: price crossed above MA150 ($${closeT.toFixed(2)} > $${smaT.toFixed(2)}), MA150 rising`);
  }

  // SELL: cross-down
  const isCrossDown = closeTm1 >= smaTm1 && closeT < smaT;
  if (isCrossDown) {
    return signal(ticker, lastCandle, "SELL", `SELL: price crossed below MA150 ($${closeT.toFixed(2)} < $${smaT.toFixed(2)})`);
  }

  return signal(ticker, lastCandle, "NEUTRAL", "No Micho signal");
}

function signal(ticker: string, candle: DailyCandle, direction: SignalDirection, description: string): MethodSignal {
  return { ticker, method: "Micho", direction, description, currentClose: candle.close, evaluatedAt: candle.date };
}
