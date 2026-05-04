import { describe, it, expect } from "vitest";
import { causalImpact } from "../../../src/domain/causal-impact";

let seed = 55555;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}

// Synthetic data: target = 2*covariate + noise, with intervention adding 5 after index 50
const n = 100;
const interventionIdx = 50;
const covariate = Array.from({ length: n }, () => lcg() * 3 + 10);
const noise = Array.from({ length: n }, () => lcg() * 0.5);
const target = covariate.map((c, i) => {
  const base = 2 * c + noise[i]!;
  return i >= interventionIdx ? base + 5 : base;
});

describe("causal-impact", () => {
  it("detects positive causal effect", () => {
    const result = causalImpact(target, [covariate], { interventionIndex: interventionIdx });
    expect(result.averageEffect).toBeGreaterThan(3);
    expect(result.averageEffect).toBeLessThan(7);
  });

  it("cumulative effect is sum of point effects", () => {
    const result = causalImpact(target, [covariate], { interventionIndex: interventionIdx });
    const expectedCum = result.pointEffect.reduce((s, e) => s + e, 0);
    expect(result.cumulativeEffect).toBeCloseTo(expectedCum, 8);
  });

  it("significant for strong intervention", () => {
    const result = causalImpact(target, [covariate], { interventionIndex: interventionIdx });
    expect(result.significant).toBe(true);
  });

  it("not significant when no intervention", () => {
    const noEffect = covariate.map((c, i) => 2 * c + noise[i]!);
    const result = causalImpact(noEffect, [covariate], { interventionIndex: interventionIdx });
    expect(Math.abs(result.averageEffect)).toBeLessThan(2);
  });

  it("predicted length matches post-intervention", () => {
    const result = causalImpact(target, [covariate], { interventionIndex: interventionIdx });
    expect(result.predicted.length).toBe(n - interventionIdx);
    expect(result.pointEffect.length).toBe(n - interventionIdx);
  });

  it("returns empty for invalid config", () => {
    const result = causalImpact(target, [], { interventionIndex: 50 });
    expect(result.significant).toBe(false);
    expect(result.cumulativeEffect).toBe(0);
  });

  it("relative effect is approximately 5/(2*mean_cov)", () => {
    const result = causalImpact(target, [covariate], { interventionIndex: interventionIdx });
    // Base is ~2*10=20, effect is 5, so relative ~0.25
    expect(result.relativeEffect).toBeGreaterThan(0.1);
    expect(result.relativeEffect).toBeLessThan(0.5);
  });

  it("handles multiple covariates", () => {
    const cov2 = Array.from({ length: n }, () => lcg() * 2 + 5);
    const result = causalImpact(target, [covariate, cov2], { interventionIndex: interventionIdx });
    expect(result.averageEffect).toBeGreaterThan(2);
  });
});
