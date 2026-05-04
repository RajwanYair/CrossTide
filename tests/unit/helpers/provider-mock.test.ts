/**
 * Unit tests for provider mock factory.
 */
import { describe, it, expect } from "vitest";
import {
  createMockProvider,
  makeQuote,
  makeCandles,
  makeSearchResult,
  makeHealth,
} from "../../helpers/provider-mock";

// ── makeQuote ────────────────────────────────────────────────────────────

describe("makeQuote", () => {
  it("returns default quote", () => {
    const q = makeQuote();
    expect(q.ticker).toBe("AAPL");
    expect(q.price).toBe(150);
    expect(q.volume).toBeGreaterThan(0);
  });

  it("accepts overrides", () => {
    const q = makeQuote({ ticker: "MSFT", price: 300 });
    expect(q.ticker).toBe("MSFT");
    expect(q.price).toBe(300);
    expect(q.open).toBe(148); // default kept
  });
});

// ── makeCandles ──────────────────────────────────────────────────────────

describe("makeCandles", () => {
  it("creates N candles from close prices", () => {
    const candles = makeCandles([10, 20, 30]);
    expect(candles).toHaveLength(3);
    expect(candles[0].close).toBe(10);
    expect(candles[2].close).toBe(30);
  });

  it("generates sequential dates", () => {
    const candles = makeCandles([1, 2, 3], "2025-03-01");
    expect(candles[0].date).toBe("2025-03-01");
    expect(candles[1].date).toBe("2025-03-02");
    expect(candles[2].date).toBe("2025-03-03");
  });

  it("sets OHLV relative to close", () => {
    const [c] = makeCandles([100]);
    expect(c.open).toBe(99);
    expect(c.high).toBe(102);
    expect(c.low).toBe(98);
    expect(c.volume).toBeGreaterThan(0);
  });
});

// ── makeSearchResult ─────────────────────────────────────────────────────

describe("makeSearchResult", () => {
  it("returns default search result", () => {
    const r = makeSearchResult();
    expect(r.symbol).toBe("AAPL");
    expect(r.name).toBe("Apple Inc.");
  });

  it("accepts overrides", () => {
    const r = makeSearchResult({ symbol: "GOOG", exchange: "NYSE" });
    expect(r.symbol).toBe("GOOG");
    expect(r.exchange).toBe("NYSE");
  });
});

// ── makeHealth ───────────────────────────────────────────────────────────

describe("makeHealth", () => {
  it("available by default", () => {
    const h = makeHealth();
    expect(h.available).toBe(true);
    expect(h.consecutiveErrors).toBe(0);
  });

  it("accepts unavailable override", () => {
    const h = makeHealth({ available: false, consecutiveErrors: 5 });
    expect(h.available).toBe(false);
    expect(h.consecutiveErrors).toBe(5);
  });
});

// ── createMockProvider ───────────────────────────────────────────────────

describe("createMockProvider", () => {
  it("creates provider with default name", () => {
    const { provider } = createMockProvider();
    expect(provider.name).toBe("mock-provider");
  });

  it("creates provider with custom name", () => {
    const { provider } = createMockProvider({ name: "test-prov" });
    expect(provider.name).toBe("test-prov");
  });

  it("getQuote returns default quote", async () => {
    const { provider } = createMockProvider();
    const q = await provider.getQuote("AAPL");
    expect(q.ticker).toBe("AAPL");
    expect(q.price).toBe(150);
  });

  it("getHistory returns default candles", async () => {
    const { provider } = createMockProvider();
    const candles = await provider.getHistory("AAPL", 3);
    expect(candles).toHaveLength(3);
  });

  it("search returns default results", async () => {
    const { provider } = createMockProvider();
    const results = await provider.search("Apple");
    expect(results).toHaveLength(1);
    expect(results[0].symbol).toBe("AAPL");
  });

  it("health returns default healthy state", () => {
    const { provider } = createMockProvider({ name: "my-prov" });
    const h = provider.health();
    expect(h.available).toBe(true);
    expect(h.name).toBe("my-prov");
  });

  it("stubs can be overridden", async () => {
    const { provider, stubs } = createMockProvider();
    stubs.getQuote.mockResolvedValue(makeQuote({ price: 999 }));
    const q = await provider.getQuote("X");
    expect(q.price).toBe(999);
  });

  it("stubs track calls", async () => {
    const { provider, stubs } = createMockProvider();
    await provider.getQuote("TSLA");
    expect(stubs.getQuote).toHaveBeenCalledWith("TSLA");
    expect(stubs.getQuote).toHaveBeenCalledTimes(1);
  });

  it("stubs can reject", async () => {
    const { provider, stubs } = createMockProvider();
    stubs.getHistory.mockRejectedValue(new Error("network"));
    await expect(provider.getHistory("X", 5)).rejects.toThrow("network");
  });

  it("multiple providers are independent", async () => {
    const a = createMockProvider({ name: "A" });
    const b = createMockProvider({ name: "B" });
    a.stubs.getQuote.mockResolvedValue(makeQuote({ price: 1 }));
    b.stubs.getQuote.mockResolvedValue(makeQuote({ price: 2 }));
    expect((await a.provider.getQuote("X")).price).toBe(1);
    expect((await b.provider.getQuote("X")).price).toBe(2);
  });
});
