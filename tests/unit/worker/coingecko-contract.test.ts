/**
 * Contract tests for CoinGecko worker provider (Q25).
 *
 * Validates that the provider correctly handles responses matching
 * the real CoinGecko API schema — catches schema drift when the
 * upstream API changes field names, nesting, or types.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchCoinGeckoQuote,
  fetchCoinGeckoOhlc,
  fetchCoinGeckoSearch,
  CoinGeckoApiError,
} from "../../../worker/providers/coingecko";
import type {
  CoinGeckoQuoteResult,
  CoinGeckoChartResult,
  CoinGeckoSearchHit,
} from "../../../worker/providers/coingecko";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// ── Realistic API response fixtures ───────────────────────────────────────────

/** Matches real GET /api/v3/coins/bitcoin response shape. */
const COIN_DETAIL_FIXTURE = {
  id: "bitcoin",
  symbol: "btc",
  name: "Bitcoin",
  market_data: {
    current_price: { usd: 67432.15 },
    market_cap: { usd: 1_327_000_000_000 },
    total_volume: { usd: 28_400_000_000 },
    price_change_24h: 1250.42,
    price_change_percentage_24h: 1.89,
    high_24h: { usd: 67890.0 },
    low_24h: { usd: 65200.0 },
    ath: { usd: 73750.07 },
    ath_change_percentage: { usd: -8.57 },
    circulating_supply: 19_672_543,
    total_supply: 21_000_000,
  },
  last_updated: "2024-05-15T12:30:00.000Z",
};

/** Matches real GET /api/v3/coins/bitcoin/ohlc response shape. */
const OHLC_FIXTURE = [
  [1715644800000, 67000, 67500, 66800, 67200],
  [1715731200000, 67200, 68000, 66900, 67800],
  [1715817600000, 67800, 68200, 67000, 67432],
];

/** Matches real GET /api/v3/search?query=bitcoin response shape. */
const SEARCH_FIXTURE = {
  coins: [
    { id: "bitcoin", name: "Bitcoin", symbol: "btc", market_cap_rank: 1 },
    { id: "bitcoin-cash", name: "Bitcoin Cash", symbol: "bch", market_cap_rank: 17 },
    { id: "wrapped-bitcoin", name: "Wrapped Bitcoin", symbol: "wbtc", market_cap_rank: 15 },
  ],
};

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, body = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

// ── Quote contract ────────────────────────────────────────────────────────────

describe("CoinGecko quote contract", () => {
  it("maps all fields from the real API schema", async () => {
    mockFetch.mockResolvedValueOnce(ok(COIN_DETAIL_FIXTURE));

    const result: CoinGeckoQuoteResult = await fetchCoinGeckoQuote("bitcoin");

    // Verify all required fields are present with correct types
    expect(result.id).toBe("bitcoin");
    expect(result.symbol).toBe("btc");
    expect(result.name).toBe("Bitcoin");
    expect(typeof result.price).toBe("number");
    expect(result.price).toBe(67432.15);
    expect(typeof result.marketCap).toBe("number");
    expect(typeof result.volume24h).toBe("number");
    expect(typeof result.change24h).toBe("number");
    expect(typeof result.changePercent24h).toBe("number");
    expect(typeof result.high24h).toBe("number");
    expect(typeof result.low24h).toBe("number");
    expect(typeof result.ath).toBe("number");
    expect(typeof result.athChangePercent).toBe("number");
    expect(typeof result.circulatingSupply).toBe("number");
    expect(result.totalSupply).toBe(21_000_000);
    expect(typeof result.lastUpdated).toBe("string");
    expect(result.source).toBe("coingecko");
  });

  it("handles missing market_data fields gracefully", async () => {
    const partial = {
      id: "unknown-coin",
      symbol: "unk",
      name: "Unknown",
      market_data: {
        current_price: { usd: 0.01 },
        // All other fields missing
      },
      last_updated: "2024-01-01T00:00:00.000Z",
    };
    mockFetch.mockResolvedValueOnce(ok(partial));

    const result = await fetchCoinGeckoQuote("unknown-coin");
    expect(result.price).toBe(0.01);
    expect(result.marketCap).toBe(0);
    expect(result.volume24h).toBe(0);
    expect(result.change24h).toBe(0);
  });

  it("throws CoinGeckoApiError on 404", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(404));

    await expect(fetchCoinGeckoQuote("nonexistent")).rejects.toThrow(CoinGeckoApiError);
  });

  it("throws CoinGeckoApiError on 429 rate limit", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(429));

    try {
      await fetchCoinGeckoQuote("bitcoin");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CoinGeckoApiError);
      expect((err as CoinGeckoApiError).status).toBe(429);
    }
  });
});

// ── OHLC contract ─────────────────────────────────────────────────────────────

describe("CoinGecko OHLC contract", () => {
  it("maps OHLC array tuples to typed candle objects", async () => {
    mockFetch.mockResolvedValueOnce(ok(OHLC_FIXTURE));

    const result: CoinGeckoChartResult = await fetchCoinGeckoOhlc("bitcoin", 7);

    expect(result.id).toBe("bitcoin");
    expect(result.source).toBe("coingecko");
    expect(result.candles).toHaveLength(3);

    const candle = result.candles[0]!;
    expect(typeof candle.date).toBe("string");
    expect(candle.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof candle.open).toBe("number");
    expect(typeof candle.high).toBe("number");
    expect(typeof candle.low).toBe("number");
    expect(typeof candle.close).toBe("number");
    expect(typeof candle.volume).toBe("number");
  });

  it("throws on empty OHLC response", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));

    await expect(fetchCoinGeckoOhlc("bitcoin", 1)).rejects.toThrow(CoinGeckoApiError);
  });

  it("handles valid candle entries with some nulls in array", async () => {
    const withSomeNulls = [
      [1715644800000, 67000, 67500, 66800, 67200],
      [1715817600000, 67800, 68200, 67000, 67432],
    ];
    mockFetch.mockResolvedValueOnce(ok(withSomeNulls));

    const result = await fetchCoinGeckoOhlc("bitcoin", 7);
    expect(result.candles).toHaveLength(2);
  });
});

// ── Search contract ───────────────────────────────────────────────────────────

describe("CoinGecko search contract", () => {
  it("maps search results with all fields", async () => {
    mockFetch.mockResolvedValueOnce(ok(SEARCH_FIXTURE));

    const results: CoinGeckoSearchHit[] = await fetchCoinGeckoSearch("bitcoin");

    expect(results).toHaveLength(3);
    const hit = results[0]!;
    expect(hit.id).toBe("bitcoin");
    expect(hit.symbol.toLowerCase()).toBe("btc");
    expect(hit.name).toBe("Bitcoin");
    expect(hit.marketCapRank).toBe(1);
  });

  it("handles empty search results", async () => {
    mockFetch.mockResolvedValueOnce(ok({ coins: [] }));

    const results = await fetchCoinGeckoSearch("zzzznonexistent");
    expect(results).toHaveLength(0);
  });

  it("respects limit parameter", async () => {
    mockFetch.mockResolvedValueOnce(ok(SEARCH_FIXTURE));

    const results = await fetchCoinGeckoSearch("bitcoin", 2);
    expect(results).toHaveLength(2);
  });
});
