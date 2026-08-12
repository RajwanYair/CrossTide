import { describe, it, expect, beforeEach } from "vitest";
import { renderConsensus } from "../../../src/cards/consensus";
import type { ConsensusResult, MethodSignal } from "../../../src/types/domain";

function makeSignal(method: string, direction: "BUY" | "SELL" | "NEUTRAL"): MethodSignal {
  return {
    ticker: "AAPL",
    method: method as MethodSignal["method"],
    direction,
    description: `${method} ${direction.toLowerCase()} signal`,
    currentClose: 150,
    evaluatedAt: new Date().toISOString(),
  };
}

describe("renderConsensus", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("shows empty state when result is null", () => {
    renderConsensus(container, "AAPL", null);
    expect(container.innerHTML).toContain("No consensus data");
    expect(container.innerHTML).toContain("AAPL");
  });

  it("renders consensus header with direction badge", () => {
    const result: ConsensusResult = {
      ticker: "AAPL",
      direction: "BUY",
      strength: 0.75,
      buyMethods: [makeSignal("RSI", "BUY"), makeSignal("MACD", "BUY")],
      sellMethods: [],
    };
    renderConsensus(container, "AAPL", result);
    expect(container.innerHTML).toContain("AAPL");
    expect(container.innerHTML).toContain("BUY");
    expect(container.innerHTML).toContain("75%");
  });

  it("renders method cards in a grid", () => {
    const result: ConsensusResult = {
      ticker: "AAPL",
      direction: "BUY",
      strength: 0.8,
      buyMethods: [makeSignal("RSI", "BUY")],
      sellMethods: [makeSignal("MACD", "SELL")],
    };
    renderConsensus(container, "AAPL", result);
    const cards = container.querySelectorAll(".method-card");
    expect(cards.length).toBe(2);
  });

  it("shows method names and descriptions", () => {
    const result: ConsensusResult = {
      ticker: "AAPL",
      direction: "NEUTRAL",
      strength: 0.5,
      buyMethods: [makeSignal("Bollinger", "BUY")],
      sellMethods: [],
    };
    renderConsensus(container, "AAPL", result);
    expect(container.innerHTML).toContain("Bollinger");
    expect(container.innerHTML).toContain("buy signal");
  });

  it("shows indicator colors matching direction", () => {
    const result: ConsensusResult = {
      ticker: "TSLA",
      direction: "SELL",
      strength: 0.6,
      buyMethods: [],
      sellMethods: [makeSignal("RSI", "SELL")],
    };
    renderConsensus(container, "TSLA", result);
    expect(container.querySelector(".method-indicator.sell")).not.toBeNull();
  });

  it("renders calculation inputs, weights, and limitations", () => {
    const result: ConsensusResult = {
      ticker: "AAPL",
      direction: "BUY",
      strength: 0.6,
      buyMethods: [makeSignal("RSI", "BUY")],
      sellMethods: [],
      explanation: {
        evaluatedAt: "2026-08-12T12:00:00.000Z",
        inputMethods: ["RSI"],
        methodWeights: { RSI: 1.5 },
        limitations: ["Requires at least 151 candles"],
      },
    };
    renderConsensus(container, "AAPL", result);
    expect(container.querySelector(".consensus-explanation")).not.toBeNull();
    expect(container.innerHTML).toContain("Methods evaluated: 1");
    expect(container.innerHTML).toContain("RSI: 1.5");
    expect(container.innerHTML).toContain("Requires at least 151 candles");
  });

  it("shows empty methods message when no signals", () => {
    const result: ConsensusResult = {
      ticker: "AAPL",
      direction: "NEUTRAL",
      strength: 0,
      buyMethods: [],
      sellMethods: [],
    };
    renderConsensus(container, "AAPL", result);
    expect(container.innerHTML).toContain("No method signals");
  });
});
