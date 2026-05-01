/**
 * Extended alert state machine tests.
 * API: createAlertState(ticker) → TickerAlertState
 *      evaluateAlerts(state, signals, consensus, enabledAlerts?, now?) → { alerts, nextState }
 */
import { describe, it, expect } from "vitest";
import {
  createAlertState,
  evaluateAlerts,
  DEFAULT_ENABLED_ALERTS,
  type AlertType,
} from "../../../src/domain/alert-state-machine";
import type { MethodSignal, ConsensusResult } from "../../../src/types/domain";

function sig(method: string, direction: "BUY" | "SELL" | "NEUTRAL"): MethodSignal {
  return {
    ticker: "AAPL",
    method: method as MethodSignal["method"],
    direction,
    description: `${method} ${direction}`,
    currentClose: 150,
    evaluatedAt: new Date().toISOString(),
  };
}

function consensus(direction: "BUY" | "SELL" | "NEUTRAL", strength = 0.8): ConsensusResult {
  return { direction, strength, signals: [] };
}

describe("alert-state-machine extended", () => {
  it("creates initial state with empty firedAlerts set", () => {
    const state = createAlertState("AAPL");
    expect(state.firedAlerts.size).toBe(0);
    expect(state.ticker).toBe("AAPL");
    expect(state.lastEvaluatedAt).toBeNull();
  });

  it("state is immutable — new nextState returned on each evaluation", () => {
    const s1 = createAlertState("AAPL");
    const { nextState } = evaluateAlerts(s1, [sig("RSI", "BUY")], null);
    expect(s1).not.toBe(nextState);
  });

  it("fires alert when method transitions to BUY", () => {
    const s1 = createAlertState("AAPL");
    const { alerts } = evaluateAlerts(s1, [sig("RSI", "BUY")], null);
    const rsiBuy = alerts.find((a) => a.alertType === "rsiMethodBuy");
    expect(rsiBuy).toBeDefined();
    expect(rsiBuy!.direction).toBe("BUY");
  });

  it("does not fire for disabled alert types", () => {
    const s1 = createAlertState("AAPL");
    const enabled = new Set<AlertType>(); // nothing enabled
    const { alerts } = evaluateAlerts(s1, [sig("RSI", "BUY")], null, enabled);
    expect(alerts).toEqual([]);
  });

  it("fires consensus alert when consensus direction is BUY", () => {
    const s1 = createAlertState("AAPL");
    const { alerts } = evaluateAlerts(s1, [], consensus("BUY"), DEFAULT_ENABLED_ALERTS);
    const consensusAlerts = alerts.filter((a) => a.alertType === "consensusBuy");
    expect(consensusAlerts.length).toBe(1);
  });

  it("updates lastEvaluatedAt timestamp", () => {
    const s1 = createAlertState("AAPL");
    const { nextState } = evaluateAlerts(s1, [sig("RSI", "NEUTRAL")], null);
    expect(nextState.lastEvaluatedAt).toBeTypeOf("string");
    expect(nextState.lastEvaluatedAt!.length).toBeGreaterThan(0);
  });

  it("handles empty signal list", () => {
    const s1 = createAlertState("AAPL");
    const { alerts } = evaluateAlerts(s1, [], null);
    expect(alerts).toEqual([]);
  });

  it("handles multiple signals in same pass", () => {
    const s1 = createAlertState("AAPL");
    const signals = [sig("RSI", "BUY"), sig("MACD", "SELL"), sig("Bollinger", "NEUTRAL")];
    const { alerts } = evaluateAlerts(s1, signals, null);
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("does not re-fire same alert type on consecutive evaluations", () => {
    const s1 = createAlertState("AAPL");
    const { nextState: s2 } = evaluateAlerts(s1, [sig("RSI", "BUY")], null);
    const { alerts: secondAlerts } = evaluateAlerts(s2, [sig("RSI", "BUY")], null);
    const rsiBuy = secondAlerts.filter((a) => a.alertType === "rsiMethodBuy");
    expect(rsiBuy.length).toBe(0);
  });
});
