/**
 * Lightweight Charts integration — candlestick chart with multi-pane layout.
 *
 * Dynamically imports `lightweight-charts@^5` (loaded only on the chart route)
 * to keep the initial bundle lean (~40 KB gz isolated in its own chunk).
 *
 * Pane layout:
 *   Pane 0 — Candlestick + SMA 50 (blue) + SMA 200 (orange) + signal markers
 *   Pane 1 — Volume histogram
 */
import type { DailyCandle } from "../types/domain";
import { computeSmaSeries } from "../domain/sma-calculator";
import { computeVolumeProfile, type VolumeProfile } from "../domain/volume-profile";
import type { Candle } from "../domain/heikin-ashi";
import { wireCrosshairSync, getGlobalChartSyncBus } from "../ui/chart-sync";

/** A consensus buy/sell signal to render as a marker on the chart. */
export interface LwChartSignal {
  readonly date: string;
  readonly direction: "BUY" | "SELL";
}

export interface LwChartOptions {
  readonly ticker: string;
  readonly candles: readonly DailyCandle[];
  readonly signals?: readonly LwChartSignal[];
  /** When true, wires crosshair to the global sync bus (B9). Default true. */
  readonly syncCrosshair?: boolean;
}

export interface LwChartHandle {
  dispose(): void;
}

/** Detect current colour scheme from the document root attribute. */
function isDarkTheme(): boolean {
  return document.documentElement.getAttribute("data-theme") !== "light";
}

/**
 * Mount a full Lightweight Charts candlestick chart inside `container`.
 *
 * The container element must have a defined height (e.g. `height: 400px`).
 * Returns a handle with a `dispose()` method to tear down the chart and its
 * ResizeObserver when the card is unmounted.
 */
export async function attachLwChart(
  container: HTMLElement,
  options: LwChartOptions,
): Promise<LwChartHandle> {
  const { ticker, candles, signals = [], syncCrosshair = true } = options;

  if (candles.length === 0) {
    container.textContent = `No chart data for ${ticker}.`;
    return { dispose: () => undefined };
  }

  const dark = isDarkTheme();
  const bg = dark ? "#161b22" : "#ffffff";
  const text = dark ? "#8b949e" : "#656d76";
  const grid = dark ? "#21262d" : "#e1e4e8";
  const border = dark ? "#30363d" : "#d0d7de";

  // Dynamic import — loads only when chart is viewed
  const { createChart, CandlestickSeries, LineSeries, HistogramSeries, createSeriesMarkers } =
    await import("lightweight-charts");

  const chart = createChart(container, {
    layout: { background: { color: bg }, textColor: text },
    grid: { vertLines: { color: grid }, horzLines: { color: grid } },
    timeScale: { borderColor: border, timeVisible: true, secondsVisible: false },
    rightPriceScale: { borderColor: border },
    autoSize: true,
  });

  // Add a second pane for volume
  chart.addPane();

  // — Pane 0: Candlesticks —
  const candleSeries = chart.addSeries(
    CandlestickSeries,
    {
      upColor: "#3fb950",
      downColor: "#f85149",
      borderUpColor: "#3fb950",
      borderDownColor: "#f85149",
      wickUpColor: "#3fb950",
      wickDownColor: "#f85149",
    },
    0,
  );

  // — Pane 0: SMA 50 overlay —
  const sma50Series = chart.addSeries(
    LineSeries,
    {
      color: "#58a6ff",
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    },
    0,
  );

  // — Pane 0: SMA 200 overlay —
  const sma200Series = chart.addSeries(
    LineSeries,
    {
      color: "#f0883e",
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    },
    0,
  );

  // — Pane 1: Volume histogram —
  const volumeSeries = chart.addSeries(
    HistogramSeries,
    { priceFormat: { type: "volume" }, priceScaleId: "" },
    1,
  );

  // Set candlestick data
  candleSeries.setData(
    candles.map((c) => ({
      time: c.date,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })),
  );

  // Set SMA 50
  const sma50Points = computeSmaSeries(candles, 50);
  sma50Series.setData(
    sma50Points
      .filter((p): p is { date: string; value: number } => p.value !== null)
      .map((p) => ({ time: p.date, value: p.value })),
  );

  // Set SMA 200
  const sma200Points = computeSmaSeries(candles, 200);
  sma200Series.setData(
    sma200Points
      .filter((p): p is { date: string; value: number } => p.value !== null)
      .map((p) => ({ time: p.date, value: p.value })),
  );

  // Set volume with green/red colouring
  volumeSeries.setData(
    candles.map((c, i) => {
      const prev = candles[i - 1];
      const color =
        prev && c.close >= prev.close
          ? dark
            ? "#3fb95055"
            : "#3fb95044"
          : dark
            ? "#f8514955"
            : "#f8514944";
      return { time: c.date, value: c.volume, color };
    }),
  );

  // Signal markers (buy = arrow up below bar, sell = arrow down above bar)
  if (signals.length > 0) {
    createSeriesMarkers(
      candleSeries,
      signals.map((s) => ({
        time: s.date,
        position: s.direction === "BUY" ? ("belowBar" as const) : ("aboveBar" as const),
        shape: s.direction === "BUY" ? ("arrowUp" as const) : ("arrowDown" as const),
        color: s.direction === "BUY" ? "#3fb950" : "#f85149",
        text: s.direction === "BUY" ? "B" : "S",
      })),
    );
  }

  // Q3: Volume Profile — POC + Value Area lines
  if (candles.length >= 10) {
    const vpCandles: Candle[] = candles.map((c) => ({
      time: new Date(c.date).getTime() / 1000,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));
    const vp: VolumeProfile = computeVolumeProfile(vpCandles);
    if (vp.totalVolume > 0) {
      candleSeries.createPriceLine({
        price: vp.poc,
        color: "#d29922",
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: "POC",
      });
      candleSeries.createPriceLine({
        price: vp.valueAreaHigh,
        color: "#d2992288",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: false,
        title: "VAH",
      });
      candleSeries.createPriceLine({
        price: vp.valueAreaLow,
        color: "#d2992288",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: false,
        title: "VAL",
      });
    }
  }

  chart.timeScale().fitContent();

  // ── B9: Synced crosshair — wire to global bus ──────────────────────────────
  let unsubCrosshair: (() => void) | null = null;
  if (syncCrosshair) {
    const chartId = `${ticker}-${Date.now()}`;
    unsubCrosshair = wireCrosshairSync(chartId, chart, candleSeries, getGlobalChartSyncBus());
  }

  // Keep chart in sync with container size
  const ro = new ResizeObserver(() => {
    chart.applyOptions({ width: container.clientWidth });
  });
  ro.observe(container);

  return {
    dispose(): void {
      unsubCrosshair?.();
      ro.disconnect();
      chart.remove();
    },
  };
}
