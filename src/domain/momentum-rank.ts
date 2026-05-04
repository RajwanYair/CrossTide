/**
 * Multi-ticker momentum rank — rank tickers by rate-of-change performance
 * over configurable lookback periods for relative strength comparison.
 */

export interface MomentumRank {
  readonly ticker: string;
  readonly roc: number; // Rate of change as percentage
  readonly rank: number; // 1 = strongest
}

/**
 * Calculate rate of change (percentage return) over a lookback period.
 */
export function rateOfChange(prices: readonly number[], period: number): number {
  if (prices.length <= period || period <= 0) return 0;
  const current = prices[prices.length - 1]!;
  const past = prices[prices.length - 1 - period]!;
  if (past === 0) return 0;
  return ((current - past) / past) * 100;
}

/**
 * Rank multiple tickers by their momentum (rate of change).
 * Returns array sorted by strongest momentum first.
 */
export function rankByMomentum(
  tickers: readonly { ticker: string; prices: readonly number[] }[],
  period: number,
): MomentumRank[] {
  const results = tickers.map((t) => ({
    ticker: t.ticker.toUpperCase(),
    roc: rateOfChange(t.prices, period),
  }));

  results.sort((a, b) => b.roc - a.roc);

  return results.map((r, i) => ({
    ticker: r.ticker,
    roc: r.roc,
    rank: i + 1,
  }));
}

/**
 * Compute composite momentum across multiple timeframes.
 * Averages ROC over short, medium, and long periods.
 */
export function compositeMomentum(
  prices: readonly number[],
  shortPeriod = 5,
  mediumPeriod = 20,
  longPeriod = 60,
): number {
  const short = rateOfChange(prices, shortPeriod);
  const medium = rateOfChange(prices, mediumPeriod);
  const long = rateOfChange(prices, longPeriod);
  return (short + medium + long) / 3;
}

/**
 * Rank tickers by composite momentum (multi-timeframe).
 */
export function rankByCompositeMomentum(
  tickers: readonly { ticker: string; prices: readonly number[] }[],
  shortPeriod = 5,
  mediumPeriod = 20,
  longPeriod = 60,
): MomentumRank[] {
  const results = tickers.map((t) => ({
    ticker: t.ticker.toUpperCase(),
    roc: compositeMomentum(t.prices, shortPeriod, mediumPeriod, longPeriod),
  }));

  results.sort((a, b) => b.roc - a.roc);

  return results.map((r, i) => ({
    ticker: r.ticker,
    roc: r.roc,
    rank: i + 1,
  }));
}

/**
 * Get the top N momentum leaders.
 */
export function getMomentumLeaders(
  rankings: readonly MomentumRank[],
  count: number,
): MomentumRank[] {
  return rankings.slice(0, count);
}

/**
 * Get the bottom N momentum laggards.
 */
export function getMomentumLaggards(
  rankings: readonly MomentumRank[],
  count: number,
): MomentumRank[] {
  return rankings.slice(-count);
}
