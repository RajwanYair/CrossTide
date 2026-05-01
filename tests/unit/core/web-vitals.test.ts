import { describe, it, expect, vi } from "vitest";
import { observeWebVitals, makeBeaconReporter } from "../../../src/core/web-vitals";

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
