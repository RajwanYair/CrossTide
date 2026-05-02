/**
 * Unit tests for the Tiingo data provider (H15).
 * All network calls are intercepted with vi.fn() mock.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTiingoProvider } from "../../../src/providers/tiingo-provider";
import type { MarketDataProvider } from "../../../src/providers/types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ── Helpers ───────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => JSON.parse(text),
    text: async () => text,
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "",
    body: null,
    bodyUsed: false,
    clone: () => jsonResponse(body, status),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    bytes: async () => new Uint8Array(),
  } as Response;
}

// ── Fixture data ──────────────────────────────────────────────────────────

const SAMPLE_QUOTE = [
  {
    ticker: "AAPL",
    last: 196.5,
    prevClose: 194.0,
    high: 197.2,
    low: 193.8,
    open: 194.1,
    volume: 55_000_000,
    timestamp: "2025-05-02T20:00:00+00:00",
  },
];

const SAMPLE_EOD = [
  {
    date: "2025-04-30T00:00:00+00:00",
    open: 190.0,
    high: 193.0,
    low: 189.5,
    close: 192.0,
    volume: 47_000_000,
    adjClose: 192.0,
  },
  {
    date: "2025-05-01T00:00:00+00:00",
    open: 192.0,
    high: 195.1,
    low: 191.5,
    close: 194.5,
    volume: 48_000_000,
    adjClose: 194.5,
  },
  {
    date: "2025-05-02T00:00:00+00:00",
    open: 194.5,
    high: 197.0,
    low: 193.2,
    close: 196.0,
    volume: 52_000_000,
    adjClose: 196.0,
  },
];

const SAMPLE_SEARCH = [
  { ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ", assetType: "Stock" },
  { ticker: "AAPLX", name: "Apple something else", exchange: "NYSE", assetType: "Stock" },
];

describe("tiingo-provider", () => {
  let provider: MarketDataProvider;

  beforeEach(() => {
    mockFetch.mockReset();
    provider = createTiingoProvider("test-api-key", "https://mock.tiingo");
  });

  // ── getQuote ─────────────────────────────────────────────────────────────

  describe("getQuote", () => {
    it("returns a Quote with correct fields", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(SAMPLE_QUOTE));
      const q = await provider.getQuote("AAPL");
      expect(q.ticker).toBe("AAPL");
      expect(q.price).toBe(196.5);
      expect(q.open).toBe(194.1);
      expect(q.high).toBe(197.2);
      expect(q.low).toBe(193.8);
      expect(q.previousClose).toBe(194.0);
      expect(q.volume).toBe(55_000_000);
    });

    it("calls IEX endpoint with uppercased ticker", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(SAMPLE_QUOTE));
      await provider.getQuote("aapl");
      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("/iex");
      expect(calledUrl).toContain("tickers=AAPL");
    });

    it("throws FetchError when response is empty array", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));
      await expect(provider.getQuote("FAKE")).rejects.toThrow(/no quote data/);
    });

    it("tracks consecutive errors in health()", async () => {
      mockFetch.mockResolvedValue(jsonResponse([]));
      for (let i = 0; i < 3; i++) {
        await provider.getQuote("FAKE").catch(() => undefined);
      }
      expect(provider.health().consecutiveErrors).toBe(3);
    });
  });

  // ── getHistory ────────────────────────────────────────────────────────────

  describe("getHistory", () => {
    it("returns candles with correct OHLCV mapping", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(SAMPLE_EOD));
      const candles = await provider.getHistory("AAPL", 90);
      expect(candles).toHaveLength(3);
      expect(candles[0]!.date).toBe("2025-04-30");
      expect(candles[0]!.open).toBe(190.0);
      expect(candles[2]!.close).toBe(196.0);
    });

    it("calls history endpoint with correct path and dates", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(SAMPLE_EOD));
      await provider.getHistory("AAPL", 30);
      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("/tiingo/daily/AAPL/prices");
      expect(calledUrl).toContain("startDate=");
      expect(calledUrl).toContain("endDate=");
    });

    it("throws FetchError when data array is empty", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));
      await expect(provider.getHistory("FAKE", 90)).rejects.toThrow(/no history data/);
    });

    it("filters out rows with missing OHLC", async () => {
      const sparse = [
        { date: "2025-01-01T00:00:00Z" }, // no open/high/low/close fields
        ...SAMPLE_EOD,
      ];
      mockFetch.mockResolvedValueOnce(jsonResponse(sparse));
      const candles = await provider.getHistory("AAPL", 90);
      expect(candles).toHaveLength(3); // row without OHLC excluded
    });
  });

  // ── search ────────────────────────────────────────────────────────────────

  describe("search", () => {
    it("returns up to 10 results mapped to SearchResult shape", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(SAMPLE_SEARCH));
      const results = await provider.search("apple");
      expect(results).toHaveLength(2);
      expect(results[0]!.symbol).toBe("AAPL");
      expect(results[0]!.name).toBe("Apple Inc");
      expect(results[0]!.exchange).toBe("NASDAQ");
      expect(results[0]!.type).toBe("Stock");
    });

    it("returns empty array on fetch error", async () => {
      mockFetch.mockRejectedValue(new Error("network"));
      const results = await provider.search("apple");
      expect(results).toEqual([]);
      mockFetch.mockReset();
    });
  });

  // ── health ────────────────────────────────────────────────────────────────

  describe("health", () => {
    it("reports name=tiingo", () => {
      expect(provider.health().name).toBe("tiingo");
    });

    it("is available when consecutiveErrors < 5", () => {
      expect(provider.health().available).toBe(true);
    });

    it("resets consecutiveErrors on success", async () => {
      mockFetch.mockResolvedValue(jsonResponse([]));
      for (let i = 0; i < 3; i++) {
        await provider.getQuote("FAKE").catch(() => undefined);
      }
      expect(provider.health().consecutiveErrors).toBe(3);

      mockFetch.mockResolvedValueOnce(jsonResponse(SAMPLE_QUOTE));
      await provider.getQuote("AAPL");
      expect(provider.health().consecutiveErrors).toBe(0);
    });
  });
});
