/** Tests for seasonality card lifecycle and fetch states. */
import { describe, expect, it, vi } from "vitest";

const fetchTickerData = vi.fn();

vi.mock("../../../src/core/data-service", () => ({
  fetchTickerData,
}));

vi.mock("../../../src/ui/router", () => ({
  getNavigationSignal: vi.fn(() => new AbortController().signal),
}));

describe("seasonality-card lifecycle", () => {
  it("ignores an older symbol response after an update", async () => {
    let resolveFirst: ((value: { candles: [] }) => void) | undefined;
    const first = new Promise<{ candles: [] }>((resolve) => (resolveFirst = resolve));
    fetchTickerData.mockReturnValueOnce(first).mockResolvedValueOnce({ candles: [] });

    const { default: card } = await import("../../../src/cards/seasonality-card");
    const container = document.createElement("div");
    const handle = card.mount(container, { route: "seasonality", params: { symbol: "AAPL" } });
    handle.update?.({ route: "seasonality", params: { symbol: "MSFT" } });
    await Promise.resolve();
    resolveFirst?.({ candles: [] });
    await Promise.resolve();
    await Promise.resolve();

    expect(container.textContent).toContain("Insufficient data for MSFT seasonality");
    expect(container.textContent).not.toContain("Insufficient data for AAPL seasonality");
    handle.dispose?.();
  });

  it("renders an explicit error when loading fails", async () => {
    fetchTickerData.mockRejectedValueOnce(new Error("network"));

    const { default: card } = await import("../../../src/cards/seasonality-card");
    const container = document.createElement("div");
    const handle = card.mount(container, { route: "seasonality", params: { symbol: "AAPL" } });
    await Promise.resolve();
    await Promise.resolve();

    expect(container.textContent).toContain("Unable to load seasonality data for AAPL.");
    handle.dispose?.();
  });
});
