/**
 * Range bar chart computation.
 *
 * Range bars form a new bar whenever the price range (high - low) reaches
 * a specified amount, regardless of time. This removes time from the X-axis
 * and focuses purely on price movement.
 */

/** A single range bar with OHLC values for LWC candlestick rendering. */
export interface RangeBar {
  readonly time: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export interface RangeBarInput {
  readonly time: string;
  readonly high: number;
  readonly low: number;
  readonly open: number;
  readonly close: number;
}

/**
 * Compute range bars from OHLC data.
 *
 * @param data — sorted array of OHLC candle entries
 * @param rangeSize — fixed price range per bar (must be > 0)
 * @returns array of RangeBar for rendering as candlestick data
 */
export function computeRangeBars(data: readonly RangeBarInput[], rangeSize: number): RangeBar[] {
  if (data.length === 0 || rangeSize <= 0) return [];

  const bars: RangeBar[] = [];
  let currentOpen = data[0]!.open;
  let currentHigh = data[0]!.high;
  let currentLow = data[0]!.low;

  for (let i = 0; i < data.length; i++) {
    const candle = data[i]!;
    currentHigh = Math.max(currentHigh, candle.high);
    currentLow = Math.min(currentLow, candle.low);

    while (currentHigh - currentLow >= rangeSize) {
      // Determine direction from open position relative to range
      const isUp = candle.close >= currentOpen;
      let barClose: number;
      let barHigh: number;
      let barLow: number;

      if (isUp) {
        barLow = currentLow;
        barHigh = currentLow + rangeSize;
        barClose = barHigh;
      } else {
        barHigh = currentHigh;
        barLow = currentHigh - rangeSize;
        barClose = barLow;
      }

      bars.push({
        time: candle.time,
        open: currentOpen,
        high: barHigh,
        low: barLow,
        close: barClose,
      });

      // Start next bar from close of completed bar
      currentOpen = barClose;
      currentHigh = Math.max(barClose, candle.close);
      currentLow = Math.min(barClose, candle.close);
    }
  }

  return bars;
}

/**
 * Suggest a range size based on average true range of the data.
 * Uses median high-low spread.
 */
export function suggestRangeSize(data: readonly RangeBarInput[]): number {
  if (data.length === 0) return 1;

  const ranges: number[] = data.map((d) => d.high - d.low);
  ranges.sort((a, b) => a - b);
  const median = ranges[Math.floor(ranges.length / 2)]!;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(median, 0.01))));
  return Math.max(magnitude, Math.round(median / magnitude) * magnitude);
}
