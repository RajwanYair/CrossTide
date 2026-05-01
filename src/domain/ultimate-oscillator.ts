/**
 * Larry Williams' Ultimate Oscillator. Combines short, medium, and long
 * term buying-pressure / true-range averages into a single momentum
 * value scaled 0–100.
 *
 *   BP = close - min(low, prevClose)
 *   TR = max(high, prevClose) - min(low, prevClose)
 *   AvgN = sum(BP, N) / sum(TR, N)
 *   UO = 100 * (4*Avg7 + 2*Avg14 + Avg28) / (4 + 2 + 1)
 */

import type { Candle } from "./heikin-ashi";

export interface UltimateOscillatorOptions {
  readonly short?: number;
  readonly medium?: number;
  readonly long?: number;
}

export function computeUltimateOscillator(
  candles: readonly Candle[],
  opts: UltimateOscillatorOptions = {},
): Array<number | null> {
  const s = opts.short ?? 7;
  const m = opts.medium ?? 14;
  const l = opts.long ?? 28;
  const out: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length < 2) return out;

  const bp: number[] = new Array(candles.length).fill(0);
  const tr: number[] = new Array(candles.length).fill(0);
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]!;
    const prev = candles[i - 1]!;
    const lowMin = Math.min(c.low, prev.close);
    const highMax = Math.max(c.high, prev.close);
    bp[i] = c.close - lowMin;
    tr[i] = highMax - lowMin;
  }

  const sumWindow = (arr: number[], end: number, n: number): number => {
    let total = 0;
    for (let k = end - n + 1; k <= end; k++) total += arr[k]!;
    return total;
  };

  for (let i = l; i < candles.length; i++) {
    const trS = sumWindow(tr, i, s);
    const trM = sumWindow(tr, i, m);
    const trL = sumWindow(tr, i, l);
    if (trS === 0 || trM === 0 || trL === 0) {
      out[i] = null;
      continue;
    }
    const avgS = sumWindow(bp, i, s) / trS;
    const avgM = sumWindow(bp, i, m) / trM;
    const avgL = sumWindow(bp, i, l) / trL;
    out[i] = (100 * (4 * avgS + 2 * avgM + avgL)) / 7;
  }
  return out;
}
