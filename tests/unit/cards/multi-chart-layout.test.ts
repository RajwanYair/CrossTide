import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import multiChartLayoutCard from "../../../src/cards/multi-chart-layout";

// Mock chart-sync so we don't need a real bus in DOM tests
vi.mock("../../../src/ui/chart-sync", () => ({
  getGlobalChartSyncBus: () => ({
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    publish: vi.fn(),
    clear: vi.fn(),
  }),
}));

// Mock loadConfig to return predictable tickers
vi.mock("../../../src/core/config", () => ({
  loadConfig: () => ({
    theme: "dark",
    watchlist: [
      { ticker: "AAPL", addedAt: "2024-01-01" },
      { ticker: "MSFT", addedAt: "2024-01-01" },
      { ticker: "GOOG", addedAt: "2024-01-01" },
    ],
  }),
}));

function storageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

describe("multi-chart-layout card", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.stubGlobal("localStorage", storageMock());
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
  });

  it("renders toolbar and grid", () => {
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    expect(container.querySelector(".mc-toolbar")).not.toBeNull();
    expect(container.querySelector(".mc-grid")).not.toBeNull();
  });

  it("renders 4 panels", () => {
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const panels = container.querySelectorAll(".mc-panel");
    expect(panels.length).toBe(4);
  });

  it("renders layout buttons for 2x2 and 1+3", () => {
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const btns = container.querySelectorAll<HTMLButtonElement>(".mc-layout-btn");
    const labels = Array.from(btns).map((b) => b.dataset["layout"]);
    expect(labels).toContain("2x2");
    expect(labels).toContain("1+3");
  });

  it("default layout is 2x2", () => {
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const grid = container.querySelector(".mc-grid");
    expect(grid?.className).toContain("2x2");
  });

  it("each panel has a ticker select with available tickers", () => {
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const selects = container.querySelectorAll<HTMLSelectElement>(".mc-ticker-select");
    expect(selects.length).toBe(4);
    // Each select should have AAPL as an option
    for (const sel of selects) {
      const opts = Array.from(sel.options).map((o) => o.value);
      expect(opts).toContain("AAPL");
      expect(opts).toContain("MSFT");
    }
  });

  it("switching layout re-renders grid", () => {
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const btn1Plus3 = container.querySelector<HTMLButtonElement>('[data-layout="1+3"]');
    btn1Plus3?.click();
    const grid = container.querySelector(".mc-grid");
    expect(grid?.className).toContain("1+3");
  });

  it("switching layout persists to localStorage", () => {
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const btn = container.querySelector<HTMLButtonElement>('[data-layout="1+3"]');
    btn?.click();
    const stored = localStorage.getItem("crosstide-multi-chart");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!) as { layout: string };
    expect(parsed.layout).toBe("1+3");
  });

  it("dispose() removes style element", () => {
    const handle = multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    // Style is injected
    expect(document.getElementById("multi-chart-styles")).not.toBeNull();
    handle?.dispose?.();
    expect(document.getElementById("multi-chart-styles")).toBeNull();
  });

  it("renders 'No data' SVG text when no cache data for ticker", () => {
    // Set a ticker in state
    localStorage.setItem(
      "crosstide-multi-chart",
      JSON.stringify({ layout: "2x2", tickers: ["AAPL", "", "", ""] }),
    );
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    // AAPL has no cache data → SVG with "No data"
    const svgTexts = container.querySelectorAll("svg text");
    const hasNoData = Array.from(svgTexts).some((t) => t.textContent?.includes("No data"));
    expect(hasNoData).toBe(true);
  });

  it("renders sparkline SVG when cache data exists", () => {
    const prices = Array.from({ length: 10 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, "0")}`,
      close: 150 + i,
    }));
    localStorage.setItem("crosstide-cache-AAPL", JSON.stringify(prices));
    localStorage.setItem(
      "crosstide-multi-chart",
      JSON.stringify({ layout: "2x2", tickers: ["AAPL", "", "", ""] }),
    );
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const svgPath = container.querySelector("path");
    expect(svgPath).not.toBeNull();
  });
});
