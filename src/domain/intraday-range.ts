/**
 * Intraday high/low distance — calculate how far the current price
 * is from the day's high and low, useful for timing entries.
 */

export interface IntradayRange {
  readonly ticker: string;
  readonly high: number;
  readonly low: number;
  readonly current: number;
}

export interface RangeDistance {
  readonly ticker: string;
  readonly range: number;
  readonly distanceFromHigh: number;
  readonly distanceFromLow: number;
  readonly percentFromHigh: number; // 0–100
  readonly percentFromLow: number; // 0–100
  readonly positionInRange: number; // 0 = at low, 1 = at high
}

/**
 * Calculate distance metrics from current price to intraday high/low.
 */
export function calculateRangeDistance(data: IntradayRange): RangeDistance {
  const range = data.high - data.low;
  const distanceFromHigh = data.high - data.current;
  const distanceFromLow = data.current - data.low;

  const percentFromHigh = data.high !== 0 ? (distanceFromHigh / data.high) * 100 : 0;
  const percentFromLow = data.low !== 0 ? (distanceFromLow / data.low) * 100 : 0;
  const positionInRange = range !== 0 ? (data.current - data.low) / range : 0.5;

  return {
    ticker: data.ticker,
    range,
    distanceFromHigh,
    distanceFromLow,
    percentFromHigh,
    percentFromLow,
    positionInRange,
  };
}

/**
 * Batch calculate range distances for multiple tickers.
 */
export function batchRangeDistance(data: readonly IntradayRange[]): RangeDistance[] {
  return data.map(calculateRangeDistance);
}

/**
 * Get tickers near their intraday high (position > threshold).
 */
export function nearHigh(distances: readonly RangeDistance[], threshold = 0.9): RangeDistance[] {
  return distances.filter((d) => d.positionInRange >= threshold);
}

/**
 * Get tickers near their intraday low (position < threshold).
 */
export function nearLow(distances: readonly RangeDistance[], threshold = 0.1): RangeDistance[] {
  return distances.filter((d) => d.positionInRange <= threshold);
}

/**
 * Get tickers with the widest intraday range (most volatile today).
 */
export function widestRange(distances: readonly RangeDistance[], count = 5): RangeDistance[] {
  return [...distances].sort((a, b) => b.range - a.range).slice(0, count);
}

/**
 * Get tickers with the narrowest intraday range (consolidating).
 */
export function narrowestRange(distances: readonly RangeDistance[], count = 5): RangeDistance[] {
  return [...distances].sort((a, b) => a.range - b.range).slice(0, count);
}

/**
 * Average True Range position across a list — market-level indicator.
 */
export function averagePositionInRange(distances: readonly RangeDistance[]): number {
  if (distances.length === 0) return 0;
  const sum = distances.reduce((s, d) => s + d.positionInRange, 0);
  return sum / distances.length;
}
