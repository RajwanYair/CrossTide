/**
 * Granger causality — test whether one time series helps predict another.
 * Uses VAR(p) model and F-test for restricted vs unrestricted regression.
 */

export interface GrangerResult {
  readonly fStatistic: number;
  readonly pValue: number;
  readonly lags: number;
  readonly reject: boolean; // true → X Granger-causes Y
  readonly direction: string;
}

export interface BidirectionalGranger {
  readonly xCausesY: GrangerResult;
  readonly yCausesX: GrangerResult;
  readonly feedback: boolean; // bidirectional causality
}

/**
 * Test whether series X Granger-causes series Y at given lag order.
 *
 * H₀: Lagged X does NOT help predict Y (restricted model)
 * H₁: Lagged X DOES help predict Y (unrestricted model)
 *
 * @param y - Dependent series (potential effect)
 * @param x - Independent series (potential cause)
 * @param maxLag - Maximum lag order for VAR model
 * @param significance - Significance level for rejection (default 0.05)
 */
export function grangerCausality(
  y: readonly number[],
  x: readonly number[],
  maxLag = 5,
  significance = 0.05,
): GrangerResult {
  const n = Math.min(y.length, x.length);
  const lags = Math.min(maxLag, Math.floor(n / 5));

  if (n < lags * 3 + 5) {
    return { fStatistic: 0, pValue: 1, lags, reject: false, direction: "none" };
  }

  const T = n - lags; // effective sample size

  // Restricted model: Y_t = α + Σ β_i·Y_{t-i} + ε (only own lags)
  const ssrRestricted = fitOLS_SSR(y, y, null, lags, n);

  // Unrestricted model: Y_t = α + Σ β_i·Y_{t-i} + Σ γ_i·X_{t-i} + ε
  const ssrUnrestricted = fitOLS_SSR(y, y, x, lags, n);

  // F-test: F = [(SSR_r - SSR_u) / q] / [SSR_u / (T - 2p - 1)]
  const q = lags; // number of restrictions
  const dfDenom = T - 2 * lags - 1;

  if (dfDenom <= 0 || ssrUnrestricted <= 0) {
    return { fStatistic: 0, pValue: 1, lags, reject: false, direction: "none" };
  }

  const fStatistic = (ssrRestricted - ssrUnrestricted) / q / (ssrUnrestricted / dfDenom);
  const pValue = 1 - fCdf(Math.max(0, fStatistic), q, dfDenom);
  const reject = pValue < significance;

  return { fStatistic, pValue, lags, reject, direction: reject ? "x→y" : "none" };
}

/**
 * Test bidirectional Granger causality between two series.
 */
export function bidirectionalGranger(
  x: readonly number[],
  y: readonly number[],
  maxLag = 5,
  significance = 0.05,
): BidirectionalGranger {
  const xCausesY = grangerCausality(y, x, maxLag, significance);
  const yCausesX = grangerCausality(x, y, maxLag, significance);
  const feedback = xCausesY.reject && yCausesX.reject;

  return { xCausesY, yCausesX, feedback };
}

/**
 * Select optimal lag order using BIC (Bayesian Information Criterion).
 */
export function selectLagOrder(y: readonly number[], x: readonly number[], maxLag = 10): number {
  const n = Math.min(y.length, x.length);
  let bestBIC = Infinity;
  let bestLag = 1;

  for (let p = 1; p <= Math.min(maxLag, Math.floor(n / 5)); p++) {
    const T = n - p;
    const ssr = fitOLS_SSR(y, y, x, p, n);
    if (ssr <= 0 || T <= 2 * p + 1) continue;

    const k = 2 * p + 1; // number of parameters
    const bic = T * Math.log(ssr / T) + k * Math.log(T);

    if (bic < bestBIC) {
      bestBIC = bic;
      bestLag = p;
    }
  }

  return bestLag;
}

