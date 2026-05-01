import { describe, it, expect } from "vitest";
import { computeDema, computeTema } from "../../../src/domain/dema-tema";

describe("dema/tema", () => {
  it("rejects bad period", () => {
    expect(computeDema([1, 2, 3], 0).every((v) => v === null)).toBe(true);
    expect(computeTema([1, 2, 3], 0).every((v) => v === null)).toBe(true);
  });

  it("constant series -> equals constant", () => {
    const data = Array.from({ length: 50 }, () => 100);
    const d = computeDema(data, 5);
    const t = computeTema(data, 5);
    expect(d[d.length - 1]!).toBeCloseTo(100, 6);
    expect(t[t.length - 1]!).toBeCloseTo(100, 6);
  });

  it("linear ramp -> DEMA tracks closer than EMA would", () => {
    const data = Array.from({ length: 60 }, (_, i) => i);
    const d = computeDema(data, 10);
    // DEMA should approach actual value (=last index) more closely than 60% lag.
    expect(d[d.length - 1]!).toBeGreaterThan(55);
  });

  it("TEMA tracks ramp even better than DEMA", () => {
    const data = Array.from({ length: 80 }, (_, i) => i);
    const d = computeDema(data, 10);
    const t = computeTema(data, 10);
    expect(t[t.length - 1]!).toBeGreaterThanOrEqual(d[d.length - 1]! - 1e-9);
  });

  it("nulls in early bars", () => {
    const data = Array.from({ length: 60 }, (_, i) => i);
    expect(computeDema(data, 10)[0]).toBeNull();
    expect(computeTema(data, 10)[0]).toBeNull();
  });

  it("output length matches input", () => {
    const data = Array.from({ length: 50 }, (_, i) => i);
    expect(computeDema(data, 5).length).toBe(50);
    expect(computeTema(data, 5).length).toBe(50);
  });
});
