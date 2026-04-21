import { describe, it, expect } from "vitest";
import { evaluate } from "../../../src/domain/macd-method";
import { makeCandles } from "../../helpers/candle-factory";

describe("macd-method evaluate", () => {
  it("returns null for insufficient data", () => {
    expect(evaluate("AAPL", makeCandles([100]))).toBeNull();
  });

  it("returns a valid signal for sufficient data", () => {
    // 50 rising candles
    const closes = Array.from({ length: 50 }, (_, i) => 100 + i);
    const result = evaluate("AAPL", makeCandles(closes));
    expect(result).not.toBeNull();
    expect(result!.method).toBe("MACD");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result!.direction);
  });

  it("populates all MethodSignal fields", () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 + i);
    const result = evaluate("GOOG", makeCandles(closes));
    expect(result!.ticker).toBe("GOOG");
    expect(result!.currentClose).toBeTypeOf("number");
    expect(result!.evaluatedAt).toBeTypeOf("string");
  });
});
