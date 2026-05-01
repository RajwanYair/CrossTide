import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  observeWebVitals,
  makeBeaconReporter,
  type VitalReport,
} from "../../../src/core/web-vitals";

// ── PerformanceObserver mock helpers ─────────────────────────────────────────

type POCallback = (list: { getEntries: () => PerformanceEntry[] }) => void;

/**
 * Builds a mock PerformanceObserver class that records instances so tests can
 * fire entries manually via `triggerType(type, entries)`.
 */
function buildMockPO() {
  const instances: Array<{ type: string; cb: POCallback; obs: { disconnect: () => void } }> = [];

  class MockPO {
    private _cb: POCallback;
    constructor(cb: POCallback) {
      this._cb = cb;
    }
    observe({ type }: { type: string }) {
      const inst = { type, cb: this._cb, obs: this as unknown as { disconnect: () => void } };
      instances.push(inst);
    }
    disconnect() {
      const idx = instances.findIndex(
        (i) => i.obs === (this as unknown as { disconnect: () => void }),
      );
      if (idx !== -1) instances.splice(idx, 1);
    }
  }

  function triggerType(type: string, entries: Partial<PerformanceEntry>[]) {
    for (const inst of instances.filter((i) => i.type === type)) {
      inst.cb({ getEntries: () => entries as PerformanceEntry[] });
    }
  }

  return { MockPO, triggerType, instances };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("web-vitals", () => {
  it("returns a stoppable observer even without PerformanceObserver", () => {
    const orig = (globalThis as { PerformanceObserver?: unknown }).PerformanceObserver;
    Object.defineProperty(globalThis, "PerformanceObserver", {
      value: undefined,
      configurable: true,
    });
    try {
      const handler = vi.fn();
      const o = observeWebVitals(handler);
      o.stop();
      o.stop();
      expect(handler).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, "PerformanceObserver", {
        value: orig,
        configurable: true,
      });
    }
  });

  describe("observeWebVitals with mock PerformanceObserver", () => {
    let mockPO: ReturnType<typeof buildMockPO>;
    let origPO: unknown;

    beforeEach(() => {
      mockPO = buildMockPO();
      origPO = (globalThis as { PerformanceObserver?: unknown }).PerformanceObserver;
      Object.defineProperty(globalThis, "PerformanceObserver", {
        value: mockPO.MockPO,
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(globalThis, "PerformanceObserver", {
        value: origPO,
        configurable: true,
        writable: true,
      });
    });

    it("reports LCP when largest-contentful-paint entry fires", () => {
      const handler = vi.fn<[VitalReport], void>();
      observeWebVitals(handler);
      mockPO.triggerType("largest-contentful-paint", [{ startTime: 1200 } as PerformanceEntry]);
      expect(handler).toHaveBeenCalledOnce();
      const r = handler.mock.calls[0][0];
      expect(r.name).toBe("LCP");
      expect(r.value).toBe(1200);
      expect(r.id).toMatch(/^LCP-/);
    });

    it("only reports LCP when new entry is larger", () => {
      const handler = vi.fn<[VitalReport], void>();
      observeWebVitals(handler);
      mockPO.triggerType("largest-contentful-paint", [{ startTime: 500 } as PerformanceEntry]);
      mockPO.triggerType("largest-contentful-paint", [{ startTime: 300 } as PerformanceEntry]);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].value).toBe(500);
    });

    it("reports CLS when layout-shift without hadRecentInput fires", () => {
      const handler = vi.fn<[VitalReport], void>();
      observeWebVitals(handler);
      mockPO.triggerType("layout-shift", [
        { hadRecentInput: false, value: 0.05 } as PerformanceEntry,
      ]);
      expect(handler).toHaveBeenCalledOnce();
      const r = handler.mock.calls[0][0];
      expect(r.name).toBe("CLS");
      expect(r.value).toBeCloseTo(0.05);
    });

    it("skips CLS entries with hadRecentInput=true", () => {
      const handler = vi.fn<[VitalReport], void>();
      observeWebVitals(handler);
      mockPO.triggerType("layout-shift", [
        { hadRecentInput: true, value: 0.5 } as PerformanceEntry,
      ]);
      expect(handler).not.toHaveBeenCalled();
    });

    it("accumulates CLS across multiple shifts", () => {
      const handler = vi.fn<[VitalReport], void>();
      observeWebVitals(handler);
      mockPO.triggerType("layout-shift", [
        { hadRecentInput: false, value: 0.1 } as PerformanceEntry,
      ]);
      mockPO.triggerType("layout-shift", [
        { hadRecentInput: false, value: 0.05 } as PerformanceEntry,
      ]);
      const lastCls = handler.mock.calls.at(-1)![0];
      expect(lastCls.value).toBeCloseTo(0.15);
    });

    it("reports FCP for first-contentful-paint entry", () => {
      const handler = vi.fn<[VitalReport], void>();
      observeWebVitals(handler);
      mockPO.triggerType("paint", [
        { name: "first-contentful-paint", startTime: 800 } as PerformanceEntry,
      ]);
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0].name).toBe("FCP");
      expect(handler.mock.calls[0][0].value).toBe(800);
    });

    it("ignores non-FCP paint entries", () => {
      const handler = vi.fn<[VitalReport], void>();
      observeWebVitals(handler);
      mockPO.triggerType("paint", [{ name: "first-paint", startTime: 400 } as PerformanceEntry]);
      expect(handler).not.toHaveBeenCalled();
    });

    it("reports TTFB from navigation entry", () => {
      const handler = vi.fn<[VitalReport], void>();
      observeWebVitals(handler);
      mockPO.triggerType("navigation", [{ responseStart: 150 } as PerformanceEntry]);
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0].name).toBe("TTFB");
      expect(handler.mock.calls[0][0].value).toBe(150);
    });

    it("reports INP when event entry fires", () => {
      const handler = vi.fn<[VitalReport], void>();
      observeWebVitals(handler);
      mockPO.triggerType("event", [{ duration: 90, interactionId: 1 } as PerformanceEntry]);
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0].name).toBe("INP");
      expect(handler.mock.calls[0][0].value).toBe(90);
    });

    it("only reports INP when new duration exceeds current max", () => {
      const handler = vi.fn<[VitalReport], void>();
      observeWebVitals(handler);
      mockPO.triggerType("event", [{ duration: 80 } as PerformanceEntry]);
      mockPO.triggerType("event", [{ duration: 40 } as PerformanceEntry]);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("stop() disconnects all observers", () => {
      const handler = vi.fn<[VitalReport], void>();
      const vitals = observeWebVitals(handler);
      vitals.stop();
      mockPO.triggerType("largest-contentful-paint", [{ startTime: 999 } as PerformanceEntry]);
      expect(handler).not.toHaveBeenCalled();
    });

    it("stop() is safe to call multiple times", () => {
      const handler = vi.fn<[VitalReport], void>();
      const vitals = observeWebVitals(handler);
      expect(() => {
        vitals.stop();
        vitals.stop();
      }).not.toThrow();
    });

    it("safeObserve returns null if observe() throws", () => {
      class ThrowingPO {
        constructor(_cb: POCallback) {}
        observe() {
          throw new Error("not supported");
        }
        disconnect() {}
      }
      Object.defineProperty(globalThis, "PerformanceObserver", {
        value: ThrowingPO,
        configurable: true,
        writable: true,
      });
      const handler = vi.fn();
      expect(() => observeWebVitals(handler)).not.toThrow();
    });
  });

  describe("makeBeaconReporter", () => {
    it("uses sendBeacon when available", () => {
      const sendBeacon = vi.fn().mockReturnValue(true);
      const orig = (globalThis as { navigator?: unknown }).navigator;
      Object.defineProperty(globalThis, "navigator", {
        value: { sendBeacon },
        configurable: true,
      });
      try {
        const r = makeBeaconReporter("/v");
        r({ name: "LCP", value: 1, id: "x", timestamp: 0 });
        expect(sendBeacon).toHaveBeenCalledOnce();
      } finally {
        Object.defineProperty(globalThis, "navigator", {
          value: orig,
          configurable: true,
        });
      }
    });

    it("falls back to fetch when no sendBeacon", () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(""));
      const origNav = (globalThis as { navigator?: unknown }).navigator;
      const origFetch = (globalThis as { fetch?: unknown }).fetch;
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        configurable: true,
      });
      Object.defineProperty(globalThis, "fetch", {
        value: fetchMock,
        configurable: true,
      });
      try {
        const r = makeBeaconReporter("/v");
        r({ name: "CLS", value: 0.05, id: "y", timestamp: 0 });
        expect(fetchMock).toHaveBeenCalledOnce();
      } finally {
        Object.defineProperty(globalThis, "navigator", {
          value: origNav,
          configurable: true,
        });
        Object.defineProperty(globalThis, "fetch", {
          value: origFetch,
          configurable: true,
        });
      }
    });

    it("falls back to fetch when sendBeacon throws", () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(""));
      const origNav = (globalThis as { navigator?: unknown }).navigator;
      const origFetch = (globalThis as { fetch?: unknown }).fetch;
      Object.defineProperty(globalThis, "navigator", {
        value: {
          sendBeacon: () => {
            throw new Error("blocked");
          },
        },
        configurable: true,
      });
      Object.defineProperty(globalThis, "fetch", {
        value: fetchMock,
        configurable: true,
      });
      try {
        const r = makeBeaconReporter("/v");
        r({ name: "INP", value: 80, id: "z", timestamp: 0 });
        expect(fetchMock).toHaveBeenCalledOnce();
      } finally {
        Object.defineProperty(globalThis, "navigator", { value: origNav, configurable: true });
        Object.defineProperty(globalThis, "fetch", { value: origFetch, configurable: true });
      }
    });

    it("is a no-op when neither sendBeacon nor fetch is available", () => {
      const origNav = (globalThis as { navigator?: unknown }).navigator;
      const origFetch = (globalThis as { fetch?: unknown }).fetch;
      Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });
      Object.defineProperty(globalThis, "fetch", { value: undefined, configurable: true });
      try {
        const r = makeBeaconReporter("/v");
        expect(() => r({ name: "FCP", value: 500, id: "a", timestamp: 0 })).not.toThrow();
      } finally {
        Object.defineProperty(globalThis, "navigator", { value: origNav, configurable: true });
        Object.defineProperty(globalThis, "fetch", { value: origFetch, configurable: true });
      }
    });
  });
});

