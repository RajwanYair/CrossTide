/**
 * ZigZag pivot detector. Marks alternating swing highs and swing lows
 * separated by at least `thresholdPercent` reversal from the last
 * confirmed pivot. Used to filter out noise and identify Elliott / fib
 * legs on a chart.
 *
 * Algorithm: walk left-to-right; track the most extreme high/low since
 * the last confirmed pivot. When the price reverses from that extreme
 * by more than the threshold, emit the extreme as a confirmed pivot.
 */

import type { Candle } from "./heikin-ashi";

export type PivotDirection = "high" | "low";

export interface ZigZagPivot {
  readonly index: number;
  readonly time: number;
  readonly price: number;
  readonly direction: PivotDirection;
}

export interface ZigZagOptions {
  /** Reversal threshold as a fraction (0.05 = 5%). Default 0.05. */
  readonly thresholdPercent?: number;
}

export function computeZigZag(
  candles: readonly Candle[],
  options: ZigZagOptions = {},
): ZigZagPivot[] {
  const threshold = options.thresholdPercent ?? 0.05;
  if (threshold <= 0) {
    throw new RangeError("thresholdPercent must be > 0");
  }
  if (candles.length === 0) return [];
  const pivots: ZigZagPivot[] = [];
  // Direction we're currently tracking (the next confirmed pivot).
  let trackingDir: PivotDirection | null = null;
  let extremeIdx = 0;
  let extremePrice = candles[0]!.close;
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]!;
    if (trackingDir === null || trackingDir === "high") {
      // Looking for a new high; check for reversal down from extremeHigh.
      if (c.high > extremePrice) {
        extremePrice = c.high;
        extremeIdx = i;
      } else if ((extremePrice - c.low) / extremePrice >= threshold) {
        // Confirm the high.
        if (extremeIdx > 0 || pivots.length > 0) {
          pivots.push({
            index: extremeIdx,
            time: candles[extremeIdx]!.time,
            price: extremePrice,
            direction: "high",
          });
        }
        trackingDir = "low";
        extremePrice = c.low;
        extremeIdx = i;
      }
    } else {
      // Tracking a low.
      if (c.low < extremePrice) {
        extremePrice = c.low;
        extremeIdx = i;
      } else if ((c.high - extremePrice) / extremePrice >= threshold) {
        pivots.push({
          index: extremeIdx,
          time: candles[extremeIdx]!.time,
          price: extremePrice,
          direction: "low",
        });
        trackingDir = "high";
        extremePrice = c.high;
        extremeIdx = i;
      }
    }
  }
  return pivots;
}
