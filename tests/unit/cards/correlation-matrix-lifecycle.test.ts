/** Tests for correlation matrix card lifecycle behavior. */
import { describe, expect, it, vi } from "vitest";

const fetchTickerData = vi.fn();

vi.mock("../../../src/core/data-service", () => ({
  fetchTickerData,
}));

vi.mock("../../../src/core/config", () => ({
  loadConfig: vi.fn(() => ({ watchlist: [{ ticker: "AAPL" }] })),
}));

describe("correlation-matrix-card lifecycle", () => {
  it("does not render fetched data after disposal", async () => {
    let resolveFetch:
      | ((value: { ticker: string; candles: []; error?: string }) => void)
      | undefined;
    const pending = new Promise<{ ticker: string; candles: []; error?: string }>((resolve) => {
      resolveFetch = resolve;
    });
    fetchTickerData.mockReturnValueOnce(pending);

    const { default: card } = await import("../../../src/cards/correlation-matrix-card");
    const container = document.createElement("div");
    const handle = card.mount(container, {} as never);
    const loadingText = container.textContent;

    handle.dispose?.();
    resolveFetch?.({ ticker: "AAPL", candles: [] });
    await Promise.resolve();
    await Promise.resolve();

    expect(container.textContent).toBe(loadingText);
  });
});
