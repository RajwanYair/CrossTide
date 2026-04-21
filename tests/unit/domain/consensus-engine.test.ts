/**
 * Consensus Engine tests.
 * Test cases ported from Dart: test/domain/consensus_engine_test.dart
 */
import { describe, it, expect } from "vitest";
import { evaluateConsensus } from "../../../src/domain/consensus-engine";
import type { MethodSignal } from "../../../src/types/domain";

function makeSignal(
  method: MethodSignal["method"],
  direction: MethodSignal["direction"],
): MethodSignal {
  return {
    ticker: "AAPL",
    method,
    direction,
    description: `${method} ${direction}`,
    currentClose: 150,
    evaluatedAt: "2024-01-15",
  };
}

describe("evaluateConsensus", () => {
  it("returns NEUTRAL when no signals", () => {
    const result = evaluateConsensus("AAPL", []);
    expect(result.direction).toBe("NEUTRAL");
    expect(result.strength).toBe(0);
  });

  it("returns NEUTRAL when only Micho BUY (no secondary)", () => {
    const signals = [makeSignal("Micho", "BUY")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("NEUTRAL");
  });

  it("returns BUY when Micho BUY + one other BUY", () => {
    const signals = [makeSignal("Micho", "BUY"), makeSignal("RSI", "BUY")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("BUY");
    expect(result.buyMethods).toHaveLength(2);
    expect(result.strength).toBeGreaterThan(0);
  });

  it("returns SELL when Micho SELL + one other SELL", () => {
    const signals = [makeSignal("Micho", "SELL"), makeSignal("MACD", "SELL")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("SELL");
    expect(result.sellMethods).toHaveLength(2);
  });

  it("returns NEUTRAL when only secondary signals agree (no Micho)", () => {
    const signals = [
      makeSignal("RSI", "BUY"),
      makeSignal("MACD", "BUY"),
      makeSignal("Bollinger", "BUY"),
    ];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("NEUTRAL");
  });

  it("BUY takes precedence over SELL when both triggered", () => {
    // Both Micho BUY+secondary and Micho SELL+secondary
    const signals = [
      makeSignal("Micho", "BUY"),
      makeSignal("RSI", "BUY"),
      makeSignal("Micho", "SELL"),
      makeSignal("MACD", "SELL"),
    ];
    const result = evaluateConsensus("AAPL", signals);
    // The engine checks BUY first, so BUY wins
    expect(result.direction).toBe("BUY");
  });

  it("strength reflects proportion of agreeing methods", () => {
    const signals = [
      makeSignal("Micho", "BUY"),
      makeSignal("RSI", "BUY"),
      makeSignal("MACD", "BUY"),
      makeSignal("Bollinger", "BUY"),
    ];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("BUY");
    // 4 of 12 methods = 0.333...
    expect(result.strength).toBeCloseTo(4 / 12, 5);
  });

  it("ignores NEUTRAL signals", () => {
    const signals = [makeSignal("Micho", "NEUTRAL"), makeSignal("RSI", "NEUTRAL")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("NEUTRAL");
  });

  it("ticker is passed through to result", () => {
    const result = evaluateConsensus("MSFT", []);
    expect(result.ticker).toBe("MSFT");
  });
});
