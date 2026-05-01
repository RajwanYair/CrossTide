import { describe, it, expect } from "vitest";
import {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  cubicBezier,
} from "../../../src/core/easing";

const nearly = (a: number, b: number, eps = 1e-3): boolean => Math.abs(a - b) < eps;

describe("easing endpoints", () => {
  const fns = [
    linear,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
  ];
  it("all easings map 0->0 and 1->1", () => {
    for (const f of fns) {
      expect(f(0)).toBeCloseTo(0, 6);
      expect(f(1)).toBeCloseTo(1, 6);
    }
  });
  it("clamps inputs outside [0,1]", () => {
    expect(linear(-1)).toBe(0);
    expect(linear(2)).toBe(1);
    expect(easeInQuad(-1)).toBe(0);
    expect(easeOutQuad(2)).toBe(1);
  });
});

describe("monotonicity", () => {
  it("standard easings are non-decreasing on [0,1]", () => {
    const fns = [
      linear,
      easeInQuad,
      easeOutQuad,
      easeInOutQuad,
      easeInCubic,
      easeOutCubic,
      easeInOutCubic,
    ];
    for (const f of fns) {
      let prev = f(0);
      for (let t = 0.05; t <= 1; t += 0.05) {
        const v = f(t);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = v;
      }
    }
  });
});

describe("cubicBezier", () => {
  it("approximates linear when control points are diagonal", () => {
    const ease = cubicBezier(0.25, 0.25, 0.75, 0.75);
    expect(nearly(ease(0.5), 0.5)).toBe(true);
  });
  it("endpoints are 0 and 1", () => {
    const ease = cubicBezier(0.4, 0, 0.2, 1);
    expect(ease(0)).toBeCloseTo(0, 5);
    expect(ease(1)).toBeCloseTo(1, 5);
  });
  it("is non-decreasing for monotonic curves", () => {
    const ease = cubicBezier(0.4, 0, 0.2, 1);
    let prev = ease(0);
    for (let t = 0.1; t <= 1; t += 0.1) {
      const v = ease(t);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-6);
      prev = v;
    }
  });

  it("bisection fallback: near-zero-slope X curve triggers break → bisect", () => {
    // cubicBezier(0,0,0,1): sampleX(t) = t³, slopeX(t) = 3t².
    // For very small x, initial t is tiny and 3t² < 1e-6 → NR breaks to bisection.
    const ease = cubicBezier(0, 0, 0, 1);
    // x = 0.0001: slopeX(0.0001) = 3e-8 < 1e-6 → slope-break → bisection entered.
    const y = ease(0.0001);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThanOrEqual(1);
    // The bisection should converge (t ≈ 0.0464, y ≈ 0.006) without throwing.
    expect(y).toBeCloseTo(0.0063, 2);
  });

  it("bisection hi-branch and lo-branch are both reached", () => {
    // For the same curve, bisection starts with mid=0.5, v=0.125 > 0.0001 → hi=mid.
    // Then bisection eventually reaches v < x → lo=mid.  Both branches exercised.
    const ease = cubicBezier(0, 0, 0, 1);
    const y1 = ease(0.0001);
    const y2 = ease(1);
    expect(y1).toBeGreaterThan(0);
    expect(y2).toBeCloseTo(1, 5);
  });
});
