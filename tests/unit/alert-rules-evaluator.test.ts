import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ConsensusResult, MethodSignal } from "../../src/types/domain";
import { addAlertRule, loadFiredRuleIds, saveAlertRules } from "../../src/core/alert-rules-store";
import { evaluateAlertRules } from "../../src/core/alert-rules-evaluator";

function storageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

// Must mock Notification API before importing the module
vi.stubGlobal("Notification", {
  permission: "denied",
  requestPermission: vi.fn(),
});

describe("alert-rules-evaluator", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
    // Reset alert rules store cache
    saveAlertRules([]);
  });

  it("does nothing when no rules exist", () => {
    const map = new Map<string, ConsensusResult>();
    // Should not throw
    evaluateAlertRules(map);
  });

  it("evaluates a matching AND rule and persists fired ID", () => {
    addAlertRule("RSI+MACD BUY", "AAPL", "AND", [
      { type: "method", method: "RSI", direction: "BUY" },
      { type: "method", method: "MACD", direction: "BUY" },
    ]);

    const rsiSignal: MethodSignal = {
      ticker: "AAPL",
      method: "RSI",
      direction: "BUY",
      description: "RSI crossed above 30",
      currentClose: 150,
      evaluatedAt: new Date().toISOString(),
    };
    const macdSignal: MethodSignal = {
      ticker: "AAPL",
      method: "MACD",
      direction: "BUY",
      description: "MACD bullish crossover",
      currentClose: 150,
      evaluatedAt: new Date().toISOString(),
    };

    const consensus: ConsensusResult = {
      ticker: "AAPL",
      direction: "BUY",
      buyMethods: [rsiSignal, macdSignal],
      sellMethods: [],
      strength: 1.0,
    };

    const map = new Map([["AAPL", consensus]]);
    evaluateAlertRules(map);

    // Fired rule ID should be persisted
    const firedIds = loadFiredRuleIds();
    expect(firedIds.size).toBe(1);
  });

  it("does not re-fire already-fired rules", () => {
    addAlertRule("Test", "AAPL", "OR", [{ type: "method", method: "RSI", direction: "BUY" }]);

    const signal: MethodSignal = {
      ticker: "AAPL",
      method: "RSI",
      direction: "BUY",
      description: "RSI",
      currentClose: 150,
      evaluatedAt: new Date().toISOString(),
    };

    const consensus: ConsensusResult = {
      ticker: "AAPL",
      direction: "BUY",
      buyMethods: [signal],
      sellMethods: [],
      strength: 1.0,
    };

    const map = new Map([["AAPL", consensus]]);

    evaluateAlertRules(map);
    const firedAfterFirst = loadFiredRuleIds();
    expect(firedAfterFirst.size).toBe(1);

    // Run again — should not add more fired IDs
    evaluateAlertRules(map);
    const firedAfterSecond = loadFiredRuleIds();
    expect(firedAfterSecond.size).toBe(1);
  });
});
