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

beforeEach(() => {
  vi.stubGlobal("sessionStorage", createStorageMock());
  vi.resetModules();
});

describe("session-state", () => {
  async function loadModule() {
    return import("../../../src/core/session-state");
  }

  it("returns null when no state saved", async () => {
    const { restoreSessionState } = await loadModule();
    expect(restoreSessionState()).toBeNull();
  });

  it("saves and restores state", async () => {
    const { saveSessionState, restoreSessionState } = await loadModule();
    saveSessionState({ route: "/chart", selectedTicker: "AAPL", scrollY: 150 });
    const state = restoreSessionState();
    expect(state).not.toBeNull();
    expect(state!.route).toBe("/chart");
    expect(state!.selectedTicker).toBe("AAPL");
    expect(state!.scrollY).toBe(150);
  });

  it("includes timestamp", async () => {
    const { saveSessionState, restoreSessionState } = await loadModule();
    const before = Date.now();
    saveSessionState({ route: "/", selectedTicker: "", scrollY: 0 });
    const state = restoreSessionState();
    expect(state!.timestamp).toBeGreaterThanOrEqual(before);
  });

  it("returns null if state is too old", async () => {
    const { restoreSessionState } = await loadModule();
    const old = {
      route: "/chart",
      selectedTicker: "MSFT",
      scrollY: 0,
      timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
    };
    sessionStorage.setItem("crosstide-session-state", JSON.stringify(old));
    expect(restoreSessionState(30 * 60 * 1000)).toBeNull();
  });

  it("clearSessionState removes stored state", async () => {
    const { saveSessionState, clearSessionState, hasSessionState } = await loadModule();
    saveSessionState({ route: "/", selectedTicker: "", scrollY: 0 });
    clearSessionState();
    expect(hasSessionState()).toBe(false);
  });

  it("hasSessionState checks presence", async () => {
    const { saveSessionState, hasSessionState } = await loadModule();
    expect(hasSessionState()).toBe(false);
    saveSessionState({ route: "/screener", selectedTicker: "", scrollY: 0 });
    expect(hasSessionState()).toBe(true);
  });

  it("handles corrupted data gracefully", async () => {
    const { restoreSessionState } = await loadModule();
    sessionStorage.setItem("crosstide-session-state", "not json{{{");
    expect(restoreSessionState()).toBeNull();
  });
});
