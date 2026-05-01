import { describe, it, expect } from "vitest";
import { mulberry32, randomInt, randomFloat, shuffle } from "../../../src/core/seedrandom";

describe("mulberry32", () => {
  it("deterministic for same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });

  it("different seeds produce different streams", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("values in [0, 1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("randomInt", () => {
  it("respects [min, max) bounds", () => {
    const r = mulberry32(123);
    for (let i = 0; i < 200; i++) {
      const v = randomInt(r, 5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
  it("collapsed range returns min", () => {
    const r = mulberry32(0);
    expect(randomInt(r, 5, 5)).toBe(5);
    expect(randomInt(r, 5, 4)).toBe(5);
  });
});

describe("randomFloat", () => {
  it("respects [min, max) bounds", () => {
    const r = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const v = randomFloat(r, -1, 1);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("shuffle", () => {
  it("permutation contains same elements", () => {
    const r = mulberry32(11);
    const a = [1, 2, 3, 4, 5];
    const s = shuffle(r, a);
    expect(s.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it("does not mutate input", () => {
    const a = [1, 2, 3];
    shuffle(mulberry32(1), a);
    expect(a).toEqual([1, 2, 3]);
  });
  it("deterministic for same seed", () => {
    const a = shuffle(mulberry32(5), [1, 2, 3, 4, 5, 6]);
    const b = shuffle(mulberry32(5), [1, 2, 3, 4, 5, 6]);
    expect(a).toEqual(b);
  });
});
