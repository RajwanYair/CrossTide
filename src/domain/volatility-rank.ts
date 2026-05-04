/**
 * Volatility rank calculator — compute and rank tickers by historical
 * volatility (standard deviation of returns) for risk assessment.
 */

export interface VolatilityRank {
  readonly ticker: string;
  readonly annualizedVol: number; // As percentage
  readonly dailyVol: number; // As percentage
  readonly rank: number; // 1 = most volatile
}

const TRADING_DAYS_PER_YEAR = 252;

/**
 * Compute daily returns from a price series.
 */
export function dailyReturns(prices: readonly number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]!;
    if (prev === 0) {
      returns.push(0);
    } else {
      returns.push((prices[i]! - prev) / prev);
    }
  }
  return returns;
}

/**
 * Compute standard deviation of a numeric array.
 */
export function standardDeviation(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.reduce((sum, v) => sum + (v - mean) ** 2, 0);
  return Math.sqrt(squaredDiffs / (values.length - 1));
}

/**
 * Compute annualized volatility from a price series.
 * Returns as percentage (e.g., 25 for 25% annual vol).
 */
export function annualizedVolatility(prices: readonly number[]): number {
  const returns = dailyReturns(prices);
  if (returns.length < 2) return 0;
  const daily = standardDeviation(returns);
  return daily * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100;
}

/**
 * Compute daily volatility from a price series.
 * Returns as percentage.
 */
export function dailyVolatility(prices: readonly number[]): number {
  const returns = dailyReturns(prices);
  if (returns.length < 2) return 0;
  return standardDeviation(returns) * 100;
}

/**
 * Rank multiple tickers by volatility (most volatile first).
 */
export function rankByVolatility(
  tickers: readonly { ticker: string; prices: readonly number[] }[],
): VolatilityRank[] {
  const results = tickers.map((t) => ({
    ticker: t.ticker.toUpperCase(),
    annualizedVol: annualizedVolatility(t.prices),
    dailyVol: dailyVolatility(t.prices),
  }));

  results.sort((a, b) => b.annualizedVol - a.annualizedVol);

  return results.map((r, i) => ({
    ...r,
    rank: i + 1,
  }));
}

/**
 * Classify volatility level.
 */
export function classifyVolatility(annualizedVol: number): string {
  if (annualizedVol < 10) return "very low";
  if (annualizedVol < 20) return "low";
  if (annualizedVol < 35) return "moderate";
  if (annualizedVol < 50) return "high";
  return "very high";
}

/**
 * Get the least volatile tickers (for conservative portfolios).
 */
export function getLeastVolatile(
  rankings: readonly VolatilityRank[],
  count: number,
): VolatilityRank[] {
  return [...rankings].sort((a, b) => a.annualizedVol - b.annualizedVol).slice(0, count);
}
