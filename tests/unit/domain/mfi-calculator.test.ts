import { describe, it, expect } from "vitest";
import { computeMfiSeries, computeMfi } from "../../../src/domain/mfi-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeMfiSeries", () => {
  it("returns all nulls for insufficient data", () => {
    const series = computeMfiSeries(makeCandles([100, 101]), 14);
    expect(series.every((p) => p.value === null)).toBe(true);
  });

  it("first period entries are null", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const series = computeMfiSeries(makeCandles(closes), 14);
    for (let i = 0; i < 14; i++) expect(series[i]?.value).toBeNull();
    expect(series[14]?.value).toBeTypeOf("number");
  });

  it("MFI is between 0 and 100", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
    const series = computeMfiSeries(makeCandles(closes), 14);
    const valid = series.filter((p) => p.value !== null);
    for (const p of valid) {
      expect(p.value!).toBeGreaterThanOrEqual(0);
      expect(p.value!).toBeLessThanOrEqual(100);
    }
  });

  it("MFI is 100 when all prices rise", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const series = computeMfiSeries(makeCandles(closes), 14);
    const valid = series.filter((p) => p.value !== null);
    for (const p of valid) expect(p.value).toBe(100);
  });
});

describe("computeMfi", () => {
  it("returns null for insufficient data", () => {
    expect(computeMfi(makeCandles([100]), 14)).toBeNull();
  });

  it("returns the latest MFI value", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    expect(computeMfi(makeCandles(closes), 14)).toBe(100);
  });
});
