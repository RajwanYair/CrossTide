/**
 * Breakout detector — identify price breakouts above resistance
 * or below support with optional volume confirmation.
 */

export interface BreakoutCandle {
  readonly close: number;
  readonly volume: number;
}

export interface BreakoutEvent {
  readonly index: number;
  readonly type: "bullish" | "bearish";
  readonly price: number;
  readonly level: number; // broken level
  readonly volumeRatio: number; // volume vs average
  readonly confirmed: boolean; // volume > threshold
}

/**
 * Find the highest close in a lookback window (resistance proxy).
 */
export function rollingHigh(closes: readonly number[], period: number, index: number): number {
  const start = Math.max(0, index - period);
  let max = -Infinity;
  for (let i = start; i < index; i++) {
    if (closes[i]! > max) max = closes[i]!;
  }
  return max === -Infinity ? closes[index]! : max;
}

/**
 * Find the lowest close in a lookback window (support proxy).
 */
export function rollingLow(closes: readonly number[], period: number, index: number): number {
  const start = Math.max(0, index - period);
  let min = Infinity;
  for (let i = start; i < index; i++) {
    if (closes[i]! < min) min = closes[i]!;
  }
  return min === Infinity ? closes[index]! : min;
}

/**
 * Compute average volume over a lookback window.
 */
function avgVolume(volumes: readonly number[], period: number, index: number): number {
  const start = Math.max(0, index - period);
  let sum = 0;
  let count = 0;
  for (let i = start; i < index; i++) {
    sum += volumes[i]!;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Detect breakout events from price/volume data.
 */
export function detectBreakouts(
  candles: readonly BreakoutCandle[],
  lookback = 20,
  volumeThreshold = 1.5,
): BreakoutEvent[] {
  const events: BreakoutEvent[] = [];
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);

  for (let i = lookback; i < candles.length; i++) {
    const high = rollingHigh(closes, lookback, i);
    const low = rollingLow(closes, lookback, i);
    const price = closes[i]!;
    const vol = volumes[i]!;
    const avgVol = avgVolume(volumes, lookback, i);
    const volumeRatio = avgVol > 0 ? vol / avgVol : 0;

    if (price > high) {
      events.push({
        index: i,
        type: "bullish",
        price,
        level: high,
        volumeRatio,
        confirmed: volumeRatio >= volumeThreshold,
      });
    } else if (price < low) {
      events.push({
        index: i,
        type: "bearish",
        price,
        level: low,
        volumeRatio,
        confirmed: volumeRatio >= volumeThreshold,
      });
    }
  }

  return events;
}

/**
 * Filter only confirmed breakouts (volume above threshold).
 */
export function confirmedBreakouts(
  candles: readonly BreakoutCandle[],
  lookback = 20,
  volumeThreshold = 1.5,
): BreakoutEvent[] {
  return detectBreakouts(candles, lookback, volumeThreshold).filter((e) => e.confirmed);
}

/**
 * Get the most recent breakout event.
 */
export function lastBreakout(
  candles: readonly BreakoutCandle[],
  lookback = 20,
  volumeThreshold = 1.5,
): BreakoutEvent | null {
  const events = detectBreakouts(candles, lookback, volumeThreshold);
  return events.length > 0 ? events[events.length - 1]! : null;
}
