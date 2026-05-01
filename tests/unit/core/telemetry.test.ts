import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  initTelemetry,
  getTelemetry,
  _resetTelemetryForTests,
  _parseStackTraceForTests,
  _reportToGlitchTipForTests,
} from "../../../src/core/telemetry";
import { createAnalyticsClient } from "../../../src/core/analytics-client";
import type { ErrorRecord } from "../../../src/core/error-boundary";

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

  // ── parseStackTrace ──────────────────────────────────────────────────────

  describe("parseStackTrace", () => {
    it("extracts filename and lineno from V8 stack frames", () => {
      const stack = `Error: boom
    at handleClick (https://example.com/app.js:12:34)
    at HTMLButtonElement.onClick (https://example.com/main.js:99:5)`;
      const frames = _parseStackTraceForTests(stack);
      expect(frames.length).toBeGreaterThan(0);
      expect(frames[0]).toMatchObject({ filename: "https://example.com/app.js", lineno: 12 });
    });

    it("returns unknown for unparseable lines", () => {
      const stack = "Error: boom\n    at native";
      const frames = _parseStackTraceForTests(stack);
      expect(frames[0]).toMatchObject({ filename: "unknown", lineno: 0 });
    });

    it("limits frames to 10", () => {
      const lines = ["Error: test"];
      for (let i = 0; i < 15; i++) {
        lines.push(`    at fn${i} (https://x.com/a.js:${i}:0)`);
      }
      const frames = _parseStackTraceForTests(lines.join("\n"));
      expect(frames.length).toBeLessThanOrEqual(10);
    });
  });

  // ── reportToGlitchTip ────────────────────────────────────────────────────

  describe("reportToGlitchTip", () => {
    const mockRecord: ErrorRecord = {
      message: "Test error",
      source: "https://example.com/app.js:42:1",
      timestamp: Date.now(),
    };
    const mockDsn = "https://pubkey123@glitchtip.example.com/456";

    beforeEach(() => {
      // Force Math.random to always pass the 25% sample check
      vi.spyOn(Math, "random").mockReturnValue(0.1);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it("sends via sendBeacon when available", () => {
      const beaconSpy = vi.fn().mockReturnValue(true);
      vi.stubGlobal("navigator", { sendBeacon: beaconSpy });
      _reportToGlitchTipForTests(mockDsn, mockRecord);
      expect(beaconSpy).toHaveBeenCalledOnce();
      const [url] = beaconSpy.mock.calls[0] as [string, unknown];
      expect(url).toContain("glitchtip.example.com");
      expect(url).toContain("pubkey123");
    });

    it("falls back to fetch when sendBeacon unavailable", async () => {
      const fetchSpy = vi.fn().mockResolvedValue(new Response(""));
      vi.stubGlobal("navigator", {});
      vi.stubGlobal("fetch", fetchSpy);
      _reportToGlitchTipForTests(mockDsn, mockRecord);
      expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it("includes stack trace when record.stack is provided", () => {
      const beaconSpy = vi.fn().mockReturnValue(true);
      vi.stubGlobal("navigator", { sendBeacon: beaconSpy });
      _reportToGlitchTipForTests(mockDsn, {
        ...mockRecord,
        stack: "Error: boom\n    at fn (https://example.com/app.js:5:1)",
      });
      // Verify the blob body contains exception data
      const [, blob] = beaconSpy.mock.calls[0] as [string, Blob];
      expect(blob).toBeInstanceOf(Blob);
    });

    it("is a no-op when Math.random is above 0.25", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const beaconSpy = vi.fn();
      vi.stubGlobal("navigator", { sendBeacon: beaconSpy });
      _reportToGlitchTipForTests(mockDsn, mockRecord);
      expect(beaconSpy).not.toHaveBeenCalled();
    });

    it("is a no-op for invalid DSN", () => {
      const beaconSpy = vi.fn();
      vi.stubGlobal("navigator", { sendBeacon: beaconSpy });
      _reportToGlitchTipForTests("not-a-dsn", mockRecord);
      expect(beaconSpy).not.toHaveBeenCalled();
    });

    it("does not throw when fetch rejects", () => {
      vi.stubGlobal("navigator", {});
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
      expect(() => _reportToGlitchTipForTests(mockDsn, mockRecord)).not.toThrow();
    });

    it("does not throw when sendBeacon throws", () => {
      vi.stubGlobal("navigator", {
        sendBeacon: () => {
          throw new Error("blocked");
        },
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("")));
      expect(() => _reportToGlitchTipForTests(mockDsn, mockRecord)).not.toThrow();
    });
  });
});
