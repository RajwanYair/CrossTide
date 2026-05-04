import { describe, it, expect } from "vitest";
import { computeRangeBars, suggestRangeSize } from "../../../src/domain/range-bars";

describe("computeRangeBars", () => {
  it("returns empty for empty input", () => {
    expect(computeRangeBars([], 1)).toEqual([]);
  });

  it("returns empty for invalid range size", () => {
    const data = [{ time: "2024-01-01", open: 100, high: 105, low: 95, close: 103 }];
    expect(computeRangeBars(data, 0)).toEqual([]);
    expect(computeRangeBars(data, -1)).toEqual([]);
  });

  it("produces a bar when candle range meets threshold", () => {
    const data = [{ time: "2024-01-01", open: 100, high: 110, low: 100, close: 108 }];
    const bars = computeRangeBars(data, 5);
    expect(bars.length).toBeGreaterThanOrEqual(1);
    for (const bar of bars) {
      expect(bar.high - bar.low).toBe(5);
    }
  });

  it("does not produce bars when range is below threshold", () => {
    const data = [{ time: "2024-01-01", open: 100, high: 102, low: 99, close: 101 }];
    const bars = computeRangeBars(data, 10);
    expect(bars).toHaveLength(0);
  });

  it("accumulates across multiple candles", () => {
    const data = [
      { time: "2024-01-01", open: 100, high: 102, low: 99, close: 101 },
      { time: "2024-01-02", open: 101, high: 104, low: 100, close: 103 },
      { time: "2024-01-03", open: 103, high: 106, low: 102, close: 105 },
    ];
    const bars = computeRangeBars(data, 5);
    expect(bars.length).toBeGreaterThanOrEqual(1);
  });

  it("all bars have uniform range size", () => {
    const data = [
      { time: "2024-01-01", open: 100, high: 105, low: 95, close: 104 },
      { time: "2024-01-02", open: 104, high: 112, low: 101, close: 110 },
      { time: "2024-01-03", open: 110, high: 115, low: 105, close: 107 },
    ];
    const bars = computeRangeBars(data, 5);
    for (const bar of bars) {
      expect(bar.high - bar.low).toBe(5);
    }
  });
});

describe("suggestRangeSize", () => {
  it("returns 1 for empty data", () => {
    expect(suggestRangeSize([])).toBe(1);
  });

  it("returns a positive value for valid data", () => {
    const data = [
      { time: "2024-01-01", open: 100, high: 103, low: 98, close: 101 },
      { time: "2024-01-02", open: 101, high: 105, low: 99, close: 104 },
      { time: "2024-01-03", open: 104, high: 107, low: 101, close: 106 },
    ];
    const size = suggestRangeSize(data);
    expect(size).toBeGreaterThan(0);
  });
});
