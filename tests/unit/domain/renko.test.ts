import { describe, it, expect } from "vitest";
import { computeRenko, suggestBrickSize } from "../../../src/domain/renko";

describe("computeRenko", () => {
  it("returns empty for empty input", () => {
    expect(computeRenko([], 1)).toEqual([]);
  });

  it("returns empty for invalid brick size", () => {
    expect(computeRenko([{ time: "2024-01-01", close: 100 }], 0)).toEqual([]);
    expect(computeRenko([{ time: "2024-01-01", close: 100 }], -1)).toEqual([]);
  });

  it("generates up bricks when price rises by brick multiples", () => {
    const data = [
      { time: "2024-01-01", close: 100 },
      { time: "2024-01-02", close: 103 },
    ];
    const bricks = computeRenko(data, 1);
    expect(bricks).toHaveLength(3);
    expect(bricks[0]).toEqual({ time: "2024-01-02", open: 100, high: 101, low: 100, close: 101 });
    expect(bricks[1]).toEqual({ time: "2024-01-02", open: 101, high: 102, low: 101, close: 102 });
    expect(bricks[2]).toEqual({ time: "2024-01-02", open: 102, high: 103, low: 102, close: 103 });
  });

  it("generates down bricks when price falls", () => {
    const data = [
      { time: "2024-01-01", close: 100 },
      { time: "2024-01-02", close: 97 },
    ];
    const bricks = computeRenko(data, 1);
    expect(bricks).toHaveLength(3);
    expect(bricks[0]).toEqual({ time: "2024-01-02", open: 100, high: 100, low: 99, close: 99 });
    expect(bricks[2]).toEqual({ time: "2024-01-02", open: 98, high: 98, low: 97, close: 97 });
  });

  it("ignores moves smaller than brick size", () => {
    const data = [
      { time: "2024-01-01", close: 100 },
      { time: "2024-01-02", close: 100.5 },
      { time: "2024-01-03", close: 99.8 },
    ];
    const bricks = computeRenko(data, 1);
    expect(bricks).toHaveLength(0);
  });

  it("handles mixed directions", () => {
    const data = [
      { time: "2024-01-01", close: 100 },
      { time: "2024-01-02", close: 102 },
      { time: "2024-01-03", close: 99 },
    ];
    const bricks = computeRenko(data, 1);
    // Up: 100→101, 101→102 (2 up bricks)
    // Down from 102: 102→101, 101→100, 100→99 (3 down bricks)
    expect(bricks).toHaveLength(5);
    expect(bricks[0]!.close).toBeGreaterThan(bricks[0]!.open); // up
    expect(bricks[2]!.close).toBeLessThan(bricks[2]!.open); // down
  });

  it("brick size larger than 1 works correctly", () => {
    const data = [
      { time: "2024-01-01", close: 100 },
      { time: "2024-01-02", close: 110 },
    ];
    const bricks = computeRenko(data, 5);
    expect(bricks).toHaveLength(2);
    expect(bricks[0]).toEqual({ time: "2024-01-02", open: 100, high: 105, low: 100, close: 105 });
    expect(bricks[1]).toEqual({ time: "2024-01-02", open: 105, high: 110, low: 105, close: 110 });
  });
});

describe("suggestBrickSize", () => {
  it("returns 1 for insufficient data", () => {
    expect(suggestBrickSize([])).toBe(1);
    expect(suggestBrickSize([{ time: "2024-01-01", close: 100 }])).toBe(1);
  });

  it("returns a positive value for valid data", () => {
    const data = [
      { time: "2024-01-01", close: 100 },
      { time: "2024-01-02", close: 102 },
      { time: "2024-01-03", close: 101 },
      { time: "2024-01-04", close: 104 },
      { time: "2024-01-05", close: 103 },
    ];
    const size = suggestBrickSize(data);
    expect(size).toBeGreaterThan(0);
  });
});
