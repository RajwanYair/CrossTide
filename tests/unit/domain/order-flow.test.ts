import { describe, it, expect } from "vitest";
import {
  tickRuleClassify,
  bulkVolumeClassify,
  orderFlowImbalance,
  computeVPIN,
  flowBuckets,
  type Trade,
} from "../../../src/domain/order-flow";

// Uptrend: steadily rising prices → mostly buys
const uptrendTrades: Trade[] = [];
for (let i = 0; i < 100; i++) {
  uptrendTrades.push({ price: 100 + i * 0.1, volume: 100 });
}

// Downtrend: steadily falling prices → mostly sells
const downtrendTrades: Trade[] = [];
for (let i = 0; i < 100; i++) {
  downtrendTrades.push({ price: 110 - i * 0.1, volume: 100 });
}

// Mixed: alternating up/down
const mixedTrades: Trade[] = [];
for (let i = 0; i < 100; i++) {
  mixedTrades.push({ price: 100 + (i % 2 === 0 ? 0.1 : -0.1), volume: 100 });
}

describe("order-flow", () => {
  describe("tickRuleClassify", () => {
    it("classifies uptrend as mostly buys", () => {
      const signed = tickRuleClassify(uptrendTrades);
      const buys = signed.filter((v) => v > 0).length;
      expect(buys).toBeGreaterThan(90);
    });

    it("classifies downtrend as mostly sells", () => {
      const signed = tickRuleClassify(downtrendTrades);
      const sells = signed.filter((v) => v < 0).length;
      expect(sells).toBeGreaterThan(90);
    });

    it("returns empty for no trades", () => {
      expect(tickRuleClassify([])).toEqual([]);
    });

    it("preserves volume magnitude", () => {
      const signed = tickRuleClassify(uptrendTrades);
      for (const v of signed) {
        expect(Math.abs(v)).toBe(100);
      }
    });
  });

  describe("bulkVolumeClassify", () => {
    it("classifies uptrend with positive net volume", () => {
      const signed = bulkVolumeClassify(uptrendTrades);
      const netFlow = signed.reduce((s, v) => s + v, 0);
      expect(netFlow).toBeGreaterThan(0);
    });

    it("classifies downtrend with negative net volume", () => {
      const signed = bulkVolumeClassify(downtrendTrades);
      const netFlow = signed.reduce((s, v) => s + v, 0);
      expect(netFlow).toBeLessThan(0);
    });
  });

  describe("orderFlowImbalance", () => {
    it("positive imbalance for uptrend", () => {
      const metrics = orderFlowImbalance(uptrendTrades);
      expect(metrics.imbalance).toBeGreaterThan(0.5);
    });

    it("negative imbalance for downtrend", () => {
      const metrics = orderFlowImbalance(downtrendTrades);
      expect(metrics.imbalance).toBeLessThan(-0.5);
    });

    it("buyVolume + sellVolume = total volume", () => {
      const metrics = orderFlowImbalance(uptrendTrades);
      expect(metrics.buyVolume + metrics.sellVolume).toBeCloseTo(100 * 100);
    });

    it("toxicity low for balanced flow", () => {
      const metrics = orderFlowImbalance(mixedTrades);
      expect(metrics.toxicity).not.toBe("high");
    });

    it("returns zeros for empty trades", () => {
      const metrics = orderFlowImbalance([]);
      expect(metrics.imbalance).toBe(0);
      expect(metrics.vpin).toBe(0);
    });
  });

  describe("computeVPIN", () => {
    it("high VPIN for one-sided flow", () => {
      const signed = Array.from({ length: 1000 }, () => 100); // all buys
      const vpin = computeVPIN(signed, 500);
      expect(vpin).toBeGreaterThan(0.8);
    });

    it("low VPIN for balanced flow", () => {
      const signed = Array.from({ length: 1000 }, (_, i) => (i % 2 === 0 ? 100 : -100));
      const vpin = computeVPIN(signed, 500);
      expect(vpin).toBeLessThan(0.21);
    });

    it("returns 0 for empty input", () => {
      expect(computeVPIN([], 100)).toBe(0);
    });
  });

  describe("flowBuckets", () => {
    it("creates buckets of approximate size", () => {
      const buckets = flowBuckets(uptrendTrades, 500);
      expect(buckets.length).toBeGreaterThan(0);
    });

    it("cumulative imbalance increases for uptrend", () => {
      const buckets = flowBuckets(uptrendTrades, 500);
      const last = buckets[buckets.length - 1]!;
      expect(last.cumulativeImbalance).toBeGreaterThan(0);
    });
  });
});
