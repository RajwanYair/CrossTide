import { describe, it, expect } from "vitest";
import { walkForward, anchoredWalkForward } from "../../../src/domain/walk-forward";

// Uptrending price series
const prices = Array.from({ length: 500 }, (_, i) => 100 + i * 0.1 + Math.sin(i * 0.05) * 5);

describe("walk-forward", () => {
  it("walkForward generates correct number of windows", () => {
    const result = walkForward(prices, 100, 50);
    // (500 - 100 - 50) / 50 + 1 = 8 windows (approximately)
    expect(result.windows.length).toBeGreaterThan(0);
  });

  it("walkForward windows have correct boundaries", () => {
    const result = walkForward(prices, 100, 50);
    const w = result.windows[0]!;
    expect(w.inSampleStart).toBe(0);
    expect(w.inSampleEnd).toBe(100);
    expect(w.outOfSampleStart).toBe(100);
    expect(w.outOfSampleEnd).toBe(150);
  });

  it("walkForward computes returns", () => {
    const result = walkForward(prices, 100, 50);
    expect(result.avgOosReturn).not.toBe(0);
  });

  it("walkForward winRate in [0,1]", () => {
    const result = walkForward(prices, 100, 50);
    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(1);
  });

  it("walkForward degradation ratio computed", () => {
    const result = walkForward(prices, 100, 50);
    expect(Number.isFinite(result.degradation)).toBe(true);
  });

  it("walkForward returns empty for short data", () => {
    const result = walkForward([100, 101, 102], 100, 50);
    expect(result.windows).toHaveLength(0);
    expect(result.aggregateOosReturn).toBe(0);
  });

  it("walkForward with custom step size", () => {
    const result = walkForward(prices, 100, 50, 25);
    // More windows with smaller step
    const defaultResult = walkForward(prices, 100, 50);
    expect(result.windows.length).toBeGreaterThan(defaultResult.windows.length);
  });

  it("walkForward with custom evaluator", () => {
    const evaluator = (_p: readonly number[], start: number, end: number) => end - start;
    const result = walkForward(prices, 100, 50, undefined, evaluator);
    expect(result.windows[0]!.inSampleReturn).toBe(100);
    expect(result.windows[0]!.outOfSampleReturn).toBe(50);
  });

  it("anchoredWalkForward in-sample always starts at 0", () => {
    const result = anchoredWalkForward(prices, 100, 50);
    for (const w of result.windows) {
      expect(w.inSampleStart).toBe(0);
    }
  });

  it("anchoredWalkForward in-sample grows", () => {
    const result = anchoredWalkForward(prices, 100, 50);
    if (result.windows.length >= 2) {
      expect(result.windows[1]!.inSampleEnd).toBeGreaterThan(result.windows[0]!.inSampleEnd);
    }
  });

  it("anchoredWalkForward aggregateOosReturn is sum", () => {
    const result = anchoredWalkForward(prices, 100, 50);
    const sum = result.windows.reduce((s, w) => s + w.outOfSampleReturn, 0);
    expect(result.aggregateOosReturn).toBeCloseTo(sum);
  });
});
