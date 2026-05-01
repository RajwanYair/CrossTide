import { describe, it, expect } from "vitest";
import { computeUlcerIndex } from "../../../src/domain/ulcer-index";

describe("ulcer-index", () => {
  it("empty / too-short -> []", () => {
    expect(computeUlcerIndex([])).toEqual([]);
    expect(computeUlcerIndex([1, 2], 5)).toEqual([]);
  });

  it("monotonic uptrend -> UI > 0 (early bars are below current max)", () => {
    const out = computeUlcerIndex(
      Array.from({ length: 30 }, (_, i) => 100 + i),
      10,
    );
    for (const v of out) expect(v).toBeGreaterThan(0);
  });

  it("flat series -> UI = 0", () => {
    expect(
      computeUlcerIndex(
        Array.from({ length: 20 }, () => 50),
        10,
      ).every((v) => v === 0),
    ).toBe(true);
  });

  it("drawdown -> positive UI", () => {
    const data = [100, 100, 100, 100, 100, 90, 80, 70, 60, 50];
    const out = computeUlcerIndex(data, 5);
    expect(out[out.length - 1]).toBeGreaterThan(0);
  });

  it("deeper drawdown -> larger UI", () => {
    const small = [100, 100, 100, 100, 100, 99, 98];
    const big = [100, 100, 100, 100, 100, 80, 70];
    const a = computeUlcerIndex(small, 5);
    const b = computeUlcerIndex(big, 5);
    expect(b[b.length - 1]).toBeGreaterThan(a[a.length - 1]!);
  });

  it("output length = closes - period + 1", () => {
    expect(
      computeUlcerIndex(
        Array.from({ length: 20 }, (_, i) => i + 1),
        5,
      ).length,
    ).toBe(16);
  });

  it("rejects non-positive period", () => {
    expect(computeUlcerIndex([1, 2, 3], 0)).toEqual([]);
  });
});
