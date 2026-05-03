/**
 * Registry coverage boost — covers the 6 late-registered card routes
 * (correlation, market-breadth, earnings-calendar, macro-dashboard,
 * sector-rotation, relative-strength) that were missing mocks in the
 * primary test file, plus loadCard cache eviction on failure.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getCardEntry,
  loadCard,
  _resetRegistryCacheForTests,
  type CardModule,
} from "../../../src/cards/registry";

// Mock ALL 20 card modules so every import() resolves
vi.mock("../../../src/cards/watchlist-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/consensus-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/chart-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/alerts-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/heatmap-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/screener-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/settings-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/provider-health-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/portfolio-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/risk-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/backtest-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/consensus-timeline-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/signal-dsl-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/multi-chart-layout", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/correlation-matrix-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/market-breadth-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/earnings-calendar-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/macro-dashboard-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/sector-rotation-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/relative-strength-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));

describe("loadCard — late-registered routes (lines 127–157)", () => {
  beforeEach(() => {
    _resetRegistryCacheForTests();
  });

  const LATE_ROUTES = [
    "correlation",
    "market-breadth",
    "earnings-calendar",
    "macro-dashboard",
    "sector-rotation",
    "relative-strength",
  ] as const;

  for (const route of LATE_ROUTES) {
    it(`loads ${route} card module`, async () => {
      const mod = await loadCard(route);
      expect(typeof mod.mount).toBe("function");
    });
  }

  it("loads all 20 routes successfully", async () => {
    const allRoutes = [
      "watchlist",
      "consensus",
      "chart",
      "alerts",
      "heatmap",
      "screener",
      "settings",
      "provider-health",
      "portfolio",
      "risk",
      "backtest",
      "consensus-timeline",
      "signal-dsl",
      "multi-chart",
      "correlation",
      "market-breadth",
      "earnings-calendar",
      "macro-dashboard",
      "sector-rotation",
      "relative-strength",
    ] as const;

    const results = await Promise.all(allRoutes.map((r) => loadCard(r)));
    expect(results).toHaveLength(20);
    for (const mod of results) {
      expect(typeof mod.mount).toBe("function");
    }
  });

  it("getCardEntry returns correct metadata for late routes", () => {
    for (const route of LATE_ROUTES) {
      const entry = getCardEntry(route);
      expect(entry).toBeDefined();
      expect(entry!.viewId).toBe(`view-${route}`);
      expect(entry!.title.length).toBeGreaterThan(0);
    }
  });

  it("caches late-route loads (same Promise reference)", async () => {
    const p1 = loadCard("correlation");
    const p2 = loadCard("correlation");
    expect(p1).toBe(p2);
    await p1;
  });

  it("evicts cache on load failure and retries successfully", async () => {
    const entry = getCardEntry("market-breadth")!;
    let callCount = 0;
    const origLoad = entry.load;
    vi.spyOn(entry, "load").mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error("chunk fail"));
      return origLoad();
    });

    await expect(loadCard("market-breadth")).rejects.toThrow("chunk fail");
    // After failure the cache should be cleared — next call retries
    const mod = await loadCard("market-breadth");
    expect(typeof mod.mount).toBe("function");
    expect(callCount).toBe(2);
  });
});
