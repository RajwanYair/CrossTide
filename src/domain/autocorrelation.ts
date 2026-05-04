/**
 * Autocorrelation — serial correlation analysis for price returns.
 * Detects momentum, mean reversion, and market efficiency.
 */

/**
 * Compute autocorrelation at a specific lag.
 * ACF(lag) = Cov(X_t, X_{t-lag}) / Var(X_t)
 */
export function autocorrelation(series: readonly number[], lag: number): number {
  const n = series.length;
  if (n < lag + 2 || lag < 1) return 0;

  const mean = series.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    denominator += (series[i]! - mean) ** 2;
  }

  if (denominator === 0) return 0;

  for (let i = lag; i < n; i++) {
    numerator += (series[i]! - mean) * (series[i - lag]! - mean);
  }

  return numerator / denominator;
}

/**
 * Compute autocorrelation function for lags 1..maxLag.
 */
export function acf(series: readonly number[], maxLag = 20): number[] {
  const result: number[] = [];
  for (let lag = 1; lag <= maxLag; lag++) {
    result.push(autocorrelation(series, lag));
  }
  return result;
}

/**
 * Partial autocorrelation at a specific lag using Durbin-Levinson recursion.
 */
export function partialAutocorrelation(series: readonly number[], lag: number): number {
  if (lag < 1) return 0;
  if (lag === 1) return autocorrelation(series, 1);

  const acfValues: number[] = [];
  for (let k = 1; k <= lag; k++) {
    acfValues.push(autocorrelation(series, k));
  }

  // Durbin-Levinson
  let phi: number[] = [acfValues[0]!];

  for (let k = 1; k < lag; k++) {
    let num = acfValues[k]!;
    for (let j = 0; j < k; j++) {
      num -= phi[j]! * acfValues[k - 1 - j]!;
    }

    let den = 1;
    for (let j = 0; j < k; j++) {
      den -= phi[j]! * acfValues[j]!;
    }

    if (den === 0) return 0;
    const phiNew = num / den;

    // Update phi coefficients
    const newPhi = phi.map((p, j) => p - phiNew * phi[k - 1 - j]!);
    newPhi.push(phiNew);
    phi = newPhi;
  }

  return phi[phi.length - 1]!;
}

/**
 * Compute partial autocorrelation function for lags 1..maxLag.
 */
export function pacf(series: readonly number[], maxLag = 20): number[] {
  const result: number[] = [];
  for (let lag = 1; lag <= maxLag; lag++) {
    result.push(partialAutocorrelation(series, lag));
  }
  return result;
}

/**
 * Ljung-Box Q-statistic for testing serial independence.
 * H0: no autocorrelation up to lag K.
 * Higher Q → reject H0 → series has serial correlation.
 */
export function ljungBox(
  series: readonly number[],
  maxLag = 10,
): { qStat: number; significant: boolean } {
  const n = series.length;
  if (n < maxLag + 2) return { qStat: 0, significant: false };

  let q = 0;
  for (let k = 1; k <= maxLag; k++) {
    const rk = autocorrelation(series, k);
    q += (rk * rk) / (n - k);
  }
  q *= n * (n + 2);

  // Chi-squared critical value at 5% for maxLag degrees of freedom (approximate)
  // For lag=10: chi2_0.05 ≈ 18.31; lag=20: ≈ 31.41
  const critical = maxLag + 2 * Math.sqrt(2 * maxLag); // rough approximation

  return { qStat: q, significant: q > critical };
}

/**
 * Summarize autocorrelation analysis.
 */
export function autocorrelationAnalysis(
  returns: readonly number[],
  maxLag = 10,
): {
  acf: number[];
  pacf: number[];
  ljungBoxQ: number;
  isSeriallyCorrelated: boolean;
  dominantLag: number;
  interpretation: string;
} {
  const acfVals = acf(returns, maxLag);
  const pacfVals = pacf(returns, maxLag);
  const lb = ljungBox(returns, maxLag);

  // Find lag with highest absolute ACF
  let maxAbs = 0;
  let dominantLag = 1;
  for (let i = 0; i < acfVals.length; i++) {
    const abs = Math.abs(acfVals[i]!);
    if (abs > maxAbs) {
      maxAbs = abs;
      dominantLag = i + 1;
    }
  }

  const lag1 = acfVals[0] ?? 0;
  let interpretation: string;
  if (!lb.significant) {
    interpretation = "random walk (efficient market)";
  } else if (lag1 > 0.1) {
    interpretation = "momentum (positive serial correlation)";
  } else if (lag1 < -0.1) {
    interpretation = "mean reversion (negative serial correlation)";
  } else {
    interpretation = "weak serial correlation";
  }

  return {
    acf: acfVals,
    pacf: pacfVals,
    ljungBoxQ: lb.qStat,
    isSeriallyCorrelated: lb.significant,
    dominantLag,
    interpretation,
  };
}
