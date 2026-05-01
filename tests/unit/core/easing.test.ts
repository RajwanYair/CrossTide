import { describe, it, expect } from "vitest";
import {
  linear, easeInQuad, easeOutQuad, easeInOutQuad,
  easeInCubic, easeOutCubic, easeInOutCubic, cubicBezier,
} from "../../../src/core/easing";

const nearly = (a: number, b: number, eps = 1e-3): boolean => Math.abs(a - b) < eps;

describe("easing endpoints", () => {
  const fns = [linear, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic];
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
    const fns = [linear, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic];
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
});
