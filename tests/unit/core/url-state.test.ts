/**
 * URL State Activation (B10) tests
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  readCurrentUrlState,
  updateCurrentUrlState,
  pushUrlState,
  clearUrlState,
  buildCurrentShareUrl,
  onUrlStateChange,
} from "../../../src/core/url-state";
import { encodeShareState } from "../../../src/core/share-state";

// ── helpers ───────────────────────────────────────────────────────────────────

function setWindowLocation(href: string): void {
  Object.defineProperty(globalThis, "location", {
    value: new URL(href),
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ── readCurrentUrlState ───────────────────────────────────────────────────────

describe("readCurrentUrlState", () => {
  it("returns decoded state from ?s= param", () => {
    const token = encodeShareState({ symbol: "AAPL", range: "1y" });
    setWindowLocation(`http://localhost/?s=${token}`);
    const state = readCurrentUrlState();
    expect(state).toEqual({ symbol: "AAPL", range: "1y" });
  });

  it("returns null when no ?s= param", () => {
    setWindowLocation("http://localhost/chart");
    expect(readCurrentUrlState()).toBeNull();
  });

  it("returns null in non-browser environment", () => {
    const orig = (globalThis as Record<string, unknown>).location;
    Reflect.deleteProperty(globalThis, "location");
    try {
      expect(readCurrentUrlState()).toBeNull();
    } finally {
      (globalThis as Record<string, unknown>).location = orig;
    }
  });
});

// ── updateCurrentUrlState ─────────────────────────────────────────────────────

describe("updateCurrentUrlState", () => {
  it("calls history.replaceState with new URL containing ?s=", () => {
    setWindowLocation("http://localhost/chart");
    const replaceState = vi.fn();
    Object.defineProperty(globalThis, "history", {
      value: { replaceState, pushState: vi.fn() },
      writable: true,
      configurable: true,
    });

    updateCurrentUrlState({ symbol: "MSFT" });

    expect(replaceState).toHaveBeenCalledOnce();
    const [, , url] = replaceState.mock.calls[0] as [unknown, unknown, string];
    expect(url).toMatch(/[?&]s=/);
  });

  it("is a no-op when location is unavailable", () => {
    const orig = (globalThis as Record<string, unknown>).location;
    Reflect.deleteProperty(globalThis, "location");
    expect(() => updateCurrentUrlState({ symbol: "X" })).not.toThrow();
    (globalThis as Record<string, unknown>).location = orig;
  });
});

// ── pushUrlState ─────────────────────────────────────────────────────────────

describe("pushUrlState", () => {
  it("calls history.pushState with new URL containing ?s=", () => {
    setWindowLocation("http://localhost/chart");
    const pushState = vi.fn();
    Object.defineProperty(globalThis, "history", {
      value: { replaceState: vi.fn(), pushState },
      writable: true,
      configurable: true,
    });

    pushUrlState({ symbol: "GOOG", card: "chart" });

    expect(pushState).toHaveBeenCalledOnce();
    const [, , url] = pushState.mock.calls[0] as [unknown, unknown, string];
    expect(url).toMatch(/[?&]s=/);
  });
});

// ── clearUrlState ─────────────────────────────────────────────────────────────

describe("clearUrlState", () => {
  it("removes ?s= param via replaceState", () => {
    const token = encodeShareState({ symbol: "AAPL" });
    setWindowLocation(`http://localhost/?s=${token}&other=1`);
    const replaceState = vi.fn();
    Object.defineProperty(globalThis, "history", {
      value: { replaceState, pushState: vi.fn() },
      writable: true,
      configurable: true,
    });

    clearUrlState();

    expect(replaceState).toHaveBeenCalledOnce();
    const [, , url] = replaceState.mock.calls[0] as [unknown, unknown, string];
    expect(url).not.toMatch(/[?&]s=/);
    expect(url).toContain("other=1");
  });
});

// ── buildCurrentShareUrl ─────────────────────────────────────────────────────

describe("buildCurrentShareUrl", () => {
  it("builds a URL with ?s= from current location", () => {
    setWindowLocation("http://localhost/");
    const url = buildCurrentShareUrl({ symbol: "TSLA" });
    expect(url).toMatch(/[?&]s=/);
    expect(url).toContain("localhost");
  });

  it("falls back to localhost when location is unavailable", () => {
    const orig = (globalThis as Record<string, unknown>).location;
    Reflect.deleteProperty(globalThis, "location");
    try {
      const url = buildCurrentShareUrl({ symbol: "AMD" });
      expect(url).toMatch(/[?&]s=/);
    } finally {
      (globalThis as Record<string, unknown>).location = orig;
    }
  });
});

// ── onUrlStateChange ──────────────────────────────────────────────────────────

describe("onUrlStateChange", () => {
  it("calls handler on popstate with valid state", () => {
    const token = encodeShareState({ symbol: "NVDA" });
    setWindowLocation(`http://localhost/?s=${token}`);

    const listeners: EventListenerOrEventListenerObject[] = [];
    Object.defineProperty(globalThis, "window", {
      value: {
        addEventListener: vi.fn((_e: string, fn: EventListenerOrEventListenerObject) =>
          listeners.push(fn),
        ),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    const handler = vi.fn();
    const listener = onUrlStateChange(handler);

    // Simulate popstate
    for (const l of listeners) {
      if (typeof l === "function") l(new PopStateEvent("popstate"));
      else l.handleEvent(new PopStateEvent("popstate"));
    }

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toEqual({ symbol: "NVDA" });

    listener.remove();
  });

  it("reports null when back navigation clears share state", () => {
    const token = encodeShareState({ symbol: "NVDA" });
    setWindowLocation(`http://localhost/?s=${token}`);
    const listeners: EventListenerOrEventListenerObject[] = [];
    Object.defineProperty(globalThis, "window", {
      value: {
        addEventListener: vi.fn((_e: string, fn: EventListenerOrEventListenerObject) =>
          listeners.push(fn),
        ),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    const handler = vi.fn();
    const listener = onUrlStateChange(handler);
    setWindowLocation("http://localhost/chart");
    for (const currentListener of listeners) {
      if (typeof currentListener === "function") currentListener(new PopStateEvent("popstate"));
    }

    expect(handler).toHaveBeenLastCalledWith(null);
    listener.remove();
  });

  it("remove() calls removeEventListener", () => {
    const removeEventListener = vi.fn();
    Object.defineProperty(globalThis, "window", {
      value: { addEventListener: vi.fn(), removeEventListener },
      writable: true,
      configurable: true,
    });

    const listener = onUrlStateChange(vi.fn());
    listener.remove();

    expect(removeEventListener).toHaveBeenCalledOnce();
  });

  it("returns no-op handle in non-browser environment", () => {
    const orig = (globalThis as Record<string, unknown>).window;
    Reflect.deleteProperty(globalThis, "window");
    try {
      const listener = onUrlStateChange(vi.fn());
      expect(() => listener.remove()).not.toThrow();
    } finally {
      (globalThis as Record<string, unknown>).window = orig;
    }
  });
});
