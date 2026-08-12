/**
 * Integration-style test: signal aggregator + consensus across various scenarios.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { aggregateSignals, aggregateConsensus } from "../../../src/domain/signal-aggregator";
import { makeCandles } from "../../helpers/candle-factory";

describe("signal-aggregator extended", () => {
  it("returns 0 signals for empty candles", () => {
    const signals = aggregateSignals("AAPL", []);
    expect(signals).toEqual([]);
  });

  it("all signals have the correct ticker", () => {
    const closes = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 10) * 20);
    const signals = aggregateSignals("GOOG", makeCandles(closes));
    for (const s of signals) {
      expect(s.ticker).toBe("GOOG");
    }
  });

  it("all signals have valid direction", () => {
    const closes = Array.from({ length: 200 }, (_, i) => 100 + i);
    const signals = aggregateSignals("SPY", makeCandles(closes));
    for (const s of signals) {
      expect(["BUY", "SELL", "NEUTRAL"]).toContain(s.direction);
    }
  });

  it("aggregateConsensus strength is 0-1", () => {
    const closes = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 10) * 20);
    const result = aggregateConsensus("AAPL", makeCandles(closes));
    expect(result.strength).toBeGreaterThanOrEqual(0);
    expect(result.strength).toBeLessThanOrEqual(1);
  });

  it("aggregateConsensus returns NEUTRAL for only a few candles", () => {
    const closes = Array.from({ length: 10 }, (_, i) => 100 + i);
    const result = aggregateConsensus("AAPL", makeCandles(closes));
    expect(result.direction).toBe("NEUTRAL");
  });

  it("12 signals when sufficient data for all methods", () => {
    const closes = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 10) * 20);
    const signals = aggregateSignals("AAPL", makeCandles(closes));
    expect(signals).toHaveLength(12);
    const methods = new Set(signals.map((s) => s.method));
    expect(methods.size).toBe(12);
  });

  it("evaluatedAt is populated on all signals", () => {
    const closes = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 10) * 20);
    const signals = aggregateSignals("AAPL", makeCandles(closes));
    for (const s of signals) {
      expect(s.evaluatedAt).toBeTypeOf("string");
      expect(s.evaluatedAt.length).toBeGreaterThan(0);
    }
  });

  it("keeps consensus strength finite and explanation methods aligned", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 151, maxLength: 220 }),
        (increments) => {
          let price = 100;
          const closes = increments.map((increment) => {
            price += increment - 50;
            return Math.max(1, price);
          });
          const signals = aggregateSignals("TEST", makeCandles(closes));
          const result = aggregateConsensus("TEST", makeCandles(closes));
          const methods = signals.map((signal) => signal.method);

          expect(Number.isFinite(result.strength)).toBe(true);
          expect(result.strength).toBeGreaterThanOrEqual(0);
          expect(result.strength).toBeLessThanOrEqual(1);
          expect(result.explanation.inputMethods).toEqual(methods);
        },
      ),
    );
  });
});
