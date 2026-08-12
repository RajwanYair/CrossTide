import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchTickerData, fetchAllTickers } from "../../../src/core/data-service";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.mock("../../../src/core/fetch", () => ({
  fetchWithTimeout: (...args: unknown[]) => mockFetch(...args),
}));

const mockConsensus = vi.fn(() => ({ signal: "BUY", confidence: 0.8 }));
vi.mock("../../../src/domain/signal-aggregator", () => ({
  aggregateConsensus: (...args: unknown[]) => mockConsensus(...args),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Generate N days of timestamps starting from epoch Jan 2 2023 */
function makeTimestamps(n: number): number[] {
  const base = new Date("2023-01-02").getTime() / 1000;
  return Array.from({ length: n }, (_, i) => base + i * 86400);
}

/** Build a valid Yahoo Finance v8 chart response. */
function yahooResponse(opts: {
  n?: number;
  instrumentType?: string;
  sector?: string;
  timezone?: string;
  marketState?: string;
  regularMarketTime?: number;
  withNulls?: boolean;
}): Record<string, unknown> {
  const n = opts.n ?? 10;
  const timestamps = makeTimestamps(n);

  const opens = Array.from({ length: n }, (_, i) => 100 + i * 0.5);
  const highs = opens.map((v) => v + 2);
  const lows = opens.map((v) => v - 1);
  const closes = opens.map((v) => v + 0.5);
  const volumes: (number | null)[] = Array.from({ length: n }, (_, i) =>
    opts.withNulls && i === 0 ? null : 1_000_000 + i * 10_000,
  );
  // Inject a null OHLC row to verify it is skipped
  if (opts.withNulls && n >= 3) {
    opens[1] = null as unknown as number;
  }

  return {
    chart: {
      result: [
        {
          meta: {
            regularMarketPrice: closes[closes.length - 1],
            previousClose: closes[closes.length - 2] ?? closes[closes.length - 1],
            symbol: "TEST",
            ...(opts.instrumentType !== undefined && { instrumentType: opts.instrumentType }),
            ...(opts.sector !== undefined && { sector: opts.sector }),
            ...(opts.timezone !== undefined && { exchangeTimezoneName: opts.timezone }),
            ...(opts.marketState !== undefined && { marketState: opts.marketState }),
            ...(opts.regularMarketTime !== undefined && {
              regularMarketTime: opts.regularMarketTime,
            }),
          },
          timestamp: timestamps,
          indicators: {
            quote: [{ open: opens, high: highs, low: lows, close: closes, volume: volumes }],
          },
        },
      ],
    },
  };
}

/** Create a minimal Response-like object that returns the given JSON. */
function makeResponse(body: unknown): { json: () => Promise<unknown> } {
  return { json: async () => body };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── fetchTickerData ───────────────────────────────────────────────────────────

describe("fetchTickerData", () => {
  it("returns structured TickerData from a valid response", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 10, sector: "Technology" })));

    const data = await fetchTickerData("AAPL");

    expect(data.ticker).toBe("AAPL");
    expect(data.price).toBeGreaterThan(0);
    expect(data.candles.length).toBeGreaterThan(0);
    expect(data.sector).toBe("Technology");
    expect(data.provenance?.source).toBe("Yahoo Finance");
    expect(data.dataStatus).toBe("live");
    expect(data.error).toBeUndefined();
  });

  it("propagates provider metadata into the provenance contract", async () => {
    mockFetch.mockResolvedValue(
      makeResponse(
        yahooResponse({
          n: 10,
          timezone: "America/New_York",
          marketState: "REGULAR",
          regularMarketTime: 1736942400,
        }),
      ),
    );

    const data = await fetchTickerData("AAPL");

    expect(data.provenance).toMatchObject({
      source: "Yahoo Finance",
      asOf: "2025-01-15T12:00:00.000Z",
      timezone: "America/New_York",
      coverage: "Historical OHLCV candles (1Y)",
      marketStatus: "REGULAR",
      adjustmentPolicy: "Yahoo Finance provider adjustment policy applies",
      limitations: ["Historical candles may be delayed or incomplete outside regular sessions."],
    });
  });

  it("populates closes30d with up to 30 values", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 40 })));

    const data = await fetchTickerData("SPY");

    expect(data.closes30d.length).toBeLessThanOrEqual(30);
    expect(data.closes30d.length).toBeGreaterThan(0);
  });

  it("consensus is null when fewer than 151 candles", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 50 })));

    const data = await fetchTickerData("TEST");

    expect(data.consensus).toBeNull();
    expect(mockConsensus).not.toHaveBeenCalled();
  });

  it("calls aggregateConsensus and attaches result when ≥151 candles", async () => {
    const sentinel = { signal: "NEUTRAL", confidence: 0.5 };
    mockConsensus.mockReturnValue(sentinel);
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 200 })));

    const data = await fetchTickerData("MSFT");

    expect(mockConsensus).toHaveBeenCalledOnce();
    expect(data.consensus).toBe(sentinel);
  });

  it("computes change and changePercent correctly", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 5 })));

    const data = await fetchTickerData("X");

    // Last close = 100 + 4×0.5 + 0.5 = 102.5; prev close = 102
    const expectedChange = data.price - data.candles[data.candles.length - 2]!.close;
    expect(data.change).toBeCloseTo(expectedChange, 5);
    expect(data.changePercent).toBeCloseTo(
      (expectedChange / data.candles[data.candles.length - 2]!.close) * 100,
      4,
    );
  });

  it("maps instrumentType EQUITY → stock", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 5, instrumentType: "EQUITY" })));
    const data = await fetchTickerData("AAPL");
    expect(data.instrumentType).toBe("stock");
  });

  it("maps instrumentType ETF → etf", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 5, instrumentType: "ETF" })));
    const data = await fetchTickerData("SPY");
    expect(data.instrumentType).toBe("etf");
  });

  it("maps instrumentType CRYPTOCURRENCY → crypto", async () => {
    mockFetch.mockResolvedValue(
      makeResponse(yahooResponse({ n: 5, instrumentType: "CRYPTOCURRENCY" })),
    );
    const data = await fetchTickerData("BTC-USD");
    expect(data.instrumentType).toBe("crypto");
  });

  it("maps unknown instrumentType → other", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 5, instrumentType: "FUTURE" })));
    const data = await fetchTickerData("GC=F");
    expect(data.instrumentType).toBe("other");
  });

  it("omits instrumentType when not present in response", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 5 })));
    const data = await fetchTickerData("X");
    expect(data.instrumentType).toBeUndefined();
  });

  it("skips rows with null OHLC and still builds candles", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 5, withNulls: true })));
    const data = await fetchTickerData("X");
    // Row 1 (index=1) has open=null and is skipped; row 0 has open=100 but vol=null→0
    expect(data.candles.every((c) => c.open != null)).toBe(true);
    expect(data.candles.length).toBeLessThan(5);
  });

  it("returns emptyData when fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));

    const data = await fetchTickerData("FAIL");

    expect(data.ticker).toBe("FAIL");
    expect(data.price).toBe(0);
    expect(data.error).toBe("network error");
    expect(data.consensus).toBeNull();
    expect(data.candles).toEqual([]);
  });

  it("falls back to the Worker provider chain when Yahoo fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Yahoo unavailable")).mockResolvedValueOnce(
      makeResponse({
        schemaVersion: "1",
        kind: "chart",
        status: "live",
        data: {
          ticker: "AAPL",
          currency: "USD",
          source: "massive",
          candles: [
            { date: "2026-07-28", open: 100, high: 105, low: 99, close: 104, volume: 1_000 },
            { date: "2026-07-29", open: 104, high: 108, low: 103, close: 107, volume: 1_200 },
          ],
        },
        provenance: { source: "massive", fetchedAt: "2026-07-29T00:00:00.000Z" },
        warnings: [],
      }),
    );

    const data = await fetchTickerData("AAPL");

    expect(data.error).toBeUndefined();
    expect(data.price).toBe(107);
    expect(data.provenance?.source).toBe("massive");
    expect(data.dataStatus).toBe("live");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(String(mockFetch.mock.calls[1]?.[0])).toContain("/api/chart?ticker=AAPL");
  });

  it("does not present Worker demo candles as live data", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Yahoo unavailable")).mockResolvedValueOnce(
      makeResponse({
        schemaVersion: "1",
        kind: "chart",
        status: "demo",
        data: {
          ticker: "AAPL",
          currency: "USD",
          source: "demo",
          candles: [
            { date: "2026-07-29", open: 100, high: 105, low: 99, close: 104, volume: 1_000 },
          ],
        },
        provenance: { source: "demo", fetchedAt: "2026-07-29T00:00:00.000Z" },
        warnings: [],
      }),
    );

    const data = await fetchTickerData("AAPL");

    expect(data.error).toBe("Yahoo unavailable");
    expect(data.candles).toEqual([]);
  });

  it("returns emptyData when response fails schema validation", async () => {
    mockFetch.mockResolvedValue(makeResponse({ bad: "data" }));

    const data = await fetchTickerData("BAD");

    expect(data.error).toBeDefined();
    expect(data.price).toBe(0);
  });

  it("returns emptyData when result has no candles", async () => {
    const empty = {
      chart: {
        result: [
          {
            meta: {},
            timestamp: [],
            indicators: { quote: [{ open: [], high: [], low: [], close: [], volume: [] }] },
          },
        ],
      },
    };
    mockFetch.mockResolvedValue(makeResponse(empty));

    const data = await fetchTickerData("EMPTY");

    expect(data.error).toBe("No candle data available");
    expect(data.candles).toEqual([]);
  });

  it("computes 52-week high and low across available candles", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 30 })));

    const data = await fetchTickerData("X");

    expect(data.high52w).toBeGreaterThanOrEqual(data.low52w);
    expect(data.low52w).toBeGreaterThan(0);
  });

  it("computes avgVolume as 20-day mean", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 25 })));

    const data = await fetchTickerData("X");

    expect(data.avgVolume).toBeGreaterThan(0);
  });
});

