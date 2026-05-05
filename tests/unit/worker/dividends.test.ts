import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleDividends } from "../../../worker/routes/dividends";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(
  overrides: Partial<{ QUOTE_CACHE: typeof mockKvStore }> = {},
): Parameters<typeof handleDividends>[1] {
  return { QUOTE_CACHE: mockKvStore, ...overrides } as Parameters<typeof handleDividends>[1];
}

const yahooResponse = {
  chart: {
    result: [
      {
        events: {
          dividends: {
            "1700000000": { date: 1700000000, amount: 0.24 },
            "1710000000": { date: 1710000000, amount: 0.25 },
          },
        },
      },
    ],
  },
};

describe("handleDividends", () => {
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

  it("returns 400 for invalid symbol", async () => {
    const res = await handleDividends("INVALID!!!!", makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns dividend history from yahoo", async () => {
    const res = await handleDividends("AAPL", makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      symbol: string;
      dividends: Array<{ date: string; amount: number }>;
      count: number;
    };
    expect(body.symbol).toBe("AAPL");
    expect(body.dividends).toHaveLength(2);
    expect(body.dividends[0]!.amount).toBeGreaterThan(0);
    expect(body.count).toBe(2);
  });

  it("returns cached data when available", async () => {
    const cached = {
      symbol: "AAPL",
      dividends: [{ date: "2024-01-15", amount: 0.24 }],
      count: 1,
      source: "yahoo",
    };
    mockKvStore.get.mockResolvedValue(JSON.stringify(cached));
    const res = await handleDividends("AAPL", makeEnv());
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("cache");
  });

  it("returns 502 when upstream fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = await handleDividends("AAPL", makeEnv());
    expect(res.status).toBe(502);
  });

  it("handles missing dividend events gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ chart: { result: [{}] } }),
      }),
    );
    const res = await handleDividends("GOOG", makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { dividends: unknown[]; count: number };
    expect(body.dividends).toHaveLength(0);
    expect(body.count).toBe(0);
  });

  it("caches result in KV", async () => {
    await handleDividends("AAPL", makeEnv());
    expect(mockKvStore.put).toHaveBeenCalled();
  });

  it("sorts dividends by date ascending", async () => {
    const res = await handleDividends("AAPL", makeEnv());
    const body = (await res.json()) as { dividends: Array<{ date: string }> };
    if (body.dividends.length >= 2) {
      expect(body.dividends[0]!.date <= body.dividends[1]!.date).toBe(true);
    }
  });
});
