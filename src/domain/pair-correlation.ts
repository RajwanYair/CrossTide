/**
 * Pair correlation calculator — compute Pearson correlation
 * between ticker return series for diversification analysis.
 */

export interface CorrelationPair {
  readonly tickerA: string;
  readonly tickerB: string;
  readonly correlation: number; // -1 to 1
  readonly sampleSize: number;
}

export interface CorrelationMatrix {
  readonly tickers: readonly string[];
  readonly matrix: readonly (readonly number[])[];
}

/**
 * Calculate daily returns from a price series.
 */
export function dailyReturns(prices: readonly number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i]! - prices[i - 1]!) / prices[i - 1]!);
  }
  return returns;
}

/**
 * Pearson correlation coefficient between two series of equal length.
 */
export function pearsonCorrelation(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;

  let sumA = 0,
    sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i]!;
    sumB += b[i]!;
  }
  const meanA = sumA / n;
  const meanB = sumB / n;

  let cov = 0,
    varA = 0,
    varB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i]! - meanA;
    const db = b[i]! - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }

  const denom = Math.sqrt(varA * varB);
  if (denom === 0) return 0;
  return cov / denom;
}

/**
 * Compute correlation between two tickers' price series.
 */
export function tickerCorrelation(
  tickerA: string,
  pricesA: readonly number[],
  tickerB: string,
  pricesB: readonly number[],
): CorrelationPair {
  const returnsA = dailyReturns(pricesA);
  const returnsB = dailyReturns(pricesB);
  const sampleSize = Math.min(returnsA.length, returnsB.length);
  const correlation = pearsonCorrelation(returnsA, returnsB);

  return { tickerA, tickerB, correlation, sampleSize };
}

/**
 * Build a full NxN correlation matrix from price data.
 */
export function buildCorrelationMatrix(
  data: ReadonlyMap<string, readonly number[]>,
): CorrelationMatrix {
  const tickers = [...data.keys()];
  const returns = new Map<string, number[]>();
  for (const [ticker, prices] of data) {
    returns.set(ticker, dailyReturns(prices));
  }

  const matrix: number[][] = [];
  for (let i = 0; i < tickers.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < tickers.length; j++) {
      if (i === j) {
        row.push(1);
      } else {
        const ra = returns.get(tickers[i]!)!;
        const rb = returns.get(tickers[j]!)!;
        row.push(pearsonCorrelation(ra, rb));
      }
    }
    matrix.push(row);
  }

  return { tickers, matrix };
}

/**
 * Find the most correlated pairs (highest absolute correlation).
 */
export function mostCorrelatedPairs(
  data: ReadonlyMap<string, readonly number[]>,
  count = 5,
): CorrelationPair[] {
  const tickers = [...data.keys()];
  const returns = new Map<string, number[]>();
  for (const [ticker, prices] of data) {
    returns.set(ticker, dailyReturns(prices));
  }

  const pairs: CorrelationPair[] = [];
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i + 1; j < tickers.length; j++) {
      const ra = returns.get(tickers[i]!)!;
      const rb = returns.get(tickers[j]!)!;
      const correlation = pearsonCorrelation(ra, rb);
      const sampleSize = Math.min(ra.length, rb.length);
      pairs.push({ tickerA: tickers[i]!, tickerB: tickers[j]!, correlation, sampleSize });
    }
  }

  return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, count);
}

/**
 * Find least correlated pairs (best for diversification).
 */
export function leastCorrelatedPairs(
  data: ReadonlyMap<string, readonly number[]>,
  count = 5,
): CorrelationPair[] {
  const tickers = [...data.keys()];
  const returns = new Map<string, number[]>();
  for (const [ticker, prices] of data) {
    returns.set(ticker, dailyReturns(prices));
  }

  const pairs: CorrelationPair[] = [];
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i + 1; j < tickers.length; j++) {
      const ra = returns.get(tickers[i]!)!;
      const rb = returns.get(tickers[j]!)!;
      const correlation = pearsonCorrelation(ra, rb);
      const sampleSize = Math.min(ra.length, rb.length);
      pairs.push({ tickerA: tickers[i]!, tickerB: tickers[j]!, correlation, sampleSize });
    }
  }

  return pairs.sort((a, b) => Math.abs(a.correlation) - Math.abs(b.correlation)).slice(0, count);
}
