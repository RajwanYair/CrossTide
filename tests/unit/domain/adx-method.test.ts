import { describe, it, expect } from "vitest";
import { evaluate } from "../../../src/domain/adx-method";
import { makeCandles } from "../../helpers/candle-factory";

describe("adx-method evaluate", () => {
  it("returns null for insufficient data", () => {
    expect(evaluate("AAPL", makeCandles([100]))).toBeNull();
  });

  it("returns a valid signal for sufficient data", () => {
    const closes = Array.from({ length: 40 }, (_, i) => 100 + i);
    const result = evaluate("AAPL", makeCandles(closes));
    expect(result).not.toBeNull();
    expect(result!.method).toBe("ADX");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result!.direction);
  });

  it("populates all MethodSignal fields", () => {
    const closes = Array.from({ length: 40 }, (_, i) => 100 + i);
    const result = evaluate("INTC", makeCandles(closes));
    expect(result!.ticker).toBe("INTC");
    expect(result!.method).toBe("ADX");
    expect(result!.evaluatedAt).toBeTypeOf("string");
  });
});
