import { describe, it, expect, vi } from "vitest";
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
