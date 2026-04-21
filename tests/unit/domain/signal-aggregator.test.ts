import { describe, it, expect } from "vitest";
import { aggregateSignals, aggregateConsensus } from "../../../src/domain/signal-aggregator";
import { makeCandles } from "../../helpers/candle-factory";

describe("aggregateSignals", () => {
  it("returns empty array for insufficient data", () => {
    const signals = aggregateSignals("AAPL", makeCandles([100]));
    expect(signals).toEqual([]);
  });

  it("returns signals from detectors that have enough data", () => {
    // 20 candles — enough for SAR, SuperTrend, Williams%R, etc. but not Micho (needs 151)
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const signals = aggregateSignals("AAPL", makeCandles(closes));
    expect(signals.length).toBeGreaterThan(0);
    for (const s of signals) {
      expect(s.ticker).toBe("AAPL");
      expect(["BUY", "SELL", "NEUTRAL"]).toContain(s.direction);
    }
  });

  it("returns all 12 signals with sufficient data", () => {
    // 200 candles — enough for all detectors including Micho (151)
    const closes = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 10) * 20);
    const signals = aggregateSignals("TSLA", makeCandles(closes));
    expect(signals.length).toBe(12);
    const methods = new Set(signals.map((s) => s.method));
    expect(methods.size).toBe(12);
  });
});

describe("aggregateConsensus", () => {
  it("returns a ConsensusResult", () => {
    const closes = Array.from({ length: 200 }, (_, i) => 100 + i);
    const result = aggregateConsensus("GOOG", makeCandles(closes));
    expect(result.ticker).toBe("GOOG");
    expect(["BUY", "SELL", "NEUTRAL"]).toContain(result.direction);
    expect(result.strength).toBeGreaterThanOrEqual(0);
    expect(result.strength).toBeLessThanOrEqual(1);
  });

  it("NEUTRAL when too few candles for Micho", () => {
    // Without Micho, consensus requires Micho BUY/SELL → always NEUTRAL
    const closes = Array.from({ length: 50 }, (_, i) => 100 + i);
    const result = aggregateConsensus("SPY", makeCandles(closes));
    expect(result.direction).toBe("NEUTRAL");
  });
});
