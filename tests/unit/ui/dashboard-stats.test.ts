import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../src/providers/provider-registry", () => ({
  getHealthSnapshot: vi.fn(() => ({
    entries: [
      { name: "yahoo", breakerState: "closed", breakerFailures: 0, health: { status: "ok" } },
      { name: "finnhub", breakerState: "open", breakerFailures: 5, health: { status: "degraded" } },
    ],
    capturedAt: Date.now(),
  })),
}));

vi.mock("../../../src/core/data-freshness", () => ({
  getAllFreshness: vi.fn(() => [
    {
      ticker: "AAPL",
      level: "fresh",
      ageMs: 1000,
      lastFetchedAt: Date.now() - 1000,
      label: "1s ago",
    },
    {
      ticker: "MSFT",
      level: "stale",
      ageMs: 360000,
      lastFetchedAt: Date.now() - 360000,
      label: "6m ago",
    },
    {
      ticker: "GOOG",
      level: "expired",
      ageMs: 2000000,
      lastFetchedAt: Date.now() - 2000000,
      label: "33m ago",
    },
  ]),
}));

vi.mock("../../../src/core/config", () => ({
  loadConfig: vi.fn(() => ({
    watchlist: [{ ticker: "AAPL" }, { ticker: "MSFT" }, { ticker: "GOOG" }],
    refreshIntervalMs: 30000,
  })),
}));

vi.mock("../../../src/core/app-store", () => {
  const listeners = new Set<(v: unknown) => void>();
  return {
    tickerDataStore: {
      subscribe: (fn: (v: unknown) => void) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
    },
  };
});

import { gatherStats, initDashboardStats } from "../../../src/ui/dashboard-stats";

describe("dashboard-stats", () => {
  beforeEach(() => {
    document.body.innerHTML = `<footer id="app-footer"><span id="app-version">v1</span></footer>`;
  });

  it("gatherStats returns correct counts", () => {
    const stats = gatherStats();
    expect(stats.watchlistCount).toBe(3);
    expect(stats.activeProviders).toBe(1); // only yahoo (closed)
    expect(stats.totalProviders).toBe(2);
    expect(stats.freshCount).toBe(1);
    expect(stats.staleCount).toBe(1);
    expect(stats.expiredCount).toBe(1);
  });

  it("initDashboardStats inserts stats element into footer", () => {
    initDashboardStats();
    const el = document.getElementById("dashboard-stats");
    expect(el).not.toBeNull();
    expect(el?.parentElement?.id).toBe("app-footer");
  });

  it("renders provider count correctly", () => {
    initDashboardStats();
    const el = document.getElementById("dashboard-stats");
    expect(el?.innerHTML).toContain("1/2 providers");
  });

  it("renders watchlist count correctly", () => {
    initDashboardStats();
    const el = document.getElementById("dashboard-stats");
    expect(el?.innerHTML).toContain("3");
  });

  it("cleanup removes stats element", () => {
    const cleanup = initDashboardStats();
    expect(document.getElementById("dashboard-stats")).not.toBeNull();
    cleanup();
    expect(document.getElementById("dashboard-stats")).toBeNull();
  });

  it("does nothing when no footer exists", () => {
    document.body.innerHTML = "";
    const cleanup = initDashboardStats();
    expect(document.getElementById("dashboard-stats")).toBeNull();
    cleanup(); // should not throw
  });
});
