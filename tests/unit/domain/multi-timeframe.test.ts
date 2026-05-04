import { describe, it, expect } from "vitest";
import {
  detectTrend,
  resampleWeekly,
  resampleMonthly,
  multiTimeframeTrend,
  isFullyAligned,
} from "../../../src/domain/multi-timeframe";

describe("multi-timeframe", () => {
  const uptrend = Array.from({ length: 300 }, (_, i) => 100 + i * 0.5);
  const downtrend = Array.from({ length: 300 }, (_, i) => 250 - i * 0.5);
  const flat = Array.from({ length: 300 }, () => 100);

  it("detectTrend identifies uptrend", () => {
    const t = detectTrend(uptrend, 20);
    expect(t.direction).toBe("up");
    expect(t.maSlope).toBeGreaterThan(0);
    expect(t.strength).toBeGreaterThanOrEqual(50);
  });

  it("detectTrend identifies downtrend", () => {
    const t = detectTrend(downtrend, 20);
    expect(t.direction).toBe("down");
    expect(t.maSlope).toBeLessThan(0);
  });

  it("detectTrend returns neutral for flat", () => {
    const t = detectTrend(flat, 20);
    expect(t.direction).toBe("neutral");
  });

  it("detectTrend returns neutral for insufficient data", () => {
    const t = detectTrend([1, 2, 3], 20);
    expect(t.direction).toBe("neutral");
    expect(t.strength).toBe(0);
  });

  it("resampleWeekly picks every 5th bar", () => {
    const weekly = resampleWeekly(uptrend);
    expect(weekly.length).toBe(
      Math.floor((uptrend.length - 4) / 5) + (uptrend.length >= 5 ? 1 : 0),
    );
    expect(weekly[0]).toBe(uptrend[4]);
  });

  it("resampleMonthly picks every 21st bar", () => {
    const monthly = resampleMonthly(uptrend);
    expect(monthly[0]).toBe(uptrend[20]);
  });

  it("multiTimeframeTrend aligned for strong uptrend", () => {
    const result = multiTimeframeTrend(uptrend);
    expect(result.consensus).toBe("up");
    expect(result.aligned).toBe(true);
    expect(result.confluenceScore).toBeGreaterThan(0);
  });

  it("multiTimeframeTrend aligned for strong downtrend", () => {
    const result = multiTimeframeTrend(downtrend);
    expect(result.consensus).toBe("down");
    expect(result.aligned).toBe(true);
  });

  it("multiTimeframeTrend has 3 timeframe entries", () => {
    const result = multiTimeframeTrend(uptrend);
    expect(result.trends).toHaveLength(3);
    const tfs = result.trends.map((t) => t.timeframe);
    expect(tfs).toContain("daily");
    expect(tfs).toContain("weekly");
    expect(tfs).toContain("monthly");
  });

  it("isFullyAligned true when all match", () => {
    const result = multiTimeframeTrend(uptrend);
    expect(isFullyAligned(result)).toBe(true);
  });

  it("flat market not aligned", () => {
    const result = multiTimeframeTrend(flat);
    expect(result.aligned).toBe(false);
  });
});
