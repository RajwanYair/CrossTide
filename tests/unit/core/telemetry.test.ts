import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initTelemetry, getTelemetry, _resetTelemetryForTests } from "../../../src/core/telemetry";
import { createAnalyticsClient } from "../../../src/core/analytics-client";

describe("telemetry", () => {
  beforeEach(() => {
    _resetTelemetryForTests();
  });

  afterEach(() => {
    _resetTelemetryForTests();
  });

  describe("initTelemetry (no env vars configured)", () => {
    it("returns a no-op handle when no env vars are set", () => {
      const handle = initTelemetry();
      expect(handle).toBeDefined();
      expect(() => handle.event("test")).not.toThrow();
      expect(() => handle.pageview("/test")).not.toThrow();
      expect(() => handle.setEnabled(false)).not.toThrow();
      expect(() => handle.destroy()).not.toThrow();
    });

    it("returns the same handle on subsequent calls (singleton)", () => {
      const h1 = initTelemetry();
      const h2 = initTelemetry();
      expect(h1).toBe(h2);
    });

    it("getTelemetry returns null before init", () => {
      expect(getTelemetry()).toBeNull();
    });

    it("getTelemetry returns handle after init", () => {
      const handle = initTelemetry();
      expect(getTelemetry()).toBe(handle);
    });

    it("destroy() resets getTelemetry to null", () => {
      const handle = initTelemetry();
      expect(getTelemetry()).toBe(handle);
      handle.destroy();
      expect(getTelemetry()).toBeNull();
    });
  });

  describe("createAnalyticsClient (used by telemetry)", () => {
    it("sends pageview to correct endpoint with site and url", () => {
      const sent: Array<[string, string]> = [];
      const client = createAnalyticsClient({
        endpoint: "https://p.example.com/api/event",
        site: "test.site",
        send: (url, body) => sent.push([url, body]),
      });

      client.pageview("/test");
      expect(sent).toHaveLength(1);
      const [url, body] = sent[0]!;
      expect(url).toBe("https://p.example.com/api/event");
      const parsed = JSON.parse(body) as Record<string, unknown>;
      expect(parsed["name"]).toBe("pageview");
      expect(parsed["url"]).toBe("/test");
      expect(parsed["site"]).toBe("test.site");
    });

    it("sends named event with props", () => {
      const sent: string[] = [];
      const client = createAnalyticsClient({
        endpoint: "/a",
        site: "s",
        send: (_, body) => sent.push(body),
      });

      client.event("ticker_added", { symbol: "AAPL", count: 1 });
      expect(sent).toHaveLength(1);
      const parsed = JSON.parse(sent[0]!) as Record<string, unknown>;
      expect(parsed["name"]).toBe("ticker_added");
    });

    it("setEnabled(false) suppresses further events", () => {
      const sent: string[] = [];
      const client = createAnalyticsClient({
        endpoint: "/a",
        site: "s",
        send: (_, body) => sent.push(body),
      });

      client.setEnabled(false);
      client.event("suppressed");
      expect(sent).toHaveLength(0);
    });

    it("re-enables after setEnabled(true)", () => {
      const sent: string[] = [];
      const client = createAnalyticsClient({
        endpoint: "/a",
        site: "s",
        send: (_, body) => sent.push(body),
      });

      client.setEnabled(false);
      client.event("off");
      client.setEnabled(true);
      client.event("on");
      expect(sent).toHaveLength(1);
      const parsed = JSON.parse(sent[0]!) as Record<string, unknown>;
      expect(parsed["name"]).toBe("on");
    });
  });

  describe("no-op telemetry (sendBeacon guard)", () => {
    it("does not call sendBeacon when telemetry is in no-op mode", () => {
      const beaconSpy = vi.fn().mockReturnValue(true);
      vi.stubGlobal("navigator", { ...navigator, sendBeacon: beaconSpy });

      const handle = initTelemetry();
      handle.event("test_event");
      expect(beaconSpy).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });
});
