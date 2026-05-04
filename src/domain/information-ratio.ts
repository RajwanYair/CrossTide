/**
 * Information ratio and related performance metrics.
 * Measures risk-adjusted excess return relative to a benchmark.
 */

/**
 * Information Ratio = (R_portfolio - R_benchmark) / TrackingError
 * Higher IR = better risk-adjusted outperformance.
 */
export function informationRatio(
  portfolioReturns: readonly number[],
  benchmarkReturns: readonly number[],
): number {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n < 2) return 0;

  const excessReturns: number[] = [];
  for (let i = 0; i < n; i++) {
    excessReturns.push(portfolioReturns[i]! - benchmarkReturns[i]!);
  }

  const te = trackingError(portfolioReturns, benchmarkReturns);
  if (te === 0) return 0;

  const meanExcess = excessReturns.reduce((s, r) => s + r, 0) / n;
  return (meanExcess * Math.sqrt(252)) / te;
}

/**
 * Tracking error — annualized standard deviation of excess returns.
 */
export function trackingError(
  portfolioReturns: readonly number[],
  benchmarkReturns: readonly number[],
): number {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n < 2) return 0;

  const excess: number[] = [];
  for (let i = 0; i < n; i++) {
    excess.push(portfolioReturns[i]! - benchmarkReturns[i]!);
  }

  const mean = excess.reduce((s, r) => s + r, 0) / n;
  let variance = 0;
  for (const e of excess) variance += (e - mean) ** 2;
  variance /= n - 1;

  return Math.sqrt(variance * 252);
}

/**
 * Active return — annualized excess return over benchmark.
 */
export function activeReturn(
  portfolioReturns: readonly number[],
  benchmarkReturns: readonly number[],
): number {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n === 0) return 0;

  let sumExcess = 0;
  for (let i = 0; i < n; i++) {
    sumExcess += portfolioReturns[i]! - benchmarkReturns[i]!;
  }

  return (sumExcess / n) * 252;
}

/**
 * Treynor ratio = (R_portfolio - R_f) / Beta
 * Measures excess return per unit of systematic risk.
 */
export function treynorRatio(
  portfolioReturns: readonly number[],
  benchmarkReturns: readonly number[],
  riskFreeRate = 0.04,
): number {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n < 2) return 0;

  const beta = computeBeta(portfolioReturns, benchmarkReturns);
  if (beta === 0) return 0;

  const meanPortfolio = portfolioReturns.reduce((s, r) => s + r, 0) / n;
  const annualizedReturn = meanPortfolio * 252;

  return (annualizedReturn - riskFreeRate) / beta;
}

/**
 * Compute beta (systematic risk) of portfolio relative to benchmark.
 */
export function computeBeta(
  portfolioReturns: readonly number[],
  benchmarkReturns: readonly number[],
): number {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n < 2) return 0;

  const meanP = portfolioReturns.slice(0, n).reduce((s, r) => s + r, 0) / n;
  const meanB = benchmarkReturns.slice(0, n).reduce((s, r) => s + r, 0) / n;

  let covariance = 0;
  let varBenchmark = 0;

  for (let i = 0; i < n; i++) {
    const dp = portfolioReturns[i]! - meanP;
    const db = benchmarkReturns[i]! - meanB;
    covariance += dp * db;
    varBenchmark += db * db;
  }

  return varBenchmark > 0 ? covariance / varBenchmark : 0;
}

/**
 * M-squared (Modigliani-Modigliani) measure.
 * Adjusts portfolio return to benchmark risk level.
 */
export function mSquared(
  portfolioReturns: readonly number[],
  benchmarkReturns: readonly number[],
  riskFreeRate = 0.04,
): number {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n < 2) return 0;

  const meanP = (portfolioReturns.slice(0, n).reduce((s, r) => s + r, 0) / n) * 252;
  const sigmaP = std(portfolioReturns.slice(0, n)) * Math.sqrt(252);
  const sigmaB = std(benchmarkReturns.slice(0, n)) * Math.sqrt(252);

  if (sigmaP === 0) return 0;
  return ((meanP - riskFreeRate) * sigmaB) / sigmaP + riskFreeRate;
}

function std(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  let variance = 0;
  for (const v of values) variance += (v - mean) ** 2;
  return Math.sqrt(variance / (n - 1));
}

/**
 * Full performance attribution summary.
 */
export function performanceAttribution(
  portfolioReturns: readonly number[],
  benchmarkReturns: readonly number[],
  riskFreeRate = 0.04,
): {
  informationRatio: number;
  trackingError: number;
  activeReturn: number;
  treynorRatio: number;
  beta: number;
  mSquared: number;
} {
  return {
    informationRatio: informationRatio(portfolioReturns, benchmarkReturns),
    trackingError: trackingError(portfolioReturns, benchmarkReturns),
    activeReturn: activeReturn(portfolioReturns, benchmarkReturns),
    treynorRatio: treynorRatio(portfolioReturns, benchmarkReturns, riskFreeRate),
    beta: computeBeta(portfolioReturns, benchmarkReturns),
    mSquared: mSquared(portfolioReturns, benchmarkReturns, riskFreeRate),
  };
}
