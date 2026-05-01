import { describe, it, expect } from "vitest";
import { computeChaikinMoneyFlow } from "../../../src/domain/chaikin-money-flow";
import type { Candle } from "../../../src/domain/heikin-ashi";

const c = (i: number, h: number, l: number, close: number, v: number): Candle => ({
  time: i,
  open: l,
  high: h,
  low: l,
  close,
  volume: v,
});

describe("chaikin-money-flow", () => {
  it("empty/short input returns []", () => {
    expect(computeChaikinMoneyFlow([])).toEqual([]);
    expect(computeChaikinMoneyFlow([c(0, 1, 0, 0.5, 100)], 5)).toEqual([]);
  });

  it("close at high -> CMF approaches +1", () => {
    const data = Array.from({ length: 6 }, (_, i) => c(i, 10, 8, 10, 100));
    const out = computeChaikinMoneyFlow(data, 5);
    expect(out[out.length - 1]!.cmf).toBeCloseTo(1, 6);
  });

  it("close at low -> CMF approaches -1", () => {
    const data = Array.from({ length: 6 }, (_, i) => c(i, 10, 8, 8, 100));
    const out = computeChaikinMoneyFlow(data, 5);
    expect(out[out.length - 1]!.cmf).toBeCloseTo(-1, 6);
  });

  it("CMF in [-1, 1]", () => {
    const data = Array.from({ length: 30 }, (_, i) =>
      c(i, 10 + (i % 3), 5 + (i % 2), 7 + Math.sin(i), 100 + i),
    );
    for (const p of computeChaikinMoneyFlow(data, 10)) {
      expect(p.cmf).toBeGreaterThanOrEqual(-1);
      expect(p.cmf).toBeLessThanOrEqual(1);
    }
  });

  it("zero range bar contributes zero to numerator", () => {
    const data = [
      c(0, 5, 5, 5, 100), // zero range
      c(1, 10, 8, 10, 100),
      c(2, 10, 8, 10, 100),
    ];
    const out = computeChaikinMoneyFlow(data, 3);
    expect(out.length).toBe(1);
    expect(out[0]!.cmf).toBeGreaterThan(0);
  });

  it("zero total volume -> CMF=0", () => {
    const data = Array.from({ length: 5 }, (_, i) => c(i, 10, 8, 9, 0));
    const out = computeChaikinMoneyFlow(data, 5);
    expect(out[0]!.cmf).toBe(0);
  });

  it("output length = candles - period + 1", () => {
    const data = Array.from({ length: 20 }, (_, i) => c(i, 10, 5, 7, 100));
    expect(computeChaikinMoneyFlow(data, 10).length).toBe(11);
  });
});
