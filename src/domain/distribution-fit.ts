/**
 * Distribution fitting tests — Kolmogorov-Smirnov and Anderson-Darling.
 * Goodness-of-fit tests for empirical distributions.
 */

export interface GoodnessOfFitResult {
  readonly statistic: number;
  readonly criticalValue: number; // at α=0.05
  readonly reject: boolean; // true if distribution is rejected
  readonly testName: string;
}

/**
 * Kolmogorov-Smirnov test: tests whether sample comes from a reference CDF.
 *
 * D = max|F_n(x) - F_0(x)|
 *
 * @param sample - Observed data (will be sorted)
 * @param cdf - Reference CDF function
 */
export function kolmogorovSmirnov(
  sample: readonly number[],
  cdf: (x: number) => number,
): GoodnessOfFitResult {
  const n = sample.length;
  if (n === 0) return { statistic: 0, criticalValue: 0, reject: false, testName: "KS" };

  const sorted = [...sample].sort((a, b) => a - b);
  let dMax = 0;

  for (let i = 0; i < n; i++) {
    const empiricalAbove = (i + 1) / n;
    const empiricalBelow = i / n;
    const theoretical = cdf(sorted[i]!);
    dMax = Math.max(
      dMax,
      Math.abs(empiricalAbove - theoretical),
      Math.abs(empiricalBelow - theoretical),
    );
  }

  // Critical value at α=0.05 (Lilliefors approximation)
  const cv = 1.36 / Math.sqrt(n);

  return {
    statistic: dMax,
    criticalValue: cv,
    reject: dMax > cv,
    testName: "KS",
  };
}

/**
 * Anderson-Darling test: weighted KS statistic emphasizing tails.
 *
 * A² = -n - (1/n)Σ(2i-1)[ln(F(x_i)) + ln(1-F(x_{n+1-i}))]
 *
 * @param sample - Observed data
 * @param cdf - Reference CDF function
 */
export function andersonDarling(
  sample: readonly number[],
  cdf: (x: number) => number,
): GoodnessOfFitResult {
  const n = sample.length;
  if (n === 0) return { statistic: 0, criticalValue: 0, reject: false, testName: "AD" };

  const sorted = [...sample].sort((a, b) => a - b);
  let S = 0;

  for (let i = 0; i < n; i++) {
    const fi = clampProb(cdf(sorted[i]!));
    const fnmi = clampProb(cdf(sorted[n - 1 - i]!));
    S += (2 * (i + 1) - 1) * (Math.log(fi) + Math.log(1 - fnmi));
  }

  const A2 = -n - S / n;

  // Adjusted statistic for finite sample
  const A2star = A2 * (1 + 0.75 / n + 2.25 / (n * n));

  // Critical value at α=0.05 for normal distribution
  const cv = 0.752;

  return {
    statistic: A2star,
    criticalValue: cv,
    reject: A2star > cv,
    testName: "AD",
  };
}

/**
 * Standard normal CDF using rational approximation (Abramowitz & Stegun).
 */
export function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + (p * Math.abs(x)) / Math.SQRT2);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp((-x * x) / 2);

  return 0.5 * (1 + sign * y);
}

/**
 * Test whether sample is normally distributed.
 */
export function normalityTest(sample: readonly number[]): {
  readonly ks: GoodnessOfFitResult;
  readonly ad: GoodnessOfFitResult;
} {
  const n = sample.length;
  if (n < 3) {
    const empty: GoodnessOfFitResult = {
      statistic: 0,
      criticalValue: 0,
      reject: false,
      testName: "",
    };
    return { ks: { ...empty, testName: "KS" }, ad: { ...empty, testName: "AD" } };
  }

  const mean = sample.reduce((s, v) => s + v, 0) / n;
  const std = Math.sqrt(sample.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
  if (std <= 0) {
    return {
      ks: { statistic: 1, criticalValue: 0, reject: true, testName: "KS" },
      ad: { statistic: Infinity, criticalValue: 0, reject: true, testName: "AD" },
    };
  }

  const standardized = (x: number): number => normalCdf((x - mean) / std);

  return {
    ks: kolmogorovSmirnov(sample, standardized),
    ad: andersonDarling(sample, standardized),
  };
}

/**
 * Test whether sample follows an exponential distribution.
 */
export function exponentialTest(sample: readonly number[]): GoodnessOfFitResult {
  const n = sample.length;
  if (n < 3) return { statistic: 0, criticalValue: 0, reject: false, testName: "KS-Exp" };

  const mean = sample.reduce((s, v) => s + v, 0) / n;
  if (mean <= 0) return { statistic: 1, criticalValue: 0, reject: true, testName: "KS-Exp" };

  const lambda = 1 / mean;
  const expCdf = (x: number): number => (x < 0 ? 0 : 1 - Math.exp(-lambda * x));

  return { ...kolmogorovSmirnov(sample, expCdf), testName: "KS-Exp" };
}

function clampProb(p: number): number {
  return Math.max(1e-15, Math.min(1 - 1e-15, p));
}
