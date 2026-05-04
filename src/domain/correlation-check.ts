/**
 * Ticker correlation quick-check — compute Pearson correlation coefficient
 * between two price series without needing the full correlation matrix card.
 */

export interface CorrelationResult {
  readonly coefficient: number; // [-1, 1]
  readonly sampleSize: number;
  readonly interpretation: string;
}

/**
 * Compute the Pearson correlation coefficient between two numeric arrays.
 * Both arrays must be the same length and have at least 2 elements.
 */
export function pearsonCorrelation(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xs[i]!;
    const y = ys[i]!;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Compute percentage returns from a price series.
 */
export function computeReturns(prices: readonly number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]!;
    if (prev === 0) {
      returns.push(0);
    } else {
      returns.push((prices[i]! - prev) / prev);
    }
  }
  return returns;
}

/**
 * Interpret correlation strength.
 */
export function interpretCorrelation(r: number): string {
  const abs = Math.abs(r);
  const direction = r >= 0 ? "positive" : "negative";
  if (abs < 0.1) return "negligible";
  if (abs < 0.3) return `weak ${direction}`;
  if (abs < 0.7) return `moderate ${direction}`;
  if (abs < 0.9) return `strong ${direction}`;
  return `very strong ${direction}`;
}

/**
 * Full correlation check between two price series.
 * Computes correlation on returns (not raw prices) for stationarity.
 */
export function correlationCheck(
  pricesA: readonly number[],
  pricesB: readonly number[],
): CorrelationResult {
  const returnsA = computeReturns(pricesA);
  const returnsB = computeReturns(pricesB);
  const n = Math.min(returnsA.length, returnsB.length);
  const coefficient = pearsonCorrelation(returnsA.slice(0, n), returnsB.slice(0, n));
  return {
    coefficient,
    sampleSize: n,
    interpretation: interpretCorrelation(coefficient),
  };
}
