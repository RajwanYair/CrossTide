import { describe, it, expect } from "vitest";
import { computeBollingerSeries, computeBollinger } from "../../../src/domain/bollinger-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeBollingerSeries", () => {
  it("returns all nulls for insufficient data", () => {
    const series = computeBollingerSeries(makeCandles([100, 101, 102]), 20);
    expect(series.every((p) => p.middle === null)).toBe(true);
  });

  it("first period-1 entries are null", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const series = computeBollingerSeries(makeCandles(closes), 20);
    for (let i = 0; i < 19; i++) expect(series[i]?.middle).toBeNull();
    expect(series[19]?.middle).toBeTypeOf("number");
  });

  it("upper > middle > lower", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
    const series = computeBollingerSeries(makeCandles(closes), 20);
    const valid = series.filter((p) => p.upper !== null);
    for (const p of valid) {
      expect(p.upper!).toBeGreaterThan(p.middle!);
      expect(p.middle!).toBeGreaterThan(p.lower!);
    }
  });

  it("bandwidth and percentB are computed", () => {
    const closes = Array.from({ length: 25 }, (_, i) => 100 + i * 0.5);
    const series = computeBollingerSeries(makeCandles(closes), 20);
    const last = series[series.length - 1]!;
    expect(last.bandwidth).toBeTypeOf("number");
    expect(last.percentB).toBeTypeOf("number");
  });
});

describe("computeBollinger", () => {
  it("returns null for insufficient data", () => {
    expect(computeBollinger(makeCandles([100]), 20)).toBeNull();
  });

  it("returns the latest band values", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = computeBollinger(makeCandles(closes), 20);
    expect(result).not.toBeNull();
    expect(result!.upper).toBeGreaterThan(result!.lower!);
  });
});
