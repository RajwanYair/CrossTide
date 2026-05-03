/**
 * Ticker navigation tests — verifies that selecting a ticker in the watchlist
 * propagates the symbol to all cards that consume ctx.params["symbol"].
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  initRouter,
  navigateToPath,
  buildPath,
  getCurrentRouteInfo,
  onRouteChange,
  _resetRouterForTests,
} from "../../src/ui/router";
import { selectedTickerStore } from "../../src/core/app-store";

function setupDOM(): void {
  document.body.innerHTML = `
    <nav>
      <a class="nav-link" data-route="watchlist" href="/watchlist">Watchlist</a>
      <a class="nav-link" data-route="chart" href="/chart">Chart</a>
      <a class="nav-link" data-route="consensus" href="/consensus">Consensus</a>
      <a class="nav-link" data-route="backtest" href="/backtest">Backtest</a>
      <a class="nav-link" data-route="consensus-timeline" href="/consensus-timeline">Timeline</a>
      <a class="nav-link" data-route="comparison" href="/comparison">Comparison</a>
      <a class="nav-link" data-route="seasonality" href="/seasonality">Seasonality</a>
    </nav>
    <div id="view-watchlist" class="view"></div>
    <div id="view-chart" class="view"></div>
    <div id="view-consensus" class="view"></div>
    <div id="view-backtest" class="view"></div>
    <div id="view-consensus-timeline" class="view"></div>
    <div id="view-comparison" class="view"></div>
    <div id="view-seasonality" class="view"></div>
  `;
}

function gotoPath(path: string): void {
  window.history.replaceState({}, "", path);
}

describe("Ticker navigation — route params", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
    selectedTickerStore.set("");
  });

  describe("navigateToPath with symbol param", () => {
    it("chart route carries the symbol param", () => {
      initRouter();
      navigateToPath("chart", { symbol: "INTC" });
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("chart");
      expect(info.params["symbol"]).toBe("INTC");
    });

    it("consensus route carries the symbol param", () => {
      initRouter();
      navigateToPath("consensus", { symbol: "INTC" });
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("consensus");
      expect(info.params["symbol"]).toBe("INTC");
    });

    it("backtest route carries the symbol param", () => {
      initRouter();
      navigateToPath("backtest", { symbol: "TSLA" });
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("backtest");
      expect(info.params["symbol"]).toBe("TSLA");
    });

    it("consensus-timeline route carries the symbol param", () => {
      initRouter();
      navigateToPath("consensus-timeline", { symbol: "NVDA" });
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("consensus-timeline");
      expect(info.params["symbol"]).toBe("NVDA");
    });

    it("comparison route carries the symbol param", () => {
      initRouter();
      navigateToPath("comparison", { symbol: "AMD" });
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("comparison");
      expect(info.params["symbol"]).toBe("AMD");
    });

    it("seasonality route carries the symbol param", () => {
      initRouter();
      navigateToPath("seasonality", { symbol: "MSFT" });
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("seasonality");
      expect(info.params["symbol"]).toBe("MSFT");
    });
  });

  describe("buildPath generates correct URLs with symbol", () => {
    it("builds /chart/INTC", () => {
      expect(buildPath("chart", { symbol: "INTC" })).toBe("/chart/INTC");
    });

    it("builds /consensus/INTC", () => {
      expect(buildPath("consensus", { symbol: "INTC" })).toBe("/consensus/INTC");
    });

    it("builds /backtest/TSLA", () => {
      expect(buildPath("backtest", { symbol: "TSLA" })).toBe("/backtest/TSLA");
    });

    it("builds /consensus-timeline/NVDA", () => {
      expect(buildPath("consensus-timeline", { symbol: "NVDA" })).toBe("/consensus-timeline/NVDA");
    });

    it("builds /comparison/AMD", () => {
      expect(buildPath("comparison", { symbol: "AMD" })).toBe("/comparison/AMD");
    });

    it("builds /seasonality/MSFT", () => {
      expect(buildPath("seasonality", { symbol: "MSFT" })).toBe("/seasonality/MSFT");
    });

    it("builds route without symbol (fallback to no-param pattern)", () => {
      expect(buildPath("consensus")).toBe("/consensus");
      expect(buildPath("backtest")).toBe("/backtest");
    });
  });

  describe("URL parsing extracts symbol", () => {
    it("parses /consensus/INTC", () => {
      gotoPath("/consensus/INTC");
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("consensus");
      expect(info.params["symbol"]).toBe("INTC");
    });

    it("parses /backtest/AAPL", () => {
      gotoPath("/backtest/AAPL");
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("backtest");
      expect(info.params["symbol"]).toBe("AAPL");
    });

    it("parses /consensus-timeline/JPM", () => {
      gotoPath("/consensus-timeline/JPM");
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("consensus-timeline");
      expect(info.params["symbol"]).toBe("JPM");
    });

    it("parses /comparison/GOOGL", () => {
      gotoPath("/comparison/GOOGL");
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("comparison");
      expect(info.params["symbol"]).toBe("GOOGL");
    });

    it("parses /seasonality/XOM", () => {
      gotoPath("/seasonality/XOM");
      const info = getCurrentRouteInfo();
      expect(info.name).toBe("seasonality");
      expect(info.params["symbol"]).toBe("XOM");
    });

    it("decodes URL-encoded symbols like BRK.A", () => {
      gotoPath("/chart/BRK.A");
      const info = getCurrentRouteInfo();
      expect(info.params["symbol"]).toBe("BRK.A");
    });
  });
});

describe("selectedTickerStore integration", () => {
  beforeEach(() => {
    selectedTickerStore.set("");
  });

  it("stores the selected ticker", () => {
    selectedTickerStore.set("INTC");
    expect(selectedTickerStore.peek()).toBe("INTC");
  });

  it("updates when a new ticker is selected", () => {
    selectedTickerStore.set("AAPL");
    expect(selectedTickerStore.peek()).toBe("AAPL");
    selectedTickerStore.set("INTC");
    expect(selectedTickerStore.peek()).toBe("INTC");
  });

  it("can be cleared", () => {
    selectedTickerStore.set("NVDA");
    selectedTickerStore.set("");
    expect(selectedTickerStore.peek()).toBe("");
  });
});

describe("Card context receives symbol from route", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
    selectedTickerStore.set("");
  });

  it("onRouteChange callback receives symbol param for consensus", () => {
    initRouter();
    const captured: string[] = [];
    onRouteChange((_route, info) => {
      captured.push(info?.params["symbol"] ?? "");
    });
    navigateToPath("consensus", { symbol: "INTC" });
    expect(captured).toContain("INTC");
  });

  it("onRouteChange callback receives symbol param for chart", () => {
    initRouter();
    const captured: string[] = [];
    onRouteChange((_route, info) => {
      captured.push(info?.params["symbol"] ?? "");
    });
    navigateToPath("chart", { symbol: "TSLA" });
    expect(captured).toContain("TSLA");
  });

  it("onRouteChange receives symbol for backtest route", () => {
    initRouter();
    const captured: string[] = [];
    onRouteChange((_route, info) => {
      captured.push(info?.params["symbol"] ?? "");
    });
    navigateToPath("backtest", { symbol: "AMZN" });
    expect(captured).toContain("AMZN");
  });
});
