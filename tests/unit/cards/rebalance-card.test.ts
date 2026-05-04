/**
 * Tests for rebalance card rendering.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock portfolio-store before import
vi.mock("../../../src/cards/portfolio-store", () => ({
  loadHoldings: vi.fn().mockResolvedValue([
    {
      ticker: "AAPL",
      sector: "Technology",
      quantity: 50,
      avgCost: 150,
      currentPrice: 200,
      addedAt: "2024-01-01",
    },
    {
      ticker: "MSFT",
      sector: "Technology",
      quantity: 30,
      avgCost: 290,
      currentPrice: 300,
      addedAt: "2024-01-01",
    },
    {
      ticker: "NVDA",
      sector: "Technology",
      quantity: 20,
      avgCost: 450,
      currentPrice: 500,
      addedAt: "2024-01-01",
    },
    {
      ticker: "JPM",
      sector: "Financials",
      quantity: 40,
      avgCost: 130,
      currentPrice: 150,
      addedAt: "2024-01-01",
    },
    {
      ticker: "XOM",
      sector: "Energy",
      quantity: 60,
      avgCost: 80,
      currentPrice: 100,
      addedAt: "2024-01-01",
    },
  ]),
}));

describe("rebalance-card", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("mounts and renders trade table", async () => {
    const mod = await import("../../../src/cards/rebalance-card");
    mod.default.mount(container, { route: "rebalance", params: {} });

    // Allow async mount to resolve
    await new Promise((r) => setTimeout(r, 50));

    expect(container.innerHTML).toContain("Portfolio Rebalance");
    expect(container.innerHTML).toContain("AAPL");
    expect(container.innerHTML).toContain("MSFT");
    expect(container.innerHTML).toContain("Target");
    expect(container.innerHTML).toContain("Drift");
  });

  it("shows status badge", async () => {
    const mod = await import("../../../src/cards/rebalance-card");
    mod.default.mount(container, { route: "rebalance", params: {} });

    await new Promise((r) => setTimeout(r, 50));

    // Should have either "Balanced" or "Rebalance needed"
    const html = container.innerHTML;
    expect(html.match(/Balanced|Rebalance needed/)).toBeTruthy();
  });
});
