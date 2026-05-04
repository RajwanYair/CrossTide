/**
 * Router additional coverage — branches not hit by the main suite:
 *   - initRouter() called twice without reset (initialized=true branch)
 *   - ?spa-redirect query param (SPA fallback redirect branch)
 *   - Link click with data-param* attributes (param extraction branch)
 *   - Link click with modifier keys (early-return branch)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  initRouter,
  onRouteChange,
  _resetRouterForTests,
  type RouteName,
} from "../../../src/ui/router";

function setupDOM(): void {
  document.body.innerHTML = `
    <nav>
      <a class="nav-link" data-route="watchlist" href="/watchlist">Watchlist</a>
      <a class="nav-link" data-route="chart" href="/chart">Chart</a>
      <a class="nav-link" data-route="settings" href="/settings">Settings</a>
    </nav>
    <div id="view-watchlist" class="view"></div>
    <div id="view-chart" class="view"></div>
    <div id="view-settings" class="view"></div>
    <div id="view-consensus" class="view"></div>
    <div id="view-alerts" class="view"></div>
    <div id="view-heatmap" class="view"></div>
    <div id="view-screener" class="view"></div>
    <div id="view-portfolio" class="view"></div>
    <div id="view-risk" class="view"></div>
    <div id="view-backtest" class="view"></div>
    <div id="view-consensus-timeline" class="view"></div>
    <div id="view-signal-dsl" class="view"></div>
    <div id="view-multi-chart" class="view"></div>
    <div id="view-provider-health" class="view"></div>
  `;
}

function gotoPath(path: string): void {
  window.history.replaceState({}, "", path);
}

describe("initRouter — already-initialized branch", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
  });

  it("second call to initRouter still handles the current route", () => {
    initRouter(); // first call — initializes
    gotoPath("/settings");
    initRouter(); // second call — hits the `if (initialized)` branch
    expect(document.getElementById("view-settings")?.classList.contains("active")).toBe(true);
  });

  it("second initRouter call fires route-change listeners", () => {
    initRouter();
    const routes: RouteName[] = [];
    onRouteChange((r) => routes.push(r));
    gotoPath("/chart");
    initRouter(); // second call
    expect(routes).toContain("chart");
  });
});

describe("initRouter — spa-redirect branch", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
  });

  it("restores URL from ?spa-redirect param on init", () => {
    // Simulate the 404.html redirect: the target path is in the query string
    gotoPath("/?spa-redirect=/settings");
    initRouter();
    // After init, the URL should be replaced to /settings
    expect(window.location.pathname).toBe("/settings");
    expect(document.getElementById("view-settings")?.classList.contains("active")).toBe(true);
  });

  it("does not redirect when spa-redirect param is absent", () => {
    gotoPath("/");
    initRouter();
    expect(window.location.pathname).toBe("/");
  });
});

describe("link interception — modifier keys skip navigation", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
    initRouter();
  });

  it("ctrlKey click does not fire router route-change handler", () => {
    const routes: RouteName[] = [];
    // Register AFTER init so we don't capture the initial handleRoute call
    const unsub = onRouteChange((r) => routes.push(r));
    const link = document.querySelector<HTMLAnchorElement>('[data-route="settings"]')!;
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
    // Router should NOT have fired a route change (it returned early)
    expect(routes).not.toContain("settings");
    unsub();
  });

  it("metaKey click does not fire router route-change handler", () => {
    const routes: RouteName[] = [];
    const unsub = onRouteChange((r) => routes.push(r));
    const link = document.querySelector<HTMLAnchorElement>('[data-route="settings"]')!;
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
    expect(routes).not.toContain("settings");
    unsub();
  });
});

describe("link interception — data-param extraction", () => {
  beforeEach(() => {
    _resetRouterForTests();
    gotoPath("/");
    document.body.innerHTML = `
      <nav>
        <a class="nav-link"
           data-route="chart"
           data-param-symbol="TSLA"
           href="/chart/TSLA">Chart TSLA</a>
      </nav>
      <div id="view-chart" class="view"></div>
      <div id="view-watchlist" class="view"></div>
      <div id="view-settings" class="view"></div>
    `;
    initRouter();
  });

  it("extracts data-param-* attributes and passes as route params", () => {
    const captured: Array<{ name: string; symbol?: string }> = [];
    onRouteChange((_r, info) => {
      captured.push({ name: info?.name ?? "", symbol: info?.params["symbol"] });
    });

    const link = document.querySelector<HTMLAnchorElement>('[data-route="chart"]')!;
    link.click();

    expect(captured.some((c) => c.name === "chart" && c.symbol === "TSLA")).toBe(true);
  });
});
