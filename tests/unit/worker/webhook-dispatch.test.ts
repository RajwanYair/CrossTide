/**
 * Tests for webhook notification dispatch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildWebhookPayload,
  sendWebhook,
  loadWebhookTargets,
  dispatchWebhooks,
} from "../../../worker/routes/webhook-dispatch";
import type { FiredAlert } from "../../../worker/routes/alert-eval";

const sampleFired: FiredAlert[] = [
  {
    ruleId: "a1",
    userId: "u1",
    ticker: "AAPL",
    condition: { field: "price", operator: "above", value: 150 },
    currentValue: 155,
    firedAt: "2025-01-15T10:00:00Z",
  },
  {
    ruleId: "a2",
    userId: "u1",
    ticker: "MSFT",
    condition: { field: "changePercent", operator: "above", value: 3 },
    currentValue: 4.2,
    firedAt: "2025-01-15T10:00:00Z",
  },
  {
    ruleId: "a3",
    userId: "u2",
    ticker: "TSLA",
    condition: { field: "price", operator: "below", value: 200 },
    currentValue: 180,
    firedAt: "2025-01-15T10:00:00Z",
  },
];

describe("buildWebhookPayload", () => {
  it("formats alerts into a webhook event payload", () => {
    const payload = buildWebhookPayload(sampleFired);
    expect(payload.event).toBe("alert.fired");
    expect(payload.alerts).toHaveLength(3);
    expect(payload.alerts[0]!.ticker).toBe("AAPL");
    expect(payload.alerts[0]!.currentValue).toBe(155);
    expect(payload.timestamp).toBeDefined();
  });

  it("returns empty alerts array for no fired alerts", () => {
    const payload = buildWebhookPayload([]);
    expect(payload.event).toBe("alert.fired");
    expect(payload.alerts).toHaveLength(0);
  });
});

describe("sendWebhook", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST with JSON body and returns status", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("ok", { status: 200 }),
    );
    const payload = buildWebhookPayload(sampleFired.slice(0, 1));
    const status = await sendWebhook("https://hooks.example.com/callback", payload);
    expect(status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://hooks.example.com/callback",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("returns error on network failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));
    const payload = buildWebhookPayload(sampleFired.slice(0, 1));
    const status = await sendWebhook("https://hooks.example.com/callback", payload);
    expect(status).toBe("error");
  });

  it("rejects non-http(s) protocols", async () => {
    const payload = buildWebhookPayload(sampleFired.slice(0, 1));
    const status = await sendWebhook("ftp://evil.com/hook", payload);
    expect(status).toBe("error");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe("loadWebhookTargets", () => {
  it("returns empty for empty user IDs", async () => {
    const mockDb = {
      prepare: () => ({ bind: () => ({ all: async () => ({ results: [] }) }) }),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    };
    const targets = await loadWebhookTargets(mockDb, []);
    expect(targets).toHaveLength(0);
  });

  it("parses D1 results into WebhookTarget array", async () => {
    const mockDb = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({
            results: [
              { user_id: "u1", webhook_url: "https://hooks.slack.com/xxx" },
              { user_id: "u2", webhook_url: "https://discord.com/api/webhooks/yyy" },
            ],
          }),
        }),
      }),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    };
    const targets = await loadWebhookTargets(mockDb, ["u1", "u2"]);
    expect(targets).toHaveLength(2);
    expect(targets[0]!.userId).toBe("u1");
    expect(targets[0]!.url).toBe("https://hooks.slack.com/xxx");
  });
});

describe("dispatchWebhooks", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns empty for no fired alerts", async () => {
    const mockDb = {
      prepare: () => ({ bind: () => ({ all: async () => ({ results: [] }) }) }),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    };
    const results = await dispatchWebhooks(mockDb, []);
    expect(results).toHaveLength(0);
  });

  it("groups alerts by user and dispatches webhooks", async () => {
    const mockDb = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({
            results: [
              { user_id: "u1", webhook_url: "https://hooks.slack.com/u1" },
              { user_id: "u2", webhook_url: "https://hooks.slack.com/u2" },
            ],
          }),
        }),
      }),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    };

    const results = await dispatchWebhooks(mockDb, sampleFired);
    expect(results).toHaveLength(2);
    expect(results[0]!.status).toBe(200);
    expect(results[1]!.status).toBe(200);
    // fetch should have been called twice (one per user)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
