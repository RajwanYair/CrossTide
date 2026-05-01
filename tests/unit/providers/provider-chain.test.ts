import { describe, it, expect } from "vitest";
import { createProviderChain } from "../../../src/providers/provider-chain";
import type { MarketDataProvider, Quote, ProviderHealth } from "../../../src/providers/types";

function makeMockProvider(
  name: string,
  opts: { fail?: boolean; available?: boolean } = {},
): MarketDataProvider {
  const fail = opts.fail ?? false;
  const available = opts.available ?? true;
  return {
    name,
    async getQuote(ticker: string): Promise<Quote> {
      if (fail) throw new Error(`${name} failed`);
      return {
        ticker,
        price: 100,
        open: 99,
        high: 101,
        low: 98,
        previousClose: 99,
        volume: 1000,
        timestamp: Date.now(),
      };
    },
    async getHistory(_t, days) {
      if (fail) throw new Error(`${name} failed`);
      return Array.from({ length: days }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, "0")}`,
        open: 100,
        high: 101,
        low: 99,
        close: 100,
        volume: 1000,
      }));
    },
    async search() {
      if (fail) throw new Error(`${name} failed`);
      return [{ symbol: "AAPL", name: "Apple" }];
    },
    health(): ProviderHealth {
      return { name, available, lastSuccessAt: null, lastErrorAt: null, consecutiveErrors: 0 };
    },
  };
}

describe("provider-chain", () => {
  it("throws on empty provider list", () => {
    expect(() => createProviderChain([])).toThrow("at least one provider");
  });

  it("uses the first healthy provider", async () => {
    const chain = createProviderChain([makeMockProvider("primary"), makeMockProvider("fallback")]);
    const q = await chain.getQuote("AAPL");
    expect(q.ticker).toBe("AAPL");
  });

  it("falls back when primary fails", async () => {
    const chain = createProviderChain([
      makeMockProvider("primary", { fail: true }),
      makeMockProvider("fallback"),
    ]);
    const q = await chain.getQuote("AAPL");
    expect(q.ticker).toBe("AAPL");
  });

  it("skips unavailable providers", async () => {
    const chain = createProviderChain([
      makeMockProvider("down", { available: false }),
      makeMockProvider("up"),
    ]);
    const q = await chain.getQuote("AAPL");
    expect(q.ticker).toBe("AAPL");
  });

  it("tries unavailable providers as last resort", async () => {
    const chain = createProviderChain([makeMockProvider("down", { available: false })]);
    // Only provider is "unavailable" but still functional
    const q = await chain.getQuote("AAPL");
    expect(q.ticker).toBe("AAPL");
  });

  it("throws when all providers fail", async () => {
    const chain = createProviderChain([
      makeMockProvider("a", { fail: true }),
      makeMockProvider("b", { fail: true }),
    ]);
    await expect(chain.getQuote("AAPL")).rejects.toThrow("failed");
  });

  it("chain health reflects provider availability", () => {
    const chain = createProviderChain([
      makeMockProvider("a", { available: false }),
      makeMockProvider("b", { available: true }),
    ]);
    expect(chain.health().available).toBe(true);
  });

  it("chain health unavailable when all providers down", () => {
    const chain = createProviderChain([
      makeMockProvider("a", { available: false }),
      makeMockProvider("b", { available: false }),
    ]);
    expect(chain.health().available).toBe(false);
  });

  it("getHistory falls back correctly", async () => {
    const chain = createProviderChain([
      makeMockProvider("primary", { fail: true }),
      makeMockProvider("fallback"),
    ]);
    const candles = await chain.getHistory("AAPL", 5);
    expect(candles).toHaveLength(5);
  });

  it("search falls back correctly", async () => {
    const chain = createProviderChain([
      makeMockProvider("primary", { fail: true }),
      makeMockProvider("fallback"),
    ]);
    const results = await chain.search("AAP");
    expect(results.length).toBeGreaterThan(0);
  });
});
