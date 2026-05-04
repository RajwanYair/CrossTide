/**
 * Hurst exponent — measure whether a time series is trending,
 * mean-reverting, or random walk using Rescaled Range (R/S) analysis.
 *
 * H > 0.5 → trending (persistent)
 * H = 0.5 → random walk
 * H < 0.5 → mean-reverting (anti-persistent)
 */

export interface HurstResult {
  readonly hurst: number;
  readonly interpretation: "trending" | "random" | "mean-reverting";
  readonly confidence: "high" | "medium" | "low";
}

/**
 * Compute the Rescaled Range (R/S) for a given series.
 */
function rescaledRange(series: readonly number[]): number {
  const n = series.length;
  if (n < 2) return 0;

  const mean = series.reduce((s, v) => s + v, 0) / n;

  // Cumulative deviations from mean
  const deviations: number[] = [];
  let cumDev = 0;
  for (const v of series) {
    cumDev += v - mean;
    deviations.push(cumDev);
  }

  const range = Math.max(...deviations) - Math.min(...deviations);

  // Standard deviation
  const variance = series.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  return stdDev > 0 ? range / stdDev : 0;
}

/**
 * Compute Hurst exponent using R/S analysis with multiple sub-periods.
 */
export function hurstExponent(prices: readonly number[], minPeriod = 8): HurstResult {
  if (prices.length < minPeriod * 2) {
    return { hurst: 0.5, interpretation: "random", confidence: "low" };
  }

  // Compute returns
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i]! / prices[i - 1]!));
  }

  // Try different sub-period sizes
  const logN: number[] = [];
  const logRS: number[] = [];

  for (let size = minPeriod; size <= returns.length / 2; size = Math.floor(size * 1.5)) {
    const numChunks = Math.floor(returns.length / size);
    if (numChunks < 1) break;

    let rsSum = 0;
    let validChunks = 0;

    for (let c = 0; c < numChunks; c++) {
      const chunk = returns.slice(c * size, (c + 1) * size);
      const rs = rescaledRange(chunk);
      if (rs > 0) {
        rsSum += rs;
        validChunks++;
      }
    }

    if (validChunks > 0) {
      logN.push(Math.log(size));
      logRS.push(Math.log(rsSum / validChunks));
    }
  }

  if (logN.length < 2) {
    return { hurst: 0.5, interpretation: "random", confidence: "low" };
  }

  // Linear regression: log(R/S) = H * log(n) + c
  const hurst = linearSlope(logN, logRS);

  // Clamp to reasonable range
  const clamped = Math.max(0, Math.min(1, hurst));

  let interpretation: "trending" | "random" | "mean-reverting";
  if (clamped > 0.55) interpretation = "trending";
  else if (clamped < 0.45) interpretation = "mean-reverting";
  else interpretation = "random";

  const confidence = logN.length >= 5 ? "high" : logN.length >= 3 ? "medium" : "low";

  return { hurst: clamped, interpretation, confidence };
}

/**
 * Simple linear regression slope.
 */
function linearSlope(x: readonly number[], y: readonly number[]): number {
  const n = x.length;
  const sumX = x.reduce((s, v) => s + v, 0);
  const sumY = y.reduce((s, v) => s + v, 0);
  const sumXY = x.reduce((s, v, i) => s + v * y[i]!, 0);
  const sumX2 = x.reduce((s, v) => s + v * v, 0);

  const denom = n * sumX2 - sumX * sumX;
  return denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
}

/**
 * Quick classification of trending behavior.
 */
export function isTrending(prices: readonly number[], minPeriod = 8): boolean {
  return hurstExponent(prices, minPeriod).interpretation === "trending";
}

/**
 * Quick classification of mean-reverting behavior.
 */
export function isMeanReverting(prices: readonly number[], minPeriod = 8): boolean {
  return hurstExponent(prices, minPeriod).interpretation === "mean-reverting";
}
