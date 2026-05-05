/**
 * Brinson-Fachler Performance Attribution — decomposes portfolio
 * excess return vs benchmark into allocation, selection, and
 * interaction effects per sector/group.
 *
 * This is the standard institutional performance attribution model.
 * All inputs are weights and returns — pure math, no I/O.
 *
 * @module domain/performance-attribution
 */

export interface SectorWeight {
  /** Sector/group identifier. */
  readonly sector: string;
  /** Weight in portfolio (0–1, all must sum to 1). */
  readonly portfolioWeight: number;
  /** Weight in benchmark (0–1, all must sum to 1). */
  readonly benchmarkWeight: number;
  /** Portfolio return for this sector (decimal, e.g., 0.05 = 5%). */
  readonly portfolioReturn: number;
  /** Benchmark return for this sector (decimal). */
  readonly benchmarkReturn: number;
}

export interface AttributionEffect {
  readonly sector: string;
  /** Allocation effect: over/underweight × (sector benchmark return − total benchmark return). */
  readonly allocation: number;
  /** Selection effect: benchmark weight × (portfolio sector return − benchmark sector return). */
  readonly selection: number;
  /** Interaction effect: (portfolio weight − benchmark weight) × (portfolio return − benchmark return). */
  readonly interaction: number;
  /** Total effect = allocation + selection + interaction. */
  readonly total: number;
}

export interface AttributionResult {
  readonly effects: readonly AttributionEffect[];
  /** Total portfolio return (weighted sum). */
  readonly portfolioReturn: number;
  /** Total benchmark return (weighted sum). */
  readonly benchmarkReturn: number;
  /** Excess return = portfolio − benchmark. */
  readonly excessReturn: number;
  /** Sum of all allocation effects. */
  readonly totalAllocation: number;
  /** Sum of all selection effects. */
  readonly totalSelection: number;
  /** Sum of all interaction effects. */
  readonly totalInteraction: number;
}

/**
 * Compute Brinson-Fachler performance attribution.
 *
 * @param sectors - Array of sector weights and returns for portfolio and benchmark.
 * @returns Attribution result with per-sector effects, or null if inputs are invalid.
 *
 * Requirements:
 * - At least 1 sector
 * - Portfolio weights must sum to ~1 (tolerance ±0.01)
 * - Benchmark weights must sum to ~1 (tolerance ±0.01)
 * - All weights must be non-negative
 */
export function computeAttribution(sectors: readonly SectorWeight[]): AttributionResult | null {
  if (sectors.length === 0) return null;

  const pWeightSum = sectors.reduce((s, sec) => s + sec.portfolioWeight, 0);
  const bWeightSum = sectors.reduce((s, sec) => s + sec.benchmarkWeight, 0);

  if (Math.abs(pWeightSum - 1) > 0.01) return null;
  if (Math.abs(bWeightSum - 1) > 0.01) return null;

  for (const sec of sectors) {
    if (sec.portfolioWeight < 0 || sec.benchmarkWeight < 0) return null;
  }

  // Total benchmark return
  const totalBenchmarkReturn = sectors.reduce(
    (s, sec) => s + sec.benchmarkWeight * sec.benchmarkReturn,
    0,
  );

  // Total portfolio return
  const totalPortfolioReturn = sectors.reduce(
    (s, sec) => s + sec.portfolioWeight * sec.portfolioReturn,
    0,
  );

  const effects: AttributionEffect[] = sectors.map((sec) => {
    const allocation =
      (sec.portfolioWeight - sec.benchmarkWeight) * (sec.benchmarkReturn - totalBenchmarkReturn);

    const selection = sec.benchmarkWeight * (sec.portfolioReturn - sec.benchmarkReturn);

    const interaction =
      (sec.portfolioWeight - sec.benchmarkWeight) * (sec.portfolioReturn - sec.benchmarkReturn);

    return {
      sector: sec.sector,
      allocation: round8(allocation),
      selection: round8(selection),
      interaction: round8(interaction),
      total: round8(allocation + selection + interaction),
    };
  });

  return {
    effects,
    portfolioReturn: round8(totalPortfolioReturn),
    benchmarkReturn: round8(totalBenchmarkReturn),
    excessReturn: round8(totalPortfolioReturn - totalBenchmarkReturn),
    totalAllocation: round8(effects.reduce((s, e) => s + e.allocation, 0)),
    totalSelection: round8(effects.reduce((s, e) => s + e.selection, 0)),
    totalInteraction: round8(effects.reduce((s, e) => s + e.interaction, 0)),
  };
}

function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}
