/**
 * Volume-weighted price calculations — VWAP and TWAP
 * from intraday price/volume data.
 */

export interface PriceVolume {
  readonly price: number;
  readonly volume: number;
}

export interface TimedPrice {
  readonly price: number;
  readonly timestamp: number; // unix ms
}

export interface VwapResult {
  readonly vwap: number;
  readonly cumulativeVolume: number;
  readonly upperBand: number; // +1 std dev
  readonly lowerBand: number; // -1 std dev
}

/**
 * Compute VWAP from price/volume bars.
 */
export function vwap(bars: readonly PriceVolume[]): number {
  if (bars.length === 0) return 0;
  let sumPV = 0;
  let sumV = 0;
  for (const bar of bars) {
    sumPV += bar.price * bar.volume;
    sumV += bar.volume;
  }
  return sumV > 0 ? sumPV / sumV : 0;
}

/**
 * Running VWAP series (cumulative at each bar).
 */
export function runningVwap(bars: readonly PriceVolume[]): number[] {
  const result: number[] = [];
  let sumPV = 0;
  let sumV = 0;
  for (const bar of bars) {
    sumPV += bar.price * bar.volume;
    sumV += bar.volume;
    result.push(sumV > 0 ? sumPV / sumV : 0);
  }
  return result;
}

/**
 * VWAP with standard deviation bands.
 */
export function vwapWithBands(bars: readonly PriceVolume[], stdDevMultiplier = 1): VwapResult {
  if (bars.length === 0) {
    return { vwap: 0, cumulativeVolume: 0, upperBand: 0, lowerBand: 0 };
  }

  let sumPV = 0;
  let sumV = 0;
  for (const bar of bars) {
    sumPV += bar.price * bar.volume;
    sumV += bar.volume;
  }

  const v = sumV > 0 ? sumPV / sumV : 0;

  // Compute volume-weighted variance
  let sumSquaredDev = 0;
  for (const bar of bars) {
    sumSquaredDev += bar.volume * Math.pow(bar.price - v, 2);
  }
  const variance = sumV > 0 ? sumSquaredDev / sumV : 0;
  const stdDev = Math.sqrt(variance);

  return {
    vwap: v,
    cumulativeVolume: sumV,
    upperBand: v + stdDev * stdDevMultiplier,
    lowerBand: v - stdDev * stdDevMultiplier,
  };
}

/**
 * Compute TWAP (time-weighted average price) from timed prices.
 */
export function twap(prices: readonly TimedPrice[]): number {
  if (prices.length < 2) return prices.length === 1 ? prices[0]!.price : 0;

  let sumPriceTime = 0;
  let totalTime = 0;

  for (let i = 1; i < prices.length; i++) {
    const dt = prices[i]!.timestamp - prices[i - 1]!.timestamp;
    sumPriceTime += prices[i - 1]!.price * dt;
    totalTime += dt;
  }

  return totalTime > 0 ? sumPriceTime / totalTime : prices[0]!.price;
}

/**
 * Simple TWAP from evenly-spaced prices.
 */
export function simpleTwap(prices: readonly number[]): number {
  if (prices.length === 0) return 0;
  return prices.reduce((s, p) => s + p, 0) / prices.length;
}

/**
 * Deviation from VWAP in percent.
 */
export function vwapDeviation(currentPrice: number, bars: readonly PriceVolume[]): number {
  const v = vwap(bars);
  return v > 0 ? ((currentPrice - v) / v) * 100 : 0;
}
