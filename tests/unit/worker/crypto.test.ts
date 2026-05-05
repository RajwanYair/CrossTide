import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleCrypto } from "../../../worker/routes/crypto";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(): Parameters<typeof handleCrypto>[1] {
  return { QUOTE_CACHE: mockKvStore } as Parameters<typeof handleCrypto>[1];
}

const validResponse = {
  id: "bitcoin",
  symbol: "btc",
  name: "Bitcoin",
  market_data: {
    current_price: { usd: 68000 },
    market_cap: { usd: 1_300_000_000_000 },
    total_volume: { usd: 35_000_000_000 },
    price_change_24h: 1500,
    price_change_percentage_24h: 2.25,
    high_24h: { usd: 69000 },
    low_24h: { usd: 66500 },
    ath: { usd: 73800 },
    ath_change_percentage: { usd: -7.86 },
    circulating_supply: 19_700_000,
    total_supply: 21_000_000,
  },
  last_updated: "2026-05-05T12:00:00.000Z",
};

describe("handleCrypto", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validResponse),
      }),
    );
    mockKvStore.get.mockResolvedValue(null);
    mockKvStore.put.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns crypto quote for valid coin id", async () => {
    const res = await handleCrypto("bitcoin", makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; price: number; source: string };
    expect(body.id).toBe("bitcoin");
    expect(body.price).toBe(68000);
    expect(body.source).toBe("coingecko");
  });

  it("rejects invalid coin id", async () => {
    const res = await handleCrypto("INVALID!!!", makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns cached data when available", async () => {
    const cached = { ...validResponse, id: "bitcoin", source: "coingecko" };
    mockKvStore.get.mockResolvedValue(JSON.stringify(cached));
    const res = await handleCrypto("bitcoin", makeEnv());
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("cache");
  });

  it("returns 404 for unknown coin", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const res = await handleCrypto("nonexistent-coin", makeEnv());
    expect(res.status).toBe(404);
  });

  it("returns 502 on upstream error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = await handleCrypto("bitcoin", makeEnv());
    expect(res.status).toBe(502);
  });

  it("caches result in KV", async () => {
    await handleCrypto("bitcoin", makeEnv());
    expect(mockKvStore.put).toHaveBeenCalled();
  });

  it("handles fetch exception gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const res = await handleCrypto("bitcoin", makeEnv());
    expect(res.status).toBe(502);
  });
});
