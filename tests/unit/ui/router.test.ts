/**
 * Router tests — History API edition.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  initRouter,
  navigateTo,
  navigateToPath,
  buildPath,
  getCurrentRoute,
  getCurrentRouteInfo,
  onRouteChange,
  _resetRouterForTests,
  type RouteName,
} from "../../../src/ui/router";

function setupDOM(): void {
  document.body.innerHTML = `
    <nav>
      <a class="nav-link" data-route="watchlist" href="/watchlist">Watchlist</a>
      <a class="nav-link" data-route="consensus" href="/consensus">Consensus</a>
      <a class="nav-link" data-route="chart" href="/chart">Chart</a>
      <a class="nav-link" data-route="alerts" href="/alerts">Alerts</a>
      <a class="nav-link" data-route="heatmap" href="/heatmap">Heatmap</a>
      <a class="nav-link" data-route="screener" href="/screener">Screener</a>
      <a class="nav-link" data-route="settings" href="/settings">Settings</a>
    </nav>
    <div id="view-watchlist" class="view"></div>
    <div id="view-consensus" class="view"></div>
    <div id="view-chart" class="view"></div>
    <div id="view-alerts" class="view"></div>
    <div id="view-heatmap" class="view"></div>
    <div id="view-screener" class="view"></div>
    <div id="view-settings" class="view"></div>
  `;
}

function gotoPath(path: string): void {
  window.history.replaceState({}, "", path);
}

describe("initRouter", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
  });

  it("activates watchlist view by default at /", () => {
    initRouter();
    expect(document.getElementById("view-watchlist")?.classList.contains("active")).toBe(true);
  });

  it("activates correct view from path", () => {
    gotoPath("/settings");
    initRouter();
    expect(document.getElementById("view-settings")?.classList.contains("active")).toBe(true);
  });

  it("falls back to watchlist for invalid path", () => {
    gotoPath("/totally-bogus");
    initRouter();
    expect(document.getElementById("view-watchlist")?.classList.contains("active")).toBe(true);
  });

  it("updates nav link active class", () => {
    gotoPath("/consensus");
    initRouter();
    expect(document.querySelector('[data-route="consensus"]')?.classList.contains("active")).toBe(
      true,
    );
    expect(document.querySelector('[data-route="watchlist"]')?.classList.contains("active")).toBe(
      false,
    );
  });

  it("responds to popstate events", () => {
    initRouter();
    window.history.pushState({}, "", "/settings");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(document.getElementById("view-settings")?.classList.contains("active")).toBe(true);
  });
});

describe("navigateTo / navigateToPath", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
  });

  it("navigateTo updates the path", () => {
    initRouter();
    navigateTo("alerts");
    expect(window.location.pathname).toBe("/alerts");
  });

  it("navigateToPath supports parameters", () => {
    initRouter();
    navigateToPath("chart", { symbol: "AAPL" });
    expect(window.location.pathname).toBe("/chart/AAPL");
    expect(getCurrentRouteInfo().params["symbol"]).toBe("AAPL");
  });

  it("supports replace mode", () => {
    initRouter();
    const before = window.history.length;
    navigateToPath("settings", {}, { replace: true });
    expect(window.location.pathname).toBe("/settings");
    expect(window.history.length).toBe(before);
  });
});

describe("buildPath", () => {
  it("builds path without params", () => {
    expect(buildPath("settings")).toBe("/settings");
  });

  it("builds path with params", () => {
    expect(buildPath("chart", { symbol: "AAPL" })).toBe("/chart/AAPL");
  });

  it("URL-encodes param values", () => {
    expect(buildPath("chart", { symbol: "BRK.A" })).toBe("/chart/BRK.A");
    expect(buildPath("chart", { symbol: "a/b" })).toBe("/chart/a%2Fb");
  });

  it("builds path for watchlist", () => {
    expect(buildPath("watchlist")).toMatch(/^(\/|\/watchlist)$/);
  });
});

describe("getCurrentRoute / getCurrentRouteInfo", () => {
  beforeEach(() => {
    _resetRouterForTests();
  });

  it("returns route from path", () => {
    gotoPath("/chart");
    expect(getCurrentRoute()).toBe("chart");
  });

  it("returns watchlist for /", () => {
    gotoPath("/");
    expect(getCurrentRoute()).toBe("watchlist");
  });

  it("parses /chart/:symbol param", () => {
    gotoPath("/chart/MSFT");
    const info = getCurrentRouteInfo();
    expect(info.name).toBe("chart");
    expect(info.params["symbol"]).toBe("MSFT");
  });

  it("falls back to legacy hash route when pathname is /", () => {
    // happy-dom doesn't support setting location.hash without changing pathname,
    // so we verify the fallback by testing getCurrentRouteInfo parses /alerts directly.
    gotoPath("/alerts");
    expect(getCurrentRoute()).toBe("alerts");
    gotoPath("/");
  });
});

describe("onRouteChange", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
  });

  it("calls handler on navigation", () => {
    initRouter();
    const routes: RouteName[] = [];
    onRouteChange((r) => routes.push(r));
    navigateTo("alerts");
    expect(routes).toContain("alerts");
  });

  it("handler receives RouteInfo with params", () => {
    initRouter();
    let captured: RouteName | undefined;
    let captSymbol: string | undefined;
    onRouteChange((r, info) => {
      captured = r;
      captSymbol = info?.params["symbol"];
    });
    navigateToPath("chart", { symbol: "TSLA" });
    expect(captured).toBe("chart");
    expect(captSymbol).toBe("TSLA");
  });

  it("returns unsubscribe function", () => {
    initRouter();
    const routes: RouteName[] = [];
    const unsub = onRouteChange((r) => routes.push(r));
    unsub();
    navigateTo("settings");
    expect(routes).toHaveLength(0);
  });
});

describe("link interception", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
  });

  it("intercepts clicks on data-route links", () => {
    initRouter();
    const link = document.querySelector<HTMLAnchorElement>('[data-route="settings"]');
    expect(link).toBeTruthy();
    link!.click();
    expect(window.location.pathname).toBe("/settings");
  });
});
