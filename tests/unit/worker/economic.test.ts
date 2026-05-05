import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleEconomic } from "../../../worker/routes/economic";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(
  overrides: Partial<{ QUOTE_CACHE: typeof mockKvStore }> = {},
): Parameters<typeof handleEconomic>[0] {
  return { QUOTE_CACHE: mockKvStore, ...overrides } as Parameters<typeof handleEconomic>[0];
}

const yahooResponse = {
  quoteResponse: {
    result: [
      {
        symbol: "^TNX",
        regularMarketPrice: 4.25,
        regularMarketChange: 0.05,
        regularMarketChangePercent: 1.19,
      },
      {
        symbol: "^VIX",
        regularMarketPrice: 18.5,
        regularMarketChange: -1.2,
        regularMarketChangePercent: -6.09,
      },
    ],
  },
};

describe("handleEconomic", () => {
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

  it("returns economic indicators from yahoo", async () => {
    const res = await handleEconomic(makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { indicators: Array<{ symbol: string }> };
    expect(body.indicators).toHaveLength(2);
    expect(body.indicators[0]!.symbol).toBe("^TNX");
  });

  it("returns cached data when available", async () => {
    const cached = {
      indicators: [{ symbol: "^VIX", name: "VIX", price: 20, change: 0, changePercent: 0 }],
      timestamp: Date.now(),
      source: "yahoo",
    };
    mockKvStore.get.mockResolvedValue(JSON.stringify(cached));
    const res = await handleEconomic(makeEnv());
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("cache");
  });

  it("returns 502 when upstream fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = await handleEconomic(makeEnv());
    expect(res.status).toBe(502);
  });

  it("handles fetch exception gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const res = await handleEconomic(makeEnv());
    expect(res.status).toBe(502);
  });

  it("caches result in KV", async () => {
    await handleEconomic(makeEnv());
    expect(mockKvStore.put).toHaveBeenCalled();
  });

  it("works without KV cache binding", async () => {
    const res = await handleEconomic(
      makeEnv({ QUOTE_CACHE: undefined as unknown as typeof mockKvStore }),
    );
    expect(res.status).toBe(200);
  });
});
