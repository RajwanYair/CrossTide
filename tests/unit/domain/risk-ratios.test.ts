import { describe, it, expect } from "vitest";
import { sortinoRatio, maxDrawdown, cagr, calmarRatio } from "../../../src/domain/risk-ratios";

describe("risk-ratios", () => {
  it("sortino returns 0 for empty input", () => {
    expect(sortinoRatio([])).toBe(0);
  });

  it("sortino returns 0 when no downside deviation", () => {
    expect(sortinoRatio([0.01, 0.02, 0.03])).toBe(0);
  });

  it("sortino is positive when mean exceeds MAR with downside", () => {
    const r = sortinoRatio([0.02, -0.01, 0.03, -0.02, 0.04]);
    expect(r).toBeGreaterThan(0);
  });

  it("sortino is negative when mean below risk-free", () => {
    const r = sortinoRatio([-0.01, -0.02, -0.005], { riskFreeRate: 0.005 });
    expect(r).toBeLessThan(0);
  });

  it("maxDrawdown computes 50% peak-to-trough", () => {
    expect(maxDrawdown([100, 120, 60, 80])).toBeCloseTo(0.5, 5);
  });

  it("maxDrawdown is 0 for monotonically increasing", () => {
    expect(maxDrawdown([1, 2, 3, 4])).toBe(0);
  });

  it("cagr handles doubling over 1 year", () => {
    expect(cagr([100, 200], 1)).toBeCloseTo(1, 5);
  });

  it("cagr returns 0 for invalid input", () => {
    expect(cagr([100], 1)).toBe(0);
    expect(cagr([100, 200], 0)).toBe(0);
    expect(cagr([0, 200], 1)).toBe(0);
  });

  it("calmarRatio computes cagr/maxDD", () => {
    // Equity 100 -> 80 -> 200 over 2 years.
    // CAGR = sqrt(2) - 1 ≈ 0.4142
    // maxDD = 20%
    // Calmar ≈ 2.07
    expect(calmarRatio([100, 80, 200], 2)).toBeCloseTo(0.4142 / 0.2, 1);
  });

  it("calmarRatio is Infinity when no drawdown but positive CAGR", () => {
    expect(calmarRatio([100, 110, 120], 1)).toBe(Infinity);
  });

  it("calmarRatio is 0 when no growth", () => {
    expect(calmarRatio([100, 100, 100], 1)).toBe(0);
  });
});
