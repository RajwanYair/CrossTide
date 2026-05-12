import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchCoinGeckoQuote,
  fetchCoinGeckoOhlc,
  fetchCoinGeckoSearch,
  CoinGeckoApiError,
} from "../../../worker/providers/coingecko";

const validCoinResponse = {
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
  last_updated: "2026-05-12T12:00:00.000Z",
};

describe("fetchCoinGeckoQuote", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns quote for valid coin", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(validCoinResponse), { status: 200 }),
    );
    const result = await fetchCoinGeckoQuote("bitcoin");
    expect(result.id).toBe("bitcoin");
    expect(result.price).toBe(68000);
    expect(result.marketCap).toBe(1_300_000_000_000);
    expect(result.source).toBe("coingecko");
  });

  it("throws 404 for unknown coin", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("Not Found", { status: 404 }));
    await expect(fetchCoinGeckoQuote("nonexistent")).rejects.toThrow(CoinGeckoApiError);
  });

  it("throws on rate limit", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("Too Many Requests", { status: 429 }));
    await expect(fetchCoinGeckoQuote("bitcoin")).rejects.toThrow(CoinGeckoApiError);
  });

  it("handles missing market_data gracefully", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "bitcoin", symbol: "btc", name: "Bitcoin" }), {
        status: 200,
      }),
    );
    const result = await fetchCoinGeckoQuote("bitcoin");
    expect(result.price).toBe(0);
    expect(result.source).toBe("coingecko");
  });
});

describe("fetchCoinGeckoOhlc", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns candles for valid coin", async () => {
    const ohlcData = [
      [1700000000000, 67000, 68000, 66000, 67500],
      [1700086400000, 67500, 69000, 67000, 68000],
    ];
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(ohlcData), { status: 200 }));
    const result = await fetchCoinGeckoOhlc("bitcoin", "1mo");
    expect(result.id).toBe("bitcoin");
    expect(result.candles).toHaveLength(2);
    expect(result.candles[0]?.open).toBe(67000);
    expect(result.source).toBe("coingecko");
  });

  it("deduplicates same-day candles", async () => {
    const ts = Date.UTC(2026, 0, 1);
    const ohlcData = [
      [ts, 100, 110, 90, 105],
      [ts + 3600000, 105, 115, 95, 110], // same day, later candle
    ];
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(ohlcData), { status: 200 }));
    const result = await fetchCoinGeckoOhlc("bitcoin", "1d");
    expect(result.candles).toHaveLength(1);
    expect(result.candles[0]?.close).toBe(110); // last entry wins
  });

  it("throws 404 for unknown coin", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("Not Found", { status: 404 }));
    await expect(fetchCoinGeckoOhlc("nonexistent", "1mo")).rejects.toThrow(CoinGeckoApiError);
  });

  it("throws on empty data", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    await expect(fetchCoinGeckoOhlc("bitcoin", "1mo")).rejects.toThrow(CoinGeckoApiError);
  });
});

describe("fetchCoinGeckoSearch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns search results", async () => {
    const mockResponse = {
      coins: [
        { id: "bitcoin", symbol: "btc", name: "Bitcoin", market_cap_rank: 1 },
        { id: "bitcoin-cash", symbol: "bch", name: "Bitcoin Cash", market_cap_rank: 20 },
      ],
    };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));
    const results = await fetchCoinGeckoSearch("bitcoin");
    expect(results).toHaveLength(2);
    expect(results[0]?.id).toBe("bitcoin");
    expect(results[0]?.symbol).toBe("BTC");
  });

  it("respects limit parameter", async () => {
    const mockResponse = {
      coins: Array.from({ length: 20 }, (_, i) => ({
        id: `coin-${i}`,
        symbol: `C${i}`,
        name: `Coin ${i}`,
      })),
    };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));
    const results = await fetchCoinGeckoSearch("coin", 5);
    expect(results).toHaveLength(5);
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("error", { status: 500 }));
    await expect(fetchCoinGeckoSearch("bitcoin")).rejects.toThrow(CoinGeckoApiError);
  });

  it("handles empty results", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ coins: [] }), { status: 200 }),
    );
    const results = await fetchCoinGeckoSearch("zzzzzz");
    expect(results).toHaveLength(0);
  });
});
