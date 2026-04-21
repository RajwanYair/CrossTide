import { describe, it, expect } from "vitest";
import { evaluate } from "../../../src/domain/micho-method";
import { makeCandles } from "../../helpers/candle-factory";

describe("micho-method evaluate", () => {
  it("returns null for insufficient data", () => {
    expect(evaluate("AAPL", makeCandles([100]))).toBeNull();
  });

  it("returns NEUTRAL when no crossover", () => {
    // Steadily rising prices well above SMA150
    const closes = Array.from({ length: 200 }, (_, i) => 100 + i);
    const result = evaluate("AAPL", makeCandles(closes));
    expect(result).not.toBeNull();
    expect(result!.method).toBe("Micho");
    expect(result!.direction).toBe("NEUTRAL");
  });

  it("returns BUY on cross-up near MA150", () => {
    // Build 150 candles at 100, then one just above SMA150
    const base = Array.from({ length: 150 }, () => 100);
    base.push(101); // cross above — SMA150 ≈ 100, close just above
    const result = evaluate("AAPL", makeCandles(base));
    expect(result).not.toBeNull();
    expect(result!.direction).toBe("BUY");
    expect(result!.description).toContain("BUY");
  });

  it("returns SELL on cross-down", () => {
    // Build 150 candles at 100, then one below SMA150
    const base = Array.from({ length: 150 }, () => 100);
    base.push(98); // cross below — SMA150 ≈ 100, close below
    const result = evaluate("AAPL", makeCandles(base));
    expect(result).not.toBeNull();
    expect(result!.direction).toBe("SELL");
    expect(result!.description).toContain("SELL");
  });

  it("populates all MethodSignal fields", () => {
    const closes = Array.from({ length: 200 }, (_, i) => 100 + i);
    const result = evaluate("TSLA", makeCandles(closes));
    expect(result!.ticker).toBe("TSLA");
    expect(result!.method).toBe("Micho");
    expect(result!.currentClose).toBeTypeOf("number");
    expect(result!.evaluatedAt).toBeTypeOf("string");
  });
});
