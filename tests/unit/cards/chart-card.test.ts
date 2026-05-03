/**
 * Chart card adapter tests.
 *
 * Covers synchronous mount/update/dispose and backtest UI rendering.
 * Network-dependent paths are mocked.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../../../src/cards/chart", () => ({
  renderChart: vi.fn(),
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

vi.mock("../../../src/core/data-service", () => ({
  fetchTickerData: vi.fn().mockResolvedValue({ candles: [] }),
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

  it("renders backtest section with run button", async () => {
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: { symbol: "AAPL" } });
    const btn = container.querySelector<HTMLButtonElement>("#btn-run-backtest");
    expect(btn).not.toBeNull();
    expect(btn?.textContent).toContain("Run Backtest");
  });

  it("disables backtest button when no ticker", async () => {
    const { default: chartCard } = await import("../../../src/cards/chart-card");
    chartCard.mount(container, { route: "chart", params: {} });
    const btn = container.querySelector<HTMLButtonElement>("#btn-run-backtest");
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
});
