/**
 * MFI Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/mfi_method_detector.dart
 *
 * BUY: MFI exits oversold (prev < 20, curr >= 20).
 * SELL: MFI exits overbought (prev > 80, curr <= 80).
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeMfiSeries } from "./mfi-calculator";
import { DEFAULTS } from "./technical-defaults";

export function evaluate(ticker: string, candles: readonly DailyCandle[]): MethodSignal | null {
  if (candles.length < DEFAULTS.period + 2) return null;

  const series = computeMfiSeries(candles, DEFAULTS.period);
  const curr = series[series.length - 1];
  const prev = series[series.length - 2];
  if (curr?.value == null || prev?.value == null) return null;

  const currMfi = curr.value;
  const prevMfi = prev.value;
  const lastCandle = candles[candles.length - 1]!;

  if (prevMfi < DEFAULTS.mfiOversold && currMfi >= DEFAULTS.mfiOversold) {
    return sig(
      ticker,
      lastCandle,
      "BUY",
      `BUY: MFI exited oversold (${prevMfi.toFixed(1)} → ${currMfi.toFixed(1)})`,
    );
  }
  if (prevMfi > DEFAULTS.mfiOverbought && currMfi <= DEFAULTS.mfiOverbought) {
    return sig(
      ticker,
      lastCandle,
      "SELL",
      `SELL: MFI exited overbought (${prevMfi.toFixed(1)} → ${currMfi.toFixed(1)})`,
    );
  }
  return sig(ticker, lastCandle, "NEUTRAL", "No MFI signal");
}

function sig(
  ticker: string,
  candle: DailyCandle,
  direction: SignalDirection,
  description: string,
): MethodSignal {
  return {
    ticker,
    method: "MFI",
    direction,
    description,
    currentClose: candle.close,
    evaluatedAt: candle.date,
  };
}
