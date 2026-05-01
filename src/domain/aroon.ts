/**
 * Aroon indicator (Chande, 1995). Measures bars since last N-period
 * high/low. Aroon Up = 100 * (period - barsSinceHigh) / period;
 * Aroon Down likewise for the low. Oscillator = Up - Down.
 */

import type { Candle } from "./heikin-ashi";

export interface AroonPoint {
  readonly time: number;
  readonly up: number;
  readonly down: number;
  readonly oscillator: number;
}

export function computeAroon(candles: readonly Candle[], period = 14): AroonPoint[] {
  if (period <= 0 || candles.length <= period) return [];
  const out: AroonPoint[] = [];
  for (let i = period; i < candles.length; i++) {
    let highIdx = i - period;
    let lowIdx = i - period;
    let highVal = candles[highIdx]!.high;
    let lowVal = candles[lowIdx]!.low;
    for (let j = i - period + 1; j <= i; j++) {
      const c = candles[j]!;
      if (c.high >= highVal) {
        highVal = c.high;
        highIdx = j;
      }
      if (c.low <= lowVal) {
        lowVal = c.low;
        lowIdx = j;
      }
    }
    const up = ((period - (i - highIdx)) / period) * 100;
    const down = ((period - (i - lowIdx)) / period) * 100;
    out.push({ time: candles[i]!.time, up, down, oscillator: up - down });
  }
  return out;
}
