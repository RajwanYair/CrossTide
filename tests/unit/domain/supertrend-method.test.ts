import { describe, it, expect } from "vitest";
import { evaluate } from "../../../src/domain/supertrend-method";
import { makeCandles } from "../../helpers/candle-factory";

describe("supertrend-method evaluate", () => {
  it("returns null for insufficient data", () => {
    expect(evaluate("AAPL", makeCandles([100]))).toBeNull();
  });

  it("returns a valid signal for sufficient data", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = evaluate("AAPL", makeCandles(closes));
    expect(result).not.toBeNull();
    expect(result!.method).toBe("SuperTrend");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result!.direction);
  });

  it("populates all MethodSignal fields", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = evaluate("COIN", makeCandles(closes));
    expect(result!.ticker).toBe("COIN");
    expect(result!.method).toBe("SuperTrend");
    expect(result!.evaluatedAt).toBeTypeOf("string");
  });
});
