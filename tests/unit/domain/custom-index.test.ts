import { describe, it, expect } from "vitest";
import {
  equalWeightedIndex,
  capWeightedIndex,
  rebalanceWeights,
} from "../../../src/domain/custom-index";

describe("custom-index", () => {
  const compA = {
    ticker: "AAPL",
    prices: Array.from({ length: 100 }, (_, i) => 150 + i * 0.5),
    marketCap: 3000,
  };
  const compB = {
    ticker: "MSFT",
    prices: Array.from({ length: 100 }, (_, i) => 300 + i * 0.3),
    marketCap: 2500,
  };
  const compC = {
    ticker: "GOOG",
    prices: Array.from({ length: 100 }, (_, i) => 120 - i * 0.1),
    marketCap: 1500,
  };

  it("equalWeightedIndex produces values starting at 100", () => {
    const result = equalWeightedIndex([compA, compB, compC]);
    expect(result.values[0]).toBeCloseTo(100);
  });

  it("equalWeightedIndex correct length", () => {
    const result = equalWeightedIndex([compA, compB, compC]);
    expect(result.values).toHaveLength(100);
    expect(result.returns).toHaveLength(99);
  });

  it("equalWeightedIndex weights are equal", () => {
    const result = equalWeightedIndex([compA, compB, compC]);
    expect(result.weights["AAPL"]).toBeCloseTo(1 / 3);
    expect(result.weights["MSFT"]).toBeCloseTo(1 / 3);
  });

  it("equalWeightedIndex empty returns empty", () => {
    const result = equalWeightedIndex([]);
    expect(result.values).toEqual([]);
  });

  it("capWeightedIndex uses market cap for weights", () => {
    const result = capWeightedIndex([compA, compB, compC]);
    // AAPL: 3000/7000, MSFT: 2500/7000, GOOG: 1500/7000
    expect(result.weights["AAPL"]).toBeCloseTo(3000 / 7000);
    expect(result.weights["GOOG"]).toBeCloseTo(1500 / 7000);
  });

  it("capWeightedIndex produces different values than equal", () => {
    const eq = equalWeightedIndex([compA, compB, compC]);
    const cap = capWeightedIndex([compA, compB, compC]);
    // Should differ (different weighting)
    expect(cap.values[50]).not.toBeCloseTo(eq.values[50]!, 1);
  });

  it("capWeightedIndex falls back to equal when no caps", () => {
    const noCap = [
      { ticker: "A", prices: compA.prices },
      { ticker: "B", prices: compB.prices },
    ];
    const result = capWeightedIndex(noCap);
    expect(result.weights["A"]).toBeCloseTo(0.5);
  });

  it("totalReturn is positive for uptrending components", () => {
    const result = equalWeightedIndex([compA, compB]);
    expect(result.totalReturn).toBeGreaterThan(0);
  });

  it("annualizedReturn is computed", () => {
    const result = equalWeightedIndex([compA, compB]);
    expect(result.annualizedReturn).toBeGreaterThan(0);
  });

  it("rebalanceWeights equal method", () => {
    const weights = rebalanceWeights([compA, compB, compC], "equal");
    expect(weights["AAPL"]).toBeCloseTo(1 / 3);
    expect(Object.values(weights).reduce((s, w) => s + w, 0)).toBeCloseTo(1);
  });

  it("rebalanceWeights cap method", () => {
    const weights = rebalanceWeights([compA, compB, compC], "cap");
    expect(weights["AAPL"]).toBeCloseTo(3000 / 7000);
    expect(Object.values(weights).reduce((s, w) => s + w, 0)).toBeCloseTo(1);
  });
});
