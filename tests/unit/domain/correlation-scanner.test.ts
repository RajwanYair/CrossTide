import { describe, it, expect } from "vitest";
import { scanCorrelations } from "../../../src/domain/correlation-scanner";

function makePrices(base: number, changes: number[]): number[] {
  const prices = [base];
  for (const c of changes) {
    prices.push(prices[prices.length - 1]! * (1 + c));
  }
  return prices;
}

describe("scanCorrelations", () => {
  it("returns null for fewer than 2 tickers", () => {
    const data = new Map([["AAPL", [100, 101, 102, 103]]]);
    expect(scanCorrelations(data)).toBeNull();
  });

  it("returns null for empty map", () => {
    expect(scanCorrelations(new Map())).toBeNull();
  });

  it("finds perfectly correlated pair", () => {
    const prices = makePrices(
      100,
      Array.from({ length: 50 }, (_, i) => 0.01 * (i % 5)),
    );
    const data = new Map([
      ["A", prices],
      ["B", prices], // identical
    ]);
    const result = scanCorrelations(data);
    expect(result).not.toBeNull();
    expect(result!.pairs).toHaveLength(1);
    expect(result!.pairs[0]!.correlation).toBeCloseTo(1.0, 5);
  });

  it("finds negatively correlated pair", () => {
    // Alternating patterns that are inversely correlated
    const up = makePrices(
      100,
      Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? 0.02 : -0.01)),
    );
    const down = makePrices(
      100,
      Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? -0.02 : 0.01)),
    );
    const data = new Map([
      ["UP", up],
      ["DOWN", down],
    ]);
    const result = scanCorrelations(data);
    expect(result).not.toBeNull();
    expect(result!.mostNegative).not.toBeNull();
    expect(result!.mostNegative!.correlation).toBeLessThan(0);
  });

  it("sorts pairs by absolute correlation descending", () => {
    // Create 3 assets with varying correlations
    const a = makePrices(
      100,
      Array.from({ length: 50 }, (_, i) => 0.01 * Math.sin(i)),
    );
    const b = makePrices(
      100,
      Array.from({ length: 50 }, (_, i) => 0.01 * Math.sin(i + 0.1)),
    ); // very similar to A
    const c = makePrices(
      100,
      Array.from({ length: 50 }, (_, i) => 0.01 * Math.cos(i)),
    ); // different pattern
    const data = new Map([
      ["A", a],
      ["B", b],
      ["C", c],
    ]);
    const result = scanCorrelations(data);
    expect(result).not.toBeNull();
    expect(result!.pairCount).toBe(3);
    // First pair should have highest abs correlation
    for (let i = 1; i < result!.pairs.length; i++) {
      expect(result!.pairs[i - 1]!.absCorrelation).toBeGreaterThanOrEqual(
        result!.pairs[i]!.absCorrelation,
      );
    }
  });

  it("respects minOverlap filter", () => {
    const short = [100, 101, 102]; // only 2 returns
    const long = makePrices(
      100,
      Array.from({ length: 50 }, () => 0.01),
    );
    const data = new Map([
      ["SHORT", short],
      ["LONG", long],
    ]);
    const result = scanCorrelations(data, { minOverlap: 30 });
    // SHORT only has 2 returns, not enough
    expect(result).toBeNull();
  });

  it("respects minAbsCorrelation filter", () => {
    // Two uncorrelated-ish series — all pairs below 0.99 threshold
    const a = makePrices(
      100,
      Array.from({ length: 50 }, (_, i) => 0.01 * Math.sin(i)),
    );
    const b = makePrices(
      100,
      Array.from({ length: 50 }, (_, i) => 0.01 * Math.cos(i * 3)),
    );
    const data = new Map([
      ["A", a],
      ["B", b],
    ]);
    // With a 0.99 threshold, no pairs pass → returns null
    const result = scanCorrelations(data, { minAbsCorrelation: 0.99 });
    expect(result).toBeNull();
  });

  it("provides tickerCount and pairCount", () => {
    const prices = makePrices(
      100,
      Array.from({ length: 50 }, () => 0.01),
    );
    const data = new Map([
      ["A", prices],
      ["B", prices],
      ["C", prices],
    ]);
    const result = scanCorrelations(data);
    expect(result).not.toBeNull();
    expect(result!.tickerCount).toBe(3);
    expect(result!.pairCount).toBe(3); // C(3,2) = 3
  });

  it("identifies highest and lowest correlated pairs", () => {
    const a = makePrices(
      100,
      Array.from({ length: 50 }, () => 0.01),
    );
    const b = makePrices(
      100,
      Array.from({ length: 50 }, () => 0.01),
    ); // same as A
    const c = makePrices(
      100,
      Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? 0.02 : -0.015)),
    );
    const data = new Map([
      ["A", a],
      ["B", b],
      ["C", c],
    ]);
    const result = scanCorrelations(data);
    expect(result).not.toBeNull();
    expect(result!.highestCorrelated).not.toBeNull();
    expect(result!.lowestCorrelated).not.toBeNull();
    expect(result!.highestCorrelated!.absCorrelation).toBeGreaterThanOrEqual(
      result!.lowestCorrelated!.absCorrelation,
    );
  });
});
