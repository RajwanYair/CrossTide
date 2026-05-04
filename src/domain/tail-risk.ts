/**
 * Tail risk metrics — CVaR (Conditional Value at Risk) / Expected Shortfall.
 * Measures the expected loss in the worst X% of scenarios.
 */

/**
 * Value at Risk (historical simulation).
 * Returns the loss threshold at the given confidence level.
 * @param returns Array of returns (can be negative)
 * @param confidence Confidence level (e.g., 0.95 for 95% VaR)
 */
export function historicalVaR(returns: readonly number[], confidence = 0.95): number {
  if (returns.length === 0) return 0;

  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  return -sorted[Math.max(0, index)]!;
}

/**
 * Conditional Value at Risk (Expected Shortfall).
 * Average loss in the worst (1-confidence)% of cases.
 * CVaR is always >= VaR.
 */
export function cvar(returns: readonly number[], confidence = 0.95): number {
  if (returns.length === 0) return 0;

  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.floor((1 - confidence) * sorted.length);
  if (cutoff === 0) return -sorted[0]!;

  let sum = 0;
  for (let i = 0; i < cutoff; i++) {
    sum += sorted[i]!;
  }
  return -(sum / cutoff);
}

/**
 * Parametric VaR assuming normal distribution.
 * VaR = -μ + σ * z_α
 */
export function parametricVaR(returns: readonly number[], confidence = 0.95): number {
  if (returns.length === 0) return 0;

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  let variance = 0;
  for (const r of returns) variance += (r - mean) ** 2;
  const std = Math.sqrt(variance / returns.length);

  // z-scores for common confidence levels
  const zScores: Record<string, number> = {
    "0.9": 1.282,
    "0.95": 1.645,
    "0.99": 2.326,
  };
  const z = zScores[confidence.toString()] ?? 1.645;

  return -(mean - z * std);
}

/**
 * Cornish-Fisher VaR (adjusts for skewness and kurtosis).
 */
export function cornishFisherVaR(returns: readonly number[], confidence = 0.95): number {
  if (returns.length < 4) return historicalVaR(returns, confidence);

  const n = returns.length;
  const mean = returns.reduce((s, r) => s + r, 0) / n;
  let m2 = 0,
    m3 = 0,
    m4 = 0;
  for (const r of returns) {
    const d = r - mean;
    m2 += d * d;
    m3 += d * d * d;
    m4 += d * d * d * d;
  }
  m2 /= n;
  m3 /= n;
  m4 /= n;

  const std = Math.sqrt(m2);
  if (std === 0) return 0;

  const skew = m3 / std ** 3;
  const kurt = m4 / std ** 4 - 3; // excess kurtosis

  // z-score for normal
  const z = confidence === 0.99 ? 2.326 : confidence === 0.9 ? 1.282 : 1.645;

  // Cornish-Fisher adjustment
  const zCF =
    z +
    ((z * z - 1) * skew) / 6 +
    ((z ** 3 - 3 * z) * kurt) / 24 -
    ((2 * z ** 3 - 5 * z) * skew ** 2) / 36;

  return -(mean - zCF * std);
}

/**
 * Tail risk summary for a return series.
 */
export function tailRiskAnalysis(
  returns: readonly number[],
  _confidence = 0.95,
): {
  var95: number;
  cvar95: number;
  var99: number;
  cvar99: number;
  parametricVar95: number;
  cornishFisherVar95: number;
  maxLoss: number;
  tailRatio: number; // CVaR/VaR ratio (>1 means fat tails)
} {
  const var95 = historicalVaR(returns, 0.95);
  const cvar95 = cvar(returns, 0.95);
  const var99 = historicalVaR(returns, 0.99);
  const cvar99 = cvar(returns, 0.99);
  const pVar95 = parametricVaR(returns, 0.95);
  const cfVar95 = cornishFisherVaR(returns, 0.95);
  const maxLoss = returns.length > 0 ? -Math.min(...returns) : 0;
  const tailRatio = var95 > 0 ? cvar95 / var95 : 0;

  return {
    var95,
    cvar95,
    var99,
    cvar99,
    parametricVar95: pVar95,
    cornishFisherVar95: cfVar95,
    maxLoss,
    tailRatio,
  };
}
