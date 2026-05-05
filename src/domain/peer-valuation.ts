/**
 * Peer Valuation — compares a target company's valuation metrics
 * against a set of peer companies, computing relative rankings,
 * z-scores, and sector medians.
 *
 * All inputs are pre-fetched fundamental data — pure math, no I/O.
 *
 * @module domain/peer-valuation
 */

export interface CompanyMetrics {
  readonly symbol: string;
  readonly pe: number | null; // Price/Earnings
  readonly ps: number | null; // Price/Sales
  readonly pb: number | null; // Price/Book
  readonly evEbitda: number | null; // EV/EBITDA
  readonly peg: number | null; // PEG ratio
  readonly dividendYield: number | null; // Dividend yield (decimal)
  readonly marketCap: number | null; // Market cap in USD
}

export interface PeerMetricComparison {
  readonly metric: string;
  readonly targetValue: number | null;
  readonly peerMedian: number | null;
  readonly peerMean: number | null;
  /** Percentile rank (0–100) of target among peers. Lower = cheaper for valuation ratios. */
  readonly percentileRank: number | null;
  /** Z-score: how many std devs from peer mean. */
  readonly zScore: number | null;
  /** Whether target appears undervalued relative to peers for this metric. */
  readonly undervalued: boolean;
}

export interface PeerValuationResult {
  readonly target: string;
  readonly peerCount: number;
  readonly comparisons: readonly PeerMetricComparison[];
  /** Overall valuation score: 0 (expensive) to 100 (cheap) relative to peers. */
  readonly valuationScore: number;
}

/**
 * Compare a target company's valuation against peers.
 *
 * @param target - Target company metrics.
 * @param peers - Array of peer company metrics (at least 2).
 * @returns Peer valuation comparison or null if insufficient data.
 */
export function computePeerValuation(
  target: CompanyMetrics,
  peers: readonly CompanyMetrics[],
): PeerValuationResult | null {
  if (peers.length < 2) return null;

  const metricKeys: Array<{
    key: keyof CompanyMetrics;
    label: string;
    lowerIsBetter: boolean;
  }> = [
    { key: "pe", label: "P/E", lowerIsBetter: true },
    { key: "ps", label: "P/S", lowerIsBetter: true },
    { key: "pb", label: "P/B", lowerIsBetter: true },
    { key: "evEbitda", label: "EV/EBITDA", lowerIsBetter: true },
    { key: "peg", label: "PEG", lowerIsBetter: true },
    { key: "dividendYield", label: "Dividend Yield", lowerIsBetter: false },
  ];

  const comparisons: PeerMetricComparison[] = [];
  let undervaluedCount = 0;
  let comparableMetrics = 0;

  for (const { key, label, lowerIsBetter } of metricKeys) {
    const targetVal = target[key] as number | null;
    const peerValues = peers
      .map((p) => p[key] as number | null)
      .filter((v): v is number => v !== null && isFinite(v));

    if (targetVal === null || !isFinite(targetVal) || peerValues.length < 2) {
      comparisons.push({
        metric: label,
        targetValue: targetVal,
        peerMedian: null,
        peerMean: null,
        percentileRank: null,
        zScore: null,
        undervalued: false,
      });
      continue;
    }

    const sorted = [...peerValues].sort((a, b) => a - b);
    const median = computeMedian(sorted);
    const mean = peerValues.reduce((s, v) => s + v, 0) / peerValues.length;
    const stdDev = computeStdDev(peerValues, mean);
    const zScore = stdDev > 0 ? (targetVal - mean) / stdDev : 0;

    // Percentile rank: what % of peers have a lower value
    const below = peerValues.filter((v) => v < targetVal).length;
    const percentileRank = Math.round((below / peerValues.length) * 100);

    // Undervalued: for lower-is-better metrics, target below median is good
    const undervalued = lowerIsBetter ? targetVal < median : targetVal > median;

    if (undervalued) undervaluedCount++;
    comparableMetrics++;

    comparisons.push({
      metric: label,
      targetValue: round6(targetVal),
      peerMedian: round6(median),
      peerMean: round6(mean),
      percentileRank,
      zScore: round6(zScore),
      undervalued,
    });
  }

  // Overall score: percentage of metrics where target is undervalued
  const valuationScore =
    comparableMetrics > 0 ? Math.round((undervaluedCount / comparableMetrics) * 100) : 50;

  return {
    target: target.symbol,
    peerCount: peers.length,
    comparisons,
    valuationScore,
  };
}

function computeMedian(sorted: readonly number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function computeStdDev(values: readonly number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
