/**
 * Ichimoku Kinko Hyo — five line indicator. Standard parameters
 * (9/26/52) shift Senkou A and B forward by 26 bars and Chikou back
 * by 26 bars.
 *
 * Tenkan = (max(high, 9) + min(low, 9)) / 2
 * Kijun  = (max(high, 26) + min(low, 26)) / 2
 * SenkouA = (Tenkan + Kijun) / 2, plotted +26 bars
 * SenkouB = (max(high, 52) + min(low, 52)) / 2, plotted +26 bars
 * Chikou  = close, plotted -26 bars
 *
 * Output is index-aligned with input (one entry per candle); shifted
 * fields are placed at their *plotted* index (so accessing
 * `result[i].senkouA` gives the cloud at time i, sourced from i-26).
 */

import type { Candle } from "./heikin-ashi";

export interface IchimokuPoint {
  readonly time: number;
  readonly tenkan: number | null;
  readonly kijun: number | null;
  readonly senkouA: number | null;
  readonly senkouB: number | null;
  readonly chikou: number | null;
}

export interface IchimokuOptions {
  readonly tenkanPeriod?: number;
  readonly kijunPeriod?: number;
  readonly senkouBPeriod?: number;
  readonly displacement?: number;
}

function midRange(candles: readonly Candle[], from: number, to: number): number {
  let hi = -Infinity;
  let lo = Infinity;
  for (let i = from; i <= to; i++) {
    const c = candles[i]!;
    if (c.high > hi) hi = c.high;
    if (c.low < lo) lo = c.low;
  }
  return (hi + lo) / 2;
}

export function computeIchimoku(
  candles: readonly Candle[],
  options: IchimokuOptions = {},
): IchimokuPoint[] {
  const tp = options.tenkanPeriod ?? 9;
  const kp = options.kijunPeriod ?? 26;
  const sbp = options.senkouBPeriod ?? 52;
  const disp = options.displacement ?? 26;
  if (tp <= 0 || kp <= 0 || sbp <= 0 || disp < 0) {
    throw new RangeError("periods must be positive, displacement non-negative");
  }
  const n = candles.length;
  const tenkanRaw: (number | null)[] = [];
  const kijunRaw: (number | null)[] = [];
  const senkouBRaw: (number | null)[] = [];
  for (let i = 0; i < n; i++) {
    tenkanRaw.push(i >= tp - 1 ? midRange(candles, i - tp + 1, i) : null);
    kijunRaw.push(i >= kp - 1 ? midRange(candles, i - kp + 1, i) : null);
    senkouBRaw.push(i >= sbp - 1 ? midRange(candles, i - sbp + 1, i) : null);
  }
  const out: IchimokuPoint[] = [];
  for (let i = 0; i < n; i++) {
    const senkouAsource = i - disp;
    const senkouA =
      senkouAsource >= 0 && tenkanRaw[senkouAsource] !== null && kijunRaw[senkouAsource] !== null
        ? (tenkanRaw[senkouAsource]! + kijunRaw[senkouAsource]!) / 2
        : null;
    const senkouB = senkouAsource >= 0 ? (senkouBRaw[senkouAsource] ?? null) : null;
    const chikouSource = i + disp;
    const chikou = chikouSource < n ? candles[chikouSource]!.close : null;
    out.push({
      time: candles[i]!.time,
      tenkan: tenkanRaw[i] ?? null,
      kijun: kijunRaw[i] ?? null,
      senkouA,
      senkouB,
      chikou,
    });
  }
  return out;
}
