/**
 * Chaikin Oscillator (Marc Chaikin). MACD applied to the
 * Accumulation/Distribution Line:
 *   AD     = cumulative sum of MFV
 *   ChOsc  = EMA(AD, fast) - EMA(AD, slow)   (typical: 3, 10)
 */

import { computeAdLine, type AdCandle } from "./ad-line";

const ema = (values: readonly number[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;
  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i]!;
  let prev = seed / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
};

export function computeChaikinOscillator(
  candles: readonly AdCandle[],
  fast = 3,
  slow = 10,
): (number | null)[] {
  const out: (number | null)[] = new Array(candles.length).fill(null);
  if (fast <= 0 || slow <= 0 || candles.length < slow) return out;
  const ad = computeAdLine(candles);
  const eFast = ema(ad, fast);
  const eSlow = ema(ad, slow);
  for (let i = 0; i < candles.length; i++) {
    const f = eFast[i];
    const s = eSlow[i];
    if (f === null || f === undefined || s === null || s === undefined) continue;
    out[i] = f - s;
  }
  return out;
}
