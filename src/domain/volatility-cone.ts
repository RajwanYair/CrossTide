/**
 * Volatility cone — term structure of realized volatility at
 * different lookback periods compared to historical percentiles.
 */

export interface VolatilityConePoint {
  readonly period: number; // lookback in days
  readonly current: number; // current realized vol
  readonly p25: number;
  readonly p50: number;
  readonly p75: number;
  readonly min: number;
  readonly max: number;
}

export interface VolatilityConeResult {
  readonly cone: readonly VolatilityConePoint[];
  readonly isElevated: boolean; // current vol above p75 for shortest period
  readonly isDepressed: boolean; // current vol below p25 for shortest period
}

/**
 * Compute annualized realized volatility from daily returns.
 */
export function realizedVol(prices: readonly number[], period: number): number {
  if (prices.length < period + 1) return 0;

  const returns: number[] = [];
  const start = prices.length - period;
  for (let i = start; i < prices.length; i++) {
    returns.push(Math.log(prices[i]! / prices[i - 1]!));
  }

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);

  return Math.sqrt(variance * 252) * 100; // annualized, percent
}

/**
 * Compute historical distribution of realized vol for a given period.
 */
export function historicalVolDistribution(
  prices: readonly number[],
  period: number,
  stepSize = 1,
): number[] {
  const vols: number[] = [];

  for (let end = period + 1; end <= prices.length; end += stepSize) {
    const slice = prices.slice(0, end);
    const vol = realizedVol(slice, period);
    if (vol > 0) vols.push(vol);
  }

  return vols.sort((a, b) => a - b);
}

/**
 * Compute percentile from sorted array.
 */
function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower]!;
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (idx - lower);
}

/**
 * Build the full volatility cone across multiple periods.
 */
export function buildVolatilityCone(
  prices: readonly number[],
  periods: readonly number[] = [10, 20, 30, 60, 90, 120],
): VolatilityConeResult {
  const cone: VolatilityConePoint[] = [];

  for (const period of periods) {
    if (prices.length < period + 2) continue;

    const current = realizedVol(prices, period);
    const dist = historicalVolDistribution(prices, period);

    if (dist.length === 0) continue;

    cone.push({
      period,
      current,
      p25: percentile(dist, 25),
      p50: percentile(dist, 50),
      p75: percentile(dist, 75),
      min: dist[0]!,
      max: dist[dist.length - 1]!,
    });
  }

  const shortest = cone.length > 0 ? cone[0]! : null;
  const isElevated = shortest ? shortest.current > shortest.p75 : false;
  const isDepressed = shortest ? shortest.current < shortest.p25 : false;

  return { cone, isElevated, isDepressed };
}

/**
 * Get current volatility percentile rank for a given period.
 */
export function volPercentileRank(prices: readonly number[], period = 20): number {
  const current = realizedVol(prices, period);
  const dist = historicalVolDistribution(prices, period);

  if (dist.length === 0) return 50;

  const below = dist.filter((v) => v <= current).length;
  return (below / dist.length) * 100;
}
