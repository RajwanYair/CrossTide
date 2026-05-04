/**
 * Copula dependence — models joint tail dependence between assets.
 * Supports Clayton (lower tail) and Gumbel (upper tail) copulas.
 */

export interface CopulaFit {
  readonly type: "clayton" | "gumbel" | "gaussian";
  readonly theta: number; // copula parameter
  readonly lowerTailDep: number; // λ_L
  readonly upperTailDep: number; // λ_U
  readonly kendallTau: number; // implied rank correlation
}

export interface DependenceAnalysis {
  readonly bestFit: CopulaFit;
  readonly fits: readonly CopulaFit[];
  readonly empiricalTailDep: { lower: number; upper: number };
}

/**
 * Fit Clayton copula parameter via Kendall's tau inversion.
 * Clayton copula has lower tail dependence: λ_L = 2^(-1/θ).
 *
 * @param u - Uniform marginals for asset 1 (in [0,1])
 * @param v - Uniform marginals for asset 2 (in [0,1])
 */
export function fitClayton(u: readonly number[], v: readonly number[]): CopulaFit {
  const tau = kendallTau(u, v);
  // Clayton: τ = θ/(θ+2), so θ = 2τ/(1-τ)
  const theta = Math.max(0.001, (2 * tau) / (1 - tau));
  const lowerTailDep = Math.pow(2, -1 / theta);
  return {
    type: "clayton",
    theta,
    lowerTailDep,
    upperTailDep: 0,
    kendallTau: tau,
  };
}

/**
 * Fit Gumbel copula parameter via Kendall's tau inversion.
 * Gumbel copula has upper tail dependence: λ_U = 2 - 2^(1/θ).
 */
export function fitGumbel(u: readonly number[], v: readonly number[]): CopulaFit {
  const tau = kendallTau(u, v);
  // Gumbel: τ = 1 - 1/θ, so θ = 1/(1-τ)
  const theta = Math.max(1, 1 / (1 - tau));
  const upperTailDep = 2 - Math.pow(2, 1 / theta);
  return {
    type: "gumbel",
    theta,
    lowerTailDep: 0,
    upperTailDep: Math.max(0, upperTailDep),
    kendallTau: tau,
  };
}

/**
 * Fit Gaussian copula (no tail dependence).
 */
export function fitGaussian(u: readonly number[], v: readonly number[]): CopulaFit {
  const tau = kendallTau(u, v);
  // Gaussian copula: τ = (2/π)*arcsin(ρ), so ρ = sin(πτ/2)
  const rho = Math.sin((Math.PI * tau) / 2);
  return {
    type: "gaussian",
    theta: rho,
    lowerTailDep: 0,
    upperTailDep: 0,
    kendallTau: tau,
  };
}

/**
 * Full dependence analysis: fit all copulas, select best by log-likelihood.
 */
export function dependenceAnalysis(u: readonly number[], v: readonly number[]): DependenceAnalysis {
  const n = Math.min(u.length, v.length);
  if (n < 10) {
    const defaultFit: CopulaFit = {
      type: "gaussian",
      theta: 0,
      lowerTailDep: 0,
      upperTailDep: 0,
      kendallTau: 0,
    };
    return { bestFit: defaultFit, fits: [defaultFit], empiricalTailDep: { lower: 0, upper: 0 } };
  }

  const clayton = fitClayton(u, v);
  const gumbel = fitGumbel(u, v);
  const gaussian = fitGaussian(u, v);

  // Compute log-likelihoods
  const llClayton = claytonLogLik(u.slice(0, n), v.slice(0, n), clayton.theta);
  const llGumbel = gumbelLogLik(u.slice(0, n), v.slice(0, n), gumbel.theta);
  const llGaussian = gaussianLogLik(u.slice(0, n), v.slice(0, n), gaussian.theta);

  const fits = [clayton, gumbel, gaussian];
  const lls = [llClayton, llGumbel, llGaussian];
  const bestIdx = lls.indexOf(Math.max(...lls));
  const bestFit = fits[bestIdx]!;

  // Empirical tail dependence
  const empiricalTailDep = empiricalTailDependence(u.slice(0, n), v.slice(0, n));

  return { bestFit, fits, empiricalTailDep };
}

/**
 * Convert raw returns to pseudo-uniform marginals via rank transform.
 */
