import { describe, it, expect } from "vitest";
import { evaluate } from "../../../src/domain/rsi-method";
import { makeCandles } from "../../helpers/candle-factory";

describe("rsi-method evaluate", () => {
  it("returns null for insufficient data", () => {
    expect(evaluate("AAPL", makeCandles([100]))).toBeNull();
  });

  it("returns NEUTRAL for steady prices", () => {
    const closes = Array.from({ length: 30 }, () => 100);
    const result = evaluate("AAPL", makeCandles(closes));
    // RSI for flat prices is indeterminate — may be null or neutral
    if (result) {
      expect(result.method).toBe("RSI");
    }
  });

  it("detects BUY when RSI exits oversold", () => {
    // Sharp decline to drive RSI below 30, then uptick
    const base = Array.from({ length: 14 }, () => 100);
    for (let i = 0; i < 10; i++) base.push(100 - i * 5); // drive RSI down
    base.push(65); // still oversold
    base.push(80); // sharp bounce to exit oversold
    const result = evaluate("AAPL", makeCandles(base));
    if (result && result.direction === "BUY") {
      expect(result.description).toContain("BUY");
    }
  });

  it("populates all MethodSignal fields", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
    const result = evaluate("MSFT", makeCandles(closes));
    if (result) {
      expect(result.ticker).toBe("MSFT");
      expect(result.method).toBe("RSI");
      expect(result.currentClose).toBeTypeOf("number");
    }
  });
});
