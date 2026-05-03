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
    // Micho weight=3 + 3 other methods (1 each) = 6, total weighted = 14
    expect(result.strength).toBeCloseTo(6 / 14, 5);
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

// ── G20: per-method weights ────────────────────────────────────────────────
describe("evaluateConsensus — per-method weights (G20)", () => {
  it("disabling Micho (weight=0) prevents BUY consensus", () => {
    const signals = [makeSignal("Micho", "BUY"), makeSignal("RSI", "BUY")];
    const result = evaluateConsensus("AAPL", signals, { Micho: 0 });
    expect(result.direction).toBe("NEUTRAL");
  });

  it("increasing non-Micho weight raises strength", () => {
    const signals = [makeSignal("Micho", "BUY"), makeSignal("RSI", "BUY")];
    const lowWeight = evaluateConsensus("AAPL", signals, { Micho: 3, RSI: 1 });
    const highWeight = evaluateConsensus("AAPL", signals, { Micho: 3, RSI: 3 });
    expect(highWeight.strength).toBeGreaterThan(lowWeight.strength);
  });

  it("equal weights (all=1) still requires Micho BUY for BUY consensus", () => {
    const signals = [makeSignal("Micho", "BUY"), makeSignal("RSI", "BUY")];
    const result = evaluateConsensus("AAPL", signals, {
      Micho: 1,
      RSI: 1,
      MACD: 1,
      Bollinger: 1,
      Stochastic: 1,
      OBV: 1,
      ADX: 1,
      CCI: 1,
      SAR: 1,
      WilliamsR: 1,
      MFI: 1,
      SuperTrend: 1,
    });
    expect(result.direction).toBe("BUY");
    // 1 (Micho) + 1 (RSI) = 2 / 12 = 1/6
    expect(result.strength).toBeCloseTo(2 / 12, 5);
  });

  it("default weights match original Micho=3 behavior", () => {
    const signals = [makeSignal("Micho", "BUY"), makeSignal("RSI", "BUY")];
    const withDefaults = evaluateConsensus("AAPL", signals);
    // Micho=3 + RSI=1 = 4 / 14
    expect(withDefaults.strength).toBeCloseTo(4 / 14, 5);
  });
});
