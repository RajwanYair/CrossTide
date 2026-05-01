import { describe, it, expect, vi } from "vitest";
import { createProviderChain } from "../../../src/providers/provider-chain";
import type { MarketDataProvider, Quote, ProviderHealth } from "../../../src/providers/types";

function makeProvider(
  name: string,
  available: boolean,
  quoteResult: Quote | Error,
  historyResult: unknown[] | Error = [],
): MarketDataProvider {
  return {
    name,
    getQuote: vi
      .fn()
      .mockImplementation(() =>
        quoteResult instanceof Error ? Promise.reject(quoteResult) : Promise.resolve(quoteResult),
      ),
    getHistory: vi
      .fn()
      .mockImplementation(() =>
        historyResult instanceof Error
          ? Promise.reject(historyResult)
          : Promise.resolve(historyResult),
      ),
    search: vi.fn().mockResolvedValue([]),
    health: (): ProviderHealth => ({
      name,
      available,
      lastSuccessAt: available ? Date.now() : null,
      lastErrorAt: available ? null : Date.now(),
      consecutiveErrors: available ? 0 : 5,
    }),
  };
}

const AAPL_QUOTE: Quote = {
  ticker: "AAPL",
  price: 150.5,
  open: 149.0,
  high: 152.0,
  low: 148.0,
  previousClose: 149.0,
  volume: 50_000_000,
  timestamp: Date.now(),
};

describe("provider-chain (extended)", () => {
  describe("fallback priority", () => {
    it("uses first healthy provider that succeeds", async () => {
      const p1 = makeProvider("p1", true, AAPL_QUOTE);
      const p2 = makeProvider("p2", true, AAPL_QUOTE);
      const chain = createProviderChain([p1, p2]);
      await chain.getQuote("AAPL");
      expect(p1.getQuote).toHaveBeenCalledTimes(1);
      expect(p2.getQuote).toHaveBeenCalledTimes(0);
    });

    it("falls back to second provider when first fails", async () => {
      const p1 = makeProvider("p1", true, new Error("p1 failed"));
      const p2 = makeProvider("p2", true, AAPL_QUOTE);
      const chain = createProviderChain([p1, p2]);
      const q = await chain.getQuote("AAPL");
      expect(q.ticker).toBe("AAPL");
      expect(p2.getQuote).toHaveBeenCalledTimes(1);
    });

    it("skips unavailable providers and tries next healthy one", async () => {
      const p1 = makeProvider("p1", false, new Error("p1 unavailable"));
      const p2 = makeProvider("p2", true, AAPL_QUOTE);
      const chain = createProviderChain([p1, p2]);
      const q = await chain.getQuote("AAPL");
      expect(q.price).toBe(150.5);
      expect(p1.getQuote).not.toHaveBeenCalled();
    });

    it("falls back to unavailable providers as last resort", async () => {
      const p1 = makeProvider("p1", false, AAPL_QUOTE);
      const chain = createProviderChain([p1]);
      const q = await chain.getQuote("AAPL");
      expect(q.price).toBe(150.5);
    });

    it("throws when all providers fail", async () => {
      const p1 = makeProvider("p1", true, new Error("p1 fail"));
      const p2 = makeProvider("p2", true, new Error("p2 fail"));
      const chain = createProviderChain([p1, p2]);
      await expect(chain.getQuote("AAPL")).rejects.toThrow();
    });

    it("throws when empty provider list", () => {
      expect(() => createProviderChain([])).toThrow();
    });
  });

  describe("chain health", () => {
    it("reports available when at least one provider is available", () => {
      const p1 = makeProvider("p1", false, AAPL_QUOTE);
      const p2 = makeProvider("p2", true, AAPL_QUOTE);
      const chain = createProviderChain([p1, p2]);
      expect(chain.health().available).toBe(true);
    });

    it("reports unavailable when all providers are down", () => {
      const p1 = makeProvider("p1", false, new Error("fail"));
      const p2 = makeProvider("p2", false, new Error("fail"));
      const chain = createProviderChain([p1, p2]);
      expect(chain.health().available).toBe(false);
    });

    it("chain name is 'chain'", () => {
      const p1 = makeProvider("p1", true, AAPL_QUOTE);
      expect(createProviderChain([p1]).health().name).toBe("chain");
    });
  });

  describe("getHistory fallback", () => {
    const CANDLES = [
      { date: "2024-01-01", open: 148, high: 152, low: 147, close: 150, volume: 1000 },
    ];

    it("falls back on history fetch failure", async () => {
      const p1 = makeProvider("p1", true, AAPL_QUOTE, new Error("history fail"));
      const p2 = makeProvider("p2", true, AAPL_QUOTE, CANDLES);
      const chain = createProviderChain([p1, p2]);
      const history = await chain.getHistory("AAPL", 30);
      expect(history).toHaveLength(1);
    });
  });

  describe("search fallback", () => {
    it("returns results from first available provider", async () => {
      const p1 = makeProvider("p1", true, AAPL_QUOTE);
      vi.mocked(p1.search).mockResolvedValue([{ symbol: "AAPL", name: "Apple Inc." }]);
      const p2 = makeProvider("p2", true, AAPL_QUOTE);
      const chain = createProviderChain([p1, p2]);
      const results = await chain.search("AAPL");
      expect(results).toHaveLength(1);
      expect(p2.search).not.toHaveBeenCalled();
    });
  });

  describe("three-provider chain", () => {
    it("reaches third provider when first two fail", async () => {
      const p1 = makeProvider("p1", true, new Error("p1 fail"));
      const p2 = makeProvider("p2", true, new Error("p2 fail"));
      const p3 = makeProvider("p3", true, AAPL_QUOTE);
      const chain = createProviderChain([p1, p2, p3]);
      const q = await chain.getQuote("AAPL");
      expect(q.price).toBe(150.5);
      expect(p3.getQuote).toHaveBeenCalledTimes(1);
    });
  });
});
