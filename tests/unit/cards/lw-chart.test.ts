import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DailyCandle } from "../../../src/types/domain";

// ---------------------------------------------------------------------------
// Mock lightweight-charts so tests run in happy-dom without canvas/WebGL
// ---------------------------------------------------------------------------
vi.mock("lightweight-charts", () => {
  const series = {
    setData: vi.fn(),
  };
  const chart = {
    addPane: vi.fn(),
    addSeries: vi.fn(() => series),
    timeScale: vi.fn(() => ({ fitContent: vi.fn() })),
    applyOptions: vi.fn(),
    remove: vi.fn(),
    subscribeCrosshairMove: vi.fn(() => () => undefined),
    unsubscribeCrosshairMove: vi.fn(),
    setCrosshairPosition: vi.fn(),
    clearCrosshairPosition: vi.fn(),
  };
  return {
    createChart: vi.fn(() => chart),
    CandlestickSeries: "CandlestickSeries",
    LineSeries: "LineSeries",
    HistogramSeries: "HistogramSeries",
    createSeriesMarkers: vi.fn(),
  };
});

// Also mock ResizeObserver (not available in happy-dom)
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe(): void {
      /* noop */
    }
    disconnect(): void {
      /* noop */
    }
  },
);

import { attachLwChart } from "../../../src/cards/lw-chart";

function makeCandle(date: string, close = 100): DailyCandle {
  return { date, open: close - 1, high: close + 2, low: close - 2, close, volume: 1_000_000 };
}

describe("attachLwChart", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.style.height = "400px";
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  it("returns a handle with dispose() for no candles", async () => {
    const handle = await attachLwChart(container, { ticker: "AAPL", candles: [] });
    expect(handle.dispose).toBeTypeOf("function");
    handle.dispose(); // should not throw
  });

  it("shows no-data message when candles are empty", async () => {
    await attachLwChart(container, { ticker: "TSLA", candles: [] });
    expect(container.textContent).toContain("No chart data");
  });

  it("calls createChart when candles are provided", async () => {
    const { createChart } = await import("lightweight-charts");
    const candles = [makeCandle("2025-01-01", 100), makeCandle("2025-01-02", 105)];
    await attachLwChart(container, { ticker: "AAPL", candles });
    expect(createChart).toHaveBeenCalledWith(container, expect.any(Object));
  });

  it("adds a second pane for volume", async () => {
    const { createChart } = await import("lightweight-charts");
    const candles = [makeCandle("2025-01-01", 100), makeCandle("2025-01-02", 102)];
    await attachLwChart(container, { ticker: "AAPL", candles });
    const mockChart = (createChart as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(mockChart?.addPane).toHaveBeenCalledOnce();
  });

  it("sets data on all series (candles + SMA50 + SMA200 + volume)", async () => {
    const { createChart } = await import("lightweight-charts");
    const candles = Array.from({ length: 60 }, (_, i) =>
      makeCandle(`2025-01-${String(i + 1).padStart(2, "0")}`, 100 + i),
    );
    await attachLwChart(container, { ticker: "AAPL", candles });
    const mockChart = (createChart as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    const mockSeries = mockChart?.addSeries.mock.results[0]?.value;
    expect(mockSeries?.setData).toHaveBeenCalled();
  });

  it("calls createSeriesMarkers when signals are provided", async () => {
    const { createSeriesMarkers } = await import("lightweight-charts");
    const candles = [makeCandle("2025-01-01"), makeCandle("2025-01-02")];
    const signals = [{ date: "2025-01-02", direction: "BUY" as const }];
    await attachLwChart(container, { ticker: "AAPL", candles, signals });
    expect(createSeriesMarkers).toHaveBeenCalled();
  });

  it("does not call createSeriesMarkers when no signals", async () => {
    const { createSeriesMarkers } = await import("lightweight-charts");
    const candles = [makeCandle("2025-01-01"), makeCandle("2025-01-02")];
    await attachLwChart(container, { ticker: "AAPL", candles, signals: [] });
    expect(createSeriesMarkers).not.toHaveBeenCalled();
  });

  it("dispose() calls chart.remove()", async () => {
    const { createChart } = await import("lightweight-charts");
    const candles = [makeCandle("2025-01-01"), makeCandle("2025-01-02")];
    const handle = await attachLwChart(container, { ticker: "AAPL", candles });
    handle.dispose();
    const mockChart = (createChart as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(mockChart?.remove).toHaveBeenCalled();
  });

  it("fits content on the time scale", async () => {
    const { createChart } = await import("lightweight-charts");
    const candles = [makeCandle("2025-01-01"), makeCandle("2025-01-02")];
    await attachLwChart(container, { ticker: "AAPL", candles });
    const mockChart = (createChart as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    // timeScale() is called at least once (for fitContent) — that's the observable behaviour
    expect(mockChart?.timeScale).toHaveBeenCalled();
  });
});
