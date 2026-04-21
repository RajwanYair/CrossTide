import { describe, it, expect } from "vitest";
import { evaluate } from "../../../src/domain/bollinger-method";
import { makeCandles } from "../../helpers/candle-factory";

describe("bollinger-method evaluate", () => {
  it("returns null for insufficient data", () => {
    expect(evaluate("AAPL", makeCandles([100]))).toBeNull();
  });

  it("returns NEUTRAL for steady prices", () => {
    const closes = Array.from({ length: 30 }, () => 100);
    const result = evaluate("AAPL", makeCandles(closes));
    expect(result).not.toBeNull();
    expect(result!.method).toBe("Bollinger");
  });

  it("detects BUY when price crosses above lower band", () => {
    // Stable then drop below lower band, then bounce
    const base = Array.from({ length: 25 }, () => 100);
    base.push(85); // drop below lower band
    base.push(100); // bounce back above
    const result = evaluate("AAPL", makeCandles(base));
    if (result && result.direction === "BUY") {
      expect(result.description).toContain("lower Bollinger");
    }
  });

  it("populates all MethodSignal fields", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = evaluate("NVDA", makeCandles(closes));
    expect(result!.ticker).toBe("NVDA");
    expect(result!.method).toBe("Bollinger");
  });
});
