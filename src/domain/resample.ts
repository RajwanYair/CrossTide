/**
 * Resample candles to a coarser timeframe by bucketing on a fixed
 * interval. Inputs must be sorted ascending by `time` (ms epoch).
 *
 * Each output bar:
 *   open   = open of first candle in bucket
 *   close  = close of last candle in bucket
 *   high   = max(high) over bucket
 *   low    = min(low) over bucket
 *   volume = sum(volume) over bucket
 *   time   = bucket start (floor of first candle's time to interval)
 */

import type { Candle } from "./heikin-ashi";

export interface ResampleOptions {
  /** Bucket size in milliseconds. */
  readonly intervalMs: number;
  /**
   * If `true`, drop the final bucket when fewer source bars than expected
   * are present (useful to skip the in-progress current bar).
   */
  readonly dropIncomplete?: boolean;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const TIMEFRAMES = {
  m1: MIN,
  m5: 5 * MIN,
  m15: 15 * MIN,
  m30: 30 * MIN,
  h1: HOUR,
  h4: 4 * HOUR,
  d1: DAY,
  w1: 7 * DAY,
} as const;

export function resampleCandles(candles: readonly Candle[], options: ResampleOptions): Candle[] {
  const interval = options.intervalMs;
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new RangeError("intervalMs must be a positive finite number");
  }
  if (candles.length === 0) return [];
  const out: Candle[] = [];
  let bucketStart = Math.floor(candles[0]!.time / interval) * interval;
  let open = candles[0]!.open;
  let high = candles[0]!.high;
  let low = candles[0]!.low;
  let close = candles[0]!.close;
  let vol = candles[0]!.volume ?? 0;
  let count = 1;

  const flush = (): void => {
    out.push({
      time: bucketStart,
      open,
      high,
      low,
      close,
      ...(candles[0]!.volume !== undefined ? { volume: vol } : {}),
    });
  };

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]!;
    const cBucket = Math.floor(c.time / interval) * interval;
    if (cBucket === bucketStart) {
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      close = c.close;
      vol += c.volume ?? 0;
      count++;
    } else {
      flush();
      bucketStart = cBucket;
      open = c.open;
      high = c.high;
      low = c.low;
      close = c.close;
      vol = c.volume ?? 0;
      count = 1;
    }
  }
  // Last bucket. Optionally skip if it appears partial (count < expected).
  if (!options.dropIncomplete || count > 0) {
    flush();
  }
  return out;
}
