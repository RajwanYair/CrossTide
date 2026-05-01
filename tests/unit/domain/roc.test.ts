import { describe, it, expect } from "vitest";
import { computeRoc } from "../../../src/domain/roc";

describe("roc", () => {
  it("rejects bad params", () => {
    expect(computeRoc([1, 2, 3], 0).every((v) => v === null)).toBe(true);
  });

  it("calculates percentage change", () => {
    const out = computeRoc([100, 110], 1);
    expect(out[1]).toBeCloseTo(10, 9);
  });

  it("downtrend -> negative ROC", () => {
    const out = computeRoc([100, 90], 1);
    expect(out[1]).toBeCloseTo(-10, 9);
  });

  it("constant -> ROC 0", () => {
    const out = computeRoc([50, 50, 50, 50], 2);
    expect(out[2]).toBe(0);
    expect(out[3]).toBe(0);
  });

  it("returns null when prev is 0", () => {
    const out = computeRoc([0, 10, 20], 2);
    expect(out[2]).toBeNull();
  });

  it("output length matches input", () => {
    expect(computeRoc([1, 2, 3, 4], 1).length).toBe(4);
  });
});
