import { describe, it, expect } from "vitest";
import { computeCmo } from "../../../src/domain/chande-momentum-oscillator";

describe("chande-momentum-oscillator", () => {
  it("rejects bad period / too short input", () => {
    expect(computeCmo([], 9).length).toBe(0);
    expect(computeCmo([1, 2, 3], 0).every((v) => v === null)).toBe(true);
    expect(computeCmo([1, 2, 3], 9).every((v) => v === null)).toBe(true);
  });

  it("monotonic uptrend -> CMO = 100", () => {
    const out = computeCmo(
      Array.from({ length: 30 }, (_, i) => 100 + i),
      9,
    );
    for (let i = 9; i < out.length; i++) expect(out[i]).toBe(100);
  });

  it("monotonic downtrend -> CMO = -100", () => {
    const out = computeCmo(
      Array.from({ length: 30 }, (_, i) => 200 - i),
      9,
    );
    for (let i = 9; i < out.length; i++) expect(out[i]).toBe(-100);
  });

  it("flat series -> CMO = 0", () => {
    const out = computeCmo(
      Array.from({ length: 20 }, () => 100),
      9,
    );
    for (let i = 9; i < out.length; i++) expect(out[i]).toBe(0);
  });

  it("alternating ±1 -> CMO oscillates around 0", () => {
    const data: number[] = [100];
    for (let i = 1; i < 30; i++) data.push(data[i - 1]! + (i % 2 === 0 ? 1 : -1));
    const out = computeCmo(data, 8);
    for (let i = 8; i < out.length; i++) {
      expect(out[i]!).toBeGreaterThanOrEqual(-100);
      expect(out[i]!).toBeLessThanOrEqual(100);
    }
  });

  it("output length equals input", () => {
    expect(
      computeCmo(
        Array.from({ length: 50 }, (_, i) => i),
        9,
      ).length,
    ).toBe(50);
  });

  it("first defined index is at `period`", () => {
    const out = computeCmo(
      Array.from({ length: 50 }, (_, i) => i),
      9,
    );
    expect(out[8]).toBeNull();
    expect(out[9]).not.toBeNull();
  });
});