describe("web-vitals", () => {
  it("returns a stoppable observer even without PerformanceObserver", () => {
    const orig = (globalThis as { PerformanceObserver?: unknown }).PerformanceObserver;
    Object.defineProperty(globalThis, "PerformanceObserver", {
      value: undefined,
      configurable: true,
    });
    try {
      const handler = vi.fn();
      const o = observeWebVitals(handler);
      o.stop();
      o.stop();
      expect(handler).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, "PerformanceObserver", {
        value: orig,
        configurable: true,
      });
    }
  });

  it("makeBeaconReporter uses sendBeacon when available", () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    const orig = (globalThis as { navigator?: unknown }).navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: { sendBeacon },
      configurable: true,
    });
    try {
      const r = makeBeaconReporter("/v");
      r({ name: "LCP", value: 1, id: "x", timestamp: 0 });
      expect(sendBeacon).toHaveBeenCalledOnce();
    } finally {
      Object.defineProperty(globalThis, "navigator", {
        value: orig,
        configurable: true,
      });
    }
  });

  it("makeBeaconReporter falls back to fetch when no sendBeacon", () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(""));
    const origNav = (globalThis as { navigator?: unknown }).navigator;
    const origFetch = (globalThis as { fetch?: unknown }).fetch;
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      configurable: true,
    });
    Object.defineProperty(globalThis, "fetch", {
      value: fetchMock,
      configurable: true,
    });
    try {
      const r = makeBeaconReporter("/v");
      r({ name: "CLS", value: 0.05, id: "y", timestamp: 0 });
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally {
      Object.defineProperty(globalThis, "navigator", {
        value: origNav,
        configurable: true,
      });
      Object.defineProperty(globalThis, "fetch", {
        value: origFetch,
        configurable: true,
      });
    }
  });
});
