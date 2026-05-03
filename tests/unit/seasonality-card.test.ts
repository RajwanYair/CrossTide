/**
 * Unit tests for seasonality-card rendering.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before importing the card
vi.mock("../../src/core/data-service", () => ({
  fetchTickerData: vi.fn(),
}));
vi.mock("../../src/ui/router", () => ({
  getNavigationSignal: () => undefined,
}));

import { fetchTickerData } from "../../src/core/data-service";
import type { DailyCandle } from "../../src/types/domain";

/** Generate synthetic candles for testing. */
function makeCandles(count: number): DailyCandle[] {
  const candles: DailyCandle[] = [];
  const start = new Date("2023-01-02");
  let price = 100;
  for (let i = 0; i < count; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const change = Math.sin(i * 0.5) * 2;
    price = Math.max(price + change, 10);
    candles.push({
      date: date.toISOString().slice(0, 10),
      open: price - 0.5,
      high: price + 1,
      low: price - 1,
      close: price,
      volume: 1_000_000,
    });
    if (candles.length >= count) break;
  }
  return candles.slice(0, count);
}

describe("seasonality-card", () => {
  let container: HTMLElement;
  const mockFetch = fetchTickerData as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    mockFetch.mockReset();
  });

  it("renders empty state when no ticker provided", async () => {
    const mod = await import("../../src/cards/seasonality-card");
    mod.default.mount(container, { route: "seasonality", params: {} });
    expect(container.innerHTML).toContain("Select a ticker");
  });

  it("renders insufficient data message for <30 candles", async () => {
    const candles = makeCandles(10);
    mockFetch.mockResolvedValue({ candles, ticker: "AAPL" });

    const mod = await import("../../src/cards/seasonality-card");
    mod.default.mount(container, { route: "seasonality", params: { symbol: "AAPL" } });

    // Wait for async fetch to resolve
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("AAPL", undefined);
    });

    // After fetch resolves with <30 candles, should show insufficient message
    await vi.waitFor(() => {
      expect(container.innerHTML).toContain("Insufficient data");
    });
  });

  it("renders monthly and weekly sections for sufficient data", async () => {
    const candles = makeCandles(200);
    mockFetch.mockResolvedValue({ candles, ticker: "MSFT" });

    const mod = await import("../../src/cards/seasonality-card");
    mod.default.mount(container, { route: "seasonality", params: { symbol: "MSFT" } });

    await vi.waitFor(() => {
      expect(container.innerHTML).toContain("Monthly Average Returns");
    });

    expect(container.innerHTML).toContain("Day-of-Week Average Returns");
    expect(container.innerHTML).toContain("MSFT");
    expect(container.innerHTML).toContain("seasonal-bar");
  });

  it("shows month labels (Jan–Dec) in the bars", async () => {
    const candles = makeCandles(300);
    mockFetch.mockResolvedValue({ candles, ticker: "TSLA" });

    const mod = await import("../../src/cards/seasonality-card");
    mod.default.mount(container, { route: "seasonality", params: { symbol: "TSLA" } });

    await vi.waitFor(() => {
      expect(container.innerHTML).toContain("Jan");
    });
  });

  it("shows weekday labels (Mon–Fri) in the bars", async () => {
    const candles = makeCandles(300);
    mockFetch.mockResolvedValue({ candles, ticker: "NVDA" });

    const mod = await import("../../src/cards/seasonality-card");
    mod.default.mount(container, { route: "seasonality", params: { symbol: "NVDA" } });

    await vi.waitFor(() => {
      expect(container.innerHTML).toContain("Mon");
    });
    expect(container.innerHTML).toContain("Fri");
  });

  it("displays win-rate percentage", async () => {
    const candles = makeCandles(200);
    mockFetch.mockResolvedValue({ candles, ticker: "SPY" });

    const mod = await import("../../src/cards/seasonality-card");
    mod.default.mount(container, { route: "seasonality", params: { symbol: "SPY" } });

    await vi.waitFor(() => {
      expect(container.innerHTML).toMatch(/\d+%W/);
    });
  });

  it("update() re-renders with new ticker", async () => {
    const candles1 = makeCandles(200);
    const candles2 = makeCandles(200);
    mockFetch
      .mockResolvedValueOnce({ candles: candles1, ticker: "AAPL" })
      .mockResolvedValueOnce({ candles: candles2, ticker: "GOOG" });

    const mod = await import("../../src/cards/seasonality-card");
    const handle = mod.default.mount(container, {
      route: "seasonality",
      params: { symbol: "AAPL" },
    });

    await vi.waitFor(() => {
      expect(container.innerHTML).toContain("AAPL");
    });

    handle?.update?.({ route: "seasonality", params: { symbol: "GOOG" } });

    await vi.waitFor(() => {
      expect(container.innerHTML).toContain("GOOG");
    });
  });
});
