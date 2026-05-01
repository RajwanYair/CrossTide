/**
 * Chart crosshair sync — keeps crosshairs aligned across multiple
 * Lightweight Charts instances on the same page.
 *
 * Mechanism: a singleton EventEmitter stores the current crosshair
 * position (logical time value). Participating charts call
 * `subscribe()` to receive updates and call `publish()` when their
 * own crosshair moves.
 *
 * Each chart must:
 *   1. Call `subscribe(chartId, chart)` to register.
 *   2. Call `unsubscribe(chartId)` on dispose.
 *
 * The sync bus uses `chart.setCrosshairPosition()` / `chart.clearCrosshairPosition()`
 * from the Lightweight Charts API.
 */

/** Opaque crosshair time position (logical time string, e.g. "2024-01-15"). */
export type CrosshairTime = string;

export interface ChartCrosshairEntry {
  /** Set crosshair at a given time position across all series. */
  setCrosshair(time: CrosshairTime | null): void;
}

export interface ChartSyncBus {
  /** Register a chart. The callback is called when another chart moves its crosshair. */
  subscribe(id: string, entry: ChartCrosshairEntry): void;
  /** Unregister a chart. */
  unsubscribe(id: string): void;
  /** Publish a crosshair move from a specific chart; all others sync to this time. */
  publish(fromId: string, time: CrosshairTime | null): void;
  /** Remove all subscribers. */
  clear(): void;
}

export function createChartSyncBus(): ChartSyncBus {
  const entries = new Map<string, ChartCrosshairEntry>();

  return {
    subscribe(id, entry): void {
      entries.set(id, entry);
    },

    unsubscribe(id): void {
      entries.delete(id);
    },

    publish(fromId, time): void {
      for (const [id, entry] of entries) {
        if (id !== fromId) {
          entry.setCrosshair(time);
        }
      }
    },

    clear(): void {
      entries.clear();
    },
  };
}

/** Singleton bus shared across all charts in the app. */
let _globalBus: ChartSyncBus | null = null;

export function getGlobalChartSyncBus(): ChartSyncBus {
  _globalBus ??= createChartSyncBus();
  return _globalBus;
}

/**
 * Wire up a Lightweight Charts `IChartApi` instance to the global sync bus.
 *
 * Call this after creating the chart. Returns an unsubscribe function.
 *
 * @param chartId   Unique string ID for this chart (e.g. ticker + "-main").
 * @param chart     The LWC chart instance.
 * @param series    The primary series to use for setCrosshairPosition (price axis).
 * @param bus       Defaults to the global singleton bus.
 */
export function wireCrosshairSync(
  chartId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chart: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: any,
  bus: ChartSyncBus = getGlobalChartSyncBus(),
): () => void {
  let isSyncing = false;

  // When this chart's crosshair moves, publish to bus
   
  const unsubLwc = chart.subscribeCrosshairMove((param: unknown) => {
    if (isSyncing) return;
     
    const time = (param as { time?: CrosshairTime } | null)?.time ?? null;
    bus.publish(chartId, time ?? null);
  });

  // When bus has an update, apply to this chart
  const entry: ChartCrosshairEntry = {
    setCrosshair(time: CrosshairTime | null): void {
      isSyncing = true;
      try {
        if (time === null) {
           
          chart.clearCrosshairPosition();
        } else {
           
          chart.setCrosshairPosition(0, time, series);
        }
      } catch {
        // ignore if series/chart has been disposed
      }
      isSyncing = false;
    },
  };

  bus.subscribe(chartId, entry);

  return () => {
    bus.unsubscribe(chartId);
     
    unsubLwc?.();
  };
}
