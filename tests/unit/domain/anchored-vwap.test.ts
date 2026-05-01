import { describe, it, expect } from "vitest";
import { anchoredVwap } from "../../../src/domain/anchored-vwap";
import type { Candle } from "../../../src/domain/heikin-ashi";

const c = (time: number, p: number, v: number): Candle => ({
  time,
  open: p,
  high: p,
  low: p,
  close: p,
  volume: v,
});

describe("anchored-vwap", () => {
  it("empty input returns []", () => {
    expect(anchoredVwap([])).toEqual([]);
  });

  it("anchor 0 produces one point per candle from start", () => {
    const out = anchoredVwap([c(0, 10, 1), c(1, 20, 1), c(2, 30, 1)]);
    expect(out.length).toBe(3);
    expect(out[0]!.vwap).toBeCloseTo(10, 6);
    expect(out[1]!.vwap).toBeCloseTo(15, 6);
    expect(out[2]!.vwap).toBeCloseTo(20, 6);
  });

  it("anchorIndex skips earlier candles", () => {
    const out = anchoredVwap([c(0, 100, 1), c(1, 10, 1), c(2, 20, 1)], { anchorIndex: 1 });
    expect(out.length).toBe(2);
    expect(out[1]!.vwap).toBeCloseTo(15, 6);
  });

  it("anchorTime selects first candle >= time", () => {
    const out = anchoredVwap([c(0, 10, 1), c(100, 20, 1), c(200, 30, 1)], { anchorTime: 50 });
    expect(out.length).toBe(2);
    expect(out[0]!.time).toBe(100);
  });

  it("constant price gives zero band width", () => {
    const out = anchoredVwap([c(0, 50, 1), c(1, 50, 1), c(2, 50, 1)]);
    expect(out[2]!.upper1).toBeCloseTo(50, 6);
    expect(out[2]!.lower1).toBeCloseTo(50, 6);
  });

  it("bands widen with price dispersion", () => {
    const out = anchoredVwap([c(0, 10, 1), c(1, 30, 1), c(2, 20, 1)]);
    expect(out[2]!.upper1).toBeGreaterThan(out[2]!.vwap);
    expect(out[2]!.upper2 - out[2]!.lower2).toBeGreaterThan(out[2]!.upper1 - out[2]!.lower1);
  });

  it("zero volume falls back to typical price", () => {
    const out = anchoredVwap([c(0, 25, 0)]);
    expect(out[0]!.vwap).toBeCloseTo(25, 6);
  });

  it("clamps out-of-range anchorIndex", () => {
    const out = anchoredVwap([c(0, 10, 1), c(1, 20, 1)], { anchorIndex: 99 });
    expect(out.length).toBe(1);
  });
});
