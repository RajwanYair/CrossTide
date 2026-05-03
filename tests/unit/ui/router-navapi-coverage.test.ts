/**
 * Coverage for router.ts — Navigation API (`onNavigateEvent`) + initRouter Navigation API branch.
 * Targets lines 295-307 (onNavigateEvent body), 330 (navigation in window), 345 (_reset navigation removal).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initRouter, _resetRouterForTests, onRouteChange } from "../../../src/ui/router";

describe("router coverage — Navigation API (lines 295-307, 330, 345)", () => {
  let navigateHandler: ((e: unknown) => void) | null = null;

  beforeEach(() => {
    navigateHandler = null;
    // Stub window.navigation
    const fakeNavigation = {
      addEventListener: vi.fn((_type: string, handler: (e: unknown) => void) => {
        navigateHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "navigation", {
      value: fakeNavigation,
      configurable: true,
      writable: true,
    });
    _resetRouterForTests();
  });

  afterEach(() => {
    _resetRouterForTests();

    delete (window as any).navigation;
  });

  it("initRouter registers navigate handler when Navigation API is available (line 330)", () => {
    initRouter();

    expect((window as any).navigation.addEventListener).toHaveBeenCalledWith(
      "navigate",
      expect.any(Function),
    );
  });

  it("onNavigateEvent early-returns when canIntercept=false (line 297)", () => {
    initRouter();
    expect(navigateHandler).not.toBeNull();

    const interceptFn = vi.fn();
    navigateHandler!({
      canIntercept: false,
      hashChange: false,
      downloadRequest: null,
      destination: { url: `${window.location.origin}/chart` },
      intercept: interceptFn,
    });
    expect(interceptFn).not.toHaveBeenCalled();
  });

  it("onNavigateEvent early-returns when hashChange=true (line 297)", () => {
    initRouter();
    const interceptFn = vi.fn();
    navigateHandler!({
      canIntercept: true,
      hashChange: true,
      downloadRequest: null,
      destination: { url: `${window.location.origin}/chart` },
      intercept: interceptFn,
    });
    expect(interceptFn).not.toHaveBeenCalled();
  });

  it("onNavigateEvent early-returns when downloadRequest is set (line 297)", () => {
    initRouter();
    const interceptFn = vi.fn();
    navigateHandler!({
      canIntercept: true,
      hashChange: false,
      downloadRequest: "file.csv",
      destination: { url: `${window.location.origin}/chart` },
      intercept: interceptFn,
    });
    expect(interceptFn).not.toHaveBeenCalled();
  });

  it("onNavigateEvent early-returns for cross-origin URL (line 299)", () => {
    initRouter();
    const interceptFn = vi.fn();
    navigateHandler!({
      canIntercept: true,
      hashChange: false,
      downloadRequest: null,
      destination: { url: "https://external.example.com/page" },
      intercept: interceptFn,
    });
    expect(interceptFn).not.toHaveBeenCalled();
  });

  it("onNavigateEvent intercepts and invokes handler for same-origin navigation (lines 300-307)", () => {
    initRouter();
    const routeListener = vi.fn();
    onRouteChange(routeListener);

    const interceptFn = vi.fn();
    navigateHandler!({
      canIntercept: true,
      hashChange: false,
      downloadRequest: null,
      destination: { url: `${window.location.origin}/chart` },
      intercept: interceptFn,
    });
    expect(interceptFn).toHaveBeenCalled();

    // Execute the handler
    const { handler } = interceptFn.mock.calls[0]![0] as { handler: () => Promise<void> };
    handler();

    expect(routeListener).toHaveBeenCalledWith("chart", expect.any(Object));
  });

  it("_resetRouterForTests removes navigate listener (line 345)", () => {
    initRouter();
    _resetRouterForTests();

    expect((window as any).navigation.removeEventListener).toHaveBeenCalledWith(
      "navigate",
      expect.any(Function),
    );
  });
});
