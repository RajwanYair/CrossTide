/** Tests for strategy comparison card lifecycle behavior. */
import { describe, expect, it, vi } from "vitest";

const fetchTickerData = vi.fn();

vi.mock("../../../src/core/data-service", () => ({
  fetchTickerData,
}));

vi.mock("../../../src/core/backtest-worker-fallback", () => ({
  runSmaCrossoverLocal: vi.fn(() => ({
    trades: [],
    equityPoints: [{ date: "2026-08-12", equity: 10_000 }],
    finalEquity: 10_000,
    totalReturnPct: 0,
    annReturn: 0,
    maxDrawdown: 0,
    stats: { winRate: 0, profitFactor: 0, trades: 0 },
  })),
}));

vi.mock("../../../src/ui/router", () => ({
  getNavigationSignal: vi.fn(() => new AbortController().signal),
}));

describe("strategy-comparison-card lifecycle", () => {
  it("does not render a late fetch result after disposal", async () => {
    let resolveFetch: ((value: { candles: [] }) => void) | undefined;
    fetchTickerData.mockImplementationOnce(
      () => new Promise<{ candles: [] }>((resolve) => (resolveFetch = resolve)),
    );

    const { default: card } = await import("../../../src/cards/strategy-comparison-card");
    const container = document.createElement("div");
    const handle = card.mount(container, { route: "strategy-comparison", params: {} });
    handle.dispose();
    resolveFetch?.({ candles: [] });
    await Promise.resolve();
    await Promise.resolve();

    expect(container.querySelector("#cmp-source")?.textContent).toBe("Loading…");
    expect(container.querySelector("#cmp-result")?.textContent).toBe("");
  });
});
