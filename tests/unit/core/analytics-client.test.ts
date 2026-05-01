import { describe, it, expect, vi, afterEach } from "vitest";
import { createAnalyticsClient } from "../../../src/core/analytics-client";

describe("analytics-client", () => {
  it("emits pageview with site and url", () => {
    const send = vi.fn();
    const c = createAnalyticsClient({
      endpoint: "/a",
      site: "ct",
      send,
    });
    c.pageview("/x");
    expect(send).toHaveBeenCalledOnce();
    const [url, body] = send.mock.calls[0] as [string, string];
    expect(url).toBe("/a");
    const parsed = JSON.parse(body) as Record<string, unknown>;
    expect(parsed.name).toBe("pageview");
    expect(parsed.url).toBe("/x");
    expect(parsed.site).toBe("ct");
  });

  it("emits named event with props", () => {
    const send = vi.fn();
    const c = createAnalyticsClient({
      endpoint: "/a",
      site: "ct",
      send,
    });
    c.event("ticker_added", { symbol: "AAPL", count: 1 });
    const body = (send.mock.calls[0] as [string, string])[1];
    const parsed = JSON.parse(body) as Record<string, unknown>;
    expect(parsed.name).toBe("ticker_added");
    expect((parsed.props as Record<string, unknown>).symbol).toBe("AAPL");
  });

  it("emits event with empty props when none provided", () => {
    const send = vi.fn();
    const c = createAnalyticsClient({ endpoint: "/a", site: "ct", send });
    c.event("simple_event");
    const body = (send.mock.calls[0] as [string, string])[1];
    const parsed = JSON.parse(body) as Record<string, unknown>;
    expect(parsed.props).toEqual({});
  });

  it("disabled config does not send", () => {
    const send = vi.fn();
    const c = createAnalyticsClient({
      endpoint: "/a",
      site: "ct",
      disabled: true,
      send,
    });
    c.pageview();
    c.event("x");
    expect(send).not.toHaveBeenCalled();
  });

  it("setEnabled toggles emission", () => {
    const send = vi.fn();
    const c = createAnalyticsClient({
      endpoint: "/a",
      site: "ct",
      send,
    });
    c.setEnabled(false);
    c.event("x");
    expect(send).not.toHaveBeenCalled();
    c.setEnabled(true);
    c.event("x");
    expect(send).toHaveBeenCalledOnce();
  });

  it("pageview without path uses window.location.pathname", () => {
    const send = vi.fn();
    // happy-dom provides window.location, pathname defaults to "/"
    const c = createAnalyticsClient({ endpoint: "/a", site: "ct", send });
    c.pageview();
    const body = (send.mock.calls[0] as [string, string])[1];
    const parsed = JSON.parse(body) as Record<string, unknown>;
    // Just verify it has a url key (happy-dom sets "/" or similar)
    expect(typeof parsed.url).toBe("string");
  });

  describe("defaultSend transport", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("uses sendBeacon when available and returns true", () => {
      const beaconSpy = vi.fn().mockReturnValue(true);
      vi.stubGlobal("navigator", { sendBeacon: beaconSpy });
      // No custom `send` — uses defaultSend
      const c = createAnalyticsClient({ endpoint: "https://p.test/api/event", site: "s" });
      c.event("beacon_event");
      expect(beaconSpy).toHaveBeenCalledOnce();
    });

    it("falls back to fetch when sendBeacon returns false", () => {
      const fetchSpy = vi.fn().mockResolvedValue(new Response(""));
      vi.stubGlobal("navigator", { sendBeacon: vi.fn().mockReturnValue(false) });
      vi.stubGlobal("fetch", fetchSpy);
      const c = createAnalyticsClient({ endpoint: "https://p.test/api/event", site: "s" });
      c.event("fallback_event");
      expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it("falls back to fetch when sendBeacon throws", () => {
      const fetchSpy = vi.fn().mockResolvedValue(new Response(""));
      vi.stubGlobal("navigator", {
        sendBeacon: () => {
          throw new Error("blocked");
        },
      });
      vi.stubGlobal("fetch", fetchSpy);
      const c = createAnalyticsClient({ endpoint: "https://p.test/api/event", site: "s" });
      c.event("throw_fallback");
      expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it("falls back to fetch when navigator has no sendBeacon", () => {
      const fetchSpy = vi.fn().mockResolvedValue(new Response(""));
      vi.stubGlobal("navigator", {});
      vi.stubGlobal("fetch", fetchSpy);
      const c = createAnalyticsClient({ endpoint: "https://p.test/api/event", site: "s" });
      c.event("no_beacon");
      expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it("is a no-op when neither sendBeacon nor fetch is available", () => {
      vi.stubGlobal("navigator", {});
      vi.stubGlobal("fetch", undefined);
      const c = createAnalyticsClient({ endpoint: "https://p.test/api/event", site: "s" });
      expect(() => c.event("no_transport")).not.toThrow();
    });
  });
});

describe("analytics-client", () => {
  it("emits pageview with site and url", () => {
    const send = vi.fn();
    const c = createAnalyticsClient({
      endpoint: "/a",
      site: "ct",
      send,
    });
    c.pageview("/x");
    expect(send).toHaveBeenCalledOnce();
    const [url, body] = send.mock.calls[0] as [string, string];
    expect(url).toBe("/a");
    const parsed = JSON.parse(body) as Record<string, unknown>;
    expect(parsed.name).toBe("pageview");
    expect(parsed.url).toBe("/x");
    expect(parsed.site).toBe("ct");
  });

  it("emits named event with props", () => {
    const send = vi.fn();
    const c = createAnalyticsClient({
      endpoint: "/a",
      site: "ct",
      send,
    });
    c.event("ticker_added", { symbol: "AAPL", count: 1 });
    const body = (send.mock.calls[0] as [string, string])[1];
    const parsed = JSON.parse(body) as Record<string, unknown>;
    expect(parsed.name).toBe("ticker_added");
    expect((parsed.props as Record<string, unknown>).symbol).toBe("AAPL");
  });

  it("disabled config does not send", () => {
    const send = vi.fn();
    const c = createAnalyticsClient({
      endpoint: "/a",
      site: "ct",
      disabled: true,
      send,
    });
    c.pageview();
    c.event("x");
    expect(send).not.toHaveBeenCalled();
  });

  it("setEnabled toggles emission", () => {
    const send = vi.fn();
    const c = createAnalyticsClient({
      endpoint: "/a",
      site: "ct",
      send,
    });
    c.setEnabled(false);
    c.event("x");
    expect(send).not.toHaveBeenCalled();
    c.setEnabled(true);
    c.event("x");
    expect(send).toHaveBeenCalledOnce();
  });
});
