/**
 * Tests for earnings calendar route.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleEarningsCalendar } from "../../../worker/routes/earnings-calendar";

describe("handleEarningsCalendar", () => {
  const emptyEnv = {};
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Mock fetch to avoid real network calls
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network disabled in test"));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("rejects invalid symbol", async () => {
    const res = await handleEarningsCalendar("!!!", emptyEnv);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid");
  });

  it("rejects empty symbol", async () => {
    const res = await handleEarningsCalendar("", emptyEnv);
    expect(res.status).toBe(400);
  });

  it("returns 502 when no cache and fetch fails", async () => {
    const res = await handleEarningsCalendar("AAPL", emptyEnv);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain("Failed to fetch earnings data");
    expect(body.symbol).toBe("AAPL");
  });

  it("returns cached data when available", async () => {
    const mockData = {
      symbol: "MSFT",
      earningsDate: "2025-07-22",
      epsEstimate: 2.5,
      epsHigh: 2.8,
      epsLow: 2.2,
      revenueEstimate: 60000000000,
      history: [{ date: "1Q2025", actual: 2.4, estimate: 2.3, surprisePct: 4.35 }],
    };

    const kvStore: Record<string, string> = {
      "earnings:MSFT": JSON.stringify(mockData),
    };

    const env = {
      QUOTE_CACHE: {
        get: async (key: string) => kvStore[key] ?? null,
        put: async () => {},
        delete: async () => {},
      },
    };

    const res = await handleEarningsCalendar("MSFT", env as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("cache");
    expect(body.symbol).toBe("MSFT");
    expect(body.earningsDate).toBe("2025-07-22");
    expect(body.history).toHaveLength(1);
  });

  it("uppercases the symbol", async () => {
    const res = await handleEarningsCalendar("aapl", emptyEnv);
    const body = await res.json();
    expect(body.symbol).toBe("AAPL");
  });

  it("returns yahoo data on successful fetch", async () => {
    const yahooResponse = {
      quoteSummary: {
        result: [
          {
            calendarEvents: {
              earnings: {
                earningsDate: [{ raw: 1753228800, fmt: "2025-07-22" }],
                earningsAverage: { raw: 2.5 },
                earningsHigh: { raw: 2.8 },
                earningsLow: { raw: 2.2 },
                revenueAverage: { raw: 60000000000 },
              },
            },
            earnings: {
              earningsChart: {
                quarterly: [{ date: "1Q2025", actual: { raw: 2.4 }, estimate: { raw: 2.3 } }],
              },
            },
          },
        ],
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => yahooResponse,
    });

    const res = await handleEarningsCalendar("MSFT", emptyEnv);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("yahoo");
    expect(body.symbol).toBe("MSFT");
    expect(body.earningsDate).toBe("2025-07-22");
    expect(body.epsEstimate).toBe(2.5);
    expect(body.history[0].surprisePct).toBeCloseTo(4.35, 1);
  });
});
