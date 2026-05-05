import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleEtfHoldings } from "../../../worker/routes/etf-holdings";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(): Parameters<typeof handleEtfHoldings>[1] {
  return { QUOTE_CACHE: mockKvStore } as Parameters<typeof handleEtfHoldings>[1];
}

const validResponse = {
  quoteSummary: {
    result: [
      {
        topHoldings: {
          holdings: [
            { symbol: "AAPL", holdingName: "Apple Inc", holdingPercent: { raw: 0.07 } },
            { symbol: "MSFT", holdingName: "Microsoft Corp", holdingPercent: { raw: 0.065 } },
            { symbol: "NVDA", holdingName: "NVIDIA Corp", holdingPercent: { raw: 0.06 } },
          ],
          sectorWeightings: [
            { technology: { raw: 0.32 } },
            { healthcare: { raw: 0.13 } },
            { financialServices: { raw: 0.12 } },
          ],
        },
        defaultKeyStatistics: {
          totalAssets: { raw: 500_000_000_000 },
        },
      },
    ],
  },
};

describe("handleEtfHoldings", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validResponse),
      }),
    );
    mockKvStore.get.mockResolvedValue(null);
    mockKvStore.put.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns holdings sorted by weight descending", async () => {
    const res = await handleEtfHoldings("SPY", makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { holdings: Array<{ symbol: string; weight: number }> };
    expect(body.holdings).toHaveLength(3);
    expect(body.holdings[0].symbol).toBe("AAPL");
    expect(body.holdings[0].weight).toBe(0.07);
  });

  it("returns sector weights", async () => {
    const res = await handleEtfHoldings("SPY", makeEnv());
    const body = (await res.json()) as { sectorWeights: Array<{ sector: string; weight: number }> };
    expect(body.sectorWeights.length).toBeGreaterThan(0);
    expect(body.sectorWeights[0].sector).toBe("Technology");
  });

  it("rejects invalid symbols", async () => {
    const res = await handleEtfHoldings("INVALID!!!", makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns cached data when available", async () => {
    const cached = {
      symbol: "SPY",
      holdings: [],
      sectorWeights: [],
      totalAssets: 0,
      holdingsCount: 0,
      source: "yahoo",
    };
    mockKvStore.get.mockResolvedValue(JSON.stringify(cached));
    const res = await handleEtfHoldings("SPY", makeEnv());
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("cache");
  });

  it("returns 502 on upstream failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = await handleEtfHoldings("SPY", makeEnv());
    expect(res.status).toBe(502);
  });

  it("caches result in KV", async () => {
    await handleEtfHoldings("SPY", makeEnv());
    expect(mockKvStore.put).toHaveBeenCalled();
  });

  it("handles exception gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const res = await handleEtfHoldings("SPY", makeEnv());
    expect(res.status).toBe(502);
  });
});
