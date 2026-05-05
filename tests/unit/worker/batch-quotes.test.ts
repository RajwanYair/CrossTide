import { describe, it, expect, vi, afterEach } from "vitest";
import { handleBatchQuotes } from "../../../worker/routes/batch-quotes";
import type { Env } from "../../../worker/index";

// Mock globalThis.fetch to prevent real network calls
afterEach(() => {
  vi.restoreAllMocks();
});

function makeUrl(params: Record<string, string>): URL {
  const url = new URL("https://api.example.com/api/quotes");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url;
}

const emptyEnv: Env = {};

describe("handleBatchQuotes", () => {
  it("returns 400 when symbols param is missing", async () => {
    const res = await handleBatchQuotes(makeUrl({}), emptyEnv);
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/missing/i);
  });

  it("returns 400 when symbols is empty string", async () => {
    const res = await handleBatchQuotes(makeUrl({ symbols: "" }), emptyEnv);
    expect(res.status).toBe(400);
  });

  it("returns 400 when more than 10 symbols provided", async () => {
    const symbols = Array.from({ length: 11 }, (_, i) => `T${i}`).join(",");
    const res = await handleBatchQuotes(makeUrl({ symbols }), emptyEnv);
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/maximum is 10/i);
  });

  it("returns 400 for invalid ticker format", async () => {
    const res = await handleBatchQuotes(makeUrl({ symbols: "AAPL,inv@lid" }), emptyEnv);
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/invalid symbol/i);
  });

  it("returns demo quotes when no cache configured", async () => {
    const res = await handleBatchQuotes(makeUrl({ symbols: "AAPL,MSFT" }), emptyEnv);
    expect(res.status).toBe(200);
    const body = await res.json<{ quotes: Record<string, unknown>; count: number }>();
    expect(body.count).toBe(2);
    expect(body.quotes).toHaveProperty("AAPL");
    expect(body.quotes).toHaveProperty("MSFT");
  });

  it("deduplicates repeated symbols", async () => {
    const res = await handleBatchQuotes(makeUrl({ symbols: "AAPL,AAPL,MSFT" }), emptyEnv);
    expect(res.status).toBe(200);
    const body = await res.json<{ quotes: Record<string, unknown>; count: number }>();
    expect(body.count).toBe(2);
    expect(Object.keys(body.quotes)).toHaveLength(2);
  });

  it("returns cache-control header", async () => {
    const res = await handleBatchQuotes(makeUrl({ symbols: "AAPL" }), emptyEnv);
    expect(res.headers.get("Cache-Control")).toContain("max-age=15");
  });

  it("returns quotes with source=demo when no cache", async () => {
    const res = await handleBatchQuotes(makeUrl({ symbols: "GOOG" }), emptyEnv);
    const body = await res.json<{ quotes: Record<string, { source: string }> }>();
    expect(body.quotes["GOOG"]!.source).toBe("demo");
  });

  it("handles single symbol correctly", async () => {
    const res = await handleBatchQuotes(makeUrl({ symbols: "TSLA" }), emptyEnv);
    expect(res.status).toBe(200);
    const body = await res.json<{ quotes: Record<string, unknown>; count: number }>();
    expect(body.count).toBe(1);
    expect(body.quotes).toHaveProperty("TSLA");
  });

  it("trims whitespace around symbol names", async () => {
    const res = await handleBatchQuotes(makeUrl({ symbols: " AAPL , MSFT " }), emptyEnv);
    expect(res.status).toBe(200);
    const body = await res.json<{ quotes: Record<string, unknown> }>();
    expect(body.quotes).toHaveProperty("AAPL");
    expect(body.quotes).toHaveProperty("MSFT");
  });

  it("uses KV cache when available and cache hit exists", async () => {
    const cachedQuote = {
      ticker: "AAPL",
      price: 150,
      marketState: "REGULAR",
      shortName: "Apple Inc.",
      currency: "USD",
      change: 1,
      changePercent: 0.67,
      previousClose: 149,
      open: 149.5,
      dayHigh: 151,
      dayLow: 148,
      volume: 5000000,
      marketCap: 2500000000000,
      fiftyTwoWeekHigh: 200,
      fiftyTwoWeekLow: 120,
      exchange: "NASDAQ",
    };

    const kvMock = {
      get: vi.fn().mockResolvedValue(JSON.stringify(cachedQuote)),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const envWithCache: Env = { QUOTE_CACHE: kvMock as unknown as Env["QUOTE_CACHE"] };

    const res = await handleBatchQuotes(makeUrl({ symbols: "AAPL" }), envWithCache);
    expect(res.status).toBe(200);
    const body = await res.json<{ quotes: Record<string, { source: string }> }>();
    expect(body.quotes["AAPL"]!.source).toBe("cache");
    expect(kvMock.get).toHaveBeenCalledWith("quote:AAPL", "text");
  });
});
