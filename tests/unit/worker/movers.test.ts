import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleMovers } from "../../../worker/routes/movers";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(): Parameters<typeof handleMovers>[1] {
  return { QUOTE_CACHE: mockKvStore } as Parameters<typeof handleMovers>[1];
}

function makeUrl(params: Record<string, string> = {}): URL {
  const u = new URL("https://example.com/api/movers");
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v);
  }
  return u;
}

const screenerResponse = {
  finance: {
    result: [
      {
        quotes: [
          {
            symbol: "NVDA",
            shortName: "NVIDIA Corp",
            regularMarketPrice: 950,
            regularMarketChange: 45,
            regularMarketChangePercent: 4.97,
            regularMarketVolume: 55_000_000,
          },
          {
            symbol: "TSLA",
            shortName: "Tesla Inc",
            regularMarketPrice: 180,
            regularMarketChange: 8,
            regularMarketChangePercent: 4.65,
            regularMarketVolume: 80_000_000,
          },
        ],
      },
    ],
  },
};

describe("handleMovers", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(screenerResponse),
      }),
    );
    mockKvStore.get.mockResolvedValue(null);
    mockKvStore.put.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns gainers, losers, and active", async () => {
    const res = await handleMovers(makeUrl(), makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      gainers: unknown[];
      losers: unknown[];
      active: unknown[];
    };
    expect(body.gainers).toBeDefined();
    expect(body.losers).toBeDefined();
    expect(body.active).toBeDefined();
  });

  it("returns cached data when available", async () => {
    const cached = {
      gainers: [],
      losers: [],
      active: [],
      timestamp: Date.now(),
      source: "yahoo",
    };
    mockKvStore.get.mockResolvedValue(JSON.stringify(cached));
    const res = await handleMovers(makeUrl(), makeEnv());
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("cache");
  });

  it("handles fetch exception gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const res = await handleMovers(makeUrl(), makeEnv());
    expect(res.status).toBe(502);
  });

  it("caches result in KV", async () => {
    await handleMovers(makeUrl(), makeEnv());
    expect(mockKvStore.put).toHaveBeenCalled();
  });

  it("respects count parameter", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(screenerResponse),
    });
    vi.stubGlobal("fetch", fetchMock);
    await handleMovers(makeUrl({ count: "5" }), makeEnv());
    // Each screener call should include count=5
    const calls = fetchMock.mock.calls as Array<[string]>;
    for (const [url] of calls) {
      expect(url).toContain("count=5");
    }
  });

  it("clamps count to max 25", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(screenerResponse),
    });
    vi.stubGlobal("fetch", fetchMock);
    await handleMovers(makeUrl({ count: "100" }), makeEnv());
    const calls = fetchMock.mock.calls as Array<[string]>;
    for (const [url] of calls) {
      expect(url).toContain("count=25");
    }
  });
});
