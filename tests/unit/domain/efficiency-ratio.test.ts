import { describe, it, expect } from "vitest";
import { makeCandles } from "../../helpers/candle-factory";
import { computeEfficiencyRatio } from "../../../src/domain/efficiency-ratio";

describe("computeEfficiencyRatio", () => {
  it("returns null for insufficient data", () => {
    const candles = makeCandles([100, 101, 102]);
    expect(computeEfficiencyRatio(candles)).toBeNull(); // needs 11
  });

  it("returns null for period < 2", () => {
    const candles = makeCandles(Array.from({ length: 20 }, (_, i) => 100 + i));
    expect(computeEfficiencyRatio(candles, { period: 1 })).toBeNull();
  });

  it("returns correct number of points", () => {
    const candles = makeCandles(Array.from({ length: 30 }, (_, i) => 100 + i * 0.5));
    const result = computeEfficiencyRatio(candles)!;
    // period=10, starts at index 10 → 30 - 10 = 20 points
    expect(result.length).toBe(20);
  });

  it("perfect uptrend has ER = 1", () => {
    // Monotonically increasing prices — net change = sum of individual changes
    const candles = makeCandles(Array.from({ length: 15 }, (_, i) => 100 + i));
    const result = computeEfficiencyRatio(candles)!;
    for (const pt of result) {
      expect(pt.er).toBeCloseTo(1, 5);
    }
  });

  it("perfect downtrend has ER = 1", () => {
    const candles = makeCandles(Array.from({ length: 15 }, (_, i) => 200 - i));
    const result = computeEfficiencyRatio(candles)!;
    for (const pt of result) {
      expect(pt.er).toBeCloseTo(1, 5);
    }
  });

  it("choppy market has ER near 0", () => {
    // Alternating up/down — lots of movement but no net progress
    const candles = makeCandles(Array.from({ length: 22 }, (_, i) => 100 + (i % 2 === 0 ? 5 : -5)));
    const result = computeEfficiencyRatio(candles)!;
    for (const pt of result) {
      expect(pt.er).toBeLessThan(0.15);
    }
  });

  it("flat prices produce ER = 0", () => {
    const candles = makeCandles(Array.from({ length: 15 }, () => 100));
    const result = computeEfficiencyRatio(candles)!;
    for (const pt of result) {
      expect(pt.er).toBe(0);
    }
  });

  it("each point has date and er fields", () => {
    const candles = makeCandles(Array.from({ length: 20 }, (_, i) => 100 + i * 0.3));
    const result = computeEfficiencyRatio(candles)!;
    for (const pt of result) {
      expect(pt).toHaveProperty("date");
      expect(pt).toHaveProperty("er");
      expect(pt.er).toBeGreaterThanOrEqual(0);
      expect(pt.er).toBeLessThanOrEqual(1);
    }
  });

  it("respects custom period", () => {
    const candles = makeCandles(Array.from({ length: 30 }, (_, i) => 100 + i));
    const result = computeEfficiencyRatio(candles, { period: 5 })!;
    // period=5, starts at index 5 → 30 - 5 = 25 points
    expect(result.length).toBe(25);
  });

  it("ER values are bounded between 0 and 1", () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.5) * 20);
    const candles = makeCandles(prices);
    const result = computeEfficiencyRatio(candles)!;
    for (const pt of result) {
      expect(pt.er).toBeGreaterThanOrEqual(0);
      expect(pt.er).toBeLessThanOrEqual(1);
    }
  });
});
