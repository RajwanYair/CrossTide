/**
 * Point & Figure chart tests — R8.
 */
import { describe, it, expect } from "vitest";
import { computePnf, autoBoxSize, floorBox } from "../../../src/domain/point-and-figure";
import type { PnfInput } from "../../../src/domain/point-and-figure";

function prices(...vals: number[]): PnfInput[] {
  return vals.map((close) => ({ close }));
}

describe("floorBox", () => {
  it("rounds price down to nearest box boundary", () => {
    expect(floorBox(23.7, 1)).toBe(23);
    expect(floorBox(23.7, 0.5)).toBe(23.5);
    expect(floorBox(100, 5)).toBe(100);
    expect(floorBox(103, 5)).toBe(100);
  });
});

describe("autoBoxSize", () => {
  it("returns a nice number close to 1% of median price", () => {
    const size = autoBoxSize([100, 100, 100, 100]);
    expect(size).toBeGreaterThan(0);
    expect([0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50, 100]).toContain(size);
  });

  it("returns 1 for empty array", () => {
    expect(autoBoxSize([])).toBe(1);
  });

  it("scales with price — 10 USD stock gets small box, 1000 USD stock gets larger", () => {
    const small = autoBoxSize(new Array(10).fill(10));
    const large = autoBoxSize(new Array(10).fill(1000));
    expect(large).toBeGreaterThan(small);
  });
});

describe("computePnf — empty input", () => {
  it("returns empty columns for empty array", () => {
    const result = computePnf([]);
    expect(result.columns).toHaveLength(0);
  });
});

describe("computePnf — single column up", () => {
  it("creates one X column from a rising price series", () => {
    // Rising prices: 10, 11, 12, 13, 14, 15
    const data = prices(10, 11, 12, 13, 14, 15);
    const result = computePnf(data, { boxSize: 1, reversal: 3 });

    expect(result.columns.length).toBeGreaterThanOrEqual(1);
    const col = result.columns[0]!;
    expect(col.direction).toBe("X");
    expect(col.count).toBeGreaterThan(0);
  });
});

describe("computePnf — reversal creates new column", () => {
  it("rising then falling creates X column then O column", () => {
    // Up to 20, then down to 13 (reversal = 3 boxes of size 1 = 3 down needed)
    const data = prices(10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 17, 14, 13);
    const result = computePnf(data, { boxSize: 1, reversal: 3 });

    // Should have at least 2 columns
    expect(result.columns.length).toBeGreaterThanOrEqual(2);
    const firstCol = result.columns[0]!;
    const secondCol = result.columns[1]!;
    expect(firstCol.direction).toBe("X");
    expect(secondCol.direction).toBe("O");
  });

  it("alternating columns have alternating directions", () => {
    // Up, down, up, down
    const data = prices(10, 15, 20, 17, 14, 11, 16, 20);
    const result = computePnf(data, { boxSize: 1, reversal: 3 });
    for (let i = 1; i < result.columns.length; i++) {
      expect(result.columns[i]!.direction).not.toBe(result.columns[i - 1]!.direction);
    }
  });
});

describe("computePnf — box metadata", () => {
  it("columns have correct high/low span", () => {
    const data = prices(10, 14, 18, 15, 12, 9);
    const result = computePnf(data, { boxSize: 1, reversal: 3 });
    for (const col of result.columns) {
      expect(col.high).toBeGreaterThanOrEqual(col.low);
      expect(col.count).toBe(col.boxes.length);
    }
  });

  it("boxes in X column all have type X", () => {
    const data = prices(10, 20);
    const result = computePnf(data, { boxSize: 1, reversal: 3 });
    const xCols = result.columns.filter((c) => c.direction === "X");
    for (const col of xCols) {
      expect(col.boxes.every((b) => b.type === "X")).toBe(true);
    }
  });

  it("boxes in O column all have type O", () => {
    const data = prices(10, 20, 15, 10, 5);
    const result = computePnf(data, { boxSize: 1, reversal: 3 });
    const oCols = result.columns.filter((c) => c.direction === "O");
    for (const col of oCols) {
      expect(col.boxes.every((b) => b.type === "O")).toBe(true);
    }
  });
});

describe("computePnf — options", () => {
  it("respects custom boxSize", () => {
    const result = computePnf(prices(10, 20), { boxSize: 5, reversal: 3 });
    expect(result.boxSize).toBe(5);
  });

  it("respects custom reversal count", () => {
    const result = computePnf(prices(10, 20), { boxSize: 1, reversal: 5 });
    expect(result.reversal).toBe(5);
  });

  it("auto box size is used when boxSize not provided", () => {
    const result = computePnf(prices(100, 110, 120));
    expect(result.boxSize).toBeGreaterThan(0);
  });
});
