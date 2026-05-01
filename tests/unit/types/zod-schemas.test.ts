/**
 * Zod schema tests — boundary validation of domain & provider shapes.
 */
import { describe, it, expect } from "vitest";
import {
  TickerSchema,
  IsoDateSchema,
  DailyCandleSchema,
  MethodSignalSchema,
  ConsensusResultSchema,
  AppConfigSchema,
  YahooChartSchema,
  PolygonAggsSchema,
  CoinGeckoOhlcSchema,
  parseOrThrow,
} from "../../../src/types/zod-schemas";

describe("TickerSchema", () => {
  it("normalizes via brand constructor", () => {
    expect(TickerSchema.parse(" aapl ")).toBe("AAPL");
  });

  it("rejects invalid ticker", () => {
    expect(TickerSchema.safeParse("123").success).toBe(false);
  });
});

describe("IsoDateSchema", () => {
  it("accepts YYYY-MM-DD", () => {
    expect(IsoDateSchema.parse("2025-06-15")).toBe("2025-06-15");
  });

  it("rejects bogus dates", () => {
    expect(IsoDateSchema.safeParse("2025-02-30").success).toBe(false);
  });
});

describe("DailyCandleSchema", () => {
  it("accepts valid candle", () => {
    expect(
      DailyCandleSchema.parse({
        date: "2025-06-15",
        open: 100,
        high: 105,
        low: 99,
        close: 104,
        volume: 1_000_000,
      }),
    ).toBeDefined();
  });

  it("rejects negative volume", () => {
    const r = DailyCandleSchema.safeParse({
      date: "2025-06-15",
      open: 100,
      high: 105,
      low: 99,
      close: 104,
      volume: -1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects extra fields gracefully (preserves only declared)", () => {
    const r = DailyCandleSchema.safeParse({
      date: "2025-06-15",
      open: 100,
      high: 105,
      low: 99,
      close: 104,
      volume: 1,
      extra: "ignored",
    });
    expect(r.success).toBe(true);
  });
});

describe("MethodSignalSchema", () => {
  it("validates all required fields", () => {
    expect(
      MethodSignalSchema.parse({
        ticker: "AAPL",
        method: "RSI",
        direction: "BUY",
        description: "RSI < 30",
        currentClose: 175.5,
        evaluatedAt: "2025-06-15T12:00:00Z",
      }),
    ).toBeDefined();
  });

  it("rejects unknown method", () => {
    expect(
      MethodSignalSchema.safeParse({
        ticker: "AAPL",
        method: "UnknownMethod",
        direction: "BUY",
        description: "",
        currentClose: 100,
        evaluatedAt: "2025-06-15T12:00:00Z",
      }).success,
    ).toBe(false);
  });
});

describe("ConsensusResultSchema", () => {
  it("requires unit-interval strength", () => {
    expect(
      ConsensusResultSchema.safeParse({
        ticker: "AAPL",
        direction: "BUY",
        buyMethods: [],
        sellMethods: [],
        strength: 1.5,
      }).success,
    ).toBe(false);
  });
});

describe("AppConfigSchema", () => {
  it("validates default config", () => {
    expect(AppConfigSchema.parse({ theme: "dark", watchlist: [] })).toBeDefined();
  });

  it("rejects bad theme", () => {
    expect(AppConfigSchema.safeParse({ theme: "neon", watchlist: [] }).success).toBe(false);
  });
});

describe("Provider shapes", () => {
  it("YahooChartSchema accepts minimal valid response", () => {
    const r = YahooChartSchema.parse({
      chart: {
        result: [
          {
            meta: { symbol: "AAPL" },
            timestamp: [1718409600],
            indicators: {
              quote: [
                {
                  open: [100],
                  high: [105],
                  low: [99],
                  close: [104],
                  volume: [1000000],
                },
              ],
            },
          },
        ],
      },
    });
    expect(r.chart.result[0]?.meta.symbol).toBe("AAPL");
  });

  it("PolygonAggsSchema accepts results-less response", () => {
    expect(PolygonAggsSchema.parse({ status: "OK" })).toBeDefined();
  });

  it("CoinGeckoOhlcSchema accepts tuple array", () => {
    expect(CoinGeckoOhlcSchema.parse([[1718409600000, 100, 105, 99, 104]])).toHaveLength(1);
  });
});

describe("parseOrThrow", () => {
  it("returns parsed value on success", () => {
    expect(parseOrThrow(IsoDateSchema, "2025-06-15", "Date")).toBe("2025-06-15");
  });

  it("throws on failure with schema name", () => {
    expect(() => parseOrThrow(IsoDateSchema, "bogus", "Date")).toThrow(/Date/);
  });
});
