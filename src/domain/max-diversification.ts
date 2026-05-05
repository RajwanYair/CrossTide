/**
 * Maximum Diversification Portfolio — weights that maximize the diversification ratio.
 *
 * The diversification ratio = weighted average volatility / portfolio volatility.
 * Higher = more diversification benefit. A fully concentrated portfolio has DR = 1.
 *
 * This uses iterative optimization (gradient-free) to find weights that maximize DR.
 * Unlike mean-variance (Markowitz), this doesn't require expected return estimates —
 * only the covariance structure matters.
 *
 * Pure function: no I/O, no DOM, no Date.now().
 */

export interface MaxDivResult {
  /** Optimal weights (same order as input tickers). */
  readonly weights: readonly number[];
  /** Diversification ratio of the optimal portfolio. */
  readonly diversificationRatio: number;
  /** Portfolio volatility (annualized). */
  readonly portfolioVolatility: number;
  /** Weighted average of individual volatilities. */
  readonly weightedAvgVolatility: number;
}

/**
 * Compute maximum diversification portfolio weights.
 *
 * @param returnSeries  Array of daily return series, one per asset.
 *                      All series must be the same length.
 * @param tradingDays   Trading days per year for annualization.
 * @returns MaxDivResult with optimal weights, or null if insufficient data.
 */
export function maxDiversification(
  returnSeries: readonly (readonly number[])[],
  tradingDays = 252,
): MaxDivResult | null {
  const n = returnSeries.length;
  if (n < 2) return null;

  const len = returnSeries[0]!.length;
  if (len < 10) return null;

  for (const series of returnSeries) {
    if (series.length !== len) return null;
  }

  // Compute individual volatilities (annualized)
  const vols = returnSeries.map((s) => stdDev(s) * Math.sqrt(tradingDays));

  // Compute correlation matrix
  const corrMatrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    corrMatrix.push(new Array(n).fill(0) as number[]);
    corrMatrix[i]![i] = 1;
    for (let j = 0; j < i; j++) {
      const corr = pearson(returnSeries[i]!, returnSeries[j]!);
      corrMatrix[i]![j] = corr;
      corrMatrix[j]![i] = corr;
    }
  }

  // Build covariance matrix from vols and correlations
  const covMatrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    covMatrix.push(new Array(n).fill(0) as number[]);
    for (let j = 0; j < n; j++) {
      covMatrix[i]![j] = vols[i]! * vols[j]! * corrMatrix[i]![j]!;
    }
  }

  // Start with equal weights
  let bestWeights = new Array(n).fill(1 / n) as number[];
  let bestDR = diversificationRatio(bestWeights, vols, covMatrix);

  // Iterative coordinate-descent optimization
  const iterations = 500;
  const stepSizes = [0.05, 0.02, 0.01, 0.005];

  for (const step of stepSizes) {
    for (let iter = 0; iter < iterations; iter++) {
      let improved = false;

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          // Try shifting weight from j to i
          const candidate = [...bestWeights];
          const shift = Math.min(step, candidate[j]!);
          candidate[i] = candidate[i]! + shift;
          candidate[j] = candidate[j]! - shift;

          if (candidate[j]! >= 0) {
            const dr = diversificationRatio(candidate, vols, covMatrix);
            if (dr > bestDR) {
              bestWeights = candidate;
              bestDR = dr;
              improved = true;
            }
          }

          // Try shifting weight from i to j
          const candidate2 = [...bestWeights];
          const shift2 = Math.min(step, candidate2[i]!);
          candidate2[j] = candidate2[j]! + shift2;
          candidate2[i] = candidate2[i]! - shift2;

          if (candidate2[i]! >= 0) {
            const dr2 = diversificationRatio(candidate2, vols, covMatrix);
            if (dr2 > bestDR) {
              bestWeights = candidate2;
              bestDR = dr2;
              improved = true;
            }
          }
        }
      }

      if (!improved) break;
    }
  }

  // Round weights to 4 decimal places and normalize
  const roundedWeights = bestWeights.map((w) => Math.round(w * 10000) / 10000);
  const weightSum = roundedWeights.reduce((s, w) => s + w, 0);
  const normalizedWeights = roundedWeights.map((w) => (weightSum > 0 ? w / weightSum : 1 / n));

  const portfolioVol = portfolioVolatility(normalizedWeights, covMatrix);
  const weightedVol = normalizedWeights.reduce((s, w, i) => s + w * vols[i]!, 0);

  return {
    weights: normalizedWeights.map((w) => Math.round(w * 10000) / 10000),
    diversificationRatio: Math.round(bestDR * 10000) / 10000,
    portfolioVolatility: Math.round(portfolioVol * 10000) / 10000,
    weightedAvgVolatility: Math.round(weightedVol * 10000) / 10000,
  };
}

function diversificationRatio(
  weights: readonly number[],
  vols: readonly number[],
  covMatrix: readonly (readonly number[])[],
): number {
  const weightedVol = weights.reduce((s, w, i) => s + w * vols[i]!, 0);
  const portVol = portfolioVolatility(weights, covMatrix);
  return portVol > 0 ? weightedVol / portVol : 1;
}

function portfolioVolatility(
  weights: readonly number[],
  covMatrix: readonly (readonly number[])[],
): number {
  let variance = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      variance += weights[i]! * weights[j]! * covMatrix[i]![j]!;
    }
  }
  return Math.sqrt(Math.max(0, variance));
}

function stdDev(arr: readonly number[]): number {
  const n = arr.length;
  if (n < 2) return 0;
  let sum = 0;
  for (const v of arr) sum += v;
  const mean = sum / n;
  let sumSq = 0;
  for (const v of arr) sumSq += (v - mean) * (v - mean);
  return Math.sqrt(sumSq / (n - 1));
}

function pearson(a: readonly number[], b: readonly number[]): number {
  const n = a.length;
  if (n < 2) return 0;
  let sumA = 0;
  let sumB = 0;
  let sumAB = 0;
  let sumA2 = 0;
  let sumB2 = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i]!;
    sumB += b[i]!;
    sumAB += a[i]! * b[i]!;
    sumA2 += a[i]! * a[i]!;
    sumB2 += b[i]! * b[i]!;
  }
  const denom = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  return denom === 0 ? 0 : (n * sumAB - sumA * sumB) / denom;
}
