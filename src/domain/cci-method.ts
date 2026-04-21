/**
 * CCI Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/cci_method_detector.dart
 *
 * BUY: CCI exits oversold (prev < −100, curr >= −100).
 * SELL: CCI exits overbought (prev > 100, curr <= 100).
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeCciSeries } from "./cci-calculator";
import { DEFAULTS } from "./technical-defaults";

const PERIOD = 20;

export function evaluate(
  ticker: string,
  candles: readonly DailyCandle[],
): MethodSignal | null {
  if (candles.length < PERIOD + 2) return null;

  const series = computeCciSeries(candles, PERIOD);
  const curr = series[series.length - 1];
  const prev = series[series.length - 2];
  if (curr?.value == null || prev?.value == null) return null;

  const currCci = curr!.value!;
  const prevCci = prev!.value!;
  const lastCandle = candles[candles.length - 1]!;

  if (prevCci < DEFAULTS.cciOversold && currCci >= DEFAULTS.cciOversold) {
    return sig(ticker, lastCandle, "BUY", `BUY: CCI exited oversold (${prevCci.toFixed(1)} → ${currCci.toFixed(1)})`);
  }
  if (prevCci > DEFAULTS.cciOverbought && currCci <= DEFAULTS.cciOverbought) {
    return sig(ticker, lastCandle, "SELL", `SELL: CCI exited overbought (${prevCci.toFixed(1)} → ${currCci.toFixed(1)})`);
  }
  return sig(ticker, lastCandle, "NEUTRAL", "No CCI signal");
}

function sig(ticker: string, candle: DailyCandle, direction: SignalDirection, description: string): MethodSignal {
  return { ticker, method: "CCI", direction, description, currentClose: candle.close, evaluatedAt: candle.date };
}
