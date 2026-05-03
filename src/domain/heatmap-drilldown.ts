/**
 * Heatmap Sector Drill-down domain helpers (G21).
 *
 * When the user clicks a sector cell in the heatmap the UI zooms into that
 * sector and shows each constituent stock as a sub-cell.
 *
 * This module is purely computational: it consumes constituent data that the
 * card has already fetched from the quote cache (no new API calls) and
 * produces the objects needed to render the drill-down view.
 */
import type { ConstituentStock } from "../cards/heatmap";

// ─── types ───────────────────────────────────────────────────────────────────

export type DrilldownSortKey = "changePercent" | "weight" | "absoluteMove";

/** A constituent stock augmented with computed drill-down fields. */
export interface DrilldownEntry {
  readonly ticker: string;
  readonly name?: string | undefined;
  /** Daily % change, e.g. 1.5 = +1.5 %. */
  readonly changePercent: number;
  /** Market-cap proxy weight in the sector (0–1). */
  readonly weight: number;
  /** |Δprice × weight| — proportional move contribution. */
  readonly absoluteMove: number;
  /** Fraction of the sector's net move attributable to this stock (0–1). */
  readonly attribution: number;
  /** Normalised cell area in the drill-down treemap (0–1). */
  readonly cellArea: number;
}

/** Full drill-down result for one sector. */
export interface DrilldownResult {
  readonly sector: string;
  /** Ordered entries (default: descending |absoluteMove|). */
  readonly entries: readonly DrilldownEntry[];
  /** Stock that contributed most to the sector move. */
  readonly topContributor: string | null;
  /** Breadcrumb segments. */
  readonly breadcrumb: readonly string[];
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute absolute move contribution for a constituent.
 *
 *   absoluteMove = |changePercent × weight|
 *
 * Weight represents the stock's share of the sector's total market cap.
 */
export function computeAbsoluteMove(changePercent: number, weight: number): number {
  return Math.abs(changePercent * weight);
}

/**
 * Build drill-down entries from a list of constituent stocks.
 *
 * - `attribution` is the stock's share of the sector's total absolute move.
 * - `cellArea` is its weight (market-cap fraction), used to size treemap cells.
 * - Entries with `weight <= 0` are skipped.
 */
export function buildDrilldownEntries(constituents: readonly ConstituentStock[]): DrilldownEntry[] {
  const valid = constituents.filter((c) => c.weight > 0);
  if (valid.length === 0) return [];

  const totalAbsMove = valid.reduce(
    (s, c) => s + computeAbsoluteMove(c.changePercent, c.weight),
    0,
  );

  return valid.map((c) => {
    const absoluteMove = computeAbsoluteMove(c.changePercent, c.weight);
    const attribution = totalAbsMove > 0 ? absoluteMove / totalAbsMove : 0;
    return {
      ticker: c.ticker,
      name: c.name,
      changePercent: c.changePercent,
      weight: c.weight,
      absoluteMove,
      attribution,
      cellArea: c.weight,
    };
  });
}

/**
 * Sort drill-down entries by the given key.
 *
 * - "changePercent": descending % change (winners first)
 * - "weight": descending market-cap proxy
 * - "absoluteMove": descending absolute move contribution (default)
 */
export function sortDrilldown(
  entries: readonly DrilldownEntry[],
  by: DrilldownSortKey = "absoluteMove",
): DrilldownEntry[] {
  return [...entries].sort((a, b) => {
    switch (by) {
      case "changePercent":
        return b.changePercent - a.changePercent;
      case "weight":
        return b.weight - a.weight;
      case "absoluteMove":
      default:
        return b.absoluteMove - a.absoluteMove;
    }
  });
}

/**
 * Build the breadcrumb for a sector drill-down.
 *
 *   ["All Sectors", "Technology"]
 */
export function buildBreadcrumb(sector: string): string[] {
  return ["All Sectors", sector];
}

/**
 * Full drill-down result for a sector.
 *
 * @param sector       Sector name.
 * @param constituents Raw constituent stocks from quote cache.
 * @param sortBy       Initial sort key (default "absoluteMove").
 */
export function buildDrilldown(
  sector: string,
  constituents: readonly ConstituentStock[],
  sortBy: DrilldownSortKey = "absoluteMove",
): DrilldownResult {
  const entries = sortDrilldown(buildDrilldownEntries(constituents), sortBy);
  const topContributor = entries[0]?.ticker ?? null;
  const breadcrumb = buildBreadcrumb(sector);
  return { sector, entries, topContributor, breadcrumb };
}

/**
 * Produce a flat attribution bar: array of (ticker, fraction) sorted by
 * attribution descending, ready to render as a stacked horizontal bar.
 */
export function computeAttributionBar(
  result: DrilldownResult,
): { ticker: string; fraction: number }[] {
  return [...result.entries]
    .sort((a, b) => b.attribution - a.attribution)
    .map((e) => ({ ticker: e.ticker, fraction: e.attribution }));
}
