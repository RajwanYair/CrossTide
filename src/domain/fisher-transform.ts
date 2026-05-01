/**
 * Fisher Transform (John Ehlers, 2002). Applied to the median price,
 * normalised over a `period` lookback into [-1, 1], then inverse-Fisher
 * transformed into a near-Gaussian series. Crossover with prior bar
 * is the standard signal.
 *
 *   x[i]   = 0.33 * 2 * ((median[i] - lowN) / (highN - lowN) - 0.5) + 0.67 * x[i-1]
 *   x[i]   clamped to [-0.999, 0.999]
 *   fish[i] = 0.5 * ln((1+x)/(1-x)) + 0.5 * fish[i-1]
 */

import type { Candle } from "./heikin-ashi";

export interface FisherPoint {
  readonly time: number;
  readonly fisher: number;
  readonly trigger: number; // previous fisher value
}

export function computeFisherTransform(candles: readonly Candle[], period = 9): FisherPoint[] {
  if (period <= 0 || candles.length < period) return [];
  const out: FisherPoint[] = [];
  let x = 0;
  let prevFisher = 0;
  for (let i = period - 1; i < candles.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j]!.high > hi) hi = candles[j]!.high;
      if (candles[j]!.low < lo) lo = candles[j]!.low;
    }
    const median = (candles[i]!.high + candles[i]!.low) / 2;
    const range = hi - lo;
    const norm = range === 0 ? 0 : (median - lo) / range - 0.5;
    x = 0.66 * norm + 0.67 * x;
    if (x > 0.999) x = 0.999;
    if (x < -0.999) x = -0.999;
    const fisher = 0.5 * Math.log((1 + x) / (1 - x)) + 0.5 * prevFisher;
    out.push({ time: candles[i]!.time, fisher, trigger: prevFisher });
    prevFisher = fisher;
  }
  return out;
}
