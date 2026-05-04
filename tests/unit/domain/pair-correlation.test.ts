import { describe, it, expect } from "vitest";
import {
  dailyReturns,
  pearsonCorrelation,
  tickerCorrelation,
  buildCorrelationMatrix,
  mostCorrelatedPairs,
  leastCorrelatedPairs,
} from "../../../src/domain/pair-correlation";

describe("pair-correlation", () => {
  it("dailyReturns computes correct values", () => {
    const returns = dailyReturns([100, 110, 105]);
    expect(returns[0]).toBeCloseTo(0.1, 5);
    expect(returns[1]).toBeCloseTo(-0.04545, 3);
  });

  it("dailyReturns of single price is empty", () => {
    expect(dailyReturns([100])).toEqual([]);
  });

  it("pearsonCorrelation of perfectly correlated is 1", () => {
    const a = [1, 2, 3, 4, 5];
    const b = [2, 4, 6, 8, 10];
    expect(pearsonCorrelation(a, b)).toBeCloseTo(1, 5);
  });

  it("pearsonCorrelation of inversely correlated is -1", () => {
    const a = [1, 2, 3, 4, 5];
    const b = [10, 8, 6, 4, 2];
    expect(pearsonCorrelation(a, b)).toBeCloseTo(-1, 5);
  });

  it("pearsonCorrelation returns 0 for uncorrelated", () => {
    const a = [1, -1, 1, -1, 1];
    const b = [1, 1, -1, -1, 1];
    // Not exactly 0 but close to 0
    const corr = pearsonCorrelation(a, b);
    expect(Math.abs(corr)).toBeLessThan(0.5);
  });

  it("tickerCorrelation produces valid pair", () => {
    const pricesA = [100, 102, 104, 106, 108];
    const pricesB = [50, 51, 52, 53, 54];
    const pair = tickerCorrelation("AAPL", pricesA, "MSFT", pricesB);
    expect(pair.tickerA).toBe("AAPL");
    expect(pair.tickerB).toBe("MSFT");
    expect(pair.correlation).toBeCloseTo(1, 1);
    expect(pair.sampleSize).toBe(4);
  });

  it("buildCorrelationMatrix diagonal is 1", () => {
    const data = new Map<string, number[]>([
      ["A", [100, 102, 104]],
      ["B", [50, 51, 52]],
    ]);
    const result = buildCorrelationMatrix(data);
    expect(result.tickers).toHaveLength(2);
    expect(result.matrix[0]![0]).toBe(1);
    expect(result.matrix[1]![1]).toBe(1);
  });

  it("buildCorrelationMatrix is symmetric", () => {
    const data = new Map<string, number[]>([
      ["A", [100, 102, 104, 103, 106]],
      ["B", [50, 49, 52, 51, 53]],
    ]);
    const result = buildCorrelationMatrix(data);
    expect(result.matrix[0]![1]).toBeCloseTo(result.matrix[1]![0]!, 5);
  });

  it("mostCorrelatedPairs returns sorted by absolute correlation", () => {
    const data = new Map<string, number[]>([
      ["A", [100, 102, 104, 106, 108]],
      ["B", [50, 51, 52, 53, 54]],
      ["C", [200, 198, 196, 194, 192]],
    ]);
    const pairs = mostCorrelatedPairs(data, 3);
    expect(pairs.length).toBeGreaterThan(0);
    expect(Math.abs(pairs[0]!.correlation)).toBeGreaterThanOrEqual(Math.abs(pairs[1]!.correlation));
  });

  it("leastCorrelatedPairs returns sorted lowest first", () => {
    const data = new Map<string, number[]>([
      ["A", [100, 102, 104, 106, 108]],
      ["B", [50, 51, 52, 53, 54]],
      ["C", [200, 198, 200, 198, 200]],
    ]);
    const pairs = leastCorrelatedPairs(data, 3);
    expect(pairs.length).toBeGreaterThan(0);
    expect(Math.abs(pairs[0]!.correlation)).toBeLessThanOrEqual(Math.abs(pairs[1]!.correlation));
  });

  it("pearsonCorrelation returns 0 for single element", () => {
    expect(pearsonCorrelation([1], [2])).toBe(0);
  });
});
