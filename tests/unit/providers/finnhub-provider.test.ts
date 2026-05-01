import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFinnhubProvider } from "../../../src/providers/finnhub-provider";
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

describe("finnhub-provider", () => {
  let provider: MarketDataProvider;

  beforeEach(() => {
    mockFetch.mockReset();
    provider = createFinnhubProvider("KEY", "https://mock.finnhub");
  });

  it("getQuote parses Finnhub fields", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        c: 150.5,
        o: 149,
        h: 152,
        l: 148,
        pc: 149.25,
        t: 1_700_000_000,
      }),
    );
    const q = await provider.getQuote("AAPL");
    expect(q.ticker).toBe("AAPL");
    expect(q.price).toBe(150.5);
    expect(q.previousClose).toBe(149.25);
    expect(q.timestamp).toBe(1_700_000_000_000);
  });

  it("getQuote sends symbol + token in URL", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ c: 1, o: 1, h: 1, l: 1, pc: 1, t: 1 }),
    );
    await provider.getQuote("MSFT");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("symbol=MSFT");
    expect(url).toContain("token=KEY");
  });

  it("getQuote throws on malformed response", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));
    await expect(provider.getQuote("AAPL")).rejects.toThrow();
    expect(provider.health().consecutiveErrors).toBeGreaterThan(0);
  });

  it("getHistory builds DailyCandle list", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        s: "ok",
        t: [1_700_000_000, 1_700_086_400],
        o: [100, 102],
        h: [105, 106],
        l: [99, 101],
        c: [104, 105],
        v: [1_000, 2_000],
      }),
    );
    const candles = await provider.getHistory("AAPL", 2);
    expect(candles).toHaveLength(2);
    expect(candles[0]?.open).toBe(100);
    expect(candles[1]?.close).toBe(105);
  });

  it("getHistory throws on no_data", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ s: "no_data" }));
    await expect(provider.getHistory("XX", 5)).rejects.toThrow();
  });

  it("search maps results", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        result: [
          {
            symbol: "AAPL",
            displaySymbol: "AAPL",
            description: "Apple Inc.",
            type: "Common Stock",
          },
        ],
      }),
    );
    const r = await provider.search("apple");
    expect(r).toEqual([
      { symbol: "AAPL", name: "Apple Inc.", type: "Common Stock" },
    ]);
  });

  it("health tracks success/error state", async () => {
    expect(provider.health().consecutiveErrors).toBe(0);
    mockFetch.mockResolvedValue(
      jsonResponse({ c: 1, o: 1, h: 1, l: 1, pc: 1, t: 1 }),
    );
    await provider.getQuote("AAPL");
    expect(provider.health().lastSuccessAt).not.toBeNull();
    expect(provider.health().available).toBe(true);
  });
});