export function toUniform(data: readonly number[]): number[] {
  const n = data.length;
  const sorted = [...data].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const result = new Array(n) as number[];
  for (let rank = 0; rank < n; rank++) {
    result[sorted[rank]!.i] = (rank + 1) / (n + 1); // avoid 0 and 1
  }
  return result;
}

/**
 * Kendall's rank correlation (tau-b).
 */
export function kendallTau(u: readonly number[], v: readonly number[]): number {
  const n = Math.min(u.length, v.length);
  if (n < 3) return 0;

  let concordant = 0;
  let discordant = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const du = u[i]! - u[j]!;
      const dv = v[i]! - v[j]!;
      const product = du * dv;
      if (product > 0) concordant++;
      else if (product < 0) discordant++;
    }
  }

  const pairs = (n * (n - 1)) / 2;
  return pairs > 0 ? (concordant - discordant) / pairs : 0;
}

// --- Log-likelihood functions ---

function claytonLogLik(u: readonly number[], v: readonly number[], theta: number): number {
  let ll = 0;
  for (let i = 0; i < u.length; i++) {
    const ui = Math.max(0.001, Math.min(0.999, u[i]!));
    const vi = Math.max(0.001, Math.min(0.999, v[i]!));
    // Clayton density: (1+θ) * (u*v)^(-1-θ) * (u^-θ + v^-θ - 1)^(-1/θ - 2)
    const term = Math.pow(ui, -theta) + Math.pow(vi, -theta) - 1;
    if (term <= 0) continue;
    ll +=
      Math.log(1 + theta) +
      (-1 - theta) * (Math.log(ui) + Math.log(vi)) +
      (-1 / theta - 2) * Math.log(term);
  }
  return ll;
}

function gumbelLogLik(u: readonly number[], v: readonly number[], theta: number): number {
  let ll = 0;
  for (let i = 0; i < u.length; i++) {
    const ui = Math.max(0.001, Math.min(0.999, u[i]!));
    const vi = Math.max(0.001, Math.min(0.999, v[i]!));
    const lu = Math.pow(-Math.log(ui), theta);
    const lv = Math.pow(-Math.log(vi), theta);
    const A = Math.pow(lu + lv, 1 / theta);
    // Simplified log density
    ll +=
      -A +
      (theta - 1) * (Math.log(-Math.log(ui)) + Math.log(-Math.log(vi))) +
      Math.log(A + theta - 1) -
      Math.log(ui * vi) +
      (1 / theta - 2) * Math.log(lu + lv);
  }
  return ll;
}

function gaussianLogLik(u: readonly number[], v: readonly number[], rho: number): number {
  const rho2 = Math.max(-0.999, Math.min(0.999, rho));
  let ll = 0;
  const denom = 1 - rho2 * rho2;
  if (denom <= 0) return -Infinity;

  for (let i = 0; i < u.length; i++) {
    const x = normalInvCdf(Math.max(0.001, Math.min(0.999, u[i]!)));
    const y = normalInvCdf(Math.max(0.001, Math.min(0.999, v[i]!)));
    ll += -0.5 * Math.log(denom) - (rho2 * rho2 * (x * x + y * y) - 2 * rho2 * x * y) / (2 * denom);
  }
  return ll;
}

function empiricalTailDependence(
  u: readonly number[],
  v: readonly number[],
): { lower: number; upper: number } {
  const n = u.length;
  const q = 0.1; // 10th percentile for tail

  let lowerCount = 0,
    lowerDenom = 0;
  let upperCount = 0,
    upperDenom = 0;

  for (let i = 0; i < n; i++) {
    if (u[i]! <= q) {
      lowerDenom++;
      if (v[i]! <= q) lowerCount++;
    }
    if (u[i]! >= 1 - q) {
      upperDenom++;
      if (v[i]! >= 1 - q) upperCount++;
    }
  }

  return {
    lower: lowerDenom > 0 ? lowerCount / lowerDenom : 0,
    upper: upperDenom > 0 ? upperCount / upperDenom : 0,
  };
}

/**
 * Approximation of the inverse normal CDF (probit function).
 * Rational approximation (Beasley-Springer-Moro).
 */
function normalInvCdf(p: number): number {
  if (p <= 0) return -8;
  if (p >= 1) return 8;
  if (p === 0.5) return 0;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
      (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }
}
