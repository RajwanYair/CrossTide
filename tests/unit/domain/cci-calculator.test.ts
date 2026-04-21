import { describe, it, expect } from "vitest";
import { computeCciSeries, computeCci } from "../../../src/domain/cci-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeCciSeries", () => {
  it("returns all nulls for insufficient data", () => {
    const series = computeCciSeries(makeCandles([100, 101]), 20);
    expect(series.every((p) => p.value === null)).toBe(true);
  });

  it("first period-1 entries are null", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const series = computeCciSeries(makeCandles(closes), 20);
    for (let i = 0; i < 19; i++) expect(series[i]?.value).toBeNull();
    expect(series[19]?.value).toBeTypeOf("number");
  });

  it("CCI is 0 for flat prices", () => {
    const closes = Array.from({ length: 25 }, () => 100);
    const series = computeCciSeries(makeCandles(closes), 20);
    const valid = series.filter((p) => p.value !== null);
    for (const p of valid) expect(p.value).toBe(0);
  });
});

describe("computeCci", () => {
  it("returns null for insufficient data", () => {
    expect(computeCci(makeCandles([100]), 20)).toBeNull();
  });

  it("returns the latest CCI value", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = computeCci(makeCandles(closes), 20);
    expect(result).toBeTypeOf("number");
  });
});
