import { describe, it, expect } from "vitest";
import { computeWilliamsRSeries, computeWilliamsR } from "../../../src/domain/williams-r-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeWilliamsRSeries", () => {
  it("returns all nulls for insufficient data", () => {
    const series = computeWilliamsRSeries(makeCandles([100, 101]), 14);
    expect(series.every((p) => p.value === null)).toBe(true);
  });

  it("first period-1 entries are null", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const series = computeWilliamsRSeries(makeCandles(closes), 14);
    for (let i = 0; i < 13; i++) expect(series[i]?.value).toBeNull();
    expect(series[13]?.value).toBeTypeOf("number");
  });

  it("values are between -100 and 0", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 10);
    const series = computeWilliamsRSeries(makeCandles(closes), 14);
    const valid = series.filter((p) => p.value !== null);
    for (const p of valid) {
      expect(p.value!).toBeGreaterThanOrEqual(-100);
      expect(p.value!).toBeLessThanOrEqual(0);
    }
  });
});

describe("computeWilliamsR", () => {
  it("returns null for insufficient data", () => {
    expect(computeWilliamsR(makeCandles([100]), 14)).toBeNull();
  });

  it("returns the latest value", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = computeWilliamsR(makeCandles(closes), 14);
    expect(result).toBeTypeOf("number");
    expect(result!).toBeGreaterThanOrEqual(-100);
    expect(result!).toBeLessThanOrEqual(0);
  });
});
