import { describe, it, expect } from "vitest";
import {
  computeForceIndex,
  computeForceIndexRaw,
  type ForceCandle,
} from "../../../src/domain/force-index";

const mk = (c: number, v: number): ForceCandle => ({ close: c, volume: v });

describe("force-index", () => {
  it("empty -> []", () => {
    expect(computeForceIndex([])).toEqual([]);
    expect(computeForceIndexRaw([])).toEqual([]);
  });

  it("single candle -> all null", () => {
    expect(computeForceIndexRaw([mk(10, 100)])).toEqual([null]);
    expect(computeForceIndex([mk(10, 100)])).toEqual([null]);
  });

  it("raw values match formula", () => {
    const raw = computeForceIndexRaw([mk(10, 100), mk(12, 50), mk(11, 80)]);
    expect(raw[0]).toBeNull();
    expect(raw[1]).toBeCloseTo((12 - 10) * 50, 9);
    expect(raw[2]).toBeCloseTo((11 - 12) * 80, 9);
  });

  it("uptrend with volume -> positive smoothed FI", () => {
    const candles = Array.from({ length: 30 }, (_, i) => mk(100 + i, 1000));
    const out = computeForceIndex(candles, 13);
    expect(out[out.length - 1]!).toBeGreaterThan(0);
  });

  it("downtrend with volume -> negative smoothed FI", () => {
    const candles = Array.from({ length: 30 }, (_, i) => mk(200 - i, 1000));
    const out = computeForceIndex(candles, 13);
    expect(out[out.length - 1]!).toBeLessThan(0);
  });

  it("output length matches input", () => {
    const candles = Array.from({ length: 20 }, (_, i) => mk(100 + i, 100));
    expect(computeForceIndex(candles, 5).length).toBe(20);
  });

  it("zero volume contributes 0 raw", () => {
    expect(computeForceIndexRaw([mk(10, 0), mk(12, 0)])[1]).toBe(0);
  });
});
