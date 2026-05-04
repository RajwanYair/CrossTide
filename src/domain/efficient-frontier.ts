/**
 * Efficient frontier — Markowitz mean-variance portfolio optimization.
 * Finds optimal asset allocations that maximize return for a given risk.
 */

export interface AssetStats {
  readonly ticker: string;
  readonly expectedReturn: number; // annualized
  readonly volatility: number; // annualized std dev
}

export interface PortfolioPoint {
  readonly weights: Record<string, number>;
  readonly expectedReturn: number;
  readonly volatility: number;
  readonly sharpeRatio: number;
}

/**
 * Compute annualized return and volatility from daily returns.
 */
export function assetStatsFromReturns(ticker: string, dailyReturns: readonly number[]): AssetStats {
  if (dailyReturns.length === 0) return { ticker, expectedReturn: 0, volatility: 0 };

  const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
  let variance = 0;
  for (const r of dailyReturns) variance += (r - mean) ** 2;
  variance /= dailyReturns.length;

  return {
    ticker,
    expectedReturn: mean * 252,
    volatility: Math.sqrt(variance * 252),
  };
}

/**
 * Compute covariance matrix from daily return series.
 * Each element [i][j] is the annualized covariance between asset i and j.
 */
export function covarianceMatrix(returnSeries: readonly (readonly number[])[]): number[][] {
  const n = returnSeries.length;
  const minLen = Math.min(...returnSeries.map((s) => s.length));
  if (minLen === 0) return Array.from({ length: n }, () => Array(n).fill(0) as number[]);

  const means = returnSeries.map((s) => {
    let sum = 0;
    for (let i = 0; i < minLen; i++) sum += s[i]!;
    return sum / minLen;
  });

  const cov: number[][] = Array.from({ length: n }, () => Array(n).fill(0) as number[]);
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < minLen; k++) {
        sum += (returnSeries[i]![k]! - means[i]!) * (returnSeries[j]![k]! - means[j]!);
      }
      const c = (sum / minLen) * 252; // annualize
      cov[i]![j] = c;
      cov[j]![i] = c;
    }
  }
  return cov;
}

/**
 * Portfolio volatility given weights and covariance matrix.
 * σ_p = sqrt(w' * Σ * w)
 */
export function portfolioVolatility(
  weights: readonly number[],
  cov: readonly (readonly number[])[],
): number {
  let variance = 0;
  const n = weights.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i]! * weights[j]! * cov[i]![j]!;
    }
  }
  return Math.sqrt(Math.max(0, variance));
}

/**
 * Portfolio expected return given weights and per-asset returns.
 */
export function portfolioReturn(weights: readonly number[], returns: readonly number[]): number {
  let r = 0;
  for (let i = 0; i < weights.length; i++) {
    r += weights[i]! * returns[i]!;
  }
  return r;
}

/**
 * Generate random portfolio weights that sum to 1 (long-only).
 */
function randomWeights(n: number, seed: number): number[] {
  const raw: number[] = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    raw.push(s / 0xffffffff);
  }
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / sum);
}

/**
 * Monte Carlo efficient frontier: generate random portfolios and extract
 * the efficient frontier (highest return for each risk level).
 * @param assets Asset statistics
 * @param cov Covariance matrix
 * @param numPortfolios Number of random portfolios to simulate
 * @param riskFreeRate Annual risk-free rate (for Sharpe)
 */
export function efficientFrontier(
  assets: readonly AssetStats[],
  cov: readonly (readonly number[])[],
  numPortfolios = 5000,
  riskFreeRate = 0.04,
): {
  portfolios: PortfolioPoint[];
  maxSharpe: PortfolioPoint;
  minVariance: PortfolioPoint;
} {
  const n = assets.length;
  const returns = assets.map((a) => a.expectedReturn);
  const portfolios: PortfolioPoint[] = [];

  let maxSharpe: PortfolioPoint = {
    weights: {},
    expectedReturn: 0,
    volatility: Infinity,
    sharpeRatio: -Infinity,
  };
  let minVariance: PortfolioPoint = {
    weights: {},
    expectedReturn: 0,
    volatility: Infinity,
    sharpeRatio: -Infinity,
  };

  for (let p = 0; p < numPortfolios; p++) {
    const w = randomWeights(n, p * 31337 + 42);
    const pRet = portfolioReturn(w, returns);
    const pVol = portfolioVolatility(w, cov);
    const sharpe = pVol > 0 ? (pRet - riskFreeRate) / pVol : 0;

    const weightMap: Record<string, number> = {};
    for (let i = 0; i < n; i++) weightMap[assets[i]!.ticker] = w[i]!;

    const point: PortfolioPoint = {
      weights: weightMap,
      expectedReturn: pRet,
      volatility: pVol,
      sharpeRatio: sharpe,
    };
    portfolios.push(point);

    if (sharpe > maxSharpe.sharpeRatio) maxSharpe = point;
    if (pVol < minVariance.volatility) minVariance = point;
  }

  return { portfolios, maxSharpe, minVariance };
}
