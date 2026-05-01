import { describe, it, expect } from "vitest";
import { computeElderRay } from "../../../src/domain/elder-ray";
import type { Candle } from "../../../src/domain/heikin-ashi";

const c = (i: number, h: number, l: number, close: number): Candle => ({
  time: i,
  open: close,
  high: h,
  low: l,
  close,
});

describe("elder-ray", () => {
  it("empty/short input returns []", () => {
    expect(computeElderRay([])).toEqual([]);
    expect(computeElderRay([c(0, 1, 0, 0.5)], 13)).toEqual([]);
  });

  it("bullPower >= bearPower (since high >= low)", () => {
    const data = Array.from({ length: 30 }, (_, i) => c(i, 10 + i, 8 + i, 9 + i));
    for (const p of computeElderRay(data, 13)) {
      expect(p.bullPower).toBeGreaterThanOrEqual(p.bearPower);
    }
  });

  it("constant prices -> bull=high-close, bear=low-close at zero", () => {
    const data = Array.from({ length: 20 }, (_, i) => c(i, 10, 10, 10));
    for (const p of computeElderRay(data, 13)) {
      expect(p.bullPower).toBeCloseTo(0, 6);
      expect(p.bearPower).toBeCloseTo(0, 6);
    }
  });

  it("rising trend yields positive bullPower at end", () => {
    const data = Array.from({ length: 30 }, (_, i) => c(i, 10 + i, 8 + i, 9 + i));
    const out = computeElderRay(data, 13);
    expect(out[out.length - 1]!.bullPower).toBeGreaterThan(0);
  });

  it("falling trend yields negative bearPower at end", () => {
    const data = Array.from({ length: 30 }, (_, i) => c(i, 30 - i, 28 - i, 29 - i));
    const out = computeElderRay(data, 13);
    expect(out[out.length - 1]!.bearPower).toBeLessThan(0);
  });

  it("output length = candles - period + 1", () => {
    const data = Array.from({ length: 25 }, (_, i) => c(i, i + 1, i, i + 0.5));
    expect(computeElderRay(data, 13).length).toBe(13);
  });
});
