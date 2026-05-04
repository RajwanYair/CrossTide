/**
 * Bayesian changepoint detection — identifies structural breaks in time series.
 * Uses Bayesian Online Changepoint Detection (BOCPD) algorithm.
 */

export interface Changepoint {
  readonly index: number;
  readonly probability: number;
  readonly meanBefore: number;
  readonly meanAfter: number;
  readonly direction: "up" | "down";
}

export interface ChangepointResult {
  readonly changepoints: readonly Changepoint[];
  readonly runLengthProbs: readonly number[]; // P(changepoint) at each t
  readonly segmentMeans: readonly number[];
}

/**
 * Bayesian changepoint detection using sliding-window Bayes factor.
 * Compares evidence for a mean shift at each point by computing
 * the ratio of likelihoods: split vs. no-split hypothesis.
 *
 * @param data - Time series observations
 * @param hazard - Prior probability of changepoint (affects Bayes factor threshold)
 * @param threshold - Minimum posterior probability to declare a changepoint
 */
export function bayesianChangepoints(
  data: readonly number[],
  hazard = 0.01,
  threshold = 0.5,
): ChangepointResult {
  const n = data.length;
  if (n < 5) return { changepoints: [], runLengthProbs: [], segmentMeans: [] };

  const window = Math.min(30, Math.floor(n / 4));
  const changepointProbs: number[] = new Array(n).fill(0);
  const changepoints: Changepoint[] = [];

  // Prior odds from hazard: P(change)/P(no change) = hazard/(1-hazard)
  const priorOdds = hazard / (1 - hazard);

  for (let t = window; t < n - window; t++) {
    const before = data.slice(t - window, t);
    const after = data.slice(t, t + window);

    // Bayes factor: how much more likely is data under "two segments" vs "one"?
    const bf = bayesFactor(before, after);
    const posteriorOdds = priorOdds * bf;
    const prob = posteriorOdds / (1 + posteriorOdds);
    changepointProbs[t] = prob;
  }

  // Find local maxima above threshold
  for (let t = window + 1; t < n - window - 1; t++) {
    const p = changepointProbs[t]!;
    if (p > threshold && p >= changepointProbs[t - 1]! && p >= changepointProbs[t + 1]!) {
      // Suppress if too close to a previous changepoint
      const lastCp = changepoints[changepoints.length - 1];
      if (lastCp && t - lastCp.index < window) continue;

      const meanBefore = segmentMean(data, t - window, t);
      const meanAfter = segmentMean(data, t, t + window);
      changepoints.push({
        index: t,
        probability: p,
        meanBefore,
        meanAfter,
        direction: meanAfter > meanBefore ? "up" : "down",
      });
    }
  }

  // Compute segment means
  const segmentMeans = computeSegmentMeans(data, changepoints);

  return { changepoints, runLengthProbs: changepointProbs, segmentMeans };
}

/**
 * Simple threshold-based changepoint detection (CUSUM-like).
 * Faster alternative for real-time use.
 */
export function cusumChangepoints(
  data: readonly number[],
  threshold = 2.0,
  drift = 0.5,
): readonly number[] {
  const n = data.length;
  if (n < 10) return [];

  const mean = data.reduce((s, v) => s + v, 0) / n;
  const std = Math.sqrt(variance(data));
  if (std === 0) return [];

  const normalized = data.map((v) => (v - mean) / std);
  const changepoints: number[] = [];

  let sPlus = 0;
  let sMinus = 0;

  for (let i = 0; i < n; i++) {
    sPlus = Math.max(0, sPlus + normalized[i]! - drift);
    sMinus = Math.max(0, sMinus - normalized[i]! - drift);

    if (sPlus > threshold || sMinus > threshold) {
      changepoints.push(i);
      sPlus = 0;
      sMinus = 0;
    }
  }

  return changepoints;
}

/**
 * Compute Bayes factor for a mean shift between two segments.
 * BF = P(data | two means) / P(data | one mean)
 * Uses marginal likelihood under conjugate normal model.
 */
function bayesFactor(before: readonly number[], after: readonly number[]): number {
  const combined = [...before, ...after];
  const logLikSplit = logMarginalLikelihood(before) + logMarginalLikelihood(after);
  const logLikJoint = logMarginalLikelihood(combined);
  return Math.exp(logLikSplit - logLikJoint);
}

/**
 * Log marginal likelihood under normal-inverse-gamma conjugate prior.
 */
function logMarginalLikelihood(data: readonly number[]): number {
  const n = data.length;
  if (n === 0) return 0;

  const mean = data.reduce((s, v) => s + v, 0) / n;
  let ss = 0;
  for (const v of data) ss += (v - mean) ** 2;

  // Weak prior: kappa0=0.01, alpha0=0.5, beta0=0.01
  const kappa0 = 0.01;
  const alpha0 = 0.5;
  const beta0 = 0.01;

  const kappaN = kappa0 + n;
  const alphaN = alpha0 + n / 2;
  const betaN = beta0 + 0.5 * ss + (0.5 * (kappa0 * n * (mean - 0) ** 2)) / kappaN;

  // log marginal = log Γ(αn) - log Γ(α0) + α0*log(β0) - αn*log(βn)
  //              + 0.5*log(κ0/κn) - (n/2)*log(π)
  return (
    logGamma(alphaN) -
    logGamma(alpha0) +
    alpha0 * Math.log(beta0) -
    alphaN * Math.log(betaN) +
    0.5 * Math.log(kappa0 / kappaN) -
    (n / 2) * Math.log(Math.PI)
  );
}

function logGamma(x: number): number {
  if (x <= 0) return 0;
  // Stirling's approximation
  return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * x);
}

function variance(data: readonly number[]): number {
  const n = data.length;
  if (n < 2) return 0;
  const mean = data.reduce((s, v) => s + v, 0) / n;
  let ss = 0;
  for (const v of data) ss += (v - mean) ** 2;
  return ss / n;
}

function segmentMean(data: readonly number[], start: number, end: number): number {
  const slice = data.slice(start, end);
  return slice.length > 0 ? slice.reduce((s, v) => s + v, 0) / slice.length : 0;
}

function computeSegmentMeans(
  data: readonly number[],
  changepoints: readonly Changepoint[],
): number[] {
  const n = data.length;
  const means: number[] = new Array(n);
  const breaks = [0, ...changepoints.map((cp) => cp.index), n];

  for (let seg = 0; seg < breaks.length - 1; seg++) {
    const start = breaks[seg]!;
    const end = breaks[seg + 1]!;
    const mean = segmentMean(data, start, end);
    for (let i = start; i < end; i++) means[i] = mean;
  }

  return means;
}
