import { describe, it, expect } from "vitest";
import {
  findSwingLows,
  findSwingHighs,
  clusterLevels,
  findLevels,
  nearestSupport,
  nearestResistance,
} from "../../../src/domain/support-resistance";

describe("support-resistance", () => {
  // Create a series with clear swing points
  const prices = [
    100, 105, 110, 108, 103, 95, 98, 105, 112, 115, 113, 108, 102, 106, 110, 114, 118, 116, 112,
    109, 113,
  ];

  it("findSwingLows identifies local minima", () => {
    const lows = findSwingLows(prices, 2);
    expect(lows.length).toBeGreaterThan(0);
    // Each low should be lower than its neighbors
    for (const low of lows) {
      const start = Math.max(0, low.index - 2);
      const end = Math.min(prices.length - 1, low.index + 2);
      for (let i = start; i <= end; i++) {
        if (i !== low.index) {
          expect(low.price).toBeLessThan(prices[i]!);
        }
      }
    }
  });

  it("findSwingHighs identifies local maxima", () => {
    const highs = findSwingHighs(prices, 2);
    expect(highs.length).toBeGreaterThan(0);
    for (const high of highs) {
      const start = Math.max(0, high.index - 2);
      const end = Math.min(prices.length - 1, high.index + 2);
      for (let i = start; i <= end; i++) {
        if (i !== high.index) {
          expect(high.price).toBeGreaterThan(prices[i]!);
        }
      }
    }
  });

  it("clusterLevels groups nearby prices", () => {
    const levels = [
      { price: 100, index: 0 },
      { price: 100.5, index: 5 },
      { price: 110, index: 10 },
      { price: 110.8, index: 15 },
    ];
    const clusters = clusterLevels(levels, 1);
    expect(clusters).toHaveLength(2);
    expect(clusters[0]!.count).toBe(2);
  });

  it("clusterLevels returns empty for empty input", () => {
    expect(clusterLevels([])).toEqual([]);
  });

  it("findLevels returns support and resistance", () => {
    const levels = findLevels(prices, 2, 2);
    expect(levels.length).toBeGreaterThan(0);
    const supports = levels.filter((l) => l.type === "support");
    const resistances = levels.filter((l) => l.type === "resistance");
    expect(supports.length).toBeGreaterThan(0);
    expect(resistances.length).toBeGreaterThan(0);
  });

  it("findLevels sorted by strength", () => {
    const levels = findLevels(prices, 2, 2);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i - 1]!.strength).toBeGreaterThanOrEqual(levels[i]!.strength);
    }
  });

  it("nearestSupport finds closest below price", () => {
    const levels = findLevels(prices, 2, 2);
    const support = nearestSupport(levels, 112);
    if (support) {
      expect(support.price).toBeLessThan(112);
      expect(support.type).toBe("support");
    }
  });

  it("nearestResistance finds closest above price", () => {
    const levels = findLevels(prices, 2, 2);
    const resistance = nearestResistance(levels, 100);
    if (resistance) {
      expect(resistance.price).toBeGreaterThan(100);
      expect(resistance.type).toBe("resistance");
    }
  });

  it("nearestSupport returns null if none below", () => {
    const levels = [
      { price: 120, type: "support" as const, strength: 1, firstSeen: 0, lastSeen: 0 },
    ];
    expect(nearestSupport(levels, 100)).toBeNull();
  });

  it("nearestResistance returns null if none above", () => {
    const levels = [
      { price: 80, type: "resistance" as const, strength: 1, firstSeen: 0, lastSeen: 0 },
    ];
    expect(nearestResistance(levels, 100)).toBeNull();
  });

  it("findSwingLows with larger lookback finds fewer points", () => {
    const lowsSmall = findSwingLows(prices, 2);
    const lowsLarge = findSwingLows(prices, 4);
    expect(lowsLarge.length).toBeLessThanOrEqual(lowsSmall.length);
  });
});
