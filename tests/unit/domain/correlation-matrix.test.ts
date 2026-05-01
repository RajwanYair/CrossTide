import { describe, it, expect } from "vitest";
import {
  pearson,
  correlationMatrix,
} from "../../../src/domain/correlation-matrix";

describe("correlation-matrix", () => {
  it("perfect positive correlation = 1", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 6);
  });

  it("perfect negative correlation = -1", () => {
    expect(pearson([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1, 6);
  });

  it("constant series correlation = 0", () => {
    expect(pearson([1, 1, 1, 1], [2, 4, 6, 8])).toBe(0);
  });

  it("uncorrelated returns near zero", () => {
    const r = pearson([1, 2, 3, 4, 5], [2, -1, 3, 0, 1]);
    expect(Math.abs(r)).toBeLessThan(0.5);
  });

  it("truncates to shortest length", () => {
    expect(pearson([1, 2, 3, 4, 5, 6], [2, 4, 6])).toBeCloseTo(1, 6);
  });

  it("returns 0 when n < 2", () => {
    expect(pearson([1], [2])).toBe(0);
    expect(pearson([], [])).toBe(0);
  });

  it("matrix has 1s on diagonal", () => {
    const m = correlationMatrix([
      { id: "a", values: [1, 2, 3] },
      { id: "b", values: [3, 2, 1] },
    ]);
    expect(m.matrix[0]![0]).toBe(1);
    expect(m.matrix[1]![1]).toBe(1);
  });

  it("matrix is symmetric", () => {
    const m = correlationMatrix([
      { id: "a", values: [1, 5, 3, 7, 2] },
      { id: "b", values: [2, 6, 4, 1, 9] },
      { id: "c", values: [9, 1, 8, 2, 7] },
    ]);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(m.matrix[i]![j]).toBeCloseTo(m.matrix[j]![i]!, 10);
      }
    }
  });

  it("preserves id order", () => {
    const m = correlationMatrix([
      { id: "spy", values: [1, 2] },
      { id: "qqq", values: [2, 3] },
    ]);
    expect(m.ids).toEqual(["spy", "qqq"]);
  });
});
