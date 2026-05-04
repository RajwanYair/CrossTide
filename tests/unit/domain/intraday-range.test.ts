import { describe, it, expect } from "vitest";
import {
  calculateRangeDistance,
  batchRangeDistance,
  nearHigh,
  nearLow,
  widestRange,
  narrowestRange,
  averagePositionInRange,
} from "../../../src/domain/intraday-range";

describe("intraday-range", () => {
  it("calculateRangeDistance computes correct metrics", () => {
    const result = calculateRangeDistance({
      ticker: "AAPL",
      high: 200,
      low: 180,
      current: 190,
    });
    expect(result.range).toBe(20);
    expect(result.distanceFromHigh).toBe(10);
    expect(result.distanceFromLow).toBe(10);
    expect(result.positionInRange).toBeCloseTo(0.5, 5);
  });

  it("positionInRange is 1 when at high", () => {
    const result = calculateRangeDistance({
      ticker: "AAPL",
      high: 200,
      low: 180,
      current: 200,
    });
    expect(result.positionInRange).toBeCloseTo(1, 5);
  });

  it("positionInRange is 0 when at low", () => {
    const result = calculateRangeDistance({
      ticker: "AAPL",
      high: 200,
      low: 180,
      current: 180,
    });
    expect(result.positionInRange).toBeCloseTo(0, 5);
  });

  it("handles zero range gracefully", () => {
    const result = calculateRangeDistance({
      ticker: "FLAT",
      high: 100,
      low: 100,
      current: 100,
    });
    expect(result.range).toBe(0);
    expect(result.positionInRange).toBe(0.5);
  });

  it("batchRangeDistance processes multiple tickers", () => {
    const results = batchRangeDistance([
      { ticker: "A", high: 100, low: 90, current: 95 },
      { ticker: "B", high: 50, low: 40, current: 48 },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0]!.ticker).toBe("A");
  });

  it("nearHigh filters tickers close to high", () => {
    const distances = batchRangeDistance([
      { ticker: "A", high: 100, low: 90, current: 99 },
      { ticker: "B", high: 50, low: 40, current: 42 },
    ]);
    const result = nearHigh(distances, 0.9);
    expect(result).toHaveLength(1);
    expect(result[0]!.ticker).toBe("A");
  });

  it("nearLow filters tickers close to low", () => {
    const distances = batchRangeDistance([
      { ticker: "A", high: 100, low: 90, current: 99 },
      { ticker: "B", high: 50, low: 40, current: 41 },
    ]);
    const result = nearLow(distances, 0.1);
    expect(result).toHaveLength(1);
    expect(result[0]!.ticker).toBe("B");
  });

  it("widestRange returns top N by range", () => {
    const distances = batchRangeDistance([
      { ticker: "A", high: 100, low: 90, current: 95 },
      { ticker: "B", high: 100, low: 50, current: 75 },
      { ticker: "C", high: 100, low: 80, current: 90 },
    ]);
    const result = widestRange(distances, 2);
    expect(result).toHaveLength(2);
    expect(result[0]!.ticker).toBe("B");
  });

  it("narrowestRange returns smallest ranges", () => {
    const distances = batchRangeDistance([
      { ticker: "A", high: 100, low: 99, current: 99.5 },
      { ticker: "B", high: 100, low: 50, current: 75 },
    ]);
    const result = narrowestRange(distances, 1);
    expect(result).toHaveLength(1);
    expect(result[0]!.ticker).toBe("A");
  });

  it("averagePositionInRange returns market-level mean", () => {
    const distances = batchRangeDistance([
      { ticker: "A", high: 100, low: 80, current: 100 }, // pos 1
      { ticker: "B", high: 100, low: 80, current: 80 }, // pos 0
    ]);
    expect(averagePositionInRange(distances)).toBeCloseTo(0.5, 5);
  });

  it("averagePositionInRange returns 0 for empty list", () => {
    expect(averagePositionInRange([])).toBe(0);
  });
});
