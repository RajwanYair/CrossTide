import { describe, it, expect } from "vitest";
import {
  diffSnapshots,
  summarizeDiff,
  getSignificantMovers,
  sortByLargestMove,
  getSignalFlips,
} from "../../../src/domain/snapshot-diff";

describe("snapshot-diff", () => {
  const before = [
    { ticker: "AAPL", price: 150, change: 2, volume: 1000000, signal: "buy" },
    { ticker: "MSFT", price: 300, change: -1, volume: 500000, signal: "hold" },
    { ticker: "GOOG", price: 100, change: 0, volume: 200000, signal: "sell" },
  ];

  const after = [
    { ticker: "AAPL", price: 155, change: 5, volume: 1200000, signal: "buy" },
    { ticker: "MSFT", price: 295, change: -5, volume: 600000, signal: "sell" },
    { ticker: "GOOG", price: 100, change: 0, volume: 180000, signal: "sell" },
  ];

  it("diffSnapshots computes price deltas", () => {
    const diffs = diffSnapshots(before, after);
    expect(diffs).toHaveLength(3);
    const aapl = diffs.find((d) => d.ticker === "AAPL")!;
    expect(aapl.priceDelta).toBe(5);
    expect(aapl.priceDeltaPercent).toBeCloseTo(3.33, 1);
  });

  it("diffSnapshots detects signal changes", () => {
    const diffs = diffSnapshots(before, after);
    const msft = diffs.find((d) => d.ticker === "MSFT")!;
    expect(msft.signalChanged).toBe(true);
    expect(msft.oldSignal).toBe("hold");
    expect(msft.newSignal).toBe("sell");
  });

  it("diffSnapshots marks unchanged signals", () => {
    const diffs = diffSnapshots(before, after);
    const aapl = diffs.find((d) => d.ticker === "AAPL")!;
    expect(aapl.signalChanged).toBe(false);
    expect(aapl.oldSignal).toBeUndefined();
  });

  it("diffSnapshots computes volume delta", () => {
    const diffs = diffSnapshots(before, after);
    const aapl = diffs.find((d) => d.ticker === "AAPL")!;
    expect(aapl.volumeDelta).toBe(200000);
  });

  it("diffSnapshots skips tickers not in before", () => {
    const extraAfter = [...after, { ticker: "NEW", price: 50, change: 1, volume: 100 }];
    const diffs = diffSnapshots(before, extraAfter);
    expect(diffs).toHaveLength(3);
  });

  it("summarizeDiff counts correctly", () => {
    const diffs = diffSnapshots(before, after);
    const summary = summarizeDiff(diffs);
    expect(summary.totalTickers).toBe(3);
    expect(summary.priceIncreased).toBe(1);
    expect(summary.priceDecreased).toBe(1);
    expect(summary.unchanged).toBe(1);
    expect(summary.signalFlips).toBe(1);
  });

  it("summarizeDiff handles empty diffs", () => {
    const summary = summarizeDiff([]);
    expect(summary.totalTickers).toBe(0);
    expect(summary.avgPriceChange).toBe(0);
  });

  it("getSignificantMovers filters by threshold", () => {
    const diffs = diffSnapshots(before, after);
    const movers = getSignificantMovers(diffs, 2);
    expect(movers.length).toBeGreaterThanOrEqual(1);
    for (const m of movers) {
      expect(Math.abs(m.priceDeltaPercent)).toBeGreaterThanOrEqual(2);
    }
  });

  it("sortByLargestMove orders correctly", () => {
    const diffs = diffSnapshots(before, after);
    const sorted = sortByLargestMove(diffs);
    for (let i = 1; i < sorted.length; i++) {
      expect(Math.abs(sorted[i - 1]!.priceDeltaPercent)).toBeGreaterThanOrEqual(
        Math.abs(sorted[i]!.priceDeltaPercent),
      );
    }
  });

  it("getSignalFlips returns only changed signals", () => {
    const diffs = diffSnapshots(before, after);
    const flips = getSignalFlips(diffs);
    expect(flips).toHaveLength(1);
    expect(flips[0]!.ticker).toBe("MSFT");
  });
});
