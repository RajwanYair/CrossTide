/**
 * Bill Williams Fractals. A bullish fractal forms at index `i` when the
 * low at `i` is strictly lower than the surrounding `n` lows on both
 * sides; a bearish fractal forms when the high at `i` is strictly higher
 * than its `n` neighbors. Default `n = 2` (5-bar pattern).
 */

import type { Candle } from "./heikin-ashi";

export interface FractalPoint {
  readonly index: number;
  readonly time: number;
  readonly type: "bullish" | "bearish";
  readonly price: number;
}

export function computeFractals(candles: readonly Candle[], n = 2): FractalPoint[] {
  if (n <= 0 || candles.length < 2 * n + 1) return [];
  const out: FractalPoint[] = [];
  for (let i = n; i < candles.length - n; i++) {
    const c = candles[i]!;
    let isBearish = true;
    let isBullish = true;
    for (let k = 1; k <= n; k++) {
      const left = candles[i - k]!;
      const right = candles[i + k]!;
      if (!(c.high > left.high) || !(c.high > right.high)) isBearish = false;
      if (!(c.low < left.low) || !(c.low < right.low)) isBullish = false;
      if (!isBearish && !isBullish) break;
    }
    if (isBearish) out.push({ index: i, time: c.time, type: "bearish", price: c.high });
    if (isBullish) out.push({ index: i, time: c.time, type: "bullish", price: c.low });
  }
  return out;
}
