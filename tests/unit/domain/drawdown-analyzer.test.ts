import { describe, it, expect } from "vitest";
import {
  drawdownSeries,
  findDrawdownPeriods,
  drawdownSummary,
  worstDrawdowns,
  timeUnderwater,
} from "../../../src/domain/drawdown-analyzer";

describe("drawdown-analyzer", () => {
  const equity = [100, 105, 110, 95, 90, 100, 115, 108, 112];

  it("drawdownSeries shows zero at new highs", () => {
    const series = drawdownSeries(equity);
    expect(series[0]).toBe(0); // first value is peak
    expect(series[1]).toBe(0); // new high
    expect(series[2]).toBe(0); // new high
  });

  it("drawdownSeries shows negative during drawdown", () => {
    const series = drawdownSeries(equity);
    // After peak 110, drops to 95: (95-110)/110 = -13.6%
    expect(series[3]).toBeCloseTo(-13.636, 1);
    // Drops to 90: (90-110)/110 = -18.18%
    expect(series[4]).toBeCloseTo(-18.182, 1);
  });

  it("findDrawdownPeriods identifies drawdown events", () => {
    const periods = findDrawdownPeriods(equity, 1);
    expect(periods.length).toBeGreaterThanOrEqual(1);
    expect(periods[0]!.drawdownPercent).toBeLessThan(0);
  });

  it("findDrawdownPeriods marks recovery when peak exceeded", () => {
    const periods = findDrawdownPeriods(equity, 1);
    const first = periods[0]!;
    // Peak at 110 (idx 2), trough at 90 (idx 4), recovery when >= 110 → idx 6 (115)
    expect(first.recoveryIndex).toBe(6);
  });

  it("findDrawdownPeriods marks ongoing if not recovered", () => {
    const ongoing = [100, 110, 95, 90, 85];
    const periods = findDrawdownPeriods(ongoing, 1);
    expect(periods[0]!.recoveryIndex).toBeNull();
  });

  it("drawdownSummary provides aggregate metrics", () => {
    const summary = drawdownSummary(equity);
    expect(summary.maxDrawdown).toBeLessThan(0);
    expect(summary.drawdownCount).toBeGreaterThanOrEqual(1);
    expect(typeof summary.isInDrawdown).toBe("boolean");
  });

  it("drawdownSummary detects current drawdown state", () => {
    const declining = [100, 110, 105, 100, 95];
    const summary = drawdownSummary(declining);
    expect(summary.isInDrawdown).toBe(true);
    expect(summary.currentDrawdown).toBeLessThan(0);
  });

  it("worstDrawdowns returns sorted by severity", () => {
    const multiDd = [100, 110, 90, 115, 80, 120, 100];
    const worst = worstDrawdowns(multiDd, 3);
    if (worst.length > 1) {
      expect(worst[0]!.drawdownPercent).toBeLessThanOrEqual(worst[1]!.drawdownPercent);
    }
  });

  it("timeUnderwater counts bars since last peak", () => {
    // Peak is 115 at index 6, series ends at index 8
    expect(timeUnderwater(equity)).toBe(2);
  });

  it("timeUnderwater returns 0 if last value is peak", () => {
    const rising = [100, 105, 110, 115];
    expect(timeUnderwater(rising)).toBe(0);
  });

  it("handles empty or single-value input", () => {
    expect(drawdownSeries([])).toEqual([]);
    expect(drawdownSeries([100])).toEqual([0]);
    expect(findDrawdownPeriods([])).toEqual([]);
  });
});
