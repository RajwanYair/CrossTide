/**
 * Analytics Calculators — Sharpe ratio, Sortino ratio, max drawdown, Fibonacci levels.
 *
 * Pure functions for portfolio analytics.
 */
import type { DailyCandle } from "../types/domain";

/**
 * Compute daily returns from a series of closes.
 */
export function dailyReturns(candles: readonly DailyCandle[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1]!.close;
    const curr = candles[i]!.close;
    returns.push(prev > 0 ? (curr - prev) / prev : 0);
  }
  return returns;
}

/**
 * Compute annualized Sharpe ratio.
 * Sharpe = (mean_return - risk_free_rate) / std_dev * sqrt(252)
 */
export function sharpeRatio(
  candles: readonly DailyCandle[],
  riskFreeRate = 0.04 / 252, // ~4% annual, daily
): number | null {
  const returns = dailyReturns(candles);
  if (returns.length < 2) return null;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  const std = Math.sqrt(variance);

  if (std === 0) return 0;
  return ((mean - riskFreeRate) / std) * Math.sqrt(252);
}

/**
 * Compute annualized Sortino ratio (penalizes downside deviation only).
 */
export function sortinoRatio(
  candles: readonly DailyCandle[],
  riskFreeRate = 0.04 / 252,
): number | null {
  const returns = dailyReturns(candles);
  if (returns.length < 2) return null;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downsideReturns = returns.filter((r) => r < 0);
  if (downsideReturns.length === 0) return null; // no downside = infinite sortino

  const downsideVariance = downsideReturns.reduce((a, r) => a + r ** 2, 0) / downsideReturns.length;
  const downsideStd = Math.sqrt(downsideVariance);

  if (downsideStd === 0) return 0;
  return ((mean - riskFreeRate) / downsideStd) * Math.sqrt(252);
}

/**
 * Compute maximum drawdown from a price series.
 * Returns a value between 0 and 1 (e.g. 0.25 = 25% drawdown).
 */
export function maxDrawdown(candles: readonly DailyCandle[]): number {
  if (candles.length < 2) return 0;

  let peak = candles[0]!.close;
  let maxDd = 0;

  for (const c of candles) {
    if (c.close > peak) peak = c.close;
    const dd = (peak - c.close) / peak;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

/**
 * Compute Fibonacci retracement levels from high/low.
 */
export interface FibonacciLevels {
  readonly high: number;
  readonly low: number;
  readonly level236: number;
  readonly level382: number;
  readonly level500: number;
  readonly level618: number;
  readonly level786: number;
}

export function fibonacciRetracement(candles: readonly DailyCandle[]): FibonacciLevels | null {
  if (candles.length < 2) return null;

  let high = -Infinity;
  let low = Infinity;

  for (const c of candles) {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  }

  const range = high - low;
  if (range <= 0) return null;

  return {
    high,
    low,
    level236: high - range * 0.236,
    level382: high - range * 0.382,
    level500: high - range * 0.5,
    level618: high - range * 0.618,
    level786: high - range * 0.786,
  };
}
