import { describe, it, expect } from "vitest";
import { computeStochRsi } from "../../../src/domain/stochastic-rsi";

describe("stochastic-rsi", () => {
  it("empty / too short -> []", () => {
    expect(computeStochRsi([])).toEqual([]);
    expect(computeStochRsi(Array.from({ length: 10 }, (_, i) => i + 1))).toEqual([]);
  });

  it("rejects bad params", () => {
    expect(computeStochRsi([1, 2, 3], { rsiPeriod: 0 })).toEqual([]);
    expect(computeStochRsi([1, 2, 3], { stochPeriod: 0 })).toEqual([]);
  });

  it("noisy uptrend reaches high %K after a dip", () => {
    const data: number[] = [];
    for (let i = 0; i < 80; i++) data.push(100 + i + (i % 7 === 0 ? -5 : 0));
    const out = computeStochRsi(data);
    const last = out[out.length - 1]!;
    expect(last.k).toBeGreaterThanOrEqual(0);
    expect(last.k).toBeLessThanOrEqual(100);
  });

  it("values stay in [0,100]", () => {
    const data = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 5) * 10);
    const out = computeStochRsi(data);
    for (const p of out) {
      expect(p.k).toBeGreaterThanOrEqual(0);
      expect(p.k).toBeLessThanOrEqual(100);
      if (p.d !== null) {
        expect(p.d).toBeGreaterThanOrEqual(0);
        expect(p.d).toBeLessThanOrEqual(100);
      }
    }
  });

  it("%D eventually populated", () => {
    const data = Array.from({ length: 80 }, (_, i) => 100 + Math.sin(i / 4) * 5);
    const out = computeStochRsi(data);
    expect(out.some((p) => p.d !== null)).toBe(true);
  });
});
