import { describe, it, expect } from "vitest";
import {
  simpleReturns,
  logReturns,
  cumulativeReturns,
  totalReturn,
  annualizedReturn,
  rollingReturns,
} from "../../../src/domain/returns";

describe("returns", () => {
  it("simpleReturns yields one fewer element", () => {
    expect(simpleReturns([100, 110, 99])).toEqual([0.1, expect.closeTo(-0.1, 5)]);
  });

  it("logReturns approximates simple for small changes", () => {
    const log = logReturns([100, 101]);
    expect(log[0]).toBeCloseTo(0.00995, 4);
  });

  it("logReturns sums to total log return", () => {
    const prices = [100, 110, 121];
    const sum = logReturns(prices).reduce((s, r) => s + r, 0);
    expect(sum).toBeCloseTo(Math.log(121 / 100), 6);
  });

  it("cumulativeReturns compounds", () => {
    const cum = cumulativeReturns([0.1, 0.1]);
    expect(cum[1]).toBeCloseTo(0.21, 6);
  });

  it("totalReturn matches cumulative product", () => {
    expect(totalReturn([100, 110, 121])).toBeCloseTo(0.21, 6);
  });

  it("annualizedReturn over 2 years", () => {
    expect(annualizedReturn(0.21, 2)).toBeCloseTo(0.1, 4);
  });

  it("rollingReturns over window", () => {
    expect(rollingReturns([100, 105, 110, 121], 2)).toEqual([0.1, expect.closeTo(0.152, 2)]);
  });

  it("safe on empty/single inputs", () => {
    expect(simpleReturns([])).toEqual([]);
    expect(logReturns([100])).toEqual([]);
    expect(totalReturn([100])).toBe(0);
    expect(annualizedReturn(0.5, 0)).toBe(0);
  });

  it("zero prev returns 0 not Infinity", () => {
    expect(simpleReturns([0, 5])[0]).toBe(0);
    expect(logReturns([0, 5])[0]).toBe(0);
    expect(rollingReturns([0, 1, 2], 1)).toEqual([0, 1]);
  });
});
