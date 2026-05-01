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
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
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

  it("renders bearish (red) sparkline when last close < first close", () => {
    const prices = Array.from({ length: 5 }, (_, i) => ({
      date: `2024-01-0${i + 1}`,
      close: 200 - i * 5, // decreasing
    }));
    localStorage.setItem("crosstide-cache-MSFT", JSON.stringify(prices));
    localStorage.setItem(
      "crosstide-multi-chart",
      JSON.stringify({ layout: "2x2", tickers: ["MSFT", "", "", ""] }),
    );
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const path = container.querySelector<SVGPathElement>("path");
    expect(path).not.toBeNull();
    // Bearish color should include the bearish CSS variable
    expect(path!.getAttribute("stroke")).toContain("bearish");
  });

  it("renders price label when prices exist", () => {
    const prices = Array.from({ length: 5 }, (_, i) => ({
      date: `2024-01-0${i + 1}`,
      close: 100 + i,
    }));
    localStorage.setItem("crosstide-cache-GOOG", JSON.stringify(prices));
    localStorage.setItem(
      "crosstide-multi-chart",
      JSON.stringify({ layout: "2x2", tickers: ["GOOG", "", "", ""] }),
    );
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const labels = container.querySelectorAll(".mc-price-label");
    const hasLabel = Array.from(labels).some((el) => el.textContent?.includes("GOOG"));
    expect(hasLabel).toBe(true);
  });

  it("changing ticker via select re-renders panel", () => {
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const firstSelect = container.querySelector<HTMLSelectElement>(
      "[data-panel='0'] .mc-ticker-select",
    );
    expect(firstSelect).not.toBeNull();
    firstSelect!.value = "MSFT";
    firstSelect!.dispatchEvent(new Event("change"));
    // After change the panel should now reference MSFT
    const stored = JSON.parse(localStorage.getItem("crosstide-multi-chart")!) as {
      tickers: string[];
    };
    expect(stored.tickers[0]).toBe("MSFT");
  });

  it("ignores invalid state from localStorage and uses defaults", () => {
    localStorage.setItem("crosstide-multi-chart", JSON.stringify({ bad: "data" }));
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    // Should still render a grid (default state)
    expect(container.querySelector(".mc-grid")).not.toBeNull();
  });

  it("ignores corrupt JSON in localStorage", () => {
    localStorage.setItem("crosstide-multi-chart", "not-valid-json");
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    expect(container.querySelector(".mc-grid")).not.toBeNull();
  });

  it("renders 1+3 layout with first panel large", () => {
    localStorage.setItem(
      "crosstide-multi-chart",
      JSON.stringify({ layout: "1+3", tickers: ["AAPL", "MSFT", "GOOG", ""] }),
    );
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    const firstPanel = container.querySelector<HTMLDivElement>("[data-panel='0']");
    expect(firstPanel?.className).toContain("mc-panel--large");
  });

  it("clicking active layout button does nothing", () => {
    multiChartLayoutCard.mount(container, { route: "multi-chart", params: {} });
    // Default is 2x2, click 2x2 again
    const btn2x2 = container.querySelector<HTMLButtonElement>('[data-layout="2x2"]');
    btn2x2?.click();
    // Grid should still be 2x2
    const grid = container.querySelector(".mc-grid");
    expect(grid?.className).toContain("2x2");
  });
});
