import { describe, it, expect } from "vitest";
import {
  estimateTransitionMatrix,
  stationaryDistribution,
  meanRecurrenceTime,
  classifyRegimes,
  buildMarkovChain,
  simulateMarkovChain,
} from "../../../src/domain/markov-chain";

describe("markov-chain", () => {
  describe("estimateTransitionMatrix", () => {
    it("rows sum to 1", () => {
      const seq = [0, 1, 0, 1, 2, 2, 1, 0, 2, 1, 0];
      const P = estimateTransitionMatrix(seq, 3);
      for (const row of P) {
        const sum = row.reduce((s, v) => s + v, 0);
        expect(sum).toBeCloseTo(1, 8);
      }
    });

    it("correct counts for deterministic sequence", () => {
      // 0→1→2→0→1→2→0
      const seq = [0, 1, 2, 0, 1, 2, 0];
      const P = estimateTransitionMatrix(seq, 3);
      expect(P[0]![1]).toBeCloseTo(1); // 0 always goes to 1
      expect(P[1]![2]).toBeCloseTo(1); // 1 always goes to 2
      expect(P[2]![0]).toBeCloseTo(1); // 2 always goes to 0
    });

    it("3×3 matrix for 3 states", () => {
      const P = estimateTransitionMatrix([0, 1, 2], 3);
      expect(P.length).toBe(3);
      expect(P[0]!.length).toBe(3);
    });
  });

  describe("stationaryDistribution", () => {
    it("sums to 1", () => {
      const P = [
        [0.7, 0.2, 0.1],
        [0.3, 0.5, 0.2],
        [0.2, 0.3, 0.5],
      ];
      const pi = stationaryDistribution(P);
      expect(pi.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 8);
    });

    it("satisfies πP = π", () => {
      const P = [
        [0.7, 0.2, 0.1],
        [0.3, 0.5, 0.2],
        [0.2, 0.3, 0.5],
      ];
      const pi = stationaryDistribution(P);
      for (let j = 0; j < 3; j++) {
        let colSum = 0;
        for (let i = 0; i < 3; i++) colSum += pi[i]! * P[i]![j]!;
        expect(colSum).toBeCloseTo(pi[j]!, 6);
      }
    });

    it("uniform for doubly stochastic matrix", () => {
      const P = [
        [1 / 3, 1 / 3, 1 / 3],
        [1 / 3, 1 / 3, 1 / 3],
        [1 / 3, 1 / 3, 1 / 3],
      ];
      const pi = stationaryDistribution(P);
      for (const p of pi) expect(p).toBeCloseTo(1 / 3, 8);
    });
  });

  describe("meanRecurrenceTime", () => {
    it("inversely proportional to stationary prob", () => {
      const pi = [0.5, 0.3, 0.2];
      const mrt = meanRecurrenceTime(pi);
      expect(mrt[0]).toBeCloseTo(2);
      expect(mrt[1]).toBeCloseTo(10 / 3);
      expect(mrt[2]).toBeCloseTo(5);
    });
  });

  describe("classifyRegimes", () => {
    it("classifies returns into correct states", () => {
      const returns = [-0.05, 0.0, 0.03, -0.02, 0.01];
      const result = classifyRegimes(returns, [-0.01, 0.01], ["bear", "neutral", "bull"]);
      expect(result.states[0]).toBe(0); // -5% → bear
      expect(result.states[1]).toBe(1); // 0% → neutral
      expect(result.states[2]).toBe(2); // 3% → bull
      expect(result.states[3]).toBe(0); // -2% → bear
      expect(result.states[4]).toBe(1); // exactly 1% → neutral (not > 0.01)
    });
  });

  describe("buildMarkovChain", () => {
    it("builds valid chain from returns", () => {
      let s = 42;
      const returns = Array.from({ length: 200 }, () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return (s / 0xffffffff - 0.5) * 0.04;
      });
      const chain = buildMarkovChain(returns);
      expect(chain.states).toEqual(["bear", "neutral", "bull"]);
      expect(chain.transitionMatrix.length).toBe(3);
      expect(chain.stationaryDistribution.reduce((s2, v) => s2 + v, 0)).toBeCloseTo(1, 6);
    });
  });

  describe("simulateMarkovChain", () => {
    it("produces path of correct length", () => {
      const P = [
        [0.8, 0.2],
        [0.3, 0.7],
      ];
      let idx = 0;
      const rng = () => {
        idx = (idx + 1) % 10;
        return idx / 10;
      };
      const path = simulateMarkovChain(P, 0, 50, rng);
      expect(path.length).toBe(51); // start + 50 steps
    });

    it("stays in absorbing state", () => {
      const P = [
        [1, 0],
        [0, 1],
      ];
      const path = simulateMarkovChain(P, 0, 20, () => 0.5);
      for (const s of path) expect(s).toBe(0);
    });
  });
});
