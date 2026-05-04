/**
 * Regime Switching (Hamilton filter) — bull/bear state detection.
 * Implements a simplified 2-state Hidden Markov Model for market regimes.
 */

export interface RegimeParams {
  readonly mu: readonly [number, number]; // means for [state0, state1]
  readonly sigma: readonly [number, number]; // volatilities for [state0, state1]
  readonly transition: readonly [[number, number], [number, number]]; // P[i→j]
}

export interface RegimeResult {
  readonly params: RegimeParams;
  readonly smoothedProbs: readonly number[]; // P(state=1 | all data) at each t
  readonly filteredProbs: readonly number[]; // P(state=1 | data up to t)
  readonly currentRegime: number; // 0 or 1
  readonly regimeLabel: readonly string[]; // "bull" or "bear" at each t
}

/**
 * Gaussian PDF.
 */
function gaussianPdf(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 0;
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/**
 * Estimate regime parameters using EM algorithm (Baum-Welch).
 * Simplified: classifies returns into 2 clusters based on sign/magnitude.
 */
export function estimateRegimeParams(returns: readonly number[], maxIter = 50): RegimeParams {
  const n = returns.length;
  if (n < 10) {
    return {
      mu: [0, 0],
      sigma: [0.01, 0.01],
      transition: [
        [0.9, 0.1],
        [0.1, 0.9],
      ],
    };
  }

  // Initialize with simple heuristic: negative returns = bear, positive = bull
  const sorted = returns.slice().sort((a, b) => a - b);
  const midpoint = Math.floor(n / 2);
  let mu0 = sorted.slice(0, midpoint).reduce((s, v) => s + v, 0) / midpoint;
  let mu1 = sorted.slice(midpoint).reduce((s, v) => s + v, 0) / (n - midpoint);
  let sigma0 =
    Math.sqrt(sorted.slice(0, midpoint).reduce((s, v) => s + (v - mu0) ** 2, 0) / midpoint) || 0.01;
  let sigma1 =
    Math.sqrt(sorted.slice(midpoint).reduce((s, v) => s + (v - mu1) ** 2, 0) / (n - midpoint)) ||
    0.01;
  let p00 = 0.9,
    p11 = 0.9;

  // EM iterations
  for (let iter = 0; iter < maxIter; iter++) {
    // E-step: compute filtered probabilities
    const gamma: number[] = []; // P(state=1 | data)
    let prob1 = 0.5;

    for (let t = 0; t < n; t++) {
      const r = returns[t]!;
      const lik0 = gaussianPdf(r, mu0, sigma0);
      const lik1 = gaussianPdf(r, mu1, sigma1);

      // Predict
      const pred0 = (1 - prob1) * p00 + prob1 * (1 - p11);
      const pred1 = (1 - prob1) * (1 - p00) + prob1 * p11;

      // Update
      const joint0 = lik0 * pred0;
      const joint1 = lik1 * pred1;
      const total = joint0 + joint1;
      prob1 = total > 0 ? joint1 / total : 0.5;
      gamma.push(prob1);
    }

    // M-step: re-estimate parameters
    let sumW0 = 0,
      sumW1 = 0;
    let sumR0 = 0,
      sumR1 = 0;
    let sumR0sq = 0,
      sumR1sq = 0;

    for (let t = 0; t < n; t++) {
      const w1 = gamma[t]!;
      const w0 = 1 - w1;
      const r = returns[t]!;
      sumW0 += w0;
      sumW1 += w1;
      sumR0 += w0 * r;
      sumR1 += w1 * r;
      sumR0sq += w0 * r * r;
      sumR1sq += w1 * r * r;
    }

    if (sumW0 > 1) {
      mu0 = sumR0 / sumW0;
      sigma0 = Math.sqrt(Math.max(0.0001, sumR0sq / sumW0 - mu0 * mu0));
    }
    if (sumW1 > 1) {
      mu1 = sumR1 / sumW1;
      sigma1 = Math.sqrt(Math.max(0.0001, sumR1sq / sumW1 - mu1 * mu1));
    }

    // Transition probabilities
    let trans00 = 0,
      trans01 = 0,
      trans10 = 0,
      trans11 = 0;
    for (let t = 1; t < n; t++) {
      const w0prev = 1 - gamma[t - 1]!;
      const w1prev = gamma[t - 1]!;
      const w0curr = 1 - gamma[t]!;
      const w1curr = gamma[t]!;
      trans00 += w0prev * w0curr;
      trans01 += w0prev * w1curr;
      trans10 += w1prev * w0curr;
      trans11 += w1prev * w1curr;
    }

    const sum0 = trans00 + trans01;
    const sum1 = trans10 + trans11;
    if (sum0 > 0) p00 = trans00 / sum0;
    if (sum1 > 0) p11 = trans11 / sum1;
  }

  // Ensure state 0 = bear (lower mean), state 1 = bull
  if (mu0 > mu1) {
    return {
      mu: [mu1, mu0],
      sigma: [sigma1, sigma0],
      transition: [
        [p11, 1 - p11],
        [1 - p00, p00],
      ],
    };
  }

  return {
    mu: [mu0, mu1],
    sigma: [sigma0, sigma1],
    transition: [
      [p00, 1 - p00],
      [1 - p11, p11],
    ],
  };
}

/**
 * Hamilton filter — forward pass computing filtered probabilities.
 */
export function hamiltonFilter(returns: readonly number[], params: RegimeParams): number[] {
  const n = returns.length;
  const probs: number[] = [];
  let prob1 = 0.5;
  const [p00, _p01] = params.transition[0];
  const [_p10, p11] = params.transition[1];

  for (let t = 0; t < n; t++) {
    const r = returns[t]!;
    const lik0 = gaussianPdf(r, params.mu[0], params.sigma[0]);
    const lik1 = gaussianPdf(r, params.mu[1], params.sigma[1]);

    const pred0 = (1 - prob1) * p00 + prob1 * (1 - p11);
    const pred1 = (1 - prob1) * (1 - p00) + prob1 * p11;

    const joint0 = lik0 * pred0;
    const joint1 = lik1 * pred1;
    const total = joint0 + joint1;
    prob1 = total > 0 ? joint1 / total : 0.5;
    probs.push(prob1);
  }

  return probs;
}

/**
 * Kim smoother — backward pass for smoothed probabilities.
 */
export function kimSmoother(filteredProbs: readonly number[], params: RegimeParams): number[] {
  const n = filteredProbs.length;
  if (n === 0) return [];

  const [p00] = params.transition[0];
  const [, p11] = params.transition[1];
  const smoothed = new Array<number>(n);
  smoothed[n - 1] = filteredProbs[n - 1]!;

  for (let t = n - 2; t >= 0; t--) {
    const filt1 = filteredProbs[t]!;
    const filt0 = 1 - filt1;
    const smooth1next = smoothed[t + 1]!;

    // P(s_t=1|all) ≈ adjusted by future smoothed probs
    const pred1 = filt0 * (1 - p00) + filt1 * p11;
    const pred0 = filt0 * p00 + filt1 * (1 - p11);

    const adj1 =
      pred1 > 0
        ? ((filt1 * p11) / pred1) * smooth1next +
          ((filt1 * (1 - p11)) / (pred0 || 1)) * (1 - smooth1next)
        : filt1;
    smoothed[t] = Math.max(0, Math.min(1, adj1));
  }

  return smoothed;
}

/**
 * Full regime switching analysis.
 */
export function regimeSwitching(returns: readonly number[]): RegimeResult {
  const params = estimateRegimeParams(returns);
  const filteredProbs = hamiltonFilter(returns, params);
  const smoothedProbs = kimSmoother(filteredProbs, params);
  const currentRegime = filteredProbs[filteredProbs.length - 1]! > 0.5 ? 1 : 0;
  const regimeLabel = smoothedProbs.map((p) => (p > 0.5 ? "bull" : "bear"));

  return { params, smoothedProbs, filteredProbs, currentRegime, regimeLabel };
}
