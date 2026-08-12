import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleQuote } from "../../../worker/routes/quote";

type KvStore = { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

function makeEnv(kv?: KvStore): Parameters<typeof handleQuote>[1] {
  return { QUOTE_CACHE: kv } as Parameters<typeof handleQuote>[1];
}

const yahooQuoteResponse = {
  chart: {
    result: [
      {
        meta: {
          symbol: "AAPL",
          shortName: "Apple Inc.",
          currency: "USD",
          regularMarketPrice: 175.5,
          chartPreviousClose: 173.0,
          previousClose: 173.0,
          regularMarketDayHigh: 176.0,
          regularMarketDayLow: 174.0,
          regularMarketVolume: 50_000_000,
          marketCap: 2_800_000_000_000,
          fiftyTwoWeekHigh: 200.0,
          fiftyTwoWeekLow: 130.0,
          fullExchangeName: "NASDAQ",
          marketState: "REGULAR",
        },
        timestamp: [Math.floor(Date.now() / 1000)],
        indicators: {
          quote: [
            {
              open: [174.0],
              high: [176.0],
              low: [174.0],
              close: [175.5],
              volume: [50_000_000],
            },
          ],
        },
      },
    ],
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("handleQuote", () => {
  it("returns 400 for empty symbol", async () => {
    const res = await handleQuote("", makeEnv());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Invalid");
  });

  it("returns 400 for invalid symbol characters", async () => {
    const res = await handleQuote("!!BAD!!", makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns demo quote when no KV binding", async () => {
    const res = await handleQuote("AAPL", makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; data: { ticker: string } };
    expect(body.data.ticker).toBe("AAPL");
    expect(body.status).toBe("demo");
  });

  it("returns cached quote when available", async () => {
    const cached = {
      schemaVersion: "1",
      kind: "quote",
      status: "live",
      data: { ticker: "MSFT", price: 400 },
      provenance: { source: "yahoo", fetchedAt: "2026-08-12T12:00:00.000Z" },
      warnings: [],
    };
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(JSON.stringify(cached)),
      put: vi.fn().mockResolvedValue(undefined),
    };
    const res = await handleQuote("MSFT", makeEnv(kv));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; provenance: { source: string } };
    expect(body.status).toBe("cached");
    expect(body.provenance.source).toBe("cache");
    expect(kv.get).toHaveBeenCalledWith("quote:MSFT", "text");
  });

  it("migrates legacy raw cached quotes into the canonical envelope", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(JSON.stringify({ ticker: "MSFT", price: 400 })),
      put: vi.fn().mockResolvedValue(undefined),
    };
    const res = await handleQuote("MSFT", makeEnv(kv));
    const body = (await res.json()) as {
      schemaVersion: string;
      data: { ticker: string };
      warnings: string[];
    };
    expect(body.schemaVersion).toBe("1");
    expect(body.data.ticker).toBe("MSFT");
    expect(body.warnings).toContain("Legacy cache entry migrated to schema version 1");
  });

  it("fetches from yahoo and caches result", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(yahooQuoteResponse))),
    );
    const res = await handleQuote("AAPL", makeEnv(kv));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; data: { ticker: string } };
    expect(body.status).toBe("live");
    expect(body.data.ticker).toBe("AAPL");
    expect(kv.put).toHaveBeenCalled();
  });

  it("returns 502 on upstream error", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("error", { status: 500 })));
    const res = await handleQuote("AAPL", makeEnv(kv));
    expect(res.status).toBe(502);
  });

  it("returns 404 for unknown ticker", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 })));
    const res = await handleQuote("XXXZZZ", makeEnv(kv));
    expect(res.status).toBe(404);
  });

  it("normalizes symbol to uppercase", async () => {
    const res = await handleQuote("aapl", makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { ticker: string } };
    expect(body.data.ticker).toBe("AAPL");
  });
});
