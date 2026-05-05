/**
 * Correlation scanner — scan multiple assets to find highest/lowest
 * correlated pairs over a given lookback window.
 *
 * Pure function: accepts price maps, returns ranked pair correlations.
 * Builds on pair-correlation.ts primitives.
 */

import { dailyReturns, pearsonCorrelation, type CorrelationPair } from "./pair-correlation.js";

/** Configuration for correlation scanning */
export interface CorrelationScanConfig {
  /** Minimum number of overlapping data points required (default: 30) */
  readonly minOverlap: number;
  /** Only return pairs above this absolute correlation threshold (default: 0) */
  readonly minAbsCorrelation: number;
}

/** A scanned pair with additional context */
export interface ScannedCorrelation extends CorrelationPair {
  /** Absolute value of correlation for sorting convenience */
  readonly absCorrelation: number;
}

/** Full scan results */
export interface CorrelationScanResult {
  readonly pairs: readonly ScannedCorrelation[];
  readonly tickerCount: number;
  readonly pairCount: number;
  readonly highestCorrelated: ScannedCorrelation | null;
  readonly lowestCorrelated: ScannedCorrelation | null;
  readonly mostNegative: ScannedCorrelation | null;
}

const DEFAULT_CONFIG: CorrelationScanConfig = {
  minOverlap: 30,
  minAbsCorrelation: 0,
};

/**
 * Scan all pairs of tickers for Pearson correlation on daily returns.
 *
 * @param priceData Map of ticker → close prices (chronological order)
 * @param config Optional scan configuration
 * @returns Scan result with all pairs ranked by absolute correlation
 */
export function scanCorrelations(
  priceData: ReadonlyMap<string, readonly number[]>,
  config: Partial<CorrelationScanConfig> = {},
): CorrelationScanResult | null {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const tickers = [...priceData.keys()];

  if (tickers.length < 2) return null;

  // Pre-compute daily returns for each ticker
  const returnsMap = new Map<string, readonly number[]>();
  for (const ticker of tickers) {
    const prices = priceData.get(ticker);
    if (!prices || prices.length < 2) continue;
    returnsMap.set(ticker, dailyReturns(prices));
  }

  const validTickers = [...returnsMap.keys()];
  if (validTickers.length < 2) return null;

  const pairs: ScannedCorrelation[] = [];

  for (let i = 0; i < validTickers.length; i++) {
    for (let j = i + 1; j < validTickers.length; j++) {
      const tickerA = validTickers[i]!;
      const tickerB = validTickers[j]!;
      const returnsA = returnsMap.get(tickerA)!;
      const returnsB = returnsMap.get(tickerB)!;

      // Align series to the shorter one (both start from the end)
      const overlap = Math.min(returnsA.length, returnsB.length);
      if (overlap < cfg.minOverlap) continue;

      const sliceA = returnsA.slice(-overlap);
      const sliceB = returnsB.slice(-overlap);

      const correlation = pearsonCorrelation(sliceA, sliceB);
      const absCorrelation = Math.abs(correlation);

      if (absCorrelation < cfg.minAbsCorrelation) continue;

      pairs.push({
        tickerA,
        tickerB,
        correlation,
        sampleSize: overlap,
        absCorrelation,
      });
    }
  }

  // Sort by absolute correlation descending
  pairs.sort((a, b) => b.absCorrelation - a.absCorrelation);

  if (pairs.length === 0) return null;

  const mostNegative = pairs.reduce<ScannedCorrelation | null>(
    (min, p) => (!min || p.correlation < min.correlation ? p : min),
    null,
  );

  return {
    pairs,
    tickerCount: validTickers.length,
    pairCount: pairs.length,
    highestCorrelated: pairs[0] ?? null,
    lowestCorrelated: pairs[pairs.length - 1] ?? null,
    mostNegative,
  };
}