/**
 * Fit OLS and return sum of squared residuals.
 * Model: Y_t = c + Σ β·Y_{t-i} [+ Σ γ·X_{t-i}] + ε
 */
function fitOLS_SSR(
  y: readonly number[],
  yLags: readonly number[],
  xLags: readonly number[] | null,
  p: number,
  n: number,
): number {
  const T = n - p;
  if (T < 5) return Infinity;

  // Build matrices
  const k = xLags ? 2 * p + 1 : p + 1; // intercept + own lags [+ x lags]

  // Normal equations via accumulated XtX and XtY
  const XtX: number[][] = Array.from({ length: k }, () => new Array(k).fill(0) as number[]);
  const XtY: number[] = new Array(k).fill(0);

  for (let t = p; t < n; t++) {
    const yVal = y[t]!;
    const row: number[] = [1]; // intercept

    for (let i = 1; i <= p; i++) row.push(yLags[t - i]!);
    if (xLags) {
      for (let i = 1; i <= p; i++) row.push(xLags[t - i]!);
    }

    for (let j = 0; j < k; j++) {
      XtY[j] += row[j]! * yVal;
      for (let l = 0; l < k; l++) {
        XtX[j]![l] += row[j]! * row[l]!;
      }
    }
  }

  // Solve via Gaussian elimination
  const beta = solveSystem(XtX, XtY);
  if (!beta) return Infinity;

  // Compute SSR
  let ssr = 0;
  for (let t = p; t < n; t++) {
    const row: number[] = [1];
    for (let i = 1; i <= p; i++) row.push(yLags[t - i]!);
    if (xLags) {
      for (let i = 1; i <= p; i++) row.push(xLags[t - i]!);
    }

    let predicted = 0;
    for (let j = 0; j < k; j++) predicted += beta[j]! * row[j]!;
    const residual = y[t]! - predicted;
    ssr += residual * residual;
  }

  return ssr;
}

function solveSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i]!]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row]![col]!) > Math.abs(aug[maxRow]![col]!)) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow]!, aug[col]!];
    if (Math.abs(aug[col]![col]!) < 1e-12) return null;

    for (let row = col + 1; row < n; row++) {
      const factor = aug[row]![col]! / aug[col]![col]!;
      for (let j = col; j <= n; j++) aug[row]![j] -= factor * aug[col]![j]!;
    }
  }

  const x = new Array(n).fill(0) as number[];
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i]![n]!;
    for (let j = i + 1; j < n; j++) sum -= aug[i]![j]! * x[j]!;
    x[i] = sum / aug[i]![i]!;
  }
  return x;
}

/**
 * F-distribution CDF approximation using the regularized incomplete beta function.
 */
function fCdf(x: number, d1: number, d2: number): number {
  if (x <= 0) return 0;
  // F_CDF(x; d1, d2) = I(d1*x/(d1*x+d2); d1/2, d2/2)
  const z = (d1 * x) / (d1 * x + d2);
  return regularizedBeta(z, d1 / 2, d2 / 2);
}

/**
 * Regularized incomplete beta function I_x(a, b) via series expansion.
 */
function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use symmetry if needed for better convergence
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedBeta(1 - x, b, a);
  }

  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta - Math.log(a));

  // Continued fraction (Lentz's modified method)
  let c = 1;
  let d = 1 / (1 - ((a + b) * x) / (a + 1));
  let result = d;

  for (let m = 1; m <= 200; m++) {
    // Even step
    const numEven = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 / (1 + numEven * d);
    c = 1 + numEven / c;
    result *= d * c;

    // Odd step
    const numOdd = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 / (1 + numOdd * d);
    c = 1 + numOdd / c;
    result *= d * c;

    if (Math.abs(d * c - 1) < 1e-10) break;
  }

  return Math.min(1, Math.max(0, front * result));
}

function logGamma(x: number): number {
  if (x <= 0) return 0;
  return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * x);
}
