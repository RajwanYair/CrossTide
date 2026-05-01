import { describe, it, expect } from "vitest";
import { computeZigZag } from "../../../src/domain/zigzag";
import type { Candle } from "../../../src/domain/heikin-ashi";

const mk = (h: number, l: number, c: number, t: number): Candle => ({
  time: t,
  open: c,
  high: h,
  low: l,
  close: c,
});

describe("zigzag", () => {
  it("returns empty for empty input", () => {
    expect(computeZigZag([])).toEqual([]);
  });

  it("rejects non-positive threshold", () => {
    expect(() => computeZigZag([], { thresholdPercent: 0 })).toThrow(RangeError);
  });

  it("emits no pivots when price never moves enough", () => {
    const candles = Array.from({ length: 10 }, (_, i) => mk(100.5, 99.5, 100, i));
    expect(computeZigZag(candles, { thresholdPercent: 0.1 })).toHaveLength(0);
  });

  it("detects a swing high then swing low", () => {
    const candles: Candle[] = [
      mk(100, 99, 100, 0),
      mk(110, 109, 110, 1), // up to 110
      mk(120, 119, 120, 2), // up to 120 (extreme)
      mk(115, 100, 105, 3), // pullback to 100 → 16% from 120
      mk(95, 90, 92, 4), // continues lower (extreme low 90)
      mk(105, 100, 102, 5), // reversal up 105/90 = +16%
    ];
    const pivots = computeZigZag(candles, { thresholdPercent: 0.1 });
    expect(pivots.length).toBeGreaterThanOrEqual(1);
    expect(pivots[0]!.direction).toBe("high");
    expect(pivots[0]!.price).toBe(120);
  });

  it("alternates direction between consecutive pivots", () => {
    const candles: Candle[] = [
      mk(100, 99, 100, 0),
      mk(120, 119, 120, 1),
      mk(95, 80, 85, 2),
      mk(100, 99, 100, 3),
      mk(140, 139, 140, 4),
      mk(105, 90, 95, 5),
    ];
    const pivots = computeZigZag(candles, { thresholdPercent: 0.1 });
    for (let i = 1; i < pivots.length; i++) {
      expect(pivots[i]!.direction).not.toBe(pivots[i - 1]!.direction);
    }
  });

  it("smaller threshold yields more pivots", () => {
    const candles: Candle[] = [
      mk(100, 99, 100, 0),
      mk(105, 104, 105, 1),
      mk(100, 99, 100, 2),
      mk(110, 109, 110, 3),
      mk(100, 99, 100, 4),
      mk(115, 114, 115, 5),
    ];
    const small = computeZigZag(candles, { thresholdPercent: 0.02 });
    const big = computeZigZag(candles, { thresholdPercent: 0.5 });
    expect(small.length).toBeGreaterThanOrEqual(big.length);
  });

  it("preserves candle index and time for each pivot", () => {
    const candles: Candle[] = [
      mk(100, 99, 100, 1000),
      mk(120, 119, 120, 2000),
      mk(95, 80, 85, 3000),
    ];
    const p = computeZigZag(candles, { thresholdPercent: 0.1 });
    expect(p[0]!.index).toBe(1);
    expect(p[0]!.time).toBe(2000);
  });
});
