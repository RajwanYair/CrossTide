import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handlePortfolioAnalytics } from "../../../worker/routes/portfolio-analytics";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(): Parameters<typeof handlePortfolioAnalytics>[1] {
  return { QUOTE_CACHE: mockKvStore } as Parameters<typeof handlePortfolioAnalytics>[1];
}

function makeRequest(body: unknown): Request {
  return new Request("https://example.com/api/portfolio/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const yahooResponse = {
  quoteResponse: {
    result: [
      { symbol: "AAPL", regularMarketPrice: 200 },
      { symbol: "GOOG", regularMarketPrice: 180 },
    ],
  },
};

describe("handlePortfolioAnalytics", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(yahooResponse),
      }),
    );
    mockKvStore.get.mockResolvedValue(null);
    mockKvStore.put.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      body: "not json",
    });
    const res = await handlePortfolioAnalytics(req, makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty holdings", async () => {
    const res = await handlePortfolioAnalytics(makeRequest({ holdings: [] }), makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid holding entry", async () => {
    const res = await handlePortfolioAnalytics(
      makeRequest({ holdings: [{ symbol: 123 }] }),
      makeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("returns portfolio analytics for valid input", async () => {
    const res = await handlePortfolioAnalytics(
      makeRequest({
        holdings: [
          { symbol: "AAPL", shares: 10, costBasis: 150 },
          { symbol: "GOOG", shares: 5, costBasis: 160 },
        ],
      }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      holdings: unknown[];
      totalValue: number;
      totalPnl: number;
      herfindahlIndex: number;
    };
    expect(body.holdings).toHaveLength(2);
    // AAPL: 10 * 200 = 2000, cost = 10 * 150 = 1500, pnl = 500
    // GOOG: 5 * 180 = 900, cost = 5 * 160 = 800, pnl = 100
    expect(body.totalValue).toBeCloseTo(2900, 0);
    expect(body.totalPnl).toBeCloseTo(600, 0);
    expect(body.herfindahlIndex).toBeGreaterThan(0);
  });

  it("computes allocation weights that sum to 1", async () => {
    const res = await handlePortfolioAnalytics(
      makeRequest({
        holdings: [
          { symbol: "AAPL", shares: 10, costBasis: 150 },
          { symbol: "GOOG", shares: 5, costBasis: 160 },
        ],
      }),
      makeEnv(),
    );
    const body = (await res.json()) as { holdings: Array<{ weight: number }> };
    const totalWeight = body.holdings.reduce((s, h) => s + h.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 4);
  });

  it("returns 502 when quote fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = await handlePortfolioAnalytics(
      makeRequest({ holdings: [{ symbol: "AAPL", shares: 10, costBasis: 150 }] }),
      makeEnv(),
    );
    expect(res.status).toBe(502);
  });

  it("returns 400 for negative shares", async () => {
    const res = await handlePortfolioAnalytics(
      makeRequest({ holdings: [{ symbol: "AAPL", shares: -5, costBasis: 150 }] }),
      makeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("uses cached quotes when available", async () => {
    mockKvStore.get.mockResolvedValue(JSON.stringify({ AAPL: 200 }));
    const res = await handlePortfolioAnalytics(
      makeRequest({ holdings: [{ symbol: "AAPL", shares: 10, costBasis: 150 }] }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
  });
});
