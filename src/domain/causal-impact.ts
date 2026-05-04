/**
 * Causal impact analysis — simplified Bayesian structural time series.
 * Estimates the causal effect of an intervention on a time series
 * using a synthetic control approach.
 */

export interface CausalImpactResult {
  readonly preIntervention: readonly number[];
  readonly postIntervention: readonly number[];
  readonly predicted: readonly number[]; // counterfactual (what would have happened)
  readonly pointEffect: readonly number[]; // observed - predicted
  readonly cumulativeEffect: number;
  readonly averageEffect: number;
  readonly relativeEffect: number; // % change vs counterfactual
  readonly significant: boolean; // effect outside credible interval
}

export interface CausalImpactConfig {
  readonly interventionIndex: number; // where intervention occurs
  readonly confidenceLevel?: number; // default 0.95
}

/**
 * Estimate causal impact of an intervention using synthetic control.
 *
 * Approach:
 * 1. Fit a linear model on pre-intervention period using covariates
 * 2. Predict counterfactual in post-intervention period
 * 3. Compute difference (observed - predicted) as causal effect
 *
 * @param target - The time series that received intervention
 * @param covariates - Control series (not affected by intervention)
 * @param config - Intervention timing configuration
 */
export function causalImpact(
  target: readonly number[],
  covariates: readonly (readonly number[])[],
  config: CausalImpactConfig,
): CausalImpactResult {
  const { interventionIndex, confidenceLevel = 0.95 } = config;
  const n = target.length;

  if (interventionIndex <= 2 || interventionIndex >= n || covariates.length === 0) {
    return emptyResult(target, interventionIndex);
  }

  // Pre-intervention period: fit linear model y = Xβ
  const prePeriod = target.slice(0, interventionIndex);
  const preX = covariates.map((c) => c.slice(0, interventionIndex));

  // Solve for coefficients using OLS
  const beta = olsRegression(prePeriod, preX);

  // Predict counterfactual for entire series
  const predicted: number[] = new Array(n);
  for (let t = 0; t < n; t++) {
    let yHat = beta[0]!; // intercept
    for (let j = 0; j < covariates.length; j++) {
      yHat += beta[j + 1]! * (covariates[j]?.[t] ?? 0);
    }
    predicted[t] = yHat;
  }

  // Compute residuals in pre-period to estimate noise
  let ssResid = 0;
  for (let t = 0; t < interventionIndex; t++) {
    ssResid += (prePeriod[t]! - predicted[t]!) ** 2;
  }
  const sigma = Math.sqrt(ssResid / Math.max(1, interventionIndex - covariates.length - 1));

  // Post-intervention effects
  const postTarget = target.slice(interventionIndex);
  const postPredicted = predicted.slice(interventionIndex);
  const pointEffect = postTarget.map((y, i) => y - postPredicted[i]!);

  const cumulativeEffect = pointEffect.reduce((s, e) => s + e, 0);
  const averageEffect = pointEffect.length > 0 ? cumulativeEffect / pointEffect.length : 0;
  const avgPredicted = postPredicted.reduce((s, p) => s + p, 0) / Math.max(1, postPredicted.length);
  const relativeEffect = avgPredicted !== 0 ? averageEffect / Math.abs(avgPredicted) : 0;

  // Significance: z-test on average effect
  const zCrit = normalQuantile((1 + confidenceLevel) / 2);
  const seAvg = sigma / Math.sqrt(Math.max(1, pointEffect.length));
  const significant = Math.abs(averageEffect) > zCrit * seAvg;

  return {
    preIntervention: prePeriod,
    postIntervention: postTarget,
    predicted: postPredicted,
    pointEffect,
    cumulativeEffect,
    averageEffect,
    relativeEffect,
    significant,
  };
}

/**
 * Simple OLS regression: y = β₀ + β₁x₁ + β₂x₂ + ...
 * Returns [intercept, β₁, β₂, ...]
 */
function olsRegression(y: readonly number[], X: readonly (readonly number[])[]): readonly number[] {
  const n = y.length;
  const p = X.length + 1; // +1 for intercept

  // Build design matrix [1, x1, x2, ...]
  const A: number[][] = Array.from({ length: n }, (_, t) => {
    const row = [1];
    for (let j = 0; j < X.length; j++) row.push(X[j]?.[t] ?? 0);
    return row;
  });

  // Normal equations: (A'A)β = A'y
  const AtA: number[][] = Array.from({ length: p }, () => new Array(p).fill(0) as number[]);
  const Aty: number[] = new Array(p).fill(0) as number[];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      Aty[j] = (Aty[j] ?? 0) + A[i]![j]! * y[i]!;
      for (let k = 0; k < p; k++) {
        AtA[j]![k] = (AtA[j]![k] ?? 0) + A[i]![j]! * A[i]![k]!;
      }
    }
  }

  // Solve via Gaussian elimination
  return gaussianElimination(AtA, Aty);
}

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i]!]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row]![col]!) > Math.abs(aug[maxRow]![col]!)) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow]!, aug[col]!];

    const pivot = aug[col]![col]!;
    if (Math.abs(pivot) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = aug[row]![col]! / pivot;
      for (let k = col; k <= n; k++) aug[row]![k] = (aug[row]![k] ?? 0) - factor * aug[col]![k]!;
    }
  }

  // Back substitution
  const x = new Array(n).fill(0) as number[];
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i]![n]!;
    for (let j = i + 1; j < n; j++) sum -= aug[i]![j]! * x[j]!;
    const pivot = aug[i]![i]!;
    x[i] = Math.abs(pivot) > 1e-12 ? sum / pivot : 0;
  }

  return x;
}

/** Approximate normal quantile (Beasley-Springer-Moro algorithm). */
function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const t = p < 0.5 ? p : 1 - p;
  const s = Math.sqrt(-2 * Math.log(t));
  // Rational approximation
  const z =
    s -
    (2.515517 + 0.802853 * s + 0.010328 * s * s) /
      (1 + 1.432788 * s + 0.189269 * s * s + 0.001308 * s * s * s);
  return p < 0.5 ? -z : z;
}

function emptyResult(target: readonly number[], idx: number): CausalImpactResult {
  return {
    preIntervention: target.slice(0, idx),
    postIntervention: target.slice(idx),
    predicted: [],
    pointEffect: [],
    cumulativeEffect: 0,
    averageEffect: 0,
    relativeEffect: 0,
    significant: false,
  };
}
