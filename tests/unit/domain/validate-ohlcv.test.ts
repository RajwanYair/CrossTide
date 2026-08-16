/** Tests for OHLCV data-quality validation. */
import { describe, expect, it } from "vitest";
import { validateOhlcv } from "../../../src/domain/validate-ohlcv";
import type { DailyCandle } from "../../../src/types/domain";

function candle(date: string, close = 10, extras: Record<string, number> = {}): DailyCandle {
  return { date, open: close, high: close + 1, low: close - 1, close, volume: 100, ...extras };
}

describe("validateOhlcv", () => {
  it("accepts ordered candles and reports corporate-action annotations", () => {
    const report = validateOhlcv([
      candle("2026-08-10", 10, { splitFactor: 0.5 }),
      candle("2026-08-11", 11, { dividendAmount: 0.25 }),
      candle("2026-08-12", 12),
    ]);
    expect(report.valid).toBe(true);
    expect(report.splitDates).toEqual(["2026-08-10"]);
    expect(report.dividendDates).toEqual(["2026-08-11"]);
  });

  it("reports invalid ranges, duplicates, ordering, and gaps", () => {
    const invalid = { date: "2026-08-01", open: 20, high: 10, low: -1, close: 30, volume: -2 };
    const report = validateOhlcv([invalid, candle("2026-08-10")]);
    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["invalid-value", "invalid-range", "gap"]),
    );
    const duplicate = validateOhlcv([
      candle("2026-08-10"),
      candle("2026-08-09"),
      candle("2026-08-09"),
    ]);
    expect(duplicate.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["out-of-order", "duplicate-date"]),
    );
  });

  it("reports currency mismatches", () => {
    const report = validateOhlcv([candle("2026-08-12")], {
      expectedCurrency: "USD",
      currency: "EUR",
    });
    expect(report.valid).toBe(false);
    expect(report.issues[0]?.code).toBe("currency-mismatch");
  });

  it("reports a duplicate candle when consecutive days share identical OHLCV values", () => {
    const report = validateOhlcv([
      candle("2026-08-10", 10),
      candle("2026-08-11", 10),
      candle("2026-08-12", 12),
    ]);
    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual(
      expect.objectContaining({ code: "duplicate-candle", date: "2026-08-11" }),
    );
    expect(report.issues.some((issue) => issue.date === "2026-08-12")).toBe(false);
  });

  it.each([
    { field: "splitFactor", value: 0, code: "invalid-split" },
    { field: "splitFactor", value: Number.NaN, code: "invalid-split" },
    { field: "dividendAmount", value: -0.01, code: "invalid-dividend" },
    { field: "dividendAmount", value: Number.POSITIVE_INFINITY, code: "invalid-dividend" },
  ])("rejects invalid $field annotations", ({ field, value, code }) => {
    const report = validateOhlcv([candle("2026-08-12", 10, { [field]: value })]);
    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain(code);
  });

  it("does not flag a weekend-only gap as invalid when an exchange calendar is given", () => {
    // 2026-08-07 is a Friday, 2026-08-10 is the following Monday.
    const candles = [candle("2026-08-07"), candle("2026-08-10")];
    const withoutExchange = validateOhlcv(candles, { maxTradingGapDays: 1 });
    expect(withoutExchange.issues.map((issue) => issue.code)).toContain("gap");

    const withExchange = validateOhlcv(candles, { exchange: "NYSE", maxTradingGapDays: 1 });
    expect(withExchange.issues.map((issue) => issue.code)).not.toContain("gap");
  });

  it("still flags a gap that skips real trading days on the exchange calendar", () => {
    // 2026-08-07 (Fri) to 2026-08-12 (Wed) skips Monday and Tuesday trading sessions.
    const report = validateOhlcv([candle("2026-08-07"), candle("2026-08-12")], {
      exchange: "NYSE",
    });
    expect(report.issues).toContainEqual(
      expect.objectContaining({ code: "gap", date: "2026-08-12" }),
    );
  });
});
