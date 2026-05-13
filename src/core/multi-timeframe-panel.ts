/**
 * Multi-timeframe analysis panel — R2
 *
 * Orchestrates 2–4 chart panels running at different intervals (e.g. 1h + 4h +
 * 1d + 1w). Provides:
 *
 *  1. **Visible-range sync** — when the user pans/zooms one chart, all others
 *     adjust their visible range to cover the same calendar window.
 *  2. **Crosshair sync** — delegates to `ChartSync` from `multi-chart-sync.ts`.
 *  3. **Confluence badge** — aggregates per-panel trend direction into a single
 *     "aligned / mixed / opposed" status that the UI can render.
 *
 * Usage:
 *   const group = createTimeframeGroup({
 *     ticker: "AAPL",
 *     panels: [
 *       { interval: "1h", label: "Hourly" },
 *       { interval: "1d", label: "Daily" },
 *       { interval: "1w", label: "Weekly" },
 *     ],
 *   });
 *
 *   group.onRangeChange("1d", { from: t0, to: t1 });
 *   group.dispose();
 */

import {
  createChartSync,
  snapToTimeframe,
  type ChartSync,
  type SyncTimeframe,
} from "./multi-chart-sync.js";

// ── Types ────────────────────────────────────────────────────────────────────

/** A calendar time range in Unix seconds. */
export interface TimeRange {
  readonly from: number;
  readonly to: number;
}

/** Configuration for one chart panel. */
export interface PanelConfig {
  readonly interval: SyncTimeframe;
  readonly label: string;
}

/** Options for creating a timeframe group. */
export interface TimeframeGroupConfig {
  readonly ticker: string;
  readonly panels: readonly PanelConfig[];
  /** Maximum number of panels. @default 4 */
  readonly maxPanels?: number;
}

/** Trend direction per panel (mirrors domain/multi-timeframe values). */
export type TrendDirection = "up" | "down" | "neutral";

/** Per-panel trend snapshot. */
export interface PanelTrend {
  readonly interval: SyncTimeframe;
  readonly direction: TrendDirection;
}

/** Confluence status across all panels. */
export type ConfluenceStatus = "aligned" | "mixed" | "opposed";

/** Aggregate confluence result. */
export interface ConfluenceResult {
  readonly status: ConfluenceStatus;
  readonly trends: readonly PanelTrend[];
  readonly dominantDirection: TrendDirection;
}

/** Callback when visible range should change on a panel. */
export type RangeChangeHandler = (interval: SyncTimeframe, range: TimeRange) => void;

/** The orchestration controller. */
export interface TimeframeGroup {
  /** The underlying crosshair sync bus. */
  readonly sync: ChartSync;
  /** Currently active panels. */
  readonly panels: readonly PanelConfig[];

  /**
   * Notify the group that one panel's visible range changed.
   * Computes equivalent ranges for other panels and invokes `onRangeSync`.
   */
  onRangeChange(source: SyncTimeframe, range: TimeRange): void;

  /**
   * Register a callback invoked when a panel's visible range should update
   * due to another panel's range change.
   */
  onRangeSync(handler: RangeChangeHandler): () => void;

  /**
   * Update trend directions from each panel. Returns confluence result.
   */
  updateTrends(trends: readonly PanelTrend[]): ConfluenceResult;

  /** Dispose the group and all sync resources. */
  dispose(): void;
}

// ── Interval helpers ─────────────────────────────────────────────────────────

/** Interval durations in seconds (matches multi-chart-sync). */
const INTERVAL_SECONDS: Readonly<Record<string, number>> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
  "1w": 604800,
  "1mo": 2_592_000,
};

/**
 * Map a visible time range from one interval to another.
 * Keeps the same calendar window but snaps boundaries to target bar boundaries.
 */
export function mapRange(range: TimeRange, targetInterval: SyncTimeframe): TimeRange {
  const from = snapToTimeframe(range.from, targetInterval);
  const to = snapToTimeframe(range.to, targetInterval);
  return { from, to };
}

/**
 * Estimate the number of bars visible in a range for a given interval.
 */
export function estimateBars(range: TimeRange, interval: SyncTimeframe): number {
  const seconds = INTERVAL_SECONDS[interval];
  if (!seconds || seconds === 0) return 0;
  return Math.max(1, Math.ceil((range.to - range.from) / seconds));
}

// ── Confluence ───────────────────────────────────────────────────────────────

/**
 * Compute confluence from per-panel trend directions.
 */
export function computeConfluence(trends: readonly PanelTrend[]): ConfluenceResult {
  if (trends.length === 0) {
    return { status: "mixed", trends, dominantDirection: "neutral" };
  }

  const counts = { up: 0, down: 0, neutral: 0 };
  for (const t of trends) counts[t.direction]++;

  let dominantDirection: TrendDirection;
  if (counts.up > counts.down && counts.up >= counts.neutral) dominantDirection = "up";
  else if (counts.down > counts.up && counts.down >= counts.neutral) dominantDirection = "down";
  else dominantDirection = "neutral";

  const nonNeutral = trends.filter((t) => t.direction !== "neutral");
  let status: ConfluenceStatus;

  if (nonNeutral.length === 0) {
    status = "mixed";
  } else if (nonNeutral.every((t) => t.direction === nonNeutral[0]!.direction)) {
    status = "aligned";
  } else if (counts.up > 0 && counts.down > 0) {
    status = "opposed";
  } else {
    status = "mixed";
  }

  return { status, trends, dominantDirection };
}

// ── Factory ──────────────────────────────────────────────────────────────────

const MAX_PANELS_DEFAULT = 4;
const MIN_PANELS = 2;

/**
 * Create a multi-timeframe analysis group.
 */
export function createTimeframeGroup(config: TimeframeGroupConfig): TimeframeGroup {
  const maxPanels = config.maxPanels ?? MAX_PANELS_DEFAULT;

  if (config.panels.length < MIN_PANELS) {
    throw new RangeError(`At least ${MIN_PANELS} panels required`);
  }
  if (config.panels.length > maxPanels) {
    throw new RangeError(`At most ${maxPanels} panels allowed`);
  }

  const sync = createChartSync();
  const rangeSyncHandlers: RangeChangeHandler[] = [];
  let disposed = false;

  const group: TimeframeGroup = {
    sync,
    panels: config.panels,

    onRangeChange(source: SyncTimeframe, range: TimeRange): void {
      if (disposed) return;
      for (const panel of config.panels) {
        if (panel.interval === source) continue;
        const mapped = mapRange(range, panel.interval);
        for (const handler of rangeSyncHandlers) {
          handler(panel.interval, mapped);
        }
      }
    },

    onRangeSync(handler: RangeChangeHandler): () => void {
      rangeSyncHandlers.push(handler);
      return () => {
        const idx = rangeSyncHandlers.indexOf(handler);
        if (idx !== -1) rangeSyncHandlers.splice(idx, 1);
      };
    },

    updateTrends(trends: readonly PanelTrend[]): ConfluenceResult {
      return computeConfluence(trends);
    },

    dispose(): void {
      disposed = true;
      rangeSyncHandlers.length = 0;
      sync.dispose();
    },
  };

  return group;
}
