/**
 * Multi-timeframe chart sync — keep 2-4 chart instances time-aligned via a
 * shared logical-time cursor.
 *
 * R6: When the user hovers over any participating chart, all others move their
 * crosshair to the corresponding bar on their own timescale.
 *
 * Usage:
 *   const sync = createChartSync();
 *   const disposeA = sync.register("1d", (time) => chartA.setCrosshairPosition(time));
 *   const disposeB = sync.register("1w", (time) => chartB.setCrosshairPosition(time));
 *
 *   // From chart A mousemove handler:
 *   sync.broadcast("1d", 1_700_000_000);
 *
 *   // Teardown:
 *   disposeA();
 *   disposeB();
 *   sync.dispose();
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** A timeframe identifier: standard interval string or any opaque label. */
export type SyncTimeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1mo" | string;

/**
 * A callback invoked on all participants other than the broadcaster.
 *
 * @param time   - Unix timestamp (seconds) to show the crosshair at.
 * @param source - The timeframe of the chart that triggered the sync.
 */
export type SyncHandler = (time: number, source: SyncTimeframe) => void;

/** Handle for a registered participant. */
export interface SyncParticipant {
  /** The timeframe this participant was registered under. */
  readonly timeframe: SyncTimeframe;
  /** Remove this participant from the sync group. */
  dispose(): void;
}

/** The chart-sync controller. */
export interface ChartSync {
  /**
   * Register a chart as a sync participant.
   *
   * @param timeframe - The interval this chart displays.
   * @param onSync    - Called when another chart broadcasts a cursor position.
   * @returns A `SyncParticipant` with a `dispose()` method.
   */
  register(timeframe: SyncTimeframe, onSync: SyncHandler): SyncParticipant;

  /**
   * Broadcast the current cursor time from the given timeframe.
   * All other registered charts receive the mapped time.
   *
   * @param sourceTimeframe - The timeframe of the broadcasting chart.
   * @param time            - Unix timestamp (seconds) of the cursor.
   */
  broadcast(sourceTimeframe: SyncTimeframe, time: number): void;

  /**
   * Clear all crosshairs (e.g. on mouseleave).
   * Calls each handler with `time = -1` as the sentinel value.
   */
  clearAll(): void;

  /** Dispose all participants and release references. */
  dispose(): void;
}

// ── Time mapping ─────────────────────────────────────────────────────────────

/** Interval durations in seconds. */
const INTERVAL_SECONDS: Readonly<Record<string, number>> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
  "1w": 604800,
  "1mo": 2_592_000, // 30 days
};

/**
 * Snap a Unix timestamp to the start of the target timeframe bar.
 * For known intervals, rounds down to the nearest bar open.
 * Unknown intervals pass the time through unchanged.
 */
export function snapToTimeframe(time: number, targetTimeframe: SyncTimeframe): number {
  const interval = INTERVAL_SECONDS[targetTimeframe];
  if (interval === undefined) return time;
  return Math.floor(time / interval) * interval;
}

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * Create a chart-sync controller that keeps up to 4 charts time-aligned.
 *
 * All registered charts receive cursor position broadcasts from any peer.
 * The time is automatically mapped to the closest bar start on each
 * participant's timeframe.
 */
export function createChartSync(): ChartSync {
  type Entry = { timeframe: SyncTimeframe; handler: SyncHandler };
  const participants: Entry[] = [];
  let disposed = false;

  const sync: ChartSync = {
    register(timeframe: SyncTimeframe, onSync: SyncHandler): SyncParticipant {
      if (disposed) throw new Error("ChartSync has been disposed");
      const entry: Entry = { timeframe, handler: onSync };
      participants.push(entry);

      return {
        timeframe,
        dispose(): void {
          const idx = participants.indexOf(entry);
          if (idx !== -1) participants.splice(idx, 1);
        },
      };
    },

    broadcast(sourceTimeframe: SyncTimeframe, time: number): void {
      if (disposed) return;
      for (const p of participants) {
        if (p.timeframe === sourceTimeframe) continue;
        const mapped = snapToTimeframe(time, p.timeframe);
        p.handler(mapped, sourceTimeframe);
      }
    },

    clearAll(): void {
      if (disposed) return;
      for (const p of participants) {
        p.handler(-1, "");
      }
    },

    dispose(): void {
      disposed = true;
      participants.length = 0;
    },
  };

  return sync;
}
