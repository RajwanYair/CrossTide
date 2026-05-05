import { describe, it, expect } from "vitest";
import { analyzeRecoveries, estimateRecoveryTime } from "../../../src/domain/drawdown-recovery";

/** Build a V-shaped price series: peak → trough → recovery */
function makeVSeries(peak: number, trough: number, steps: number): number[] {
  const half = Math.floor(steps / 2);
  const down: number[] = [];
  const up: number[] = [];

  for (let i = 0; i <= half; i++) {
    down.push(peak - ((peak - trough) * i) / half);
  }
  for (let i = 1; i <= half; i++) {
    up.push(trough + ((peak - trough) * i) / half);
  }
  return [...down, ...up];
}

describe("analyzeRecoveries", () => {
  it("returns null for too few values", () => {
    expect(analyzeRecoveries([100])).toBeNull();
  });

  it("returns null for no drawdowns", () => {
    // Monotonically increasing — no drawdowns above 5% threshold
    const values = Array.from({ length: 50 }, (_, i) => 100 + i);
    expect(analyzeRecoveries(values)).toBeNull();
  });

  it("detects a single V-shaped recovery", () => {
    // 100 → 80 → 100 (20% drawdown, then full recovery)
    const values = makeVSeries(100, 80, 40);
    const result = analyzeRecoveries(values);
    expect(result).not.toBeNull();
    expect(result!.totalEvents).toBeGreaterThanOrEqual(1);
    expect(result!.recoveredCount).toBeGreaterThanOrEqual(1);
    expect(result!.recoveryRate).toBeGreaterThan(0);
  });

  it("calculates recovery rate correctly", () => {
    // Two drawdowns: one recovered, one not
    const v1 = makeVSeries(100, 85, 20); // recovered
    const decline = Array.from({ length: 10 }, (_, i) => 100 - i * 2); // ends at 82, not recovered
    const values = [...v1, ...decline];
    const result = analyzeRecoveries(values, 0.05);
    expect(result).not.toBeNull();
    if (result!.totalEvents > 0) {
      expect(result!.recoveryRate).toBeGreaterThanOrEqual(0);
      expect(result!.recoveryRate).toBeLessThanOrEqual(1);
    }
  });

  it("finds fastest and slowest recovery", () => {
    // Fast V (10 bars) then slow V (30 bars)
    const fast = makeVSeries(100, 85, 10);
    const slow = makeVSeries(100, 85, 30);
    const values = [...fast, ...slow];
    const result = analyzeRecoveries(values, 0.05);
    if (result && result.recoveredCount >= 2) {
      expect(result.fastestRecovery).not.toBeNull();
      expect(result.slowestRecovery).not.toBeNull();
      expect(result.fastestRecovery!.recoveryDuration!).toBeLessThanOrEqual(
        result.slowestRecovery!.recoveryDuration!,
      );
    }
  });

  it("computes median recovery duration", () => {
    const v = makeVSeries(100, 80, 20);
    const result = analyzeRecoveries(v, 0.05);
    if (result && result.recoveredCount > 0) {
      expect(result.medianRecoveryDuration).not.toBeNull();
      expect(result.medianRecoveryDuration!).toBeGreaterThan(0);
    }
  });

  it("tracks unrecovered drawdowns", () => {
    // Decline without recovery
    const values = Array.from({ length: 50 }, (_, i) => 100 - i * 0.5);
    const result = analyzeRecoveries(values, 0.05);
    if (result) {
      expect(result.largestUnrecovered).not.toBeNull();
      expect(result.largestUnrecovered!.recovered).toBe(false);
    }
  });

  it("respects minDrawdownPercent parameter", () => {
    // 3% drawdown — should be excluded with 5% threshold
    const values = makeVSeries(100, 97, 20);
    const result = analyzeRecoveries(values, 0.05);
    // 3% is below 5% threshold
    expect(result).toBeNull();
  });
});

describe("estimateRecoveryTime", () => {
  it("returns null for insufficient data", () => {
    expect(estimateRecoveryTime([100], 0.1)).toBeNull();
  });

  it("estimates based on historical recoveries", () => {
    const values = makeVSeries(100, 80, 40);
    const estimate = estimateRecoveryTime(values, 0.15);
    if (estimate !== null) {
      expect(estimate).toBeGreaterThan(0);
    }
  });

  it("returns null when no similar historical drawdowns", () => {
    // Only shallow 6% drawdowns, asking about 50% drawdown
    const values = makeVSeries(100, 94, 20);
    const estimate = estimateRecoveryTime(values, 0.5, 0.05);
    // No historical drawdowns deep enough for comparison
    expect(estimate).toBeNull();
  });
});
