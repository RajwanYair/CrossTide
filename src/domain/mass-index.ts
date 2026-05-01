/**
 * Mass Index (Donald Dorsey, 1990s). Identifies trend reversals from
 * range expansion, *not* direction.
 *   ema1   = EMA(high - low, emaPeriod)        // default 9
 *   ema2   = EMA(ema1, emaPeriod)              // default 9
 *   ratio  = ema1 / ema2
 *   MI     = sum(ratio, sumPeriod)             // default 25
 * A "reversal bulge" occurs when MI rises above ~27 then drops below 26.5.
 */

import type { Candle } from "./heikin-ashi";

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

export function computeMassIndex(
  candles: readonly Candle[],
  emaPeriod = 9,
  sumPeriod = 25,
): (number | null)[] {
  const out: (number | null)[] = new Array(candles.length).fill(null);
  if (emaPeriod <= 0 || sumPeriod <= 0 || candles.length === 0) return out;
  const range = candles.map((c) => c.high - c.low);
  const e1 = ema(range, emaPeriod);
  const e2: (number | null)[] = new Array(candles.length).fill(null);
  // ema of dense tail of e1
  let firstIdx = -1;
  for (let i = 0; i < e1.length; i++) {
    if (e1[i] !== null) {
      firstIdx = i;
      break;
    }
  }
  if (firstIdx >= 0) {
    const dense: number[] = [];
    for (let i = firstIdx; i < e1.length; i++) dense.push(e1[i] as number);
    const e2dense = ema(dense, emaPeriod);
    for (let j = 0; j < e2dense.length; j++) e2[firstIdx + j] = e2dense[j] ?? null;
  }
  const ratio: (number | null)[] = candles.map((_, i) => {
    const a = e1[i];
    const b = e2[i];
    if (a === null || a === undefined || b === null || b === undefined || b === 0) return null;
    return a / b;
  });
  // rolling sum over sumPeriod
  let sum = 0;
  let count = 0;
  for (let i = 0; i < candles.length; i++) {
    const v = ratio[i];
    if (v !== null && v !== undefined) {
      sum += v;
      count++;
    } else {
      sum = 0;
      count = 0;
    }
    if (count >= sumPeriod) {
      const old = ratio[i - sumPeriod];
      if (i >= sumPeriod && old !== null && old !== undefined) sum -= old;
      out[i] = sum;
    }
  }
  return out;
}