// ── fetchAllTickers ───────────────────────────────────────────────────────────

describe("fetchAllTickers", () => {
  it("returns an empty map for empty input", async () => {
    const result = await fetchAllTickers([]);
    expect(result.size).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns a map keyed by ticker", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 5 })));

    const result = await fetchAllTickers(["AAPL", "MSFT"]);

    expect(result.has("AAPL")).toBe(true);
    expect(result.has("MSFT")).toBe(true);
    expect(result.size).toBe(2);
  });

  it("fetches each ticker exactly once", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 5 })));

    await fetchAllTickers(["AAPL", "MSFT", "GOOG"]);

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("reports progress after each completed ticker", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 5 })));
    const progress: Array<[number, number]> = [];

    await fetchAllTickers(["A", "B", "C"], (done, total) => {
      progress.push([done, total]);
    });

    expect(progress.length).toBe(3);
    const totals = progress.map(([, t]) => t);
    expect(totals.every((t) => t === 3)).toBe(true);
    // done values should all be present (1, 2, 3)
    const dones = new Set(progress.map(([d]) => d));
    expect(dones).toContain(1);
    expect(dones).toContain(2);
    expect(dones).toContain(3);
  });

  it("includes error entries when a ticker fails", async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse(yahooResponse({ n: 5 })))
      .mockRejectedValueOnce(new Error("bad ticker"));

    const result = await fetchAllTickers(["OK", "FAIL"]);

    expect(result.get("OK")?.error).toBeUndefined();
    expect(result.get("FAIL")?.error).toBe("bad ticker");
  });

  it("handles a single ticker without errors", async () => {
    mockFetch.mockResolvedValue(makeResponse(yahooResponse({ n: 5, sector: "Energy" })));

    const result = await fetchAllTickers(["XOM"]);

    expect(result.get("XOM")?.sector).toBe("Energy");
  });
});
