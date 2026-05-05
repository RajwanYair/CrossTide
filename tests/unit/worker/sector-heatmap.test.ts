import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleSectorHeatmap } from "../../../worker/routes/sector-heatmap";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(
  overrides: Partial<{ QUOTE_CACHE: typeof mockKvStore }> = {},
): Parameters<typeof handleSectorHeatmap>[0] {
  return { QUOTE_CACHE: mockKvStore, ...overrides } as Parameters<typeof handleSectorHeatmap>[0];
}

const yahooResponse = {
  quoteResponse: {
    result: [
      {
        symbol: "XLK",
        regularMarketPrice: 210.5,
        regularMarketChange: 3.2,
        regularMarketChangePercent: 1.54,
        regularMarketVolume: 8_000_000,
      },
      {
        symbol: "XLF",
        regularMarketPrice: 42.1,
        regularMarketChange: -0.3,
        regularMarketChangePercent: -0.71,
        regularMarketVolume: 12_000_000,
      },
    ],
  },
};

describe("handleSectorHeatmap", () => {
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

  it("returns sector data sorted by change percent desc", async () => {
    const res = await handleSectorHeatmap(makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      sectors: Array<{ sector: string; changePercent: number }>;
    };
    expect(body.sectors).toHaveLength(2);
    expect(body.sectors[0]!.sector).toBe("Technology");
    expect(body.sectors[0]!.changePercent).toBeGreaterThan(body.sectors[1]!.changePercent);
  });

  it("maps ETF symbols to sector names", async () => {
    const res = await handleSectorHeatmap(makeEnv());
    const body = (await res.json()) as { sectors: Array<{ sector: string; symbol: string }> };
    const tech = body.sectors.find((s) => s.symbol === "XLK");
    expect(tech?.sector).toBe("Technology");
  });

  it("returns cached data when available", async () => {
    const cached = {
      sectors: [
        { sector: "Energy", symbol: "XLE", price: 80, change: 1, changePercent: 1.2, volume: 5e6 },
      ],
      timestamp: Date.now(),
      source: "yahoo",
    };
    mockKvStore.get.mockResolvedValue(JSON.stringify(cached));
    const res = await handleSectorHeatmap(makeEnv());
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("cache");
  });

  it("returns 502 when upstream fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = await handleSectorHeatmap(makeEnv());
    expect(res.status).toBe(502);
  });

  it("handles fetch exception gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const res = await handleSectorHeatmap(makeEnv());
    expect(res.status).toBe(502);
  });

  it("caches result in KV", async () => {
    await handleSectorHeatmap(makeEnv());
    expect(mockKvStore.put).toHaveBeenCalled();
  });
});
