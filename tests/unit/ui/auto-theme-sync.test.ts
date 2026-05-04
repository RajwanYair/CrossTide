import { describe, it, expect, beforeEach, vi } from "vitest";

function createStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}

let darkListeners: Array<(e: { matches: boolean }) => void> = [];
let contrastListeners: Array<(e: { matches: boolean }) => void> = [];

function createMatchMediaMock(darkMatches: boolean, contrastMatches: boolean) {
  return (query: string) => {
    const isDark = query.includes("prefers-color-scheme: dark");
    const isContrast = query.includes("prefers-contrast: more");
    const isLight = query.includes("prefers-color-scheme: light");
    return {
      matches: isDark ? darkMatches : isContrast ? contrastMatches : isLight ? !darkMatches : false,
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
        if (isDark) darkListeners.push(fn);
        if (isContrast) contrastListeners.push(fn);
      },
      removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
        darkListeners = darkListeners.filter((f) => f !== fn);
        contrastListeners = contrastListeners.filter((f) => f !== fn);
      },
    };
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorageMock());
  darkListeners = [];
  contrastListeners = [];
  vi.stubGlobal("matchMedia", createMatchMediaMock(true, false));
  document.documentElement.removeAttribute("data-theme");
  vi.resetModules();
});

describe("auto-theme-sync", () => {
  async function loadModule() {
    return import("../../../src/ui/auto-theme-sync");
  }

  it("hasThemeOverride returns false by default", async () => {
    const { hasThemeOverride } = await loadModule();
    expect(hasThemeOverride()).toBe(false);
  });

  it("setThemeOverride stores and applies theme", async () => {
    const { setThemeOverride, getThemeOverride } = await loadModule();
    setThemeOverride("light");
    expect(getThemeOverride()).toBe("light");
    expect(document.documentElement.dataset["theme"]).toBe("light");
  });

  it("setThemeOverride(null) clears override and reverts to system", async () => {
    const { setThemeOverride, getThemeOverride, hasThemeOverride } = await loadModule();
    setThemeOverride("light");
    setThemeOverride(null);
    expect(hasThemeOverride()).toBe(false);
    expect(getThemeOverride()).toBeNull();
    // Should have applied system preference (dark in our mock)
    expect(document.documentElement.dataset["theme"]).toBe("dark");
  });

  it("initAutoThemeSync applies system theme on media change", async () => {
    const { initAutoThemeSync } = await loadModule();
    initAutoThemeSync();

    // Simulate system switching to light
    vi.stubGlobal("matchMedia", createMatchMediaMock(false, false));
    for (const fn of darkListeners) fn({ matches: false });

    expect(document.documentElement.dataset["theme"]).toBe("light");
  });

  it("does NOT apply system theme when override is set", async () => {
    const { initAutoThemeSync, setThemeOverride } = await loadModule();
    setThemeOverride("high-contrast");
    initAutoThemeSync();

    // Simulate system change
    vi.stubGlobal("matchMedia", createMatchMediaMock(false, false));
    for (const fn of darkListeners) fn({ matches: false });

    // Should stay at override
    expect(document.documentElement.dataset["theme"]).toBe("high-contrast");
  });

  it("cleanup removes listeners", async () => {
    const { initAutoThemeSync } = await loadModule();
    const cleanup = initAutoThemeSync();
    expect(darkListeners.length).toBe(1);
    cleanup();
    expect(darkListeners.length).toBe(0);
  });
});
