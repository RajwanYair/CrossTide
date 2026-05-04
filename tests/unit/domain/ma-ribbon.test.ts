import { describe, it, expect } from "vitest";
import { computeRibbon, ribbonSummary, findCrossovers } from "../../../src/domain/ma-ribbon";

describe("ma-ribbon", () => {
  // Strongly trending up
  const uptrend = Array.from({ length: 250 }, (_, i) => 100 + i * 0.5);
  // Strongly trending down
  const downtrend = Array.from({ length: 250 }, (_, i) => 200 - i * 0.5);
  // Cross: down then up
  const crossSeries = [
    ...Array.from({ length: 210 }, (_, i) => 200 - i * 0.3),
    ...Array.from({ length: 100 }, (_, i) => 137 + i * 0.8),
  ];

  it("computeRibbon returns points from min period onward", () => {
    const ribbon = computeRibbon(uptrend, [5, 10, 20]);
    expect(ribbon.length).toBe(uptrend.length - 19); // starts at index 19
    expect(ribbon[0]!.index).toBe(19);
  });

  it("uptrend is bullish aligned", () => {
    const ribbon = computeRibbon(uptrend, [5, 10, 20]);
    const last = ribbon[ribbon.length - 1]!;
    expect(last.aligned).toBe("bullish");
    // In bullish: faster MA > slower MA, so spread > 0
    expect(last.spread).toBeGreaterThan(0);
  });

  it("downtrend is bearish aligned", () => {
    const ribbon = computeRibbon(downtrend, [5, 10, 20]);
    const last = ribbon[ribbon.length - 1]!;
    expect(last.aligned).toBe("bearish");
    expect(last.spread).toBeLessThan(0);
  });

  it("ribbonSummary provides metrics", () => {
    const summary = ribbonSummary(uptrend, [5, 10, 20]);
    expect(summary).not.toBeNull();
    expect(summary!.currentAlignment).toBe("bullish");
    expect(summary!.spreadPercent).toBeGreaterThan(0);
    expect(summary!.periods).toEqual([5, 10, 20]);
  });

  it("ribbonSummary returns null for insufficient data", () => {
    const summary = ribbonSummary([1, 2, 3], [5, 10, 20]);
    expect(summary).toBeNull();
  });

  it("findCrossovers detects golden cross", () => {
    const crosses = findCrossovers(crossSeries, 10, 50);
    const golden = crosses.filter((c) => c.type === "golden");
    expect(golden.length).toBeGreaterThan(0);
  });

  it("findCrossovers detects death cross in downtrend start", () => {
    // Start up, then decline
    const series = [
      ...Array.from({ length: 210 }, (_, i) => 100 + i * 0.5),
      ...Array.from({ length: 100 }, (_, i) => 205 - i * 1.5),
    ];
    const crosses = findCrossovers(series, 10, 50);
    const death = crosses.filter((c) => c.type === "death");
    expect(death.length).toBeGreaterThan(0);
  });

  it("ribbon values contain all requested periods", () => {
    const ribbon = computeRibbon(uptrend, [5, 10, 20]);
    const last = ribbon[ribbon.length - 1]!;
    expect(
      Object.keys(last.values)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([5, 10, 20]);
  });

  it("convergence detection works", () => {
    // Flat prices should converge ribbons
    const flat = Array.from({ length: 250 }, () => 100);
    const summary = ribbonSummary(flat, [5, 10, 20]);
    expect(summary).not.toBeNull();
    // Flat = all MAs equal
    expect(Math.abs(summary!.spreadPercent)).toBeLessThan(0.01);
  });

  it("default periods work with enough data", () => {
    const data = Array.from({ length: 300 }, (_, i) => 100 + i * 0.2);
    const ribbon = computeRibbon(data);
    expect(ribbon.length).toBe(data.length - 199);
  });

  it("findCrossovers returns empty for pure uptrend", () => {
    const crosses = findCrossovers(uptrend, 10, 50);
    expect(crosses).toEqual([]);
  });
});
