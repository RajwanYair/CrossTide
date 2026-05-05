/**
 * Rolling Correlation — sliding-window Pearson correlation between two price series.
 *
 * Useful for:
 * - Monitoring diversification over time (rising correlation = less hedge value)
 * - Detecting regime changes (correlation spikes during crises)
 * - Pairs trading: tracking spread stability
 *
 * Pure function: no I/O, no DOM, no Date.now().
 */
import type { DailyCandle } from "../types/domain";

export interface RollingCorrelationPoint {
  readonly date: string;
  /** Pearson correlation coefficient for the trailing window (-1 to 1). */
  readonly correlation: number;
}

export interface RollingCorrelationOptions {
  /**
   * Window size in trading days.
   * @default 60
   */
  readonly window?: number;
}

/**
 * Compute rolling Pearson correlation between two daily return series.
 *
 * Both candle arrays must be date-aligned (same length, same dates).
 * Returns one correlation point per day starting from index = window.
 *
 * @param candlesA  First asset daily OHLCV (ascending by date).
 * @param candlesB  Second asset daily OHLCV (ascending by date).
 * @param options   Window configuration.
 * @returns Array of rolling correlation points, or null if insufficient data.
 */
export function computeRollingCorrelation(
  candlesA: readonly DailyCandle[],
  candlesB: readonly DailyCandle[],
  options?: RollingCorrelationOptions,
): RollingCorrelationPoint[] | null {
  const window = options?.window ?? 60;
  const n = Math.min(candlesA.length, candlesB.length);

  // Need window+1 bars to get 'window' daily returns
  if (n < window + 1) return null;

  // Pre-compute daily returns
  const returnsA: number[] = [];
  const returnsB: number[] = [];
  for (let i = 1; i < n; i++) {
    const prevA = candlesA[i - 1]!.close;
    const prevB = candlesB[i - 1]!.close;
    returnsA.push(prevA !== 0 ? (candlesA[i]!.close - prevA) / prevA : 0);
    returnsB.push(prevB !== 0 ? (candlesB[i]!.close - prevB) / prevB : 0);
  }

  const result: RollingCorrelationPoint[] = [];

  for (let i = window - 1; i < returnsA.length; i++) {
    const start = i - window + 1;
    const corr = pearson(returnsA, returnsB, start, window);
    result.push({
      date: candlesA[i + 1]!.date, // +1 because returns are offset by 1
      correlation: Math.round(corr * 10000) / 10000,
    });
  }

  return result;
}

/** Pearson correlation over a sub-range of two arrays. */
function pearson(a: readonly number[], b: readonly number[], start: number, len: number): number {
  let sumA = 0;
  let sumB = 0;
  let sumAB = 0;
  let sumA2 = 0;
  let sumB2 = 0;

  for (let i = start; i < start + len; i++) {
    const va = a[i]!;
    const vb = b[i]!;
    sumA += va;
    sumB += vb;
    sumAB += va * vb;
    sumA2 += va * va;
    sumB2 += vb * vb;
  }

  const numerator = len * sumAB - sumA * sumB;
  const denominator = Math.sqrt((len * sumA2 - sumA * sumA) * (len * sumB2 - sumB * sumB));

  return denominator === 0 ? 0 : numerator / denominator;
}
