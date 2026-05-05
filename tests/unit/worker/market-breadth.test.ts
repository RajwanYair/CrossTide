import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMarketBreadth } from "../../../worker/routes/market-breadth";

type Env = Parameters<typeof handleMarketBreadth>[1];
type KvStore = { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

function makeEnv(kv?: KvStore): Env {
  return { QUOTE_CACHE: kv } as Env;
}

function makeRequest(body: unknown): Request {
  return new Request("https://test.local/api/market-breadth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockYahooQuote(symbol: string, price: number, changePercent: number): object {
  return {
    chart: {
      result: [
        {
          meta: {
            symbol,
            currency: "USD",
            regularMarketPrice: price,
            chartPreviousClose: price / (1 + changePercent / 100),
            shortName: symbol,
          },
          timestamp: [Math.floor(Date.now() / 1000)],
          indicators: {
            quote: [
              {
                open: [price],
                high: [price + 1],
                low: [price - 1],
                close: [price],
                volume: [1_000_000],
              },
            ],
          },
        },
      ],
    },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("handleMarketBreadth", () => {
  it("returns 400 for invalid JSON", async () => {
    const req = new Request("https://test.local/api/market-breadth", {
      method: "POST",
      body: "not json",
    });
    const res = await handleMarketBreadth(req, makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns 400 when symbols missing", async () => {
    const res = await handleMarketBreadth(makeRequest({}), makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns 400 for too many symbols", async () => {
    const symbols = Array.from({ length: 51 }, (_, i) => `SYM${i}`);
    const res = await handleMarketBreadth(makeRequest({ symbols }), makeEnv());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Maximum");
  });

  it("returns 400 for invalid symbol format", async () => {
    const res = await handleMarketBreadth(makeRequest({ symbols: ["!!BAD"] }), makeEnv());
    expect(res.status).toBe(400);
  });

  it("computes breadth for symbols", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(mockYahooQuote("AAPL", 150, 2.5))))
      .mockResolvedValueOnce(new Response(JSON.stringify(mockYahooQuote("GOOG", 140, -1.5))))
      .mockResolvedValueOnce(new Response(JSON.stringify(mockYahooQuote("MSFT", 300, 0.0))));
    vi.stubGlobal("fetch", mockFetch);

    const res = await handleMarketBreadth(
      makeRequest({ symbols: ["AAPL", "GOOG", "MSFT"] }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      total: number;
      advancers: number;
      decliners: number;
      unchanged: number;
      source: string;
    };
    expect(body.total).toBe(3);
    expect(body.advancers).toBeGreaterThanOrEqual(1);
    expect(body.source).toBe("yahoo");
  });

  it("returns cached response when available", async () => {
    const cached = {
      total: 2,
      advancers: 1,
      decliners: 1,
      unchanged: 0,
      adRatio: 1,
      avgChangePercent: 0.5,
      tickers: [],
      source: "yahoo",
    };
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(JSON.stringify(cached)),
      put: vi.fn().mockResolvedValue(undefined),
    };
    const res = await handleMarketBreadth(makeRequest({ symbols: ["AAPL", "GOOG"] }), makeEnv(kv));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("cache");
  });

  it("returns 502 when all fetches fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const res = await handleMarketBreadth(makeRequest({ symbols: ["AAPL"] }), makeEnv());
    expect(res.status).toBe(502);
  });
});
