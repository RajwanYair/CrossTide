/**
 * Chart card adapter tests.
 *
 * Covers synchronous mount/update/dispose and backtest UI rendering.
 * Network-dependent paths are mocked.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../../../src/cards/chart", () => ({
  renderChart: vi.fn((container: HTMLElement) => {
    container.innerHTML = '<div class="chart-header"></div><div class="chart-canvas"></div>';
  }),
}));

vi.mock("../../../src/cards/lw-chart", () => ({
  attachLwChart: vi.fn().mockResolvedValue({ dispose: vi.fn() }),
}));

vi.mock("../../../src/core/backtest-worker", () => ({
  runBacktestAsync: vi.fn().mockResolvedValue({
    trades: [],
    totalReturnPercent: 0,
    winRate: 0,
    maxDrawdown: 0,
  }),
}));

vi.mock("../../../src/core/perf-metrics", () => ({
  recordPerformanceTrace: vi.fn(),
}));

vi.mock("../../../src/core/data-service", () => ({
  fetchTickerData: vi.fn().mockResolvedValue({
    candles: [{ date: "2026-08-12", open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 }],
    provenance: {
      source: "test",
      fetchedAt: "2026-08-12T12:00:00.000Z",
      asOf: "2026-08-12T11:59:30.000Z",
      timezone: "America/New_York",
      attribution: "Test Provider",
      coverage: "Daily candles",
      marketStatus: "REGULAR",
      adjustmentPolicy: "Split-adjusted",
      limitations: ["Delayed for testing"],
    },
    dataStatus: "live",
    dataWarnings: [],
  }),
  TIMEFRAME_PRESETS: [
    { label: "1D", range: "1d", interval: "5m" },
    { label: "5D", range: "5d", interval: "15m" },
    { label: "1M", range: "1mo", interval: "1h" },
    { label: "3M", range: "3mo", interval: "1d" },
    { label: "1Y", range: "1y", interval: "1d" },
    { label: "5Y", range: "5y", interval: "1wk" },
  ],
  DEFAULT_TIMEFRAME: { label: "1Y", range: "1y", interval: "1d" },
}));

vi.mock("../../../src/ui/toast", () => ({
  showToast: vi.fn(),
}));

vi.mock("../../../src/ui/router", () => ({
  getNavigationSignal: vi.fn().mockReturnValue(new AbortController().signal),
}));

const mockDrawingHandle = {
  dispose: vi.fn(),
  setDrawings: vi.fn(),
  getDrawings: vi.fn(() => [] as unknown[]),
};

vi.mock("../../../src/cards/drawing-tools", () => ({
  mountDrawingTools: vi.fn(() => mockDrawingHandle),
}));

describe("chart-card (CardModule)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it("mounts without throwing", async () => {
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    expect(() =>
      chartCard.mount(container, { route: "chart", params: { symbol: "AAPL" } }),
    ).not.toThrow();
  });

  it("calls renderChart on mount", async () => {
    const { renderChart } = await import("../../../src/cards/chart");
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: { symbol: "MSFT" } });
    expect(renderChart).toHaveBeenCalled();
  });

  it("renders data provenance after the chart response resolves", async () => {
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: { symbol: "MSFT" } });
    await vi.waitFor(() => {
      expect(container.textContent).toContain("Source: test");
      expect(container.textContent).toContain("Market data as of: 2026-08-12T11:59:30.000Z");
      expect(container.textContent).toContain("Timezone: America/New_York");
      expect(container.textContent).toContain("Test Provider");
      expect(container.textContent).toContain("Coverage: Daily candles");
      expect(container.textContent).toContain("Market: REGULAR");
      expect(container.textContent).toContain("Adjustments: Split-adjusted");
      expect(container.textContent).toContain("Delayed for testing");
    });
  });

  it("records interactive chart render timing", async () => {
    const { recordPerformanceTrace } = await import("../../../src/core/perf-metrics");
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: { symbol: "MSFT" } });
    await vi.waitFor(() =>
      expect(recordPerformanceTrace).toHaveBeenCalledWith("chartRenderMs", expect.any(Number)),
    );
  });

  it("renders backtest section with run button", async () => {
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: { symbol: "AAPL" } });
    const btn = container.querySelector<HTMLButtonElement>("[data-action='run-backtest']");
    expect(btn).not.toBeNull();
    expect(btn?.textContent).toContain("Run Backtest");
  });

  it("disables backtest button when no ticker", async () => {
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: {} });
    const btn = container.querySelector<HTMLButtonElement>("[data-action='run-backtest']");
    expect(btn?.disabled).toBe(true);
  });

  it("update re-renders with new ticker", async () => {
    const { renderChart } = await import("../../../src/cards/chart");
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    const handle = chartCard.mount(container, { route: "chart", params: { symbol: "AAPL" } });
    vi.mocked(renderChart).mockClear();
    handle?.update?.({ route: "chart", params: { symbol: "NVDA" } });
    expect(renderChart).toHaveBeenCalled();
  });

  it("dispose cleans up without throwing", async () => {
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    const handle = chartCard.mount(container, { route: "chart", params: { symbol: "AAPL" } });
    expect(() => handle?.dispose?.()).not.toThrow();
  });

  it("renders a share-drawings toolbar button", async () => {
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: { symbol: "AAPL" } });
    const btn = container.querySelector<HTMLButtonElement>("[data-action='share-drawings']");
    expect(btn).not.toBeNull();
  });

  it("shows a toast when there are no drawings to share", async () => {
    mockDrawingHandle.getDrawings.mockReturnValue([]);
    const { showToast } = await import("../../../src/ui/toast");
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: { symbol: "AAPL" } });
    await vi.waitFor(() => {
      expect(container.querySelector("[data-action='share-drawings']")).not.toBeNull();
    });
    container.querySelector<HTMLButtonElement>("[data-action='share-drawings']")?.click();
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "No drawings to share" }),
    );
  });

  it("copies a share link with drawings to clipboard", async () => {
    const drawing = { kind: "line", points: [] };
    mockDrawingHandle.getDrawings.mockReturnValue([drawing]);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { showToast } = await import("../../../src/ui/toast");
    const { mountDrawingTools } = await import("../../../src/cards/drawing-tools");
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: { symbol: "AAPL" } });
    // Wait for the async LWC attach + drawing-tools mount to populate drawingRef
    // before clicking, so getDrawings() is read from a live handle, not null.
    await vi.waitFor(() => expect(mountDrawingTools).toHaveBeenCalled());
    container.querySelector<HTMLButtonElement>("[data-action='share-drawings']")?.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0]![0]).toContain("?s=");
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Drawing share link copied to clipboard!" }),
    );
    vi.unstubAllGlobals();
  });

  it("restores drawings from a matching shared URL on mount", async () => {
    const { encodeDrawingsUrl } = await import("../../../src/core/share-state");
    const sharedDrawing = { kind: "line", points: [1, 2] };
    const shareUrl = encodeDrawingsUrl("AAPL", [sharedDrawing], "http://localhost/");
    const token = new URL(shareUrl).searchParams.get("s")!;
    window.history.pushState({}, "", `/chart/AAPL?s=${token}`);

    mockDrawingHandle.getDrawings.mockReturnValue([]);
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: { symbol: "AAPL" } });
    await vi.waitFor(() => {
      expect(mockDrawingHandle.setDrawings).toHaveBeenCalledWith([sharedDrawing]);
    });
    window.history.pushState({}, "", "/");
  });
});
