/**
 * VaR backtest — Kupiec POF test and Christoffersen independence/conditional coverage tests.
 * Validates whether a VaR model's violation rate is consistent with its confidence level.
 */

export interface KupiecResult {
  readonly violations: number;
  readonly expected: number;
  readonly violationRate: number;
  readonly lrStatistic: number; // likelihood ratio test statistic
  readonly pValue: number;
  readonly reject: boolean; // true → model is rejected
}

export interface ChristoffersenResult {
  readonly independenceStat: number;
  readonly independencePValue: number;
  readonly conditionalCoverageStat: number;
  readonly conditionalCoveragePValue: number;
  readonly reject: boolean;
}

export interface VarBacktestResult {
  readonly kupiec: KupiecResult;
  readonly christoffersen: ChristoffersenResult;
  readonly summary: "adequate" | "violations_too_many" | "violations_too_few" | "clustered";
}

/**
 * Kupiec (1995) Proportion-of-Failures (POF) test.
 * Tests H₀: observed violation rate = expected (α).
 *
 * LR_POF = -2 ln[(1-α)^(T-x) · α^x] + 2 ln[(1-p̂)^(T-x) · p̂^x]
 * where x = violations, T = total obs, p̂ = x/T
 *
 * @param returns - Portfolio returns
 * @param varEstimates - VaR estimates (negative values = losses)
 * @param confidence - VaR confidence level (e.g. 0.99 for 99% VaR)
 */
export function kupiecTest(
  returns: readonly number[],
  varEstimates: readonly number[],
  confidence = 0.99,
): KupiecResult {
  const n = Math.min(returns.length, varEstimates.length);
  const alpha = 1 - confidence; // expected violation rate

  let violations = 0;
  for (let i = 0; i < n; i++) {
    // Violation: return < -VaR (loss exceeds VaR)
    if (returns[i]! < varEstimates[i]!) violations++;
  }

  const expected = n * alpha;
  const violationRate = n > 0 ? violations / n : 0;

  // LR statistic
  let lrStatistic: number;
  if (violations === 0 || violations === n) {
    // Edge cases
    lrStatistic = violations === 0 ? -2 * n * Math.log(1 - alpha) : -2 * n * Math.log(alpha);
  } else {
    const pHat = violations / n;
    const logL0 = (n - violations) * Math.log(1 - alpha) + violations * Math.log(alpha);
    const logL1 = (n - violations) * Math.log(1 - pHat) + violations * Math.log(pHat);
    lrStatistic = -2 * (logL0 - logL1);
  }

  // Chi-squared p-value with 1 degree of freedom
  const pValue = 1 - chi2Cdf(lrStatistic, 1);
  const reject = pValue < 0.05;

  return { violations, expected, violationRate, lrStatistic, pValue, reject };
}

/**
 * Christoffersen (1998) independence and conditional coverage tests.
 * Tests whether violations are serially independent.
 */
export function christoffersenTest(
  returns: readonly number[],
  varEstimates: readonly number[],
  confidence = 0.99,
): ChristoffersenResult {
  const n = Math.min(returns.length, varEstimates.length);

  // Build violation indicator sequence
  const violations: number[] = [];
  for (let i = 0; i < n; i++) {
    violations.push(returns[i]! < varEstimates[i]! ? 1 : 0);
  }

  // Count transitions
  let n00 = 0,
    n01 = 0,
    n10 = 0,
    n11 = 0;
  for (let i = 1; i < n; i++) {
    if (violations[i - 1] === 0 && violations[i] === 0) n00++;
    else if (violations[i - 1] === 0 && violations[i] === 1) n01++;
    else if (violations[i - 1] === 1 && violations[i] === 0) n10++;
    else n11++;
  }

  // Independence test
  const n0 = n00 + n01;
  const n1 = n10 + n11;
  const p01 = n0 > 0 ? n01 / n0 : 0;
  const p11 = n1 > 0 ? n11 / n1 : 0;
  const pHat = (n01 + n11) / (n - 1 || 1);

  let independenceStat: number;
  if (pHat === 0 || pHat === 1 || n0 === 0 || n1 === 0) {
    independenceStat = 0;
  } else {
    const logL0 = (n00 + n10) * Math.log(1 - pHat) + (n01 + n11) * Math.log(pHat);
    let logL1 = 0;
    if (n0 > 0 && p01 > 0 && p01 < 1) logL1 += n00 * Math.log(1 - p01) + n01 * Math.log(p01);
    if (n1 > 0 && p11 > 0 && p11 < 1) logL1 += n10 * Math.log(1 - p11) + n11 * Math.log(p11);
    independenceStat = -2 * (logL0 - logL1);
  }

  const independencePValue = 1 - chi2Cdf(Math.max(0, independenceStat), 1);

  // Conditional coverage = Kupiec + Independence
  const kupiec = kupiecTest(returns, varEstimates, confidence);
  const conditionalCoverageStat = kupiec.lrStatistic + independenceStat;
  const conditionalCoveragePValue = 1 - chi2Cdf(Math.max(0, conditionalCoverageStat), 2);

  const reject = independencePValue < 0.05 || conditionalCoveragePValue < 0.05;

  return {
    independenceStat,
    independencePValue,
    conditionalCoverageStat,
    conditionalCoveragePValue,
    reject,
  };
}

/**
 * Full VaR backtest combining Kupiec and Christoffersen.
 */
export function varBacktest(
  returns: readonly number[],
  varEstimates: readonly number[],
  confidence = 0.99,
): VarBacktestResult {
  const kupiec = kupiecTest(returns, varEstimates, confidence);
  const christoffersen = christoffersenTest(returns, varEstimates, confidence);

  let summary: VarBacktestResult["summary"];
  if (christoffersen.independencePValue < 0.05) {
    summary = "clustered";
  } else if (kupiec.reject && kupiec.violationRate > 1 - confidence) {
    summary = "violations_too_many";
  } else if (kupiec.reject && kupiec.violationRate < 1 - confidence) {
    summary = "violations_too_few";
  } else {
    summary = "adequate";
  }

  return { kupiec, christoffersen, summary };
}

/**
 * Chi-squared CDF approximation (1 or 2 degrees of freedom).
 */
function chi2Cdf(x: number, df: number): number {
  if (x <= 0) return 0;
  if (df === 1) {
    // CDF of χ²(1) = 2*Φ(√x) - 1 where Φ is standard normal CDF
    return erf(Math.sqrt(x / 2));
  }
  if (df === 2) {
    return 1 - Math.exp(-x / 2);
  }
  // General approximation using Wilson-Hilferty
  const z = Math.pow(x / df, 1 / 3) - (1 - 2 / (9 * df));
  const denom = Math.sqrt(2 / (9 * df));
  return normalCdf(z / denom);
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function erf(x: number): number {
  // Abramowitz & Stegun approximation
  const sign = x >= 0 ? 1 : -1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return sign * y;
}
