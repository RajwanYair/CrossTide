import { describe, it, expect } from "vitest";
import type { MarketDataProvider, Quote, ProviderHealth } from "../../../src/providers/types";
import type { DailyCandle } from "../../../src/types/domain";

describe("MarketDataProvider interface", () => {
  it("can be implemented as a mock", () => {
    const mock: MarketDataProvider = {
      name: "mock",
      getQuote: async (ticker: string): Promise<Quote> => ({
        ticker,
        price: 100,
        open: 99,
        high: 101,
        low: 98,
        previousClose: 99.5,
        volume: 1_000_000,
        timestamp: Date.now(),
      }),
      getHistory: async (_ticker: string, days: number): Promise<readonly DailyCandle[]> =>
        Array.from({ length: days }, (_, i) => ({
          date: `2025-01-${String(i + 1).padStart(2, "0")}`,
          open: 100,
          high: 101,
          low: 99,
          close: 100,
          volume: 1000,
        })),
      search: async () => [{ symbol: "AAPL", name: "Apple Inc" }],
      health: (): ProviderHealth => ({
        name: "mock",
        available: true,
        lastSuccessAt: Date.now(),
        lastErrorAt: null,
        consecutiveErrors: 0,
      }),
    };

    expect(mock.name).toBe("mock");
    expect(typeof mock.getQuote).toBe("function");
    expect(typeof mock.getHistory).toBe("function");
    expect(typeof mock.search).toBe("function");
    expect(typeof mock.health).toBe("function");
  });

  it("getQuote returns expected shape", async () => {
    const provider: MarketDataProvider = createMockProvider();
    const quote = await provider.getQuote("AAPL");
    expect(quote.ticker).toBe("AAPL");
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.volume).toBeGreaterThan(0);
  });

  it("getHistory returns candles with correct length", async () => {
    const provider = createMockProvider();
    const candles = await provider.getHistory("AAPL", 30);
    expect(candles).toHaveLength(30);
    expect(candles[0]!.date).toBeDefined();
    expect(candles[0]!.close).toBeDefined();
  });

  it("search returns results with symbol and name", async () => {
    const provider = createMockProvider();
    const results = await provider.search("AAP");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.symbol).toBe("AAPL");
    expect(results[0]!.name).toBeDefined();
  });

  it("health returns provider status", () => {
    const provider = createMockProvider();
    const h = provider.health();
    expect(h.name).toBe("mock");
    expect(h.available).toBe(true);
    expect(h.consecutiveErrors).toBe(0);
  });
});

function createMockProvider(): MarketDataProvider {
  return {
    name: "mock",
    getQuote: async (ticker) => ({
      ticker,
      price: 150.5,
      open: 149,
      high: 152,
      low: 148,
      previousClose: 149,
      volume: 5_000_000,
      timestamp: Date.now(),
    }),
    getHistory: async (_ticker, days) =>
      Array.from({ length: days }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, "0")}`,
        open: 100,
        high: 101,
        low: 99,
        close: 100,
        volume: 1000,
      })),
    search: async () => [{ symbol: "AAPL", name: "Apple Inc", exchange: "NASDAQ" }],
    health: () => ({
      name: "mock",
      available: true,
      lastSuccessAt: Date.now(),
      lastErrorAt: null,
      consecutiveErrors: 0,
    }),
  };
}
