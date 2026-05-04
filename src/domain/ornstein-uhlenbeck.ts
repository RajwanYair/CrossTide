/**
 * Ornstein-Uhlenbeck (OU) process — mean-reversion parameter estimation.
 * Models: dX = θ(μ - X)dt + σ dW
 * Parameters: θ (speed), μ (long-run mean), σ (volatility)
 */

export interface OUParams {
  readonly theta: number; // mean-reversion speed
  readonly mu: number; // long-run mean level
  readonly sigma: number; // volatility of the process
  readonly halfLife: number; // time to revert halfway: ln(2)/θ
}

export interface OUResult {
  readonly params: OUParams;
  readonly residuals: readonly number[];
  readonly rSquared: number;
  readonly isStationary: boolean; // theta > 0 implies mean-reverting
}

/**
 * Estimate OU parameters via OLS on the discrete-time AR(1) representation:
 * X(t+1) - X(t) = a + b·X(t) + ε
 * Then: θ = -b/Δt, μ = -a/b, σ = std(ε) * √(2θ / (1 - exp(-2θΔt)))
 *
 * @param series - Time series of prices/log-prices
 * @param dt - Time step (default 1)
 */
export function estimateOU(series: readonly number[], dt = 1): OUParams {
  const n = series.length;
  if (n < 10) return { theta: 0, mu: 0, sigma: 0, halfLife: Infinity };

  // Compute differences and run OLS: ΔX = a + b*X(t)
  const diffs: number[] = [];
  const levels: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    diffs.push(series[i + 1]! - series[i]!);
    levels.push(series[i]!);
  }

  const m = diffs.length;
  let sumX = 0,
    sumY = 0,
    sumXX = 0,
    sumXY = 0;
  for (let i = 0; i < m; i++) {
    sumX += levels[i]!;
    sumY += diffs[i]!;
    sumXX += levels[i]! * levels[i]!;
    sumXY += levels[i]! * diffs[i]!;
  }

  const denom = m * sumXX - sumX * sumX;
  if (denom === 0) return { theta: 0, mu: series[0] ?? 0, sigma: 0, halfLife: Infinity };

  const b = (m * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / m;

  // Convert to continuous-time parameters
  const theta = -b / dt;
  const mu = theta > 0 ? -a / b : series.reduce((s, v) => s + v, 0) / n;

  // Estimate sigma from residuals
  let ssResid = 0;
  for (let i = 0; i < m; i++) {
    const predicted = a + b * levels[i]!;
    ssResid += (diffs[i]! - predicted) ** 2;
  }
  const residStd = Math.sqrt(ssResid / m);

  // σ_OU = residStd * sqrt(2θ / (1 - exp(-2θ·dt)))
  let sigma: number;
  if (theta > 0) {
    const factor = (2 * theta) / (1 - Math.exp(-2 * theta * dt));
    sigma = residStd * Math.sqrt(Math.max(0, factor));
  } else {
    sigma = residStd / Math.sqrt(dt);
  }

  const halfLife = theta > 0 ? Math.log(2) / theta : Infinity;

  return { theta: Math.max(0, theta), mu, sigma, halfLife };
}

/**
 * Full OU analysis with goodness-of-fit.
 */
export function ouAnalysis(series: readonly number[], dt = 1): OUResult {
  const params = estimateOU(series, dt);
  const n = series.length;

  // Compute residuals from AR(1) fit
  const residuals: number[] = [];
  const b = -params.theta * dt;
  const a = params.theta * params.mu * dt;

  let ssResid = 0;
  let ssTot = 0;
  const meanDiff = (series[n - 1]! - series[0]!) / (n - 1);

  for (let i = 0; i < n - 1; i++) {
    const diff = series[i + 1]! - series[i]!;
    const predicted = a + b * series[i]!;
    const resid = diff - predicted;
    residuals.push(resid);
    ssResid += resid ** 2;
    ssTot += (diff - meanDiff) ** 2;
  }

  const rSquared = ssTot > 0 ? 1 - ssResid / ssTot : 0;
  const isStationary = params.theta > 0;

  return { params, residuals, rSquared, isStationary };
}

/**
 * Simulate OU process forward from current value.
 */
export function simulateOU(params: OUParams, startValue: number, steps: number, dt = 1): number[] {
  const { theta, mu, sigma } = params;
  const path: number[] = [startValue];

  // Use Box-Muller for Gaussian noise (deterministic seed for reproducibility is caller's concern)
  for (let i = 1; i <= steps; i++) {
    const x = path[i - 1]!;
    const drift = theta * (mu - x) * dt;
    const diffusion = sigma * Math.sqrt(dt);
    // Expected value path (no randomness — for signal purposes)
    path.push(x + drift + diffusion * 0); // deterministic expected path
  }

  return path;
}

/**
 * Expected time to mean from current level.
 */
export function expectedTimeToMean(
  params: OUParams,
  currentValue: number,
  tolerance = 0.1,
): number {
  const { theta, mu } = params;
  if (theta <= 0) return Infinity;
  const distance = Math.abs(currentValue - mu);
  if (distance <= tolerance) return 0;
  // Time for exp(-θt) * distance = tolerance => t = -ln(tolerance/distance) / θ
  return -Math.log(tolerance / distance) / theta;
}
