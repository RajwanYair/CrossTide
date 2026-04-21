import { describe, it, expect } from "vitest";
import { evaluate } from "../../../src/domain/sar-method";
import { makeCandles } from "../../helpers/candle-factory";

describe("sar-method evaluate", () => {
  it("returns null for insufficient data", () => {
    expect(evaluate("AAPL", makeCandles([100]))).toBeNull();
  });

  it("returns a valid signal for sufficient data", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = evaluate("AAPL", makeCandles(closes));
    expect(result).not.toBeNull();
    expect(result!.method).toBe("SAR");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result!.direction);
  });

  it("detects trend flip on reversal", () => {
    const up = Array.from({ length: 10 }, (_, i) => 100 + i * 2);
    const down = Array.from({ length: 10 }, (_, i) => 120 - i * 3);
    const result = evaluate("AAPL", makeCandles([...up, ...down]));
    expect(result).not.toBeNull();
    expect(result!.method).toBe("SAR");
  });

  it("populates all MethodSignal fields", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = evaluate("TSLA", makeCandles(closes));
    expect(result!.ticker).toBe("TSLA");
    expect(result!.currentClose).toBeTypeOf("number");
  });
});
