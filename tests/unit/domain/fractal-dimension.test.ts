import { describe, it, expect } from "vitest";
import {
  higuchiFractalDimension,
  boxCountingDimension,
  katzFractalDimension,
  interpretFractalDimension,
} from "../../../src/domain/fractal-dimension";

// Trending series (low FD, ~1.0-1.3)
const trending = Array.from({ length: 200 }, (_, i) => 100 + i * 0.5);
// Choppy/random-like series (higher FD, ~1.5-2.0)
let seed = 42;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
}
const choppy: number[] = [100];
for (let i = 1; i < 200; i++) choppy.push(choppy[i - 1]! + (lcg() - 0.5) * 5);

describe("fractal-dimension", () => {
  it("higuchiFractalDimension returns value for trending", () => {
    const fd = higuchiFractalDimension(trending);
    expect(fd).toBeGreaterThan(0);
    expect(fd).toBeLessThan(2.5);
  });

  it("higuchiFractalDimension lower for trending than choppy", () => {
    const fdTrend = higuchiFractalDimension(trending);
    const fdChop = higuchiFractalDimension(choppy);
    expect(fdTrend).toBeLessThan(fdChop);
  });

  it("higuchiFractalDimension returns 0 for short series", () => {
    expect(higuchiFractalDimension([1, 2, 3])).toBe(0);
  });

  it("boxCountingDimension returns value in [1, 2]", () => {
    const fd = boxCountingDimension(choppy);
    expect(fd).toBeGreaterThanOrEqual(1);
    expect(fd).toBeLessThanOrEqual(2);
  });

  it("boxCountingDimension returns 0 for flat series", () => {
    const flat = Array.from({ length: 100 }, () => 50);
    expect(boxCountingDimension(flat)).toBe(0);
  });

  it("boxCountingDimension returns 0 for short series", () => {
    expect(boxCountingDimension([1, 2])).toBe(0);
  });

  it("katzFractalDimension positive for valid series", () => {
    const fd = katzFractalDimension(choppy);
    expect(fd).toBeGreaterThan(0);
  });

  it("katzFractalDimension lower for trending", () => {
    const fdTrend = katzFractalDimension(trending);
    const fdChop = katzFractalDimension(choppy);
    expect(fdTrend).toBeLessThan(fdChop);
  });

  it("katzFractalDimension returns 0 for short series", () => {
    expect(katzFractalDimension([1, 2])).toBe(0);
  });

  it("interpretFractalDimension trending", () => {
    expect(interpretFractalDimension(1.1)).toContain("trending");
  });

  it("interpretFractalDimension random walk", () => {
    expect(interpretFractalDimension(1.6)).toContain("random walk");
  });
});
