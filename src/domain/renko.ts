/**
 * Renko chart brick computation.
 *
 * Converts standard OHLC candles into Renko bricks of a fixed price size.
 * Each brick is emitted when price moves by at least `brickSize` from the
 * previous brick's close. Bricks have uniform height and are either "up"
 * (close > open) or "down" (close < open).
 */

/** A single Renko brick with OHLC values for LWC candlestick rendering. */
export interface RenkoBrick {
  readonly time: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export interface RenkoInput {
  readonly time: string;
  readonly close: number;
}

/**
 * Compute Renko bricks from price data.
 *
 * @param data — sorted array of { time, close } entries
 * @param brickSize — fixed price height of each brick (must be > 0)
 * @returns array of RenkoBrick for rendering as candlestick data
 */
export function computeRenko(data: readonly RenkoInput[], brickSize: number): RenkoBrick[] {
  if (data.length === 0 || brickSize <= 0) return [];

  const bricks: RenkoBrick[] = [];
  let basePrice = data[0]!.close;

  for (let i = 1; i < data.length; i++) {
    const current = data[i]!;
    const diff = current.close - basePrice;
    const numBricks = Math.floor(Math.abs(diff) / brickSize);

    if (numBricks === 0) continue;

    const direction = diff > 0 ? 1 : -1;
    for (let b = 0; b < numBricks; b++) {
      const open = basePrice + direction * b * brickSize;
      const close = open + direction * brickSize;
      bricks.push({
        time: current.time,
        open,
        high: Math.max(open, close),
        low: Math.min(open, close),
        close,
      });
    }
    basePrice = basePrice + direction * numBricks * brickSize;
  }

  return bricks;
}

/**
 * Suggest a brick size based on ATR-like heuristic.
 * Uses median absolute daily change over the data window.
 */
export function suggestBrickSize(data: readonly RenkoInput[]): number {
  if (data.length < 2) return 1;

  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(Math.abs(data[i]!.close - data[i - 1]!.close));
  }
  changes.sort((a, b) => a - b);
  const median = changes[Math.floor(changes.length / 2)]!;
  // Round to 2 significant digits
  const magnitude = Math.pow(10, Math.floor(Math.log10(median)));
  return Math.max(magnitude, Math.round(median / magnitude) * magnitude);
}
