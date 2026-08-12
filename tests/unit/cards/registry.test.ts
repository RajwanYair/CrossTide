/**
 * Card registry tests — lazy loader, metadata, cache behaviour.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getCardEntry,
  listCards,
  loadCard,
  createCardLifecycleStore,
  _resetRegistryCacheForTests,
  type CardModule,
  type CardContext,
  type CardHandle,
} from "../../../src/cards/registry";
import { buildPath, getCurrentRouteInfo } from "../../../src/ui/router";

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
vi.mock("../../../src/cards/news-feed-card", () => ({
  default: { mount: vi.fn(() => ({})) } satisfies CardModule,
}));

const CTX: CardContext = { route: "watchlist", params: {} };

describe("listCards", () => {
  it("returns 25 entries covering all routes", () => {
    const cards = listCards();
    expect(cards).toHaveLength(25);
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
    expect(routes).toContain("news-feed");
  });

  it("each entry has a title and viewId", () => {
    for (const card of listCards()) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.viewId).toBe(`view-${card.route}`);
    }
  });
});

describe("E2E card matrix", () => {
  // The Playwright matrix hand-mirrors the registry because importing the card
  // graph into the Node test runner would pull in DOM-only modules. Parse it as
  // text so a newly registered card cannot ship without an E2E guard.
  // Resolved from the Vitest root: happy-dom rewrites `import.meta.url` to a
  // non-`file:` scheme, so `fileURLToPath` is unusable in this project.
  const spec = readFileSync(resolve(process.cwd(), "tests/e2e/cards.spec.ts"), {
    encoding: "utf8",
  });
  const covered = new Set([...spec.matchAll(/\{\s*route:\s*"([^"]+)"/g)].map((m) => m[1] ?? ""));

  it("covers every registered card route", () => {
    const missing = listCards()
      .map((c) => c.route)
      .filter((route) => !covered.has(route));
    expect(missing).toEqual([]);
  });

  it("does not reference routes that no longer exist", () => {
    const known = new Set(listCards().map((c) => c.route));
    expect([...covered].filter((route) => !known.has(route))).toEqual([]);
  });
});

describe("router parity", () => {
  it("round-trips every registered route through the router", () => {
    for (const card of listCards()) {
      const path = buildPath(card.route);
      window.history.replaceState({}, "", path);
      expect(getCurrentRouteInfo().name, card.route).toBe(card.route);
    }
  });
});

describe("view container parity", () => {
  it("has an index view container for every registered card", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const missing = listCards()
      .map((card) => card.viewId)
      .filter((viewId) => !html.includes(`id="${viewId}"`));
    expect(missing).toEqual([]);
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

  it("resolves for the initial card routes", async () => {
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
      "news-feed",
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

describe("card lifecycle store", () => {
  it("disposes inactive handles and removes them from the store", () => {
    const store = createCardLifecycleStore();
    const disposeWatchlist = vi.fn();
    const disposeChart = vi.fn();
    store.set("watchlist", { dispose: disposeWatchlist });
    store.set("chart", { dispose: disposeChart });

    store.disposeInactive("chart");

    expect(disposeWatchlist).toHaveBeenCalledOnce();
    expect(disposeChart).not.toHaveBeenCalled();
    expect(store.get("watchlist")).toBeUndefined();
    expect(store.get("chart")).toBeDefined();
  });

  it("removes inactive handles without a dispose hook", () => {
    const store = createCardLifecycleStore();
    const handleWithoutDispose: CardHandle = { update: vi.fn() };
    store.set("watchlist", handleWithoutDispose);

    store.disposeInactive("chart");

    expect(store.get("watchlist")).toBeUndefined();
  });

  it("disposes every active handle on shutdown", () => {
    const store = createCardLifecycleStore();
    const disposeWatchlist = vi.fn();
    const disposeChart = vi.fn();
    store.set("watchlist", { dispose: disposeWatchlist });
    store.set("chart", { dispose: disposeChart });

    store.disposeAll();

    expect(disposeWatchlist).toHaveBeenCalledOnce();
    expect(disposeChart).toHaveBeenCalledOnce();
    expect(store.get("watchlist")).toBeUndefined();
    expect(store.get("chart")).toBeUndefined();
  });

  it("disposes a late handle mounted for an inactive route", () => {
    const store = createCardLifecycleStore();
    const disposeLateHandle = vi.fn();

    store.disposeInactive("chart");
    store.set("watchlist", { dispose: disposeLateHandle });

    expect(disposeLateHandle).toHaveBeenCalledOnce();
    expect(store.get("watchlist")).toBeUndefined();
  });

  it("disposes a handle that resolves after shutdown", () => {
    const store = createCardLifecycleStore();
    const disposeLateHandle = vi.fn();

    store.disposeAll();
    store.set("chart", { dispose: disposeLateHandle });

    expect(disposeLateHandle).toHaveBeenCalledOnce();
    expect(store.get("chart")).toBeUndefined();
  });
});
