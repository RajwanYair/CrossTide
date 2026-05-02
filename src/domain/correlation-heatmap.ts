/**
 * Correlation Heatmap render-data helpers (G22).
 *
 * Pure functions that transform `CorrelationResult` into display-ready
 * structures for the heatmap renderer.  No DOM dependencies — fully testable
 * in unit tests.
 */
import type { CorrelationResult } from "./correlation-matrix";

// ─────────────────────────── Types ───────────────────────────────────────────

export interface HeatmapCell {
  rowId: string;
  colId: string;
  rowIndex: number;
  colIndex: number;
  /** Pearson r value in [-1, 1] */
  r: number;
  /** Whether this is a diagonal (self-correlation) cell */
  isDiagonal: boolean;
  /** True when |r| > warnThreshold and not diagonal */
  isWarning: boolean;
  /** CSS hsl() color string derived from the r value */
  color: string;
  /** Formatted display string ("—" for diagonal, "0.72" otherwise) */
  display: string;
}

export interface HeatmapRenderData {
  ids: readonly string[];
  cells: readonly HeatmapCell[];
  /** Pairs with |r| >= warnThreshold, sorted by |r| descending */
  warningPairs: readonly { tickerA: string; tickerB: string; r: number }[];
}

// ─────────────────────────── Color mapping ───────────────────────────────────

/**
 * Map Pearson r ∈ [-1, 1] to a CSS hsl() color string.
 * Positive → red family, Negative → blue family, Zero → light grey.
 */
export function rToHslColor(r: number): string {
  const clamped = Math.max(-1, Math.min(1, r));
  if (clamped >= 0) {
    const lightness = Math.round(95 - clamped * 45);
    const saturation = Math.round(clamped * 80);
    return `hsl(0,${saturation}%,${lightness}%)`;
  } else {
    const abs = -clamped;
    const lightness = Math.round(95 - abs * 45);
    const saturation = Math.round(abs * 80);
    return `hsl(220,${saturation}%,${lightness}%)`;
  }
}

// ─────────────────────────── Builder ─────────────────────────────────────────

/**
 * Build the full flat array of `HeatmapCell` objects from a `CorrelationResult`.
 *
 * @param result        Output of `correlationMatrix()`
 * @param warnThreshold Min |r| for a non-diagonal cell to be marked as warning (default 0.85)
 */
export function buildHeatmapRenderData(
  result: CorrelationResult,
  warnThreshold = 0.85,
): HeatmapRenderData {
  const { ids, matrix } = result;
  const n = ids.length;
  const cells: HeatmapCell[] = [];
  const warningPairs: { tickerA: string; tickerB: string; r: number }[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const r = matrix[i]![j]!;
      const isDiagonal = i === j;
      const isWarning = !isDiagonal && Math.abs(r) >= warnThreshold;

      cells.push({
        rowId: ids[i]!,
        colId: ids[j]!,
        rowIndex: i,
        colIndex: j,
        r,
        isDiagonal,
        isWarning,
        color: rToHslColor(r),
        display: isDiagonal ? "—" : r.toFixed(2),
      });

      // Only record upper-triangle pairs once
      if (!isDiagonal && i < j && isWarning) {
        warningPairs.push({ tickerA: ids[i]!, tickerB: ids[j]!, r });
      }
    }
  }

  warningPairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  return { ids, cells, warningPairs };
}

/**
 * Extract a 2-D sliced view of the heatmap for a subset of ticker IDs.
 * Returns a new `CorrelationResult`-shaped object for only the requested IDs
 * (in the order provided).
 */
export function sliceCorrelationResult(
  result: CorrelationResult,
  keepIds: readonly string[],
): CorrelationResult {
  const indices = keepIds.map((id) => result.ids.indexOf(id)).filter((i) => i !== -1);
  const ids = indices.map((i) => result.ids[i]!);
  const matrix = indices.map((i) => indices.map((j) => result.matrix[i]![j]!));
  return { ids, matrix };
}
