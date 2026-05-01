import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTwelveDataProvider } from "../../../src/providers/twelve-data-provider";
import type { MarketDataProvider } from "../../../src/providers/types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
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
    text: async () => JSON.stringify(body),
    bytes: async () => new Uint8Array(),
  } as Response;
}

const QUOTE_RESPONSE = {
  price: "150.50",
  open: "149.00",
  high: "152.00",
  low: "148.00",
  previous_close: "149.00",
  volume: "50000000",
  symbol: "AAPL",
  timestamp: 1700000000,
};

const TIME_SERIES_RESPONSE = {
  status: "ok",
  values: [
    {
      datetime: "2024-01-03",
      open: "151.00",
      high: "153.00",
      low: "150.00",
      close: "152.00",
      volume: "45000000",
    },
    {
      datetime: "2024-01-02",
      open: "150.00",
      high: "151.00",
      low: "149.00",
      close: "150.50",
      volume: "40000000",
    },
    {
      datetime: "2024-01-01",
      open: "148.00",
      high: "151.00",
      low: "147.00",
      close: "149.00",
      volume: "35000000",
    },
  ],
};

const SEARCH_RESPONSE = {
  data: [
    {
      symbol: "AAPL",
      instrument_name: "Apple Inc.",
      exchange: "NASDAQ",
      instrument_type: "Common Stock",
    },
    {
      symbol: "AAPD",
      instrument_name: "Direxion AAPL Bear",
      exchange: "NYSE",
      instrument_type: "ETF",
    },
  ],
};

describe("twelve-data-provider", () => {
  let provider: MarketDataProvider;

  beforeEach(() => {
    mockFetch.mockReset();
    provider = createTwelveDataProvider("test-api-key", "https://mock.twelve");
  });

  describe("getQuote", () => {
    it("returns a quote with correct fields", async () => {
      mockFetch.mockResolvedValue(jsonResponse(QUOTE_RESPONSE));
      const q = await provider.getQuote("AAPL");
      expect(q.ticker).toBe("AAPL");
      expect(q.price).toBe(150.5);
      expect(q.open).toBe(149.0);
      expect(q.high).toBe(152.0);
      expect(q.low).toBe(148.0);
      expect(q.previousClose).toBe(149.0);
      expect(q.volume).toBe(50_000_000);
    });

    it("includes apikey and ticker in request URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse(QUOTE_RESPONSE));
      await provider.getQuote("AAPL");
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("test-api-key");
      expect(url).toContain("AAPL");
    });

    it("uses timestamp from response", async () => {
      mockFetch.mockResolvedValue(jsonResponse(QUOTE_RESPONSE));
      const q = await provider.getQuote("AAPL");
      expect(q.timestamp).toBe(1700000000 * 1000);
    });

    it("tracks health on success", async () => {
      mockFetch.mockResolvedValue(jsonResponse(QUOTE_RESPONSE));
      await provider.getQuote("AAPL");
      const h = provider.health();
      expect(h.available).toBe(true);
      expect(h.lastSuccessAt).not.toBeNull();
      expect(h.consecutiveErrors).toBe(0);
    });

    it("records error on network failure", async () => {
      mockFetch.mockRejectedValue(new Error("network error"));
      await expect(provider.getQuote("AAPL")).rejects.toThrow();
      expect(provider.health().lastErrorAt).not.toBeNull();
    });

    it("marks unavailable after 3 consecutive failures", async () => {
      mockFetch.mockRejectedValue(new Error("fail"));
      for (let i = 0; i < 3; i++) {
        try {
          await provider.getQuote("X");
        } catch {}
      }
      expect(provider.health().available).toBe(false);
      expect(provider.health().consecutiveErrors).toBe(3);
    });

    it("throws on API error response (code >= 400)", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ code: 400, message: "Invalid API key" }));
      await expect(provider.getQuote("AAPL")).rejects.toThrow("Invalid API key");
    });

    it("throws when price field is absent", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ symbol: "AAPL" }));
      await expect(provider.getQuote("AAPL")).rejects.toThrow();
    });

    it("falls back to price when open/high/low/prev_close absent", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ price: "100.00", symbol: "X" }));
      const q = await provider.getQuote("X");
      expect(q.open).toBe(100.0);
      expect(q.high).toBe(100.0);
      expect(q.low).toBe(100.0);
      expect(q.previousClose).toBe(100.0);
    });
  });

  describe("getHistory", () => {
    it("returns candles sorted oldest-first", async () => {
      mockFetch.mockResolvedValue(jsonResponse(TIME_SERIES_RESPONSE));
      const candles = await provider.getHistory("AAPL", 3);
      expect(candles).toHaveLength(3);
      expect(candles[0].date).toBe("2024-01-01");
      expect(candles[2].date).toBe("2024-01-03");
    });

    it("parses candle fields correctly", async () => {
      mockFetch.mockResolvedValue(jsonResponse(TIME_SERIES_RESPONSE));
      const candles = await provider.getHistory("AAPL", 3);
      expect(candles[2].open).toBe(151.0);
      expect(candles[2].high).toBe(153.0);
      expect(candles[2].low).toBe(150.0);
      expect(candles[2].close).toBe(152.0);
      expect(candles[2].volume).toBe(45_000_000);
    });

    it("passes outputsize in request URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse(TIME_SERIES_RESPONSE));
      await provider.getHistory("AAPL", 60);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("outputsize=60");
    });

    it("throws on API error code", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ code: 429, message: "Rate limited" }));
      await expect(provider.getHistory("AAPL", 30)).rejects.toThrow("Rate limited");
    });

    it("throws on empty values array", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ status: "ok", values: [] }));
      await expect(provider.getHistory("AAPL", 30)).rejects.toThrow();
    });
  });

  describe("search", () => {
    it("returns search results with correct fields", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SEARCH_RESPONSE));
      const results = await provider.search("AAPL");
      expect(results).toHaveLength(2);
      expect(results[0].symbol).toBe("AAPL");
      expect(results[0].name).toBe("Apple Inc.");
      expect(results[0].exchange).toBe("NASDAQ");
      expect(results[0].type).toBe("Common Stock");
    });

    it("returns empty array when no data field", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));
      const results = await provider.search("XYZ");
      expect(results).toHaveLength(0);
    });
  });

  describe("health", () => {
    it("starts healthy with null timestamps", () => {
      const h = provider.health();
      expect(h.name).toBe("twelve-data");
      expect(h.available).toBe(true);
      expect(h.lastSuccessAt).toBeNull();
      expect(h.lastErrorAt).toBeNull();
      expect(h.consecutiveErrors).toBe(0);
    });

    it("recovers after success following errors", async () => {
      mockFetch.mockRejectedValue(new Error("fail"));
      try {
        await provider.getQuote("X");
      } catch {}
      expect(provider.health().consecutiveErrors).toBe(1);

      mockFetch.mockResolvedValue(jsonResponse(QUOTE_RESPONSE));
      await provider.getQuote("AAPL");
      expect(provider.health().consecutiveErrors).toBe(0);
      expect(provider.health().available).toBe(true);
    });
  });
});
