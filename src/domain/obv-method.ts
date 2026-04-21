/**
 * OBV Method Detector — Pure domain logic.
 * Ported from Dart: lib/src/domain/obv_method_detector.dart
 *
 * BUY: OBV rising while price falling (bullish divergence).
 * SELL: OBV falling while price rising (bearish divergence).
 */
import type { DailyCandle, MethodSignal, SignalDirection } from "../types/domain";
import { computeObvSeries } from "./obv-calculator";

const LOOKBACK = 10;

export function evaluate(
  ticker: string,
  candles: readonly DailyCandle[],
): MethodSignal | null {
  if (candles.length < LOOKBACK + 2) return null;

  const series = computeObvSeries(candles);
  if (series.length < LOOKBACK + 1) return null;

  const obvNow = series[series.length - 1]!.obv;
  const obvPrev = series[series.length - 1 - LOOKBACK]!.obv;
  const priceNow = candles[candles.length - 1]!.close;
  const pricePrev = candles[candles.length - 1 - LOOKBACK]!.close;
  const lastCandle = candles[candles.length - 1]!;

  const obvRising = obvNow > obvPrev;
  const obvFalling = obvNow < obvPrev;
  const priceRising = priceNow > pricePrev;
  const priceFalling = priceNow < pricePrev;

  if (obvRising && priceFalling) {
    return sig(ticker, lastCandle, "BUY", "BUY: Bullish OBV divergence — OBV rising while price falling");
  }
  if (obvFalling && priceRising) {
    return sig(ticker, lastCandle, "SELL", "SELL: Bearish OBV divergence — OBV falling while price rising");
  }
  return sig(ticker, lastCandle, "NEUTRAL", "No OBV divergence");
}

function sig(ticker: string, candle: DailyCandle, direction: SignalDirection, description: string): MethodSignal {
  return { ticker, method: "OBV", direction, description, currentClose: candle.close, evaluatedAt: candle.date };
}
