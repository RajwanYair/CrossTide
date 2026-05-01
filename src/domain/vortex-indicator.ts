/**
 * Vortex Indicator (Etienne Botes & Douglas Siepman, 2009).
 *   VM+[i] = |high[i]   - low[i-1]|
 *   VM-[i] = |low[i]    - high[i-1]|
 *   TR[i]  = max(high-low, |high-prevClose|, |low-prevClose|)
 *   VI+    = sum(VM+, period) / sum(TR, period)
 *   VI-    = sum(VM-, period) / sum(TR, period)
 * VI+ crossing above VI- is a bullish signal.
 */

import type { Candle } from "./heikin-ashi";

export interface VortexPoint {
  readonly time: number;
  readonly viPlus: number;
  readonly viMinus: number;
}

export function computeVortex(
  candles: readonly Candle[],
  period = 14,
): VortexPoint[] {
  if (period <= 0 || candles.length <= period) return [];
  const vmp: number[] = new Array(candles.length).fill(0);
  const vmm: number[] = new Array(candles.length).fill(0);
  const tr: number[] = new Array(candles.length).fill(0);
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i]!;
    const prev = candles[i - 1]!;
    vmp[i] = Math.abs(cur.high - prev.low);
    vmm[i] = Math.abs(cur.low - prev.high);
    tr[i] = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close),
    );
  }
  let sumVmp = 0;
  let sumVmm = 0;
  let sumTr = 0;
  for (let i = 1; i <= period; i++) {
    sumVmp += vmp[i]!;
    sumVmm += vmm[i]!;
    sumTr += tr[i]!;
  }
  const out: VortexPoint[] = [];
  out.push({
    time: candles[period]!.time,
    viPlus: sumTr === 0 ? 0 : sumVmp / sumTr,
    viMinus: sumTr === 0 ? 0 : sumVmm / sumTr,
  });
  for (let i = period + 1; i < candles.length; i++) {
    sumVmp += vmp[i]! - vmp[i - period]!;
    sumVmm += vmm[i]! - vmm[i - period]!;
    sumTr += tr[i]! - tr[i - period]!;
    out.push({
      time: candles[i]!.time,
      viPlus: sumTr === 0 ? 0 : sumVmp / sumTr,
      viMinus: sumTr === 0 ? 0 : sumVmm / sumTr,
    });
  }
  return out;
}
