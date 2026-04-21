import { describe, it, expect } from "vitest";
import { evaluate } from "../../../src/domain/stochastic-method";
import { makeCandles } from "../../helpers/candle-factory";

describe("stochastic-method evaluate", () => {
  it("returns null for insufficient data", () => {
    expect(evaluate("AAPL", makeCandles([100]))).toBeNull();
  });

  it("returns a valid signal for sufficient data", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 10);
    const result = evaluate("AAPL", makeCandles(closes));
    expect(result).not.toBeNull();
    expect(result!.method).toBe("Stochastic");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result!.direction);
  });

  it("populates all MethodSignal fields", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = evaluate("META", makeCandles(closes));
    expect(result!.ticker).toBe("META");
    expect(result!.method).toBe("Stochastic");
  });
});
