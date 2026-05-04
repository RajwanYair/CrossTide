/**
 * Cointegration test — Engle-Granger two-step method for pairs trading.
 * Tests whether two price series share a long-run equilibrium.
 */

/**
 * Ordinary least squares regression: y = alpha + beta * x + residuals.
 */
export function ols(
  x: readonly number[],
  y: readonly number[],
): { alpha: number; beta: number; residuals: number[] } {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { alpha: 0, beta: 0, residuals: [] };

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i]!;
    sumY += y[i]!;
    sumXY += x[i]! * y[i]!;
    sumX2 += x[i]! * x[i]!;
  }

  const beta = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const alpha = (sumY - beta * sumX) / n;

  const residuals: number[] = [];
  for (let i = 0; i < n; i++) {
    residuals.push(y[i]! - alpha - beta * x[i]!);
  }

  return { alpha, beta, residuals };
}

/**
 * Augmented Dickey-Fuller test statistic on a series.
 * Tests H0: unit root (non-stationary) vs H1: stationary.
 * More negative = stronger rejection of unit root.
 */
export function adfStatistic(series: readonly number[], maxLag = 1): number {
  if (series.length < maxLag + 3) return 0;

  // First differences
  const diffs: number[] = [];
  for (let i = 1; i < series.length; i++) {
    diffs.push(series[i]! - series[i - 1]!);
  }

  // Regression: Δy_t = γ * y_{t-1} + Σ(φ_i * Δy_{t-i}) + ε
  // Simplified: regress Δy_t on y_{t-1} (no lagged differences for simplicity)
  const n = diffs.length;
  const yLag: number[] = [];
  const dy: number[] = [];

  for (let i = maxLag; i < n; i++) {
    yLag.push(series[i]!); // y_{t-1} aligned with diff[i]
    dy.push(diffs[i]!);
  }

  const reg = ols(yLag, dy);
  const gamma = reg.beta;

  // Standard error of gamma
  const residuals = reg.residuals;
  const m = residuals.length;
  if (m < 3) return 0;

  let sse = 0;
  for (const r of residuals) sse += r * r;
  const sigma2 = sse / (m - 2);

  let sumX2 = 0;
  const meanX = yLag.reduce((s, v) => s + v, 0) / yLag.length;
  for (const v of yLag) sumX2 += (v - meanX) ** 2;

  const seGamma = sumX2 > 0 ? Math.sqrt(sigma2 / sumX2) : 1;

  return seGamma > 0 ? gamma / seGamma : 0;
}

/**
 * Critical values for ADF test (approximate, no intercept).
 * At n=100: 1%=-3.51, 5%=-2.89, 10%=-2.58
 */
export const ADF_CRITICAL_VALUES = {
  "1%": -3.51,
  "5%": -2.89,
  "10%": -2.58,
} as const;

/**
 * Engle-Granger cointegration test between two price series.
 * Step 1: OLS regression to get spread (residuals)
 * Step 2: ADF test on residuals
 */
export function engleGranger(
  seriesA: readonly number[],
  seriesB: readonly number[],
): {
  beta: number;
  alpha: number;
  adfStat: number;
  pValue: string;
  isCointegrated: boolean;
  spread: readonly number[];
  halfLife: number;
} {
  const reg = ols(seriesA, seriesB);
  const adf = adfStatistic(reg.residuals);

  let pValue: string;
  let isCointegrated: boolean;
  if (adf < ADF_CRITICAL_VALUES["1%"]) {
    pValue = "<0.01";
    isCointegrated = true;
  } else if (adf < ADF_CRITICAL_VALUES["5%"]) {
    pValue = "<0.05";
    isCointegrated = true;
  } else if (adf < ADF_CRITICAL_VALUES["10%"]) {
    pValue = "<0.10";
    isCointegrated = false; // borderline
  } else {
    pValue = ">0.10";
    isCointegrated = false;
  }

  const hl = halfLife(reg.residuals);

  return {
    beta: reg.beta,
    alpha: reg.alpha,
    adfStat: adf,
    pValue,
    isCointegrated,
    spread: reg.residuals,
    halfLife: hl,
  };
}

/**
 * Estimate mean-reversion half-life of a spread using OLS on ΔS = λ * S_{t-1}.
 * Half-life = -ln(2) / λ
 */
export function halfLife(spread: readonly number[]): number {
  if (spread.length < 3) return Infinity;

  const yLag: number[] = [];
  const dy: number[] = [];
  for (let i = 1; i < spread.length; i++) {
    yLag.push(spread[i - 1]!);
    dy.push(spread[i]! - spread[i - 1]!);
  }

  const reg = ols(yLag, dy);
  const lambda = reg.beta;

  if (lambda >= 0) return Infinity; // not mean-reverting
  return -Math.LN2 / lambda;
}

/**
 * Compute z-score of current spread value.
 */
export function spreadZScore(spread: readonly number[]): number {
  if (spread.length < 2) return 0;
  const mean = spread.reduce((s, v) => s + v, 0) / spread.length;
  let variance = 0;
  for (const v of spread) variance += (v - mean) ** 2;
  const std = Math.sqrt(variance / spread.length);
  if (std === 0) return 0;
  return (spread[spread.length - 1]! - mean) / std;
}
