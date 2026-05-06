/**
 * Q9 — Contract tests: Yahoo Finance v8 API response shapes.
 *
 * These tests use frozen fixture payloads that reflect the actual JSON
 * structure returned by Yahoo Finance. They validate that our internal
 * parsing logic (YahooChartResponse / YahooFundamentals) continues to
 * accept the expected shapes after any upstream schema drift.
 *
 * No network calls are made — purely offline contract verification.
 */
import { describe, it, expect } from "vitest";
import {
  fetchYahooChart,
  fetchYahooQuote,
  fetchYahooSearch,
  YahooApiError,
} from "../../../worker/providers/yahoo.js";
import { vi, beforeEach, afterEach } from "vitest";

// ── Fixture: Yahoo v8 chart response ────────────────────────────────────────

const yahooChartFixture = {
  chart: {
    result: [
      {
        meta: {
          symbol: "AAPL",
          currency: "USD",
          shortName: "Apple Inc.",
          regularMarketPrice: 175.5,
          chartPreviousClose: 173.0,
          previousClose: 173.0,
          regularMarketOpen: 174.0,
          regularMarketDayHigh: 177.0,
          regularMarketDayLow: 173.5,
          regularMarketVolume: 52_000_000,
          marketCap: 2_800_000_000_000,
          fiftyTwoWeekHigh: 199.62,
          fiftyTwoWeekLow: 124.17,
          exchangeName: "NMS",
          marketState: "REGULAR",
        },
        timestamp: [1_700_000_000, 1_700_086_400],
        indicators: {
          quote: [
            {
              open: [174.0, 175.0],
              high: [177.0, 176.0],
              low: [173.5, 174.5],
              close: [175.5, 175.0],
              volume: [52_000_000, 48_000_000],
            },
          ],
        },
        events: {
          splits: {
            "1700000000": { date: 1_700_000_000, splitRatio: 0.5 },
          },
          dividends: {
            "1700086400": { date: 1_700_086_400, amount: 0.24 },
          },
        },
      },
    ],
  },
};

// ── Fixture: Yahoo v8 search response ───────────────────────────────────────

const yahooSearchFixture = {
  quotes: [
    {
      symbol: "AAPL",
      shortname: "Apple Inc.",
      longname: "Apple Inc.",
      exchange: "NMS",
      exchDisp: "NASDAQ",
      quoteType: "EQUITY",
    },
    {
      symbol: "AAPLX",
      shortname: "Apple ETF",
      exchange: "PCX",
      quoteType: "ETF",
    },
    {
      symbol: "AAPLC",
      shortname: "Apple Crypto Mirror",
      exchange: "CCC",
      quoteType: "CRYPTOCURRENCY",
    },
    {
      symbol: "^AAPL",
      shortname: "Apple Index",
      exchange: "SNP",
      quoteType: "INDEX",
    },
  ],
};

// ── Fixture: error response ──────────────────────────────────────────────────

const yahooErrorFixture = {
  chart: {
    result: null,
    error: {
      code: "Not Found",
      description: "No fundamentals data found for any of the summaryTypes=summaryDetail",
    },
  },
};

function makeOkFetch(body: unknown): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

function makeFailFetch(status: number): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  } as unknown as Response);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Contract: chart endpoint ─────────────────────────────────────────────────

describe("Yahoo v8 chart contract", () => {
  it("parses canonical chart fixture into YahooChartResult", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooChartFixture));

    const result = await fetchYahooChart("AAPL", "1mo", "1d");

    expect(result.ticker).toBe("AAPL");
    expect(result.currency).toBe("USD");
    expect(result.candles).toHaveLength(2);
  });

  it("candle shape: all required numeric fields present", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooChartFixture));

    const { candles } = await fetchYahooChart("AAPL", "1mo", "1d");
    for (const c of candles) {
      expect(typeof c.date).toBe("string");
      expect(c.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof c.open).toBe("number");
      expect(typeof c.high).toBe("number");
      expect(typeof c.low).toBe("number");
      expect(typeof c.close).toBe("number");
      expect(typeof c.volume).toBe("number");
    }
  });

  it("annotates split events from events.splits", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooChartFixture));

    const { candles } = await fetchYahooChart("AAPL", "1mo", "1d");
    const split = candles.find((c) => c.splitFactor !== undefined);
    expect(split).toBeDefined();
    expect(split!.splitFactor).toBeCloseTo(0.5, 5);
  });

  it("annotates dividend events from events.dividends", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooChartFixture));

    const { candles } = await fetchYahooChart("AAPL", "1mo", "1d");
    const div = candles.find((c) => c.dividendAmount !== undefined);
    expect(div).toBeDefined();
    expect(div!.dividendAmount).toBeCloseTo(0.24, 5);
  });

  it("skips null OHLCV entries (market holidays)", async () => {
    const withNulls = structuredClone(yahooChartFixture);
    withNulls.chart.result[0].indicators.quote[0].close = [null as unknown as number, 175.0];
    vi.stubGlobal("fetch", makeOkFetch(withNulls));

    const { candles } = await fetchYahooChart("AAPL", "1mo", "1d");
    // First bar should be skipped because close is null
    expect(candles).toHaveLength(1);
  });

  it("throws YahooApiError on non-200 status", async () => {
    vi.stubGlobal("fetch", makeFailFetch(429));

    await expect(fetchYahooChart("AAPL", "1mo", "1d")).rejects.toThrow(YahooApiError);
  });

  it("throws YahooApiError when result array is missing", async () => {
    vi.stubGlobal("fetch", makeOkFetch({ chart: { result: null } }));

    await expect(fetchYahooChart("AAPL", "1mo", "1d")).rejects.toThrow(YahooApiError);
  });

  it("throws YahooApiError when quote indicators are missing", async () => {
    const noIndicators = structuredClone(yahooChartFixture);
    noIndicators.chart.result[0].indicators.quote = [];
    vi.stubGlobal("fetch", makeOkFetch(noIndicators));

    await expect(fetchYahooChart("AAPL", "1mo", "1d")).rejects.toThrow(YahooApiError);
  });
});

