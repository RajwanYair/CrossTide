/**
 * ETF Constituent Drilldown domain (G18).
 *
 * Provides domain logic for drilling down from an ETF to its top holdings,
 * computing weighted contributions to daily performance, and ranking by
 * various criteria.
 *
 * ## Workflow
 * 1. Consumer fetches ETF holdings (ticker, weight, changePercent) from
 *    provider layer.
 * 2. `buildEtfDrilldown(etfTicker, holdings)` produces a `EtfDrilldownResult`.
 * 3. `topHoldingsByWeight(result, n)` / `topHoldersByContribution(result, n)`
 *    return the most significant constituents.
 *
 * ## Types
 * - `EtfHolding` — a single constituent (ticker + weight + price change).
 * - `EtfDrilldownEntry` — enriched entry with `weightedContribution`.
 * - `EtfDrilldownResult` — aggregate container with summary stats.
 *
 * @module domain/etf-drilldown
 */

// ─── types ────────────────────────────────────────────────────────────────────

/** A single ETF holding returned by the data provider. */
export interface EtfHolding {
  /** Ticker symbol, e.g. `"AAPL"`. */
  ticker: string;
  /**
   * Portfolio weight as a fraction in [0, 1].
   * e.g. `0.073` = 7.3 %.
   */
  weight: number;
  /**
   * Today's price change as a percent (e.g. `2.5` = +2.5 %).
   * May be negative or zero.
   */
  changePercent: number;
}

/** An enriched ETF holding entry with contribution analytics. */
export interface EtfDrilldownEntry {
  ticker: string;
  /** Portfolio weight [0, 1]. */
  weight: number;
  /** Daily price change, %. */
  changePercent: number;
  /**
   * Contribution to the ETF's performance:
   *   `weightedContribution = weight × changePercent`
   */
  weightedContribution: number;
  /**
   * Fraction of the ETF's total absolute contribution from this holding.
   * In [0, 1].  All entries sum to 1.
   */
  attributionShare: number;
}

/** Aggregate result produced by `buildEtfDrilldown`. */
export interface EtfDrilldownResult {
  /** ETF ticker symbol, e.g. `"QQQ"`. */
  etfTicker: string;
  /** All constituent entries, sorted by weight descending by default. */
  entries: EtfDrilldownEntry[];
  /**
   * Estimated ETF daily change, % (sum of all weighted contributions).
   */
  estimatedChangePercent: number;
  /**
   * Sum of all constituent weights.  Should be ≈ 1 for full coverage;
   * may be < 1 when partial holdings are provided.
   */
  totalWeight: number;
}

// ─── computation ─────────────────────────────────────────────────────────────

/**
 * Enrich a raw holding with `weightedContribution`.
 * `attributionShare` is filled in a second pass once the total is known.
 */
function enrichHolding(h: EtfHolding): Omit<EtfDrilldownEntry, "attributionShare"> {
  return {
    ticker: h.ticker,
    weight: h.weight,
    changePercent: h.changePercent,
    weightedContribution: h.weight * h.changePercent,
  };
}

/**
 * Build an `EtfDrilldownResult` from raw ETF holdings.
 *
 * Holdings are sorted by `weight` descending in the result.
 *
 * @param etfTicker  ETF symbol, e.g. `"SPY"`.
 * @param holdings   Raw constituent list (order does not matter).
 */
export function buildEtfDrilldown(etfTicker: string, holdings: EtfHolding[]): EtfDrilldownResult {
  if (holdings.length === 0) {
    return {
      etfTicker,
      entries: [],
      estimatedChangePercent: 0,
      totalWeight: 0,
    };
  }

  // First pass: enrich each holding
  const enriched = holdings.map(enrichHolding);

  // Aggregate
  const estimatedChangePercent = enriched.reduce((sum, e) => sum + e.weightedContribution, 0);
  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  const totalAbsContribution = enriched.reduce(
    (sum, e) => sum + Math.abs(e.weightedContribution),
    0,
  );

  // Second pass: attribution share
  const entries: EtfDrilldownEntry[] = enriched
    .map((e) => ({
      ...e,
      attributionShare:
        totalAbsContribution === 0 ? 0 : Math.abs(e.weightedContribution) / totalAbsContribution,
    }))
    .sort((a, b) => b.weight - a.weight);

  return { etfTicker, entries, estimatedChangePercent, totalWeight };
}

// ─── query helpers ────────────────────────────────────────────────────────────

/**
 * Return the top `n` holdings by portfolio weight (largest first).
 * Already sorted in `EtfDrilldownResult.entries` but this provides a
 * convenient slice API.
 */
export function topHoldingsByWeight(result: EtfDrilldownResult, n: number): EtfDrilldownEntry[] {
  return result.entries.slice(0, n);
}

/**
 * Return the top `n` holdings by absolute weighted contribution (most
 * impactful first, regardless of sign).
 */
export function topHoldersByContribution(
  result: EtfDrilldownResult,
  n: number,
): EtfDrilldownEntry[] {
  return [...result.entries]
    .sort((a, b) => Math.abs(b.weightedContribution) - Math.abs(a.weightedContribution))
    .slice(0, n);
}

/**
 * Return holdings with a positive weighted contribution, sorted by
 * contribution descending.
 */
export function positiveContributors(result: EtfDrilldownResult): EtfDrilldownEntry[] {
  return result.entries
    .filter((e) => e.weightedContribution > 0)
    .sort((a, b) => b.weightedContribution - a.weightedContribution);
}

/**
 * Return holdings with a negative weighted contribution, sorted by
 * contribution ascending (worst drag first).
 */
export function negativeContributors(result: EtfDrilldownResult): EtfDrilldownEntry[] {
  return result.entries
    .filter((e) => e.weightedContribution < 0)
    .sort((a, b) => a.weightedContribution - b.weightedContribution);
}
