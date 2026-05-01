/**
 * Donchian channels: highest-high and lowest-low over a lookback
 * window, used by the Turtle trading rules and breakout systems.
 */

import type { Candle } from "./heikin-ashi";

export interface DonchianPoint {
  readonly time: number;
  readonly upper: number;
  readonly lower: number;
  readonly middle: number;
}

export function computeDonchian(candles: readonly Candle[], period = 20): DonchianPoint[] {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new RangeError("period must be a positive integer");
  }
  const out: DonchianPoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      const c = candles[j]!;
      if (c.high > hi) hi = c.high;
      if (c.low < lo) lo = c.low;
    }
    out.push({
      time: candles[i]!.time,
      upper: hi,
      lower: lo,
      middle: (hi + lo) / 2,
    });
  }
  return out;
}
