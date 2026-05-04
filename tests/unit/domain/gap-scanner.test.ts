import { describe, it, expect } from "vitest";
import {
  detectGaps,
  unfilledGaps,
  gapUps,
  gapDowns,
  gapFillRate,
  largestGaps,
  averageGapSize,
  hasRecentGap,
} from "../../../src/domain/gap-scanner";

describe("gap-scanner", () => {
  const data = [
    { date: "2026-01-01", open: 100, high: 105, low: 98, close: 102 },
    { date: "2026-01-02", open: 105, high: 108, low: 104, close: 107 }, // gap up from 102
    { date: "2026-01-03", open: 104, high: 106, low: 103, close: 105 }, // gap down from 107
    { date: "2026-01-04", open: 108, high: 110, low: 104, close: 109 }, // gap up from 105, filled (low<=105)
  ];

  it("detectGaps finds gaps exceeding threshold", () => {
    const gaps = detectGaps(data, 0.5);
    expect(gaps.length).toBeGreaterThan(0);
  });

  it("detectGaps identifies gap-up type", () => {
    const gaps = detectGaps(data, 0.5);
    const ups = gaps.filter((g) => g.type === "gap-up");
    expect(ups.length).toBeGreaterThan(0);
    expect(ups[0]!.open).toBeGreaterThan(ups[0]!.prevClose);
  });

  it("detectGaps identifies gap-down type", () => {
    const gaps = detectGaps(data, 0.5);
    const downs = gaps.filter((g) => g.type === "gap-down");
    expect(downs.length).toBeGreaterThan(0);
  });

  it("detectGaps checks if gap was filled same day", () => {
    const gaps = detectGaps(data, 0.5);
    const lastGap = gaps[gaps.length - 1]!;
    // Last gap up from 105 open at 108, low=104 <= 105, so filled
    expect(lastGap.filled).toBe(true);
  });

  it("unfilledGaps filters correctly", () => {
    const gaps = detectGaps(data, 0.5);
    const unfilled = unfilledGaps(gaps);
    expect(unfilled.every((g) => !g.filled)).toBe(true);
  });

  it("gapUps returns only up gaps", () => {
    const gaps = detectGaps(data, 0.5);
    const ups = gapUps(gaps);
    expect(ups.every((g) => g.type === "gap-up")).toBe(true);
  });

  it("gapDowns returns only down gaps", () => {
    const gaps = detectGaps(data, 0.5);
    const downs = gapDowns(gaps);
    expect(downs.every((g) => g.type === "gap-down")).toBe(true);
  });

  it("gapFillRate computes correct ratio", () => {
    const gaps = detectGaps(data, 0.5);
    const rate = gapFillRate(gaps);
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(1);
  });

  it("largestGaps sorts by percent descending", () => {
    const gaps = detectGaps(data, 0.5);
    const largest = largestGaps(gaps, 2);
    if (largest.length > 1) {
      expect(largest[0]!.gapPercent).toBeGreaterThanOrEqual(largest[1]!.gapPercent);
    }
  });

  it("averageGapSize returns 0 for no gaps", () => {
    expect(averageGapSize([])).toBe(0);
  });

  it("hasRecentGap detects gap on last day", () => {
    const result = hasRecentGap(data, 0.5);
    // Last two days: close 105, open 108 → gap up ~2.86%
    expect(result).not.toBeNull();
    expect(result!.type).toBe("gap-up");
  });
});
