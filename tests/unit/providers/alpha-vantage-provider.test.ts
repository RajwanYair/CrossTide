/**
 * Unit tests for Alpha Vantage provider.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAlphaVantageProvider } from "../../../src/providers/alpha-vantage-provider";
import type { MarketDataProvider } from "../../../src/providers/types";

// ── Mock fetch ───────────────────────────────────────────────────────────

const globalFetch = globalThis.fetch;

function mockFetch(body: unknown, status = 200): void {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(),
  });
}

afterEach(() => {
  globalThis.fetch = globalFetch;
});

// ── Fixtures ─────────────────────────────────────────────────────────────

const QUOTE_RESPONSE = {
  "Global Quote": {
    "01. symbol": "AAPL",
    "02. open": "185.50",
    "03. high": "187.00",
    "04. low": "184.20",
    "05. price": "186.75",
    "06. volume": "52345678",
    "07. latest trading day": "2025-01-15",
    "08. previous close": "185.00",
    "09. change": "1.75",
    "10. change percent": "0.9459%",
  },
};

const HISTORY_RESPONSE = {
  "Meta Data": { "2. Symbol": "AAPL" },
  "Time Series (Daily)": {
    "2025-01-15": {
      "1. open": "185.50",
      "2. high": "187.00",
      "3. low": "184.20",
      "4. close": "186.75",
      "5. volume": "52345678",
    },
    "2025-01-14": {
      "1. open": "184.00",
      "2. high": "186.00",
      "3. low": "183.50",
      "4. close": "185.00",
      "5. volume": "48000000",
    },
    "2025-01-13": {
      "1. open": "182.00",
      "2. high": "184.50",
      "3. low": "181.00",
      "4. close": "184.00",
      "5. volume": "45000000",
    },
  },
};

const SEARCH_RESPONSE = {
  bestMatches: [
    {
      "1. symbol": "AAPL",
      "2. name": "Apple Inc",
      "3. type": "Equity",
      "4. region": "United States",
      "8. currency": "USD",
    },
    {
      "1. symbol": "AAPL.LON",
      "2. name": "Apple Inc",
      "3. type": "Equity",
      "4. region": "United Kingdom",
      "8. currency": "GBP",
    },
  ],
};

// ── Tests ────────────────────────────────────────────────────────────────

describe("alpha-vantage-provider", () => {
  let provider: MarketDataProvider;

  beforeEach(() => {
    provider = createAlphaVantageProvider("test-key", "https://mock.av");
  });

  // ── getQuote ─────────────────────────────────────────────────────────

  describe("getQuote", () => {
    it("returns a Quote from GLOBAL_QUOTE", async () => {
      mockFetch(QUOTE_RESPONSE);
      const q = await provider.getQuote("AAPL");
      expect(q.ticker).toBe("AAPL");
      expect(q.price).toBe(186.75);
      expect(q.open).toBe(185.5);
      expect(q.high).toBe(187.0);
      expect(q.low).toBe(184.2);
      expect(q.previousClose).toBe(185.0);
      expect(q.volume).toBe(52345678);
    });

    it("uses correct API params", async () => {
      mockFetch(QUOTE_RESPONSE);
      await provider.getQuote("MSFT");
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain("function=GLOBAL_QUOTE");
      expect(url).toContain("symbol=MSFT");
      expect(url).toContain("apikey=test-key");
    });

    it("throws on rate limit Note", async () => {
      mockFetch({ Note: "Thank you for using Alpha Vantage! Please visit..." });
      await expect(provider.getQuote("AAPL")).rejects.toThrow("rate limit");
    });

    it("throws on Error Message", async () => {
      mockFetch({ "Error Message": "Invalid API call" });
      await expect(provider.getQuote("AAPL")).rejects.toThrow("Invalid API call");
    });

    it("throws on missing quote data", async () => {
      mockFetch({ "Global Quote": {} });
      await expect(provider.getQuote("AAPL")).rejects.toThrow("no quote data");
    });
  });

  // ── getHistory ───────────────────────────────────────────────────────

  describe("getHistory", () => {
    it("returns sorted candles oldest-first", async () => {
      mockFetch(HISTORY_RESPONSE);
      const candles = await provider.getHistory("AAPL", 30);
      expect(candles).toHaveLength(3);
      expect(candles[0].date).toBe("2025-01-13");
      expect(candles[2].date).toBe("2025-01-15");
    });

    it("parses OHLCV correctly", async () => {
      mockFetch(HISTORY_RESPONSE);
      const candles = await provider.getHistory("AAPL", 30);
      expect(candles[2].open).toBe(185.5);
      expect(candles[2].high).toBe(187.0);
      expect(candles[2].low).toBe(184.2);
      expect(candles[2].close).toBe(186.75);
      expect(candles[2].volume).toBe(52345678);
    });

    it("uses compact outputsize for ≤100 days", async () => {
      mockFetch(HISTORY_RESPONSE);
      await provider.getHistory("AAPL", 30);
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain("outputsize=compact");
    });

    it("uses full outputsize for >100 days", async () => {
      mockFetch(HISTORY_RESPONSE);
      await provider.getHistory("AAPL", 200);
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain("outputsize=full");
    });

    it("slices to requested days", async () => {
      mockFetch(HISTORY_RESPONSE);
      const candles = await provider.getHistory("AAPL", 2);
      expect(candles).toHaveLength(2);
    });

    it("throws on missing time series", async () => {
      mockFetch({ "Meta Data": {} });
      await expect(provider.getHistory("AAPL", 30)).rejects.toThrow("no history data");
    });

    it("throws on rate limit", async () => {
      mockFetch({ Note: "API limit reached" });
      await expect(provider.getHistory("AAPL", 30)).rejects.toThrow("rate limit");
    });
  });

  // ── search ───────────────────────────────────────────────────────────

  describe("search", () => {
    it("returns SearchResult array", async () => {
      mockFetch(SEARCH_RESPONSE);
      const results = await provider.search("AAPL");
      expect(results).toHaveLength(2);
      expect(results[0].symbol).toBe("AAPL");
      expect(results[0].name).toBe("Apple Inc");
      expect(results[0].exchange).toBe("United States");
      expect(results[0].type).toBe("Equity");
    });

    it("returns empty array when no matches", async () => {
      mockFetch({ bestMatches: [] });
      const results = await provider.search("XYZXYZ");
      expect(results).toHaveLength(0);
    });

    it("handles missing bestMatches", async () => {
      mockFetch({});
      const results = await provider.search("AAPL");
      expect(results).toHaveLength(0);
    });
  });

  // ── health ───────────────────────────────────────────────────────────

  describe("health", () => {
    it("starts healthy", () => {
      const h = provider.health();
      expect(h.name).toBe("alpha-vantage");
      expect(h.available).toBe(true);
      expect(h.consecutiveErrors).toBe(0);
    });

    it("records success", async () => {
      mockFetch(QUOTE_RESPONSE);
      await provider.getQuote("AAPL");
      const h = provider.health();
      expect(h.available).toBe(true);
      expect(h.lastSuccessAt).toBeTypeOf("number");
    });

    it("becomes unavailable after 3 errors", async () => {
      mockFetch({ "Error Message": "fail" });
      for (let i = 0; i < 3; i++) {
        try {
          await provider.getQuote("AAPL");
        } catch {
          /* expected */
        }
      }
      const h = provider.health();
      expect(h.available).toBe(false);
      expect(h.consecutiveErrors).toBe(3);
    });

    it("resets errors on success", async () => {
      mockFetch({ "Error Message": "fail" });
      try {
        await provider.getQuote("AAPL");
      } catch {
        /* expected */
      }
      mockFetch(QUOTE_RESPONSE);
      await provider.getQuote("AAPL");
      const h = provider.health();
      expect(h.available).toBe(true);
      expect(h.consecutiveErrors).toBe(0);
    });
  });
});
