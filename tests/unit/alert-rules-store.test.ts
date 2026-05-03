import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadAlertRules,
  saveAlertRules,
  addAlertRule,
  removeAlertRule,
  toggleAlertRule,
  loadFiredRuleIds,
  saveFiredRuleIds,
  resetFiredRule,
} from "../../src/core/alert-rules-store";

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

describe("alert-rules-store", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
    // Reset the module-level cache by saving empty array
    saveAlertRules([]);
  });

  it("returns empty array when no rules stored", () => {
    expect(loadAlertRules()).toEqual([]);
  });

  it("saves and loads rules", () => {
    const rules = [
      {
        id: "r1",
        name: "Test Rule",
        ticker: "AAPL",
        operator: "AND" as const,
        conditions: [
          { type: "method" as const, method: "RSI" as const, direction: "BUY" as const },
        ],
        enabled: true,
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ];
    saveAlertRules(rules);
    expect(loadAlertRules()).toEqual(rules);
  });

  it("addAlertRule creates a new rule with generated id", () => {
    addAlertRule("My Rule", "TSLA", "OR", [{ type: "consensus", direction: "SELL" }]);
    const rules = loadAlertRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe("My Rule");
    expect(rules[0].ticker).toBe("TSLA");
    expect(rules[0].operator).toBe("OR");
    expect(rules[0].enabled).toBe(true);
    expect(rules[0].id).toBeTruthy();
  });

  it("removeAlertRule deletes by id", () => {
    addAlertRule("A", "X", "AND", [{ type: "method", method: "MACD", direction: "BUY" }]);
    addAlertRule("B", "Y", "AND", [{ type: "method", method: "RSI", direction: "SELL" }]);
    const rules = loadAlertRules();
    expect(rules).toHaveLength(2);
    removeAlertRule(rules[0].id);
    expect(loadAlertRules()).toHaveLength(1);
    expect(loadAlertRules()[0].name).toBe("B");
  });

  it("toggleAlertRule flips enabled state", () => {
    addAlertRule("T", "Z", "AND", [{ type: "consensus", direction: "BUY" }]);
    const id = loadAlertRules()[0].id;
    expect(loadAlertRules()[0].enabled).toBe(true);
    toggleAlertRule(id);
    expect(loadAlertRules()[0].enabled).toBe(false);
    toggleAlertRule(id);
    expect(loadAlertRules()[0].enabled).toBe(true);
  });

  it("fired rule ids persist and can be reset", () => {
    expect(loadFiredRuleIds().size).toBe(0);
    saveFiredRuleIds(new Set(["r1", "r2"]));
    expect(loadFiredRuleIds()).toEqual(new Set(["r1", "r2"]));
    resetFiredRule("r1");
    expect(loadFiredRuleIds()).toEqual(new Set(["r2"]));
  });
});
