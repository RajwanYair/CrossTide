/** Tests for chart comparison card lifecycle behavior. */
import { describe, expect, it, vi } from "vitest";

const fetchTickerData = vi.fn();

vi.mock("../../../src/core/data-service", () => ({
  fetchTickerData,
}));

vi.mock("../../../src/ui/router", () => ({
  getNavigationSignal: vi.fn(() => new AbortController().signal),
}));

vi.mock("../../../src/ui/toast", () => ({
  showToast: vi.fn(),
}));

describe("comparison-card lifecycle", () => {
  it("does not patch output after an in-flight comparison is disposed", async () => {
    let resolveFetch: ((value: { candles: [] }) => void) | undefined;
    const pending = new Promise<{ candles: [] }>((resolve) => (resolveFetch = resolve));
    fetchTickerData.mockImplementation(() => pending);

    const { default: card } = await import("../../../src/cards/comparison-card");
    const container = document.createElement("div");
    const handle = card.mount(container, { route: "comparison", params: { symbol: "AAPL" } });
    const output = container.querySelector<HTMLElement>("#comparison-output");
    expect(output?.textContent).toContain("Fetching data for AAPL, SPY");

    handle.dispose?.();
    resolveFetch?.({ candles: [] });
    await Promise.resolve();
    await Promise.resolve();

    expect(output?.textContent).toContain("Fetching data for AAPL, SPY");
  });
});