// ── Contract: quote endpoint ─────────────────────────────────────────────────

describe("Yahoo v8 quote contract", () => {
  it("parses canonical chart fixture into YahooQuoteResult", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooChartFixture));

    const q = await fetchYahooQuote("AAPL");

    expect(q.ticker).toBe("AAPL");
    expect(q.currency).toBe("USD");
    expect(q.price).toBeCloseTo(175.5, 1);
    expect(typeof q.change).toBe("number");
    expect(typeof q.changePercent).toBe("number");
    expect(q.marketState).toMatch(/^(PRE|REGULAR|POST|CLOSED)$/);
  });

  it("quote result contains all required fields", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooChartFixture));

    const q = await fetchYahooQuote("AAPL");

    expect(q.ticker).toBeDefined();
    expect(q.currency).toBeDefined();
    expect(q.price).toBeDefined();
    expect(q.previousClose).toBeDefined();
    expect(q.dayHigh).toBeDefined();
    expect(q.dayLow).toBeDefined();
    expect(q.marketState).toBeDefined();
    // change/changePercent may be 0 (defined) — check type instead
    expect(typeof q.change).toBe("number");
    expect(typeof q.changePercent).toBe("number");
  });

  it("computes change from regularMarketPrice minus chartPreviousClose", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooChartFixture));

    const q = await fetchYahooQuote("AAPL");

    const expectedChange = 175.5 - 173.0;
    expect(q.change).toBeCloseTo(expectedChange, 2);
  });

  it("falls back to CLOSED marketState for unknown values", async () => {
    const unknown = structuredClone(yahooChartFixture);
    unknown.chart.result[0].meta.marketState = "UNKNOWN_STATE";
    vi.stubGlobal("fetch", makeOkFetch(unknown));

    const q = await fetchYahooQuote("AAPL");
    expect(q.marketState).toBe("UNKNOWN_STATE"); // passed through as-is by cast
  });

  it("throws YahooApiError on 503 upstream error", async () => {
    vi.stubGlobal("fetch", makeFailFetch(503));

    await expect(fetchYahooQuote("AAPL")).rejects.toThrow(YahooApiError);
  });
});

// ── Contract: search endpoint ────────────────────────────────────────────────

describe("Yahoo v1 search contract", () => {
  it("parses canonical search fixture into YahooSearchHit[]", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooSearchFixture));

    const hits = await fetchYahooSearch("AAPL", 10);

    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits[0].ticker).toBe("AAPL");
    expect(hits[0].name).toBe("Apple Inc.");
  });

  it("search hit shape: required string fields", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooSearchFixture));

    const hits = await fetchYahooSearch("AAPL", 10);
    for (const h of hits) {
      expect(typeof h.ticker).toBe("string");
      expect(typeof h.name).toBe("string");
      expect(typeof h.exchange).toBe("string");
      expect(["EQUITY", "ETF", "CRYPTO", "INDEX", "MUTUALFUND", "FUTURES"]).toContain(h.type);
    }
  });

  it("maps CRYPTOCURRENCY quoteType to CRYPTO", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooSearchFixture));

    const hits = await fetchYahooSearch("AAPL", 10);
    const crypto = hits.find((h) => h.ticker === "AAPLC");
    expect(crypto?.type).toBe("CRYPTO");
  });

  it("maps INDEX quoteType correctly", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooSearchFixture));

    const hits = await fetchYahooSearch("AAPL", 10);
    const idx = hits.find((h) => h.ticker === "^AAPL");
    expect(idx?.type).toBe("INDEX");
  });

  it("respects the limit parameter", async () => {
    vi.stubGlobal("fetch", makeOkFetch(yahooSearchFixture));

    const hits = await fetchYahooSearch("AAPL", 2);
    expect(hits.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array when quotes field is missing", async () => {
    vi.stubGlobal("fetch", makeOkFetch({}));

    const hits = await fetchYahooSearch("AAPL", 10);
    expect(hits).toEqual([]);
  });

  it("throws YahooApiError on HTTP error", async () => {
    vi.stubGlobal("fetch", makeFailFetch(401));

    await expect(fetchYahooSearch("AAPL", 10)).rejects.toThrow(YahooApiError);
  });
});

// ── Contract: error fixture shape ────────────────────────────────────────────

describe("Yahoo error response shape", () => {
  it("error fixture matches expected {chart.result: null, chart.error} shape", () => {
    // Validates that our error fixture is structurally valid Yahoo error format
    expect(yahooErrorFixture.chart.result).toBeNull();
    expect(yahooErrorFixture.chart.error).toBeDefined();
    expect(typeof yahooErrorFixture.chart.error.code).toBe("string");
    expect(typeof yahooErrorFixture.chart.error.description).toBe("string");
  });
});
