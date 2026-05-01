import { describe, it, expect, vi, beforeEach } from "vitest";
import { createYahooProvider } from "../../../src/providers/yahoo-provider";
import type { MarketDataProvider } from "../../../src/providers/types";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "",
    body: null,
    bodyUsed: false,
    clone: () => jsonResponse(body),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    text: async () => JSON.stringify(body),
    bytes: async () => new Uint8Array(),
  } as Response;
}

const CHART_RESPONSE = {
  chart: {
    result: [
      {
        meta: { regularMarketPrice: 150.5, previousClose: 149.0, symbol: "AAPL" },
        timestamp: [1700000000],
        indicators: {
          quote: [
            {
              open: [149],
              high: [152],
              low: [148],
              close: [150.5],
              volume: [50_000_000],
            },
          ],
        },
      },
    ],
  },
};

const SEARCH_RESPONSE = {
  quotes: [
    { symbol: "AAPL", longname: "Apple Inc.", exchDisp: "NASDAQ", quoteType: "EQUITY" },
    { symbol: "AAPD", shortname: "Direxion Daily AAPL Bear", exchDisp: "NYSE" },
  ],
};

describe("yahoo-provider", () => {
  let provider: MarketDataProvider;

  beforeEach(() => {
    mockFetch.mockReset();
    provider = createYahooProvider("https://mock.api");
  });

  describe("getQuote", () => {
    it("returns a quote with correct fields", async () => {
      mockFetch.mockResolvedValue(jsonResponse(CHART_RESPONSE));
      const q = await provider.getQuote("AAPL");
      expect(q.ticker).toBe("AAPL");
      expect(q.price).toBe(150.5);
      expect(q.previousClose).toBe(149.0);
      expect(q.volume).toBe(50_000_000);
    });

    it("tracks health on success", async () => {
      mockFetch.mockResolvedValue(jsonResponse(CHART_RESPONSE));
      await provider.getQuote("AAPL");
      const h = provider.health();
      expect(h.available).toBe(true);
      expect(h.consecutiveErrors).toBe(0);
      expect(h.lastSuccessAt).not.toBeNull();
    });

    it("tracks health on error", async () => {
      mockFetch.mockRejectedValue(new Error("network"));
      await expect(provider.getQuote("AAPL")).rejects.toThrow();
      const h = provider.health();
      expect(h.consecutiveErrors).toBe(1);
      expect(h.lastErrorAt).not.toBeNull();
    });
  });

  describe("getHistory", () => {
    it("returns candles from chart API", async () => {
      const multiDay = {
        chart: {
          result: [
            {
              meta: {},
              timestamp: [1700000000, 1700086400, 1700172800],
              indicators: {
                quote: [
                  {
                    open: [100, 101, 102],
                    high: [103, 104, 105],
                    low: [99, 100, 101],
                    close: [102, 103, 104],
                    volume: [1000, 1100, 1200],
                  },
                ],
              },
            },
          ],
        },
      };
      mockFetch.mockResolvedValue(jsonResponse(multiDay));
      const candles = await provider.getHistory("AAPL", 30);
      expect(candles).toHaveLength(3);
      expect(candles[0]!.open).toBe(100);
      expect(candles[0]!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("skips candles with null OHLC", async () => {
      const partial = {
        chart: {
          result: [
            {
              meta: {},
              timestamp: [1700000000, 1700086400],
              indicators: {
                quote: [
                  {
                    open: [100, null],
                    high: [101, null],
                    low: [99, null],
                    close: [100, null],
                    volume: [1000, 1000],
                  },
                ],
              },
            },
          ],
        },
      };
      mockFetch.mockResolvedValue(jsonResponse(partial));
      const candles = await provider.getHistory("AAPL", 30);
      expect(candles).toHaveLength(1);
    });
  });

  describe("search", () => {
    it("returns search results", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SEARCH_RESPONSE));
      const results = await provider.search("AAP");
      expect(results).toHaveLength(2);
      expect(results[0]!.symbol).toBe("AAPL");
      expect(results[0]!.name).toBe("Apple Inc.");
      expect(results[0]!.exchange).toBe("NASDAQ");
    });
  });

  describe("health", () => {
    it("becomes unavailable after 5 consecutive errors", async () => {
      mockFetch.mockRejectedValue(new Error("fail"));
      for (let i = 0; i < 5; i++) {
        try {
          await provider.getQuote("X");
        } catch {
          /* expected */
        }
      }
      expect(provider.health().available).toBe(false);
      expect(provider.health().consecutiveErrors).toBe(5);
    });

    it("resets errors on success", async () => {
      mockFetch.mockRejectedValue(new Error("fail"));
      try {
        await provider.getQuote("X");
      } catch {
        /* expected */
      }
      expect(provider.health().consecutiveErrors).toBe(1);

      mockFetch.mockResolvedValue(jsonResponse(CHART_RESPONSE));
      await provider.getQuote("AAPL");
      expect(provider.health().consecutiveErrors).toBe(0);
    });
  });
});
