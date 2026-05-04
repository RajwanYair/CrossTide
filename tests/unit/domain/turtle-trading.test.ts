import { describe, it, expect } from "vitest";
import { donchianChannel, computeATR, turtleTrading } from "../../../src/domain/turtle-trading";

// Trending up data
const n = 100;
const highs: number[] = [];
const lows: number[] = [];
const closes: number[] = [];
let price = 100;
let seed = 33333;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
}
for (let i = 0; i < n; i++) {
  price += (lcg() - 0.3) * 2; // slight upward bias
  const h = price + lcg() * 2;
  const l = price - lcg() * 2;
  highs.push(h);
  lows.push(l);
  closes.push(price);
}

describe("turtle-trading", () => {
  describe("donchianChannel", () => {
    it("returns correct length", () => {
      const { upper, lower } = donchianChannel(highs, lows, 20);
      expect(upper).toHaveLength(n);
      expect(lower).toHaveLength(n);
    });

    it("upper >= lower at all points", () => {
      const { upper, lower } = donchianChannel(highs, lows, 20);
      for (let i = 0; i < n; i++) {
        expect(upper[i]).toBeGreaterThanOrEqual(lower[i]!);
      }
    });

    it("upper equals max of first period at index period-1", () => {
      const period = 5;
      const { upper } = donchianChannel(highs, lows, period);
      const expected = Math.max(...highs.slice(0, period));
      expect(upper[period - 1]).toBeCloseTo(expected);
    });
  });

  describe("computeATR", () => {
    it("returns correct length", () => {
      const atr = computeATR(highs, lows, closes, 14);
      expect(atr).toHaveLength(n);
    });

    it("all values positive", () => {
      const atr = computeATR(highs, lows, closes, 14);
      for (const v of atr) expect(v).toBeGreaterThan(0);
    });

    it("returns empty for empty input", () => {
      expect(computeATR([], [], [], 14)).toEqual([]);
    });
  });

  describe("turtleTrading", () => {
    it("generates signals for trending data", () => {
      const result = turtleTrading(highs, lows, closes);
      expect(result.signals.length).toBeGreaterThan(0);
    });

    it("first signal is entry (long or short)", () => {
      const result = turtleTrading(highs, lows, closes);
      if (result.signals.length > 0) {
        expect(result.signals[0]!.action).toMatch(/^(long|short)$/);
      }
    });

    it("donchianHigh/Low have correct length", () => {
      const result = turtleTrading(highs, lows, closes);
      expect(result.donchianHigh).toHaveLength(n);
      expect(result.donchianLow).toHaveLength(n);
    });

    it("positionSize returns valid number", () => {
      const result = turtleTrading(highs, lows, closes);
      const size = result.positionSize(100000, 2.5);
      expect(size).toBeGreaterThan(0);
      expect(Number.isFinite(size)).toBe(true);
    });

    it("positionSize returns 0 for zero ATR", () => {
      const result = turtleTrading(highs, lows, closes);
      expect(result.positionSize(100000, 0)).toBe(0);
    });

    it("units never exceed maxUnits", () => {
      const result = turtleTrading(highs, lows, closes, { maxUnits: 3 });
      for (const sig of result.signals) {
        expect(sig.units).toBeLessThanOrEqual(3);
      }
    });
  });
});
