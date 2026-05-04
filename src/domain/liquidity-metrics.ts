/**
 * Liquidity metrics — measures of market liquidity and trading costs.
 * Includes Amihud illiquidity, bid-ask spread estimators, turnover ratio.
 */

export interface LiquidityMetrics {
  readonly amihudIlliquidity: number;
  readonly rollSpread: number; // Roll (1984) effective spread
  readonly turnoverRatio: number;
  readonly volumeWeightedLiquidity: number;
  readonly kyleSlambda: number; // Kyle's lambda (price impact per unit volume)
}

/**
 * Amihud (2002) illiquidity ratio: average |return| / dollar volume.
 * Higher = less liquid.
 */
export function amihudIlliquidity(
  returns: readonly number[],
  volumes: readonly number[],
  prices: readonly number[],
): number {
  const n = Math.min(returns.length, volumes.length, prices.length);
  if (n === 0) return 0;

  let sum = 0;
  let count = 0;

  for (let i = 0; i < n; i++) {
    const dollarVol = volumes[i]! * prices[i]!;
    if (dollarVol > 0) {
      sum += Math.abs(returns[i]!) / dollarVol;
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}

/**
 * Roll (1984) effective spread estimator from serial covariance of price changes.
 * Spread = 2 * sqrt(-Cov(ΔP_t, ΔP_{t-1})) if covariance is negative.
 */
export function rollSpread(prices: readonly number[]): number {
  const n = prices.length;
  if (n < 4) return 0;

  const changes: number[] = [];
  for (let i = 1; i < n; i++) changes.push(prices[i]! - prices[i - 1]!);

  // Serial covariance of price changes
  const m = changes.length;
  let cov = 0;
  for (let i = 1; i < m; i++) {
    cov += changes[i]! * changes[i - 1]!;
  }
  cov /= m - 1;

  // Spread only meaningful if covariance is negative (bid-ask bounce)
  return cov < 0 ? 2 * Math.sqrt(-cov) : 0;
}

/**
 * Turnover ratio: total volume traded / shares outstanding.
 * Higher = more liquid.
 */
export function turnoverRatio(volumes: readonly number[], sharesOutstanding: number): number {
  if (sharesOutstanding <= 0 || volumes.length === 0) return 0;
  const totalVolume = volumes.reduce((s, v) => s + v, 0);
  return totalVolume / sharesOutstanding;
}

/**
 * Kyle's lambda — price impact coefficient.
 * Estimated as slope of regression: ΔP = λ * signed_volume + ε.
 * Uses absolute volume with return sign as proxy for order flow.
 */
export function kyleLambda(returns: readonly number[], volumes: readonly number[]): number {
  const n = Math.min(returns.length, volumes.length);
  if (n < 10) return 0;

  // Signed volume = volume * sign(return)
  const signedVol: number[] = [];
  for (let i = 0; i < n; i++) {
    signedVol.push(volumes[i]! * Math.sign(returns[i]!));
  }

  // OLS: return = λ * signedVolume
  let sumXY = 0,
    sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumXY += signedVol[i]! * returns[i]!;
    sumXX += signedVol[i]! * signedVol[i]!;
  }

  return sumXX > 0 ? sumXY / sumXX : 0;
}

/**
 * Volume-weighted average liquidity score (composite).
 * Normalizes Amihud to [0, 1] scale where 1 = most liquid.
 */
export function liquidityScore(
  returns: readonly number[],
  volumes: readonly number[],
  prices: readonly number[],
): number {
  const amihud = amihudIlliquidity(returns, volumes, prices);
  // Convert to score: high amihud = illiquid = low score
  // Use logistic transform: score = 1 / (1 + amihud * scaling)
  const scaling = 1e9; // scale for typical stock dollar volumes
  return 1 / (1 + amihud * scaling);
}

/**
 * Full liquidity analysis.
 */
export function liquidityAnalysis(
  returns: readonly number[],
  volumes: readonly number[],
  prices: readonly number[],
  sharesOutstanding = 1e8,
): LiquidityMetrics {
  return {
    amihudIlliquidity: amihudIlliquidity(returns, volumes, prices),
    rollSpread: rollSpread(prices),
    turnoverRatio: turnoverRatio(volumes, sharesOutstanding),
    volumeWeightedLiquidity: liquidityScore(returns, volumes, prices),
    kyleSlambda: kyleLambda(returns, volumes),
  };
}
