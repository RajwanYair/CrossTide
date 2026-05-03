/**
 * Card registry tests — lazy loader, metadata, cache behaviour.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getCardEntry,
  listCards,
  loadCard,
  _resetRegistryCacheForTests,
  type CardModule,
  type CardContext,
} from "../../../src/cards/registry";

// Stub dynamic-import resolution inside the registry for unit tests.
// We mock at the module level so the registry's import() calls resolve
// to our minimal CardModule stubs.
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
vi.mock("../../../src/cards/seasonality-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));
vi.mock("../../../src/cards/multi-chart-layout", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));

const CTX: CardContext = { route: "watchlist", params: {} };

describe("listCards", () => {
  it("returns 22 entries covering all routes", () => {
    const cards = listCards();
    expect(cards).toHaveLength(22);
    const routes = cards.map((c) => c.route);
    expect(routes).toContain("watchlist");
    expect(routes).toContain("consensus");
    expect(routes).toContain("chart");
    expect(routes).toContain("alerts");
    expect(routes).toContain("heatmap");
    expect(routes).toContain("screener");
    expect(routes).toContain("settings");
    expect(routes).toContain("provider-health");
    expect(routes).toContain("portfolio");
    expect(routes).toContain("risk");
    expect(routes).toContain("backtest");
    expect(routes).toContain("consensus-timeline");
    expect(routes).toContain("signal-dsl");
    expect(routes).toContain("multi-chart");
    expect(routes).toContain("correlation");
    expect(routes).toContain("market-breadth");
    expect(routes).toContain("earnings-calendar");
    expect(routes).toContain("macro-dashboard");
    expect(routes).toContain("sector-rotation");
    expect(routes).toContain("relative-strength");
    expect(routes).toContain("seasonality");
  });

  it("each entry has a title and viewId", () => {
    for (const card of listCards()) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.viewId).toBe(`view-${card.route}`);
    }
  });
});

describe("getCardEntry", () => {
  it("finds entry by route", () => {
    const entry = getCardEntry("settings");
    expect(entry?.route).toBe("settings");
    expect(entry?.viewId).toBe("view-settings");
  });

  it("returns undefined for unknown route", () => {
    expect(getCardEntry("unknown" as never)).toBeUndefined();
  });
});

describe("loadCard", () => {
  beforeEach(() => {
    _resetRegistryCacheForTests();
  });

  it("resolves to a CardModule with mount", async () => {
    const mod = await loadCard("watchlist");
    expect(typeof mod.mount).toBe("function");
  });

  it("caches subsequent loads (same Promise reference)", async () => {
    const p1 = loadCard("consensus");
    const p2 = loadCard("consensus");
    expect(p1).toBe(p2);
    await p1;
  });

  it("resolves for all 14 routes", async () => {
    const routes = [
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
    ] as const;
    await Promise.all(routes.map((r) => loadCard(r)));
  });

  it("rejects for unknown route", async () => {
    await expect(loadCard("unknown" as never)).rejects.toThrow("Unknown route");
  });

  it("mount can be called with container and ctx", async () => {
    const container = document.createElement("div");
    const mod = await loadCard("watchlist");
    expect(() => mod.mount(container, CTX)).not.toThrow();
  });

  it("evicts cache on load failure so next call retries", async () => {
    // First call: make the load() throw
    const entry = getCardEntry("watchlist")!;
    const origLoad = entry.load;
    let callCount = 0;
    vi.spyOn(entry, "load").mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error("chunk failed"));
      return origLoad();
    });

    await expect(loadCard("watchlist")).rejects.toThrow("chunk failed");
    // Second call should retry (cache was cleared)
    const mod = await loadCard("watchlist");
    expect(typeof mod.mount).toBe("function");
    vi.restoreAllMocks();
  });
});
