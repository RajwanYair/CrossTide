/**
 * Risk-adjusted return metrics that complement Sharpe in
 * `backtest-engine.ts`. All inputs are *period* returns (e.g. daily) and
 * a `periodsPerYear` factor controls annualization.
 *
 * - Sortino: like Sharpe but only penalizes downside deviation.
 * - Calmar: annualized return divided by the absolute max drawdown.
 */

export interface RatioOptions {
  /** Annualization periods (default 252 trading days). */
  readonly periodsPerYear?: number;
  /** Risk-free rate per period (default 0). */
  readonly riskFreeRate?: number;
  /** Minimum acceptable return per period for Sortino (default 0). */
  readonly mar?: number;
}

const DEFAULT_PPY = 252;

function mean(arr: readonly number[]): number {
  if (arr.length === 0) return 0;
  let s = 0;
  for (const v of arr) s += v;
  return s / arr.length;
}

/**
 * Sortino ratio: (mean - mar) / downside_dev, annualized.
 * Returns 0 when downside deviation is zero or input is empty.
 */
export function sortinoRatio(returns: readonly number[], options: RatioOptions = {}): number {
  if (returns.length === 0) return 0;
  const ppy = options.periodsPerYear ?? DEFAULT_PPY;
  const rf = options.riskFreeRate ?? 0;
  const mar = options.mar ?? 0;
  const excess = mean(returns) - rf;
  let sumSq = 0;
  let count = 0;
  for (const r of returns) {
    if (r < mar) {
      const d = r - mar;
      sumSq += d * d;
      count++;
    }
  }
  if (count === 0) return 0;
  const downsideDev = Math.sqrt(sumSq / returns.length);
  if (downsideDev === 0) return 0;
  return (excess / downsideDev) * Math.sqrt(ppy);
}

/**
 * Compute the maximum drawdown from an equity curve as a positive
 * fraction (e.g. 0.25 for a 25% drawdown).
 */
export function maxDrawdown(equity: readonly number[]): number {
  let peak = -Infinity;
  let maxDD = 0;
  for (const v of equity) {
    if (v > peak) peak = v;
    if (peak > 0) {
      const dd = (peak - v) / peak;
      if (dd > maxDD) maxDD = dd;
    }
  }
  return maxDD;
}

/**
 * CAGR from an equity curve, given the number of years spanned.
 * Returns 0 when years <= 0 or equity[0] <= 0.
 */
export function cagr(equity: readonly number[], years: number): number {
  if (equity.length < 2 || years <= 0) return 0;
  const start = equity[0]!;
  const end = equity[equity.length - 1]!;
  if (start <= 0) return 0;
  return Math.pow(end / start, 1 / years) - 1;
}

/**
 * Calmar ratio: CAGR / max drawdown. Returns Infinity when there is no
 * drawdown but a positive CAGR; returns 0 when CAGR is 0.
 */
export function calmarRatio(equity: readonly number[], years: number): number {
  const c = cagr(equity, years);
  if (c === 0) return 0;
  const dd = maxDrawdown(equity);
  if (dd === 0) return c > 0 ? Infinity : 0;
  return c / dd;
}
