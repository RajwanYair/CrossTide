import { describe, it, expect } from "vitest";
import {
  normalizeReturns,
  renderRelativeStrength,
} from "../../../src/cards/relative-strength-card";

describe("relative-strength-card", () => {
  it("normalizeReturns starts at 0", () => {
    const v = normalizeReturns([100, 105, 95]);
    expect(v[0]).toBe(0);
  });

  it("normalizeReturns computes pct series", () => {
    const v = normalizeReturns([100, 110]);
    expect(v[1]).toBeCloseTo(10);
  });

  it("normalizeReturns handles zero base", () => {
    const v = normalizeReturns([0, 10]);
    expect(v[1]).toBe(0);
  });

  it("renderRelativeStrength renders svg and legend", () => {
    const el = document.createElement("div");
    renderRelativeStrength(
      el,
      [
        { ticker: "AAPL", values: [0, 1, 2] },
        { ticker: "SPY", values: [0, 0.5, 1] },
      ],
      "SPY",
    );
    expect(el.innerHTML).toContain("rs-chart");
    expect(el.innerHTML).toContain("AAPL");
    expect(el.innerHTML).toContain("SPY");
  });
});
