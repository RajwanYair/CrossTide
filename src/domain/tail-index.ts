/**
 * Tail index estimation (Extreme Value Theory) — Hill estimator, peaks-over-threshold.
 * Quantifies tail heaviness for risk management.
 */

export interface TailIndexResult {
  readonly hillEstimator: number; // ξ (shape parameter), >0 = heavy tail
  readonly tailIndex: number; // α = 1/ξ (tail exponent)
  readonly threshold: number; // u (threshold used)
  readonly nExceedances: number;
  readonly expectedShortfall: number; // ES at given quantile
}

export interface PeaksOverThreshold {
  readonly threshold: number;
  readonly exceedances: readonly number[];
  readonly shape: number; // ξ (GPD shape)
  readonly scale: number; // σ (GPD scale)
  readonly meanExcess: number;
}

/**
 * Hill estimator for the tail index.
 *
 * ξ_Hill = (1/k) Σᵢ₌₁ᵏ ln(X_{(n-i+1)} / X_{(n-k)})
 *
 * where X_{(i)} are order statistics and k is the number of upper order statistics used.
 *
 * @param data - Sample data (losses or absolute returns)
 * @param k - Number of upper order statistics (defaults to √n)
 */
export function hillEstimator(data: readonly number[], k?: number): TailIndexResult {
  const n = data.length;
  if (n < 10) return emptyResult();

  const sorted = [...data].sort((a, b) => b - a); // descending
  const numK = k ?? Math.max(5, Math.floor(Math.sqrt(n)));
  const kActual = Math.min(numK, n - 1);

  if (kActual < 2) return emptyResult();

  const threshold = sorted[kActual]!; // X_{(n-k)}
  if (threshold <= 0) return emptyResult();

  // Hill estimator: (1/k) Σ ln(X_{(i)} / threshold) for i=1..k
  let sumLog = 0;
  for (let i = 0; i < kActual; i++) {
    if (sorted[i]! > 0) sumLog += Math.log(sorted[i]! / threshold);
  }

  const xi = sumLog / kActual; // shape parameter
  const tailIndex = xi > 0 ? 1 / xi : Infinity;

  // Expected shortfall (for heavy tail, α > 1)
  const es =
    tailIndex > 1
      ? ((threshold * tailIndex) / (tailIndex - 1)) * Math.pow(n / kActual, xi)
      : Infinity;

  return {
    hillEstimator: xi,
    tailIndex,
    threshold,
    nExceedances: kActual,
    expectedShortfall: es,
  };
}

/**
 * Peaks-over-threshold method with Generalized Pareto Distribution (GPD) fit.
 *
 * For exceedances y = x - u, fit GPD: F(y) = 1 - (1 + ξy/σ)^{-1/ξ}
 *
 * @param data - Sample data
 * @param quantile - Threshold quantile (default 0.9)
 */
export function peaksOverThreshold(data: readonly number[], quantile = 0.9): PeaksOverThreshold {
  const n = data.length;
  if (n < 10) return { threshold: 0, exceedances: [], shape: 0, scale: 1, meanExcess: 0 };

  const sorted = [...data].sort((a, b) => a - b);
  const threshIdx = Math.floor(n * quantile);
  const threshold = sorted[threshIdx]!;

  const exceedances = data.filter((x) => x > threshold).map((x) => x - threshold);
  const nu = exceedances.length;

  if (nu < 3) return { threshold, exceedances, shape: 0, scale: 1, meanExcess: 0 };

  const meanExcess = exceedances.reduce((s, e) => s + e, 0) / nu;

  // Method of moments for GPD: ξ = 0.5*(mean²/var - 1), σ = mean*(1-ξ)/2 ... actually
  // PWM estimator for GPD:
  const sortedExc = [...exceedances].sort((a, b) => a - b);
  const m0 = sortedExc.reduce((s, e) => s + e, 0) / nu;
  let m1 = 0;
  for (let i = 0; i < nu; i++) {
    m1 += sortedExc[i]! * (i / (nu - 1));
  }
  m1 /= nu;

  // PWM estimates: ξ = 2 - m0/(m0 - 2m1), σ = 2m0m1/(m0 - 2m1)
  const denom = m0 - 2 * m1;
  let shape: number;
  let scale: number;

  if (Math.abs(denom) < 1e-12) {
    shape = 0;
    scale = m0;
  } else {
    shape = 2 - m0 / denom;
    scale = (2 * m0 * m1) / denom;
  }

  // Constrain shape to reasonable range
  shape = Math.max(-0.5, Math.min(2, shape));
  scale = Math.max(1e-10, scale);

  return { threshold, exceedances, shape, scale, meanExcess };
}

/**
 * Mean excess function: E[X - u | X > u] for various thresholds.
 * Linear mean excess plot indicates GPD tail.
 */
export function meanExcessFunction(
  data: readonly number[],
  nPoints = 50,
): readonly { threshold: number; meanExcess: number }[] {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const results: { threshold: number; meanExcess: number }[] = [];

  for (let i = 0; i < nPoints; i++) {
    const idx = Math.floor((i / nPoints) * n * 0.95);
    const u = sorted[idx]!;
    const exceedances = data.filter((x) => x > u);
    if (exceedances.length < 3) break;
    const me = exceedances.reduce((s, x) => s + (x - u), 0) / exceedances.length;
    results.push({ threshold: u, meanExcess: me });
  }

  return results;
}

/**
 * VaR and ES estimation using GPD tail model.
 *
 * VaR_p = u + (σ/ξ) * ((n/Nu * (1-p))^{-ξ} - 1)
 * ES_p = VaR_p / (1-ξ) + (σ - ξu) / (1-ξ)
 */
export function gpdRiskMeasures(
  pot: PeaksOverThreshold,
  n: number,
  probability = 0.99,
): { var: number; es: number } {
  const { threshold, exceedances, shape, scale } = pot;
  const nu = exceedances.length;

  if (nu === 0 || n === 0) return { var: 0, es: 0 };

  const excessProb = nu / n;

  let varP: number;
  if (Math.abs(shape) < 1e-8) {
    // Exponential case (ξ → 0)
    varP = threshold + scale * Math.log(excessProb / (1 - probability));
  } else {
    varP = threshold + (scale / shape) * (Math.pow(excessProb / (1 - probability), shape) - 1);
  }

  let esP: number;
  if (shape < 1) {
    esP = varP / (1 - shape) + (scale - shape * threshold) / (1 - shape);
  } else {
    esP = Infinity;
  }

  return { var: varP, es: esP };
}

function emptyResult(): TailIndexResult {
  return {
    hillEstimator: 0,
    tailIndex: Infinity,
    threshold: 0,
    nExceedances: 0,
    expectedShortfall: 0,
  };
}
