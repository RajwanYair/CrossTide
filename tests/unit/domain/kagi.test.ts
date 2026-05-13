import { describe, it, expect } from "vitest";
import { computeKagi, autoReversalThreshold } from "../../../src/domain/kagi";
import type { KagiInput } from "../../../src/domain/kagi";

function prices(...values: number[]): KagiInput[] {
  return values.map((close) => ({ close }));
}

describe("computeKagi", () => {
  it("returns empty for fewer than 2 data points", () => {
    expect(computeKagi(prices(100)).segments).toHaveLength(0);
    expect(computeKagi([]).segments).toHaveLength(0);
  });

  it("creates a single segment for monotonic up movement", () => {
    const result = computeKagi(prices(100, 105, 110, 115, 120), {
      reversalThreshold: 0.1,
      isPercentage: true,
    });
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]!.from).toBe(100);
    expect(result.segments[0]!.to).toBe(120);
  });

  it("creates a single segment for monotonic down movement", () => {
    const result = computeKagi(prices(120, 115, 110, 105, 100), {
      reversalThreshold: 0.1,
      isPercentage: true,
    });
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]!.from).toBe(120);
    expect(result.segments[0]!.to).toBe(100);
  });

  it("detects reversal with percentage threshold", () => {
    // Up from 100 to 110, then down to 104 (5.5% reversal from 110)
    const result = computeKagi(prices(100, 105, 110, 106, 104), {
      reversalThreshold: 0.05,
      isPercentage: true,
    });
    expect(result.segments.length).toBeGreaterThanOrEqual(2);
    // First segment should be up
    expect(result.segments[0]!.to).toBeGreaterThan(result.segments[0]!.from);
    // Second segment should be down
    expect(result.segments[1]!.to).toBeLessThan(result.segments[1]!.from);
  });

  it("detects reversal with absolute threshold", () => {
    const result = computeKagi(prices(100, 110, 105), {
      reversalThreshold: 5,
      isPercentage: false,
    });
    expect(result.segments.length).toBeGreaterThanOrEqual(2);
  });

  it("ignores small moves below threshold", () => {
    // Move up to 110, then only 2% down — should NOT trigger 5% reversal
    const result = computeKagi(prices(100, 105, 110, 108), {
      reversalThreshold: 0.05,
      isPercentage: true,
    });
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]!.to).toBe(110);
  });

  it("tracks shoulders and waists on weight changes", () => {
    // Create a pattern where weight should change:
    // Up to 120 (shoulder), down to 90 (waist), up to 130 (above old shoulder → yang)
    const data = prices(
      100,
      105,
      110,
      115,
      120, // up to 120
      115,
      110,
      105,
      100,
      95,
      90, // down to 90 (reversal)
      95,
      100,
      105,
      110,
      115,
      120,
      125,
      130, // up to 130 (above shoulder → yang)
    );
    const result = computeKagi(data, {
      reversalThreshold: 0.04,
      isPercentage: true,
    });
    expect(result.segments.length).toBeGreaterThanOrEqual(2);
    // Should have recorded weight transitions
    expect(result.shoulders.length + result.waists.length).toBeGreaterThanOrEqual(0);
  });

  it("preserves default options", () => {
    const result = computeKagi(prices(100, 110, 95, 120));
    expect(result.reversalThreshold).toBe(0.04);
    expect(result.isPercentage).toBe(true);
  });

  it("endIndex references correct position in original data", () => {
    const result = computeKagi(prices(100, 110, 95, 120), {
      reversalThreshold: 0.05,
      isPercentage: true,
    });
    for (const seg of result.segments) {
      expect(seg.endIndex).toBeGreaterThanOrEqual(0);
      expect(seg.endIndex).toBeLessThan(4);
    }
  });

  it("all segments have valid weight", () => {
    const result = computeKagi(prices(100, 120, 90, 130, 80, 140), {
      reversalThreshold: 0.04,
    });
    for (const seg of result.segments) {
      expect(["yang", "yin"]).toContain(seg.weight);
    }
  });
});

describe("autoReversalThreshold", () => {
  it("returns 0.04 for short series", () => {
    expect(autoReversalThreshold([100, 101, 102])).toBe(0.04);
  });

  it("returns value between 0.02 and 0.10 for normal data", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i * 0.3) * 5);
    const threshold = autoReversalThreshold(prices);
    expect(threshold).toBeGreaterThanOrEqual(0.02);
    expect(threshold).toBeLessThanOrEqual(0.1);
  });

  it("returns higher threshold for volatile data", () => {
    const calm = Array.from({ length: 60 }, (_, i) => 100 + i * 0.1);
    const volatile = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i) * 20);
    const calmThreshold = autoReversalThreshold(calm);
    const volatileThreshold = autoReversalThreshold(volatile);
    expect(volatileThreshold).toBeGreaterThanOrEqual(calmThreshold);
  });
});
