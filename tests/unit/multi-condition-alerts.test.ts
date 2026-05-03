/**
 * Unit tests for multi-condition alert rules (L3).
 */
import { describe, it, expect } from "vitest";
import { evaluateMultiConditionRules } from "../../src/domain/alert-state-machine";
import type { AlertRule, MethodSignal, ConsensusResult } from "../../src/types/domain";

function makeSignal(method: string, direction: "BUY" | "SELL" | "NEUTRAL"): MethodSignal {
  return {
    ticker: "AAPL",
    method: method as MethodSignal["method"],
    direction,
    description: `${method} ${direction}`,
    currentClose: 150,
    evaluatedAt: "2025-01-15T10:00:00Z",
  };
}

function makeConsensus(direction: "BUY" | "SELL" | "NEUTRAL"): ConsensusResult {
  return {
    ticker: "AAPL",
    direction,
    strength: 0.8,
    buyMethods: direction === "BUY" ? [makeSignal("RSI", "BUY")] : [],
    sellMethods: direction === "SELL" ? [makeSignal("RSI", "SELL")] : [],
    evaluatedAt: "2025-01-15T10:00:00Z",
  };
}

const NOW = "2025-01-15T10:00:00Z";

describe("evaluateMultiConditionRules", () => {
  describe("AND operator", () => {
    it("fires when ALL conditions are met", () => {
      const rule: AlertRule = {
        id: "r1",
        name: "RSI+MACD BUY",
        ticker: "AAPL",
        operator: "AND",
        conditions: [
          { type: "method", method: "RSI", direction: "BUY" },
          { type: "method", method: "MACD", direction: "BUY" },
        ],
        enabled: true,
        createdAt: "2025-01-01T00:00:00Z",
      };

      const signals = [makeSignal("RSI", "BUY"), makeSignal("MACD", "BUY")];
      const { alerts, newFiredIds } = evaluateMultiConditionRules(
        [rule],
        signals,
        null,
        new Set(),
        NOW,
      );

      expect(alerts).toHaveLength(1);
      expect(alerts[0]!.ruleId).toBe("r1");
      expect(alerts[0]!.direction).toBe("BUY");
      expect(alerts[0]!.description).toContain("RSI BUY");
      expect(alerts[0]!.description).toContain("MACD BUY");
      expect(newFiredIds.has("r1")).toBe(true);
    });

    it("does NOT fire when only some conditions are met", () => {
      const rule: AlertRule = {
        id: "r2",
        name: "RSI+MACD",
        ticker: "AAPL",
        operator: "AND",
        conditions: [
          { type: "method", method: "RSI", direction: "BUY" },
          { type: "method", method: "MACD", direction: "BUY" },
        ],
        enabled: true,
        createdAt: "2025-01-01T00:00:00Z",
      };

      const signals = [makeSignal("RSI", "BUY"), makeSignal("MACD", "SELL")];
      const { alerts } = evaluateMultiConditionRules([rule], signals, null, new Set(), NOW);

      expect(alerts).toHaveLength(0);
    });

    it("fires with consensus + method AND", () => {
      const rule: AlertRule = {
        id: "r3",
        name: "Consensus+Bollinger",
        ticker: "AAPL",
        operator: "AND",
        conditions: [
          { type: "consensus", direction: "BUY" },
          { type: "method", method: "Bollinger", direction: "BUY" },
        ],
        enabled: true,
        createdAt: "2025-01-01T00:00:00Z",
      };

      const signals = [makeSignal("Bollinger", "BUY")];
      const consensus = makeConsensus("BUY");
      const { alerts } = evaluateMultiConditionRules([rule], signals, consensus, new Set(), NOW);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]!.description).toContain("Consensus BUY");
      expect(alerts[0]!.description).toContain("Bollinger BUY");
    });
  });

  describe("OR operator", () => {
    it("fires when ANY condition is met", () => {
      const rule: AlertRule = {
        id: "r4",
        name: "RSI or MACD",
        ticker: "AAPL",
        operator: "OR",
        conditions: [
          { type: "method", method: "RSI", direction: "BUY" },
          { type: "method", method: "MACD", direction: "BUY" },
        ],
        enabled: true,
        createdAt: "2025-01-01T00:00:00Z",
      };

      const signals = [makeSignal("RSI", "BUY")]; // Only RSI, no MACD
      const { alerts } = evaluateMultiConditionRules([rule], signals, null, new Set(), NOW);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]!.ruleName).toBe("RSI or MACD");
    });

    it("does NOT fire when NO conditions are met", () => {
      const rule: AlertRule = {
        id: "r5",
        name: "RSI or MACD",
        ticker: "AAPL",
        operator: "OR",
        conditions: [
          { type: "method", method: "RSI", direction: "BUY" },
          { type: "method", method: "MACD", direction: "BUY" },
        ],
        enabled: true,
        createdAt: "2025-01-01T00:00:00Z",
      };

      const signals = [makeSignal("RSI", "SELL"), makeSignal("MACD", "SELL")];
      const { alerts } = evaluateMultiConditionRules([rule], signals, null, new Set(), NOW);

      expect(alerts).toHaveLength(0);
    });
  });

  describe("idempotency", () => {
    it("does NOT re-fire if rule already fired", () => {
      const rule: AlertRule = {
        id: "r6",
        name: "RSI BUY",
        ticker: "AAPL",
        operator: "AND",
        conditions: [{ type: "method", method: "RSI", direction: "BUY" }],
        enabled: true,
        createdAt: "2025-01-01T00:00:00Z",
      };

      const signals = [makeSignal("RSI", "BUY")];
      const alreadyFired = new Set(["r6"]);
      const { alerts } = evaluateMultiConditionRules([rule], signals, null, alreadyFired, NOW);

      expect(alerts).toHaveLength(0);
    });
  });

  describe("disabled rules", () => {
    it("skips disabled rules", () => {
      const rule: AlertRule = {
        id: "r7",
        name: "Disabled",
        ticker: "AAPL",
        operator: "AND",
        conditions: [{ type: "method", method: "RSI", direction: "BUY" }],
        enabled: false,
        createdAt: "2025-01-01T00:00:00Z",
      };

      const signals = [makeSignal("RSI", "BUY")];
      const { alerts } = evaluateMultiConditionRules([rule], signals, null, new Set(), NOW);

      expect(alerts).toHaveLength(0);
    });
  });

  describe("empty conditions", () => {
    it("skips rules with no conditions", () => {
      const rule: AlertRule = {
        id: "r8",
        name: "Empty",
        ticker: "AAPL",
        operator: "AND",
        conditions: [],
        enabled: true,
        createdAt: "2025-01-01T00:00:00Z",
      };

      const { alerts } = evaluateMultiConditionRules([rule], [], null, new Set(), NOW);
      expect(alerts).toHaveLength(0);
    });
  });

  describe("multiple rules", () => {
    it("evaluates multiple rules independently", () => {
      const rules: AlertRule[] = [
        {
          id: "r9",
          name: "RSI BUY",
          ticker: "AAPL",
          operator: "AND",
          conditions: [{ type: "method", method: "RSI", direction: "BUY" }],
          enabled: true,
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "r10",
          name: "MACD SELL",
          ticker: "AAPL",
          operator: "AND",
          conditions: [{ type: "method", method: "MACD", direction: "SELL" }],
          enabled: true,
          createdAt: "2025-01-01T00:00:00Z",
        },
      ];

      const signals = [makeSignal("RSI", "BUY"), makeSignal("MACD", "SELL")];
      const { alerts, newFiredIds } = evaluateMultiConditionRules(
        rules,
        signals,
        null,
        new Set(),
        NOW,
      );

      expect(alerts).toHaveLength(2);
      expect(newFiredIds.has("r9")).toBe(true);
      expect(newFiredIds.has("r10")).toBe(true);
    });
  });

  describe("direction derivation", () => {
    it("derives SELL direction when majority are SELL", () => {
      const rule: AlertRule = {
        id: "r11",
        name: "Mixed",
        ticker: "AAPL",
        operator: "OR",
        conditions: [
          { type: "method", method: "RSI", direction: "SELL" },
          { type: "method", method: "MACD", direction: "SELL" },
          { type: "method", method: "Bollinger", direction: "BUY" },
        ],
        enabled: true,
        createdAt: "2025-01-01T00:00:00Z",
      };

      const signals = [makeSignal("RSI", "SELL")];
      const { alerts } = evaluateMultiConditionRules([rule], signals, null, new Set(), NOW);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]!.direction).toBe("SELL");
    });
  });
});
