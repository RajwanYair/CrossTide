/**
 * Router coverage boost — targets uncovered branches:
 *   - onLinkClick with data-param* attributes
 *   - onLinkClick early return conditions
 *   - spa-redirect restoration
 *   - View Transitions API path
 *   - parsePath hash fallback
 *   - buildPath with params and multiple candidates
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  initRouter,
  navigateToPath,
  buildPath,
  getCurrentRoute,
  getCurrentRouteInfo,
  onRouteChange,
  getNavigationSignal,
  _resetRouterForTests,
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
  `;
}

function gotoPath(path: string): void {
  window.history.replaceState({}, "", path);
}

describe("router — link click interception", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
    initRouter();
  });

  afterEach(() => {
    _resetRouterForTests();
  });

  it("intercepts click on [data-route] anchor", () => {
    const link = document.querySelector<HTMLAnchorElement>('a[data-route="settings"]')!;
    const handler = vi.fn();
    onRouteChange(handler);

    link.click();

    expect(getCurrentRoute()).toBe("settings");
    expect(handler).toHaveBeenCalled();
  });

  it("does not intercept click with meta key", () => {
    gotoPath("/");
    navigateToPath("watchlist");
    const link = document.querySelector<HTMLAnchorElement>('a[data-route="settings"]')!;
    const handler = vi.fn();
    const unsub = onRouteChange(handler);
    const event = new MouseEvent("click", { metaKey: true, bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    // Handler should not fire for meta+click
    expect(handler).not.toHaveBeenCalled();
    unsub();
  });

  it("does not intercept ctrl+click", () => {
    gotoPath("/");
    navigateToPath("watchlist");
    const link = document.querySelector<HTMLAnchorElement>('a[data-route="settings"]')!;
    const handler = vi.fn();
    const unsub = onRouteChange(handler);
    const event = new MouseEvent("click", { ctrlKey: true, bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();
    unsub();
  });

  it("extracts data-param* attributes from link", () => {
    const link = document.createElement("a");
    link.setAttribute("data-route", "chart");
    link.setAttribute("data-param-symbol", "AAPL");
    link.href = "/chart/AAPL";
    document.body.appendChild(link);

    const handler = vi.fn();
    onRouteChange(handler);

    link.click();

    const info = getCurrentRouteInfo();
    expect(info.name).toBe("chart");
    expect(info.params["symbol"]).toBe("AAPL");
  });

  it("ignores click on non-route elements", () => {
    const span = document.createElement("span");
    document.body.appendChild(span);

    const handler = vi.fn();
    onRouteChange(handler);

    span.click();
    // handler not called for non-route click
    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores click on invalid route", () => {
    const link = document.createElement("a");
    link.setAttribute("data-route", "nonexistent");
    link.href = "/nonexistent";
    document.body.appendChild(link);

    const handler = vi.fn();
    onRouteChange(handler);

    link.click();
    // Should not have fired route change for invalid route
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("router — spa-redirect restoration", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
  });

  afterEach(() => {
    _resetRouterForTests();
  });

  it("restores spa-redirect query param on init", () => {
    gotoPath("/?spa-redirect=%2Fsettings");
    initRouter();
    expect(getCurrentRoute()).toBe("settings");
  });
});

describe("router — view transitions", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
  });

  afterEach(() => {
    _resetRouterForTests();
  });

  it("uses startViewTransition when available", () => {
    const transitionSpy = vi.fn((cb: () => void) => cb());
    (document as unknown as Record<string, unknown>).startViewTransition = transitionSpy;

    initRouter();
    navigateToPath("settings");

    expect(transitionSpy).toHaveBeenCalled();

    delete (document as unknown as Record<string, unknown>).startViewTransition;
  });
});

describe("router — navigation signal", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
    initRouter();
  });

  afterEach(() => {
    _resetRouterForTests();
  });

  it("returns an AbortSignal", () => {
    const signal = getNavigationSignal();
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
  });

  it("aborts previous signal on navigation", () => {
    const signal = getNavigationSignal();
    navigateToPath("settings");
    expect(signal.aborted).toBe(true);
  });
});

describe("router — buildPath edge cases", () => {
  it("builds /chart/:symbol when symbol param is provided", () => {
    const path = buildPath("chart", { symbol: "NVDA" });
    expect(path).toContain("/chart/NVDA");
  });

  it("builds /chart without param when none provided", () => {
    const path = buildPath("chart");
    expect(path).toContain("/chart");
    expect(path).not.toContain("undefined");
  });

  it("encodes special characters in params", () => {
    const path = buildPath("chart", { symbol: "BRK.B" });
    expect(path).toContain("BRK.B");
  });

  it("builds path for route without pattern", () => {
    // relative-strength has no explicit PATTERNS entry — fallback to [route]
    const path = buildPath("relative-strength");
    expect(path).toContain("relative-strength");
  });
});

describe("router — hash fallback", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
  });

  afterEach(() => {
    _resetRouterForTests();
    window.location.hash = "";
  });

  it("resolves legacy hash route on root path", () => {
    gotoPath("/");
    window.location.hash = "#settings";
    initRouter();
    expect(getCurrentRoute()).toBe("settings");
  });
});

describe("router — navigateToPath replace mode", () => {
  beforeEach(() => {
    _resetRouterForTests();
    setupDOM();
    gotoPath("/");
    initRouter();
  });

  afterEach(() => {
    _resetRouterForTests();
  });

  it("replaces history entry when opts.replace is true", () => {
    const lengthBefore = window.history.length;
    navigateToPath("settings", {}, { replace: true });
    expect(getCurrentRoute()).toBe("settings");
    // History length should not increase on replace
    expect(window.history.length).toBe(lengthBefore);
  });
});
