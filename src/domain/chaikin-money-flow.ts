/**
 * Chaikin Money Flow (Marc Chaikin). For each bar:
 *   MFM = ((C - L) - (H - C)) / (H - L)   // Money Flow Multiplier
 *   MFV = MFM * Volume                     // Money Flow Volume
 * CMF(n) = sum(MFV, n) / sum(Volume, n). Range: [-1, 1].
 * Positive → buying pressure, negative → selling.
 */

import type { Candle } from "./heikin-ashi";

export interface CmfPoint {
  readonly time: number;
  readonly cmf: number;
}

export function computeChaikinMoneyFlow(candles: readonly Candle[], period = 20): CmfPoint[] {
  if (period <= 0 || candles.length < period) return [];
  const mfv: number[] = [];
  const vol: number[] = [];
  for (const c of candles) {
    const range = c.high - c.low;
    const v = c.volume ?? 0;
    const mult = range === 0 ? 0 : (c.close - c.low - (c.high - c.close)) / range;
    mfv.push(mult * v);
    vol.push(v);
  }
  const out: CmfPoint[] = [];
  let mfvSum = 0;
  let volSum = 0;
  for (let i = 0; i < period; i++) {
    mfvSum += mfv[i]!;
    volSum += vol[i]!;
  }
  out.push({
    time: candles[period - 1]!.time,
    cmf: volSum === 0 ? 0 : mfvSum / volSum,
  });
  for (let i = period; i < candles.length; i++) {
    mfvSum += mfv[i]! - mfv[i - period]!;
    volSum += vol[i]! - vol[i - period]!;
    out.push({
      time: candles[i]!.time,
      cmf: volSum === 0 ? 0 : mfvSum / volSum,
    });
  }
  return out;
}
