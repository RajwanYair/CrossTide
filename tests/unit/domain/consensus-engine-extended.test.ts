/**
 * Extended consensus engine tests — edge cases and deeper coverage.
 */
import { describe, it, expect } from "vitest";
import { evaluateConsensus } from "../../../src/domain/consensus-engine";
import type { MethodSignal, MethodName } from "../../../src/types/domain";

const ALL_METHODS: MethodName[] = [
  "Micho",
  "RSI",
  "MACD",
  "Bollinger",
  "Stochastic",
  "OBV",
  "ADX",
  "CCI",
  "SAR",
  "WilliamsR",
  "MFI",
  "SuperTrend",
];

function sig(method: MethodName, direction: "BUY" | "SELL" | "NEUTRAL"): MethodSignal {
  return {
    ticker: "AAPL",
    method,
    direction,
    description: `${method} ${direction}`,
    currentClose: 150,
    evaluatedAt: "2025-01-01",
  };
}

describe("consensus-engine extended", () => {
  it("strength is 1.0 when all 12 methods BUY", () => {
    const signals = ALL_METHODS.map((m) => sig(m, "BUY"));
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("BUY");
    expect(result.strength).toBe(1);
  });

  it("strength is 1.0 when all 12 methods SELL", () => {
    const signals = ALL_METHODS.map((m) => sig(m, "SELL"));
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("SELL");
    expect(result.strength).toBe(1);
  });

  it("Micho SELL + RSI SELL = SELL direction", () => {
    const result = evaluateConsensus("AAPL", [sig("Micho", "SELL"), sig("RSI", "SELL")]);
    expect(result.direction).toBe("SELL");
    expect(result.sellMethods).toHaveLength(2);
  });

  it("NEUTRAL when Micho NEUTRAL and others BUY", () => {
    const signals = [sig("Micho", "NEUTRAL"), sig("RSI", "BUY"), sig("MACD", "BUY")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("NEUTRAL");
  });

  it("NEUTRAL when Micho BUY but no supporting secondary", () => {
    const result = evaluateConsensus("AAPL", [sig("Micho", "BUY")]);
    expect(result.direction).toBe("NEUTRAL");
  });

  it("strength is buySignals/12 when BUY", () => {
    const signals = [sig("Micho", "BUY"), sig("RSI", "BUY"), sig("MACD", "BUY")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("BUY");
    expect(result.strength).toBeCloseTo(3 / 12);
  });

  it("result contains correct ticker", () => {
    const result = evaluateConsensus("GOOG", [sig("Micho", "BUY"), sig("RSI", "BUY")]);
    expect(result.ticker).toBe("GOOG");
  });

  it("buyMethods includes only BUY signals", () => {
    const signals = [sig("Micho", "BUY"), sig("RSI", "BUY"), sig("MACD", "SELL")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.buyMethods.every((m) => m.direction === "BUY")).toBe(true);
  });

  it("sellMethods includes only SELL signals", () => {
    const signals = [sig("Micho", "SELL"), sig("RSI", "SELL"), sig("MACD", "BUY")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.sellMethods.every((m) => m.direction === "SELL")).toBe(true);
  });

  it("handles mixed signals correctly (more BUY than SELL)", () => {
    const signals = [
      sig("Micho", "BUY"),
      sig("RSI", "BUY"),
      sig("MACD", "SELL"),
      sig("Bollinger", "NEUTRAL"),
    ];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("BUY");
  });

  it("handles duplicate method signals", () => {
    const signals = [sig("Micho", "BUY"), sig("RSI", "BUY"), sig("RSI", "BUY")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("BUY");
  });
});
