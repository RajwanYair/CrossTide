import { describe, it, expect } from "vitest";
import { computeKst } from "../../../src/domain/kst";

describe("kst", () => {
  it("empty / too short -> []", () => {
    expect(computeKst([])).toEqual([]);
    expect(computeKst(Array.from({ length: 30 }, (_, i) => i + 1))).toEqual([]);
  });

  it("uptrend -> positive KST once defined", () => {
    const data = Array.from({ length: 100 }, (_, i) => 100 + i);
    const out = computeKst(data);
    expect(out.length).toBeGreaterThan(0);
    expect(out[out.length - 1]!.kst).toBeGreaterThan(0);
  });

  it("downtrend -> negative KST once defined", () => {
    const data = Array.from({ length: 100 }, (_, i) => 200 - i);
    const out = computeKst(data);
    expect(out[out.length - 1]!.kst).toBeLessThan(0);
  });

  it("flat series -> KST ~ 0", () => {
    const data = Array.from({ length: 100 }, () => 100);
    const out = computeKst(data);
    expect(Math.abs(out[out.length - 1]!.kst)).toBeLessThan(1e-9);
  });

  it("signal eventually populated", () => {
    const data = Array.from({ length: 120 }, (_, i) => 100 + Math.sin(i / 8) * 20);
    const out = computeKst(data);
    expect(out.some((p) => p.signal !== null)).toBe(true);
  });

  it("custom periods", () => {
    const data = Array.from({ length: 80 }, (_, i) => 100 + i);
    const out = computeKst(data, {
      roc1: 5,
      roc2: 7,
      roc3: 9,
      roc4: 11,
      sma1: 3,
      sma2: 3,
      sma3: 3,
      sma4: 4,
      signal: 5,
    });
    expect(out.length).toBeGreaterThan(0);
  });
});
