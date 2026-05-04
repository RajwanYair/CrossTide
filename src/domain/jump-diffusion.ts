/**
 * Merton Jump Diffusion model — extends geometric Brownian motion with Poisson jumps.
 * Models: dS/S = (μ - λk)dt + σ dW + J dN
 * Where N is Poisson process with intensity λ, J is log-normal jump size.
 */

export interface JumpDiffusionParams {
  readonly mu: number; // drift
  readonly sigma: number; // diffusion volatility
  readonly lambda: number; // jump intensity (expected jumps per unit time)
  readonly jumpMean: number; // mean of log jump size
  readonly jumpVol: number; // volatility of log jump size
}

export interface JumpDiffusionResult {
  readonly params: JumpDiffusionParams;
  readonly totalVariance: number;
  readonly jumpContribution: number; // fraction of variance from jumps
  readonly expectedJumpsPerYear: number;
  readonly adjustedDrift: number;
}

/**
 * Estimate jump diffusion parameters from returns using method of moments.
 * Separates "normal" returns from jumps using threshold detection.
 */
export function estimateJumpDiffusion(
  returns: readonly number[],
  dt = 1 / 252,
): JumpDiffusionResult {
  const n = returns.length;
  if (n < 30) {
    const params: JumpDiffusionParams = { mu: 0, sigma: 0.01, lambda: 0, jumpMean: 0, jumpVol: 0 };
    return {
      params,
      totalVariance: 0,
      jumpContribution: 0,
      expectedJumpsPerYear: 0,
      adjustedDrift: 0,
    };
  }

  const mean = returns.reduce((s, r) => s + r, 0) / n;
  let variance = 0;
  for (const r of returns) variance += (r - mean) ** 2;
  variance /= n;
  const std = Math.sqrt(variance);

  // Identify jumps as returns > 3σ from mean
  const threshold = 3 * std;
  const normalReturns: number[] = [];
  const jumpReturns: number[] = [];

  for (const r of returns) {
    if (Math.abs(r - mean) > threshold) {
      jumpReturns.push(r);
    } else {
      normalReturns.push(r);
    }
  }

  // Diffusion parameters from non-jump returns
  const normalMean =
    normalReturns.length > 0
      ? normalReturns.reduce((s, r) => s + r, 0) / normalReturns.length
      : mean;
  let normalVar = 0;
  for (const r of normalReturns) normalVar += (r - normalMean) ** 2;
  normalVar /= Math.max(1, normalReturns.length);
  const sigma = Math.sqrt(normalVar / dt);

  // Jump parameters
  const lambda = jumpReturns.length / (n * dt);
  const jumpMean =
    jumpReturns.length > 0 ? jumpReturns.reduce((s, r) => s + r, 0) / jumpReturns.length : 0;
  let jumpVar = 0;
  for (const r of jumpReturns) jumpVar += (r - jumpMean) ** 2;
  jumpVar /= Math.max(1, jumpReturns.length);
  const jumpVol = Math.sqrt(jumpVar);

  const mu = mean / dt + lambda * jumpMean;
  const k = Math.exp(jumpMean + 0.5 * jumpVol ** 2) - 1;
  const adjustedDrift = mu - lambda * k;

  // Variance decomposition
  const totalVariance = sigma ** 2 + lambda * (jumpVol ** 2 + jumpMean ** 2);
  const jumpContribution =
    totalVariance > 0 ? (lambda * (jumpVol ** 2 + jumpMean ** 2)) / totalVariance : 0;

  const params: JumpDiffusionParams = { mu, sigma, lambda, jumpMean, jumpVol };
  return {
    params,
    totalVariance,
    jumpContribution,
    expectedJumpsPerYear: lambda,
    adjustedDrift,
  };
}

/**
 * Merton jump-diffusion call option price (series approximation).
 * Extends Black-Scholes with Poisson-weighted sum.
 */
export function mertonCallPrice(
  spot: number,
  strike: number,
  rate: number,
  timeToExpiry: number,
  params: JumpDiffusionParams,
  terms = 10,
): number {
  const { sigma, lambda, jumpMean, jumpVol } = params;
  const lambdaPrime = lambda * Math.exp(jumpMean + 0.5 * jumpVol ** 2);

  let price = 0;

  for (let k = 0; k < terms; k++) {
    const factK = factorial(k);
    const poissonWeight =
      (Math.exp(-lambdaPrime * timeToExpiry) * Math.pow(lambdaPrime * timeToExpiry, k)) / factK;

    const sigmaK = Math.sqrt(sigma ** 2 + (k * jumpVol ** 2) / timeToExpiry);
    const rateK =
      rate -
      lambda * (Math.exp(jumpMean + 0.5 * jumpVol ** 2) - 1) +
      (k * (jumpMean + 0.5 * jumpVol ** 2)) / timeToExpiry;

    price += poissonWeight * bsCall(spot, strike, rateK, timeToExpiry, sigmaK);
  }

  return price;
}

/**
 * Detect jump events in a return series.
 */
export function detectJumps(returns: readonly number[], threshold = 3): readonly number[] {
  const n = returns.length;
  if (n < 5) return [];

  const mean = returns.reduce((s, r) => s + r, 0) / n;
  let variance = 0;
  for (const r of returns) variance += (r - mean) ** 2;
  const std = Math.sqrt(variance / n);

  const jumpIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (Math.abs(returns[i]! - mean) > threshold * std) {
      jumpIndices.push(i);
    }
  }
  return jumpIndices;
}

function bsCall(S: number, K: number, r: number, T: number, sigma: number): number {
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
}

function normCDF(x: number): number {
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741;
  const a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp((-x * x) / 2);
  return 0.5 * (1 + sign * y);
}

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}
