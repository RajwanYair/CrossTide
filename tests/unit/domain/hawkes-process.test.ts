import { describe, it, expect } from "vitest";
import {
  fitHawkes,
  simulateHawkes,
  hawkesIntensity,
  type HawkesParams,
} from "../../../src/domain/hawkes-process";

let seed = 33333;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
}

// Simulate known Hawkes process
const trueParams: HawkesParams = { mu: 1.0, alpha: 0.5, beta: 1.5 };
const simEvents = simulateHawkes(trueParams, 100, lcg);

describe("hawkes-process", () => {
  describe("simulateHawkes", () => {
    it("generates events within time window", () => {
      for (const t of simEvents) {
        expect(t).toBeGreaterThan(0);
        expect(t).toBeLessThan(100);
      }
    });

    it("events are sorted", () => {
      for (let i = 1; i < simEvents.length; i++) {
        expect(simEvents[i]).toBeGreaterThanOrEqual(simEvents[i - 1]!);
      }
    });

    it("generates reasonable number of events", () => {
      // Stationary rate = μ/(1-α/β) = 1/(1-1/3) = 1.5, expect ~150 in T=100
      expect(simEvents.length).toBeGreaterThan(50);
      expect(simEvents.length).toBeLessThan(500);
    });

    it("empty for zero time", () => {
      const events = simulateHawkes(trueParams, 0, lcg);
      expect(events.length).toBe(0);
    });
  });

  describe("fitHawkes", () => {
    it("estimates positive parameters", () => {
      const result = fitHawkes(simEvents, 100);
      expect(result.params.mu).toBeGreaterThan(0);
      expect(result.params.alpha).toBeGreaterThan(0);
      expect(result.params.beta).toBeGreaterThan(0);
    });

    it("branching ratio below 1 (stationary)", () => {
      const result = fitHawkes(simEvents, 100);
      expect(result.branchingRatio).toBeLessThan(1);
      expect(result.branchingRatio).toBeGreaterThan(0);
    });

    it("stationary intensity reasonable", () => {
      const result = fitHawkes(simEvents, 100);
      // Should be close to observed rate
      const observedRate = simEvents.length / 100;
      expect(result.stationaryIntensity).toBeGreaterThan(observedRate * 0.3);
      expect(result.stationaryIntensity).toBeLessThan(observedRate * 3);
    });

    it("half-life is positive", () => {
      const result = fitHawkes(simEvents, 100);
      expect(result.halfLife).toBeGreaterThan(0);
    });

    it("handles too few events gracefully", () => {
      const result = fitHawkes([1, 2, 3], 10);
      expect(result.params.mu).toBeGreaterThan(0);
    });
  });

  describe("hawkesIntensity", () => {
    it("intensity equals mu before any events", () => {
      const intensity = hawkesIntensity(simEvents, [0], trueParams);
      expect(intensity[0]).toBeCloseTo(trueParams.mu);
    });

    it("intensity spikes after events", () => {
      if (simEvents.length < 2) return;
      const justBefore = simEvents[1]! - 0.001;
      const justAfter = simEvents[1]! + 0.001;
      const [iBefore] = hawkesIntensity(simEvents, [justBefore], trueParams);
      const [iAfter] = hawkesIntensity(simEvents, [justAfter], trueParams);
      expect(iAfter).toBeGreaterThan(iBefore!);
    });

    it("intensity decays over time without new events", () => {
      const lastEvent = simEvents[simEvents.length - 1]!;
      const [i1] = hawkesIntensity(simEvents, [lastEvent + 1], trueParams);
      const [i2] = hawkesIntensity(simEvents, [lastEvent + 10], trueParams);
      expect(i1).toBeGreaterThan(i2!);
    });
  });
});
