import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchFinnhubQuote,
  fetchFinnhubCandles,
  fetchFinnhubSearch,
  FinnhubApiError,
} from "../../../worker/providers/finnhub";

const API_KEY = "test-key";

describe("fetchFinnhubQuote", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns quote for valid symbol", async () => {
    const mockResponse = {
      c: 175.5,
      d: 2.5,
      dp: 1.44,
      h: 176,
      l: 174,
      o: 174,
      pc: 173,
      t: 1700000000,
    };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));
    const result = await fetchFinnhubQuote("AAPL", API_KEY);
    expect(result.ticker).toBe("AAPL");
    expect(result.price).toBe(175.5);
    expect(result.change).toBe(2.5);
    expect(result.changePercent).toBe(1.44);
    expect(result.source).toBe("finnhub");
  });

  it("throws 404 for unknown ticker (all zeros)", async () => {
    const mockResponse = { c: 0, d: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: 0 };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));
    await expect(fetchFinnhubQuote("XXXXXX", API_KEY)).rejects.toThrow(FinnhubApiError);
  });

  it("error message mentions not found", async () => {
    const mockResponse = { c: 0, d: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: 0 };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));
    await expect(fetchFinnhubQuote("XXXXXX", API_KEY)).rejects.toThrow("not found");
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("error", { status: 429 }));
    await expect(fetchFinnhubQuote("AAPL", API_KEY)).rejects.toThrow(FinnhubApiError);
  });

  it("includes API key in URL", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ c: 100, d: 1, dp: 1, h: 101, l: 99, o: 100, pc: 99, t: 1700000000 }),
      ),
    );
    await fetchFinnhubQuote("AAPL", API_KEY);
    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0];
    expect(String(calledUrl)).toContain("token=test-key");
  });
});

describe("fetchFinnhubCandles", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns candles for valid symbol", async () => {
    const now = Math.floor(Date.now() / 1000);
    const mockResponse = {
      s: "ok",
      t: [now - 86400, now],
      o: [170, 174],
      h: [172, 176],
      l: [169, 173],
      c: [171, 175],
      v: [1000000, 2000000],
    };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));
    const result = await fetchFinnhubCandles("AAPL", "1y", "1d", API_KEY);
    expect(result.ticker).toBe("AAPL");
    expect(result.candles).toHaveLength(2);
    expect(result.candles[0]?.open).toBe(170);
    expect(result.source).toBe("finnhub");
  });

  it("throws 404 when status is not ok", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ s: "no_data" }), { status: 200 }),
    );
    await expect(fetchFinnhubCandles("XXXXXX", "1y", "1d", API_KEY)).rejects.toThrow(
      FinnhubApiError,
    );
  });

  it("throws on non-ok HTTP response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("error", { status: 500 }));
    await expect(fetchFinnhubCandles("AAPL", "1y", "1d", API_KEY)).rejects.toThrow(FinnhubApiError);
  });

  it("skips candles with missing data", async () => {
    const now = Math.floor(Date.now() / 1000);
    const mockResponse = {
      s: "ok",
      t: [now - 86400, now],
      o: [170, null],
      h: [172, 176],
      l: [169, 173],
      c: [171, 175],
      v: [1000000, 2000000],
    };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));
    const result = await fetchFinnhubCandles("AAPL", "1y", "1d", API_KEY);
    expect(result.candles).toHaveLength(1);
  });
});

describe("fetchFinnhubSearch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns search results", async () => {
    const mockResponse = {
      count: 2,
      result: [
        { symbol: "AAPL", description: "Apple Inc", type: "Common Stock", displaySymbol: "AAPL" },
        {
          symbol: "AAPL.MX",
          description: "Apple Inc (Mexico)",
          type: "Common Stock",
          displaySymbol: "AAPL.MX",
        },
      ],
    };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));
    const results = await fetchFinnhubSearch("apple", API_KEY);
    expect(results).toHaveLength(2);
    expect(results[0]?.symbol).toBe("AAPL");
    expect(results[0]?.description).toBe("Apple Inc");
  });

  it("respects limit parameter", async () => {
    const mockResponse = {
      count: 5,
      result: Array.from({ length: 5 }, (_, i) => ({
        symbol: `SYM${i}`,
        description: `Stock ${i}`,
        type: "Common Stock",
      })),
    };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));
    const results = await fetchFinnhubSearch("test", API_KEY, 3);
    expect(results).toHaveLength(3);
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("error", { status: 403 }));
    await expect(fetchFinnhubSearch("test", API_KEY)).rejects.toThrow(FinnhubApiError);
  });

  it("handles empty results", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ count: 0, result: [] }), { status: 200 }),
    );
    const results = await fetchFinnhubSearch("zzzzzz", API_KEY);
    expect(results).toHaveLength(0);
  });
});
