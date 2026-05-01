import { describe, it, expect } from "vitest";
import {
  createAlertState,
  evaluateAlerts,
  DEFAULT_ENABLED_ALERTS,
  type AlertType,
  type TickerAlertState,
} from "../../../src/domain/alert-state-machine";
import type { ConsensusResult, MethodSignal } from "../../../src/types/domain";

function sig(method: string, direction: "BUY" | "SELL" | "NEUTRAL"): MethodSignal {
  return {
    ticker: "AAPL",
    method: method as MethodSignal["method"],
    direction,
    description: `${direction} ${method}`,
    currentClose: 150,
    evaluatedAt: "2024-01-15",
  };
}

describe("createAlertState", () => {
  it("creates fresh state", () => {
    const state = createAlertState("AAPL");
    expect(state.ticker).toBe("AAPL");
    expect(state.firedAlerts.size).toBe(0);
    expect(state.lastEvaluatedAt).toBeNull();
  });
});

describe("evaluateAlerts", () => {
  it("fires BUY alert on first evaluation", () => {
    const state = createAlertState("AAPL");
    const { alerts, nextState } = evaluateAlerts(
      state,
      [sig("Micho", "BUY")],
      null,
      DEFAULT_ENABLED_ALERTS,
      "2024-01-15",
    );
    expect(alerts.length).toBe(1);
    expect(alerts[0]!.alertType).toBe("michoMethodBuy");
    expect(alerts[0]!.direction).toBe("BUY");
    expect(nextState.firedAlerts.has("michoMethodBuy")).toBe(true);
  });

  it("does not fire same BUY alert twice", () => {
    const state = createAlertState("AAPL");
    const { nextState } = evaluateAlerts(
      state,
      [sig("Micho", "BUY")],
      null,
      DEFAULT_ENABLED_ALERTS,
      "2024-01-15",
    );
    const { alerts } = evaluateAlerts(
      nextState,
      [sig("Micho", "BUY")],
      null,
      DEFAULT_ENABLED_ALERTS,
      "2024-01-16",
    );
    expect(alerts.length).toBe(0);
  });

  it("resets BUY when SELL fires", () => {
    const state = createAlertState("AAPL");
    const { nextState: s1 } = evaluateAlerts(
      state,
      [sig("Micho", "BUY")],
      null,
      DEFAULT_ENABLED_ALERTS,
      "2024-01-15",
    );
    const { nextState: s2 } = evaluateAlerts(
      s1,
      [sig("Micho", "SELL")],
      null,
      DEFAULT_ENABLED_ALERTS,
      "2024-01-16",
    );
    expect(s2.firedAlerts.has("michoMethodSell")).toBe(true);
    expect(s2.firedAlerts.has("michoMethodBuy")).toBe(false);
    // BUY can fire again now
    const { alerts } = evaluateAlerts(
      s2,
      [sig("Micho", "BUY")],
      null,
      DEFAULT_ENABLED_ALERTS,
      "2024-01-17",
    );
    expect(alerts.length).toBe(1);
  });

  it("NEUTRAL resets both sides", () => {
    const state = createAlertState("AAPL");
    const { nextState: s1 } = evaluateAlerts(
      state,
      [sig("RSI", "BUY")],
      null,
      DEFAULT_ENABLED_ALERTS,
      "2024-01-15",
    );
    const { nextState: s2 } = evaluateAlerts(
      s1,
      [sig("RSI", "NEUTRAL")],
      null,
      DEFAULT_ENABLED_ALERTS,
      "2024-01-16",
    );
    expect(s2.firedAlerts.has("rsiMethodBuy")).toBe(false);
    expect(s2.firedAlerts.has("rsiMethodSell")).toBe(false);
  });

  it("fires consensus BUY alert", () => {
    const consensus: ConsensusResult = {
      ticker: "AAPL",
      direction: "BUY",
      buyMethods: [],
      sellMethods: [],
      strength: 0.5,
    };
    const state = createAlertState("AAPL");
    const { alerts } = evaluateAlerts(state, [], consensus, DEFAULT_ENABLED_ALERTS, "2024-01-15");
    expect(alerts.length).toBe(1);
    expect(alerts[0]!.alertType).toBe("consensusBuy");
  });

  it("skips alerts not in enabled set", () => {
    const state = createAlertState("AAPL");
    const enabled = new Set<AlertType>(["rsiMethodBuy"]);
    const { alerts } = evaluateAlerts(
      state,
      [sig("Micho", "BUY"), sig("RSI", "BUY")],
      null,
      enabled,
      "2024-01-15",
    );
    expect(alerts.length).toBe(1);
    expect(alerts[0]!.alertType).toBe("rsiMethodBuy");
  });

  it("updates lastEvaluatedAt", () => {
    const state = createAlertState("AAPL");
    const { nextState } = evaluateAlerts(
      state,
      [],
      null,
      DEFAULT_ENABLED_ALERTS,
      "2024-01-15T10:00:00Z",
    );
    expect(nextState.lastEvaluatedAt).toBe("2024-01-15T10:00:00Z");
  });

  it("handles multiple signals in one pass", () => {
    const state = createAlertState("AAPL");
    const { alerts } = evaluateAlerts(
      state,
      [sig("Micho", "BUY"), sig("RSI", "SELL"), sig("MACD", "BUY")],
      null,
      DEFAULT_ENABLED_ALERTS,
      "2024-01-15",
    );
    expect(alerts.length).toBe(3);
    const types = alerts.map((a) => a.alertType);
    expect(types).toContain("michoMethodBuy");
    expect(types).toContain("rsiMethodSell");
    expect(types).toContain("macdMethodBuy");
  });
});
