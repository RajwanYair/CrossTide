/**
 * fast-check property tests for core indicator calculators (Q13).
 *
 * Fuzz SMA, EMA, RSI, Bollinger, and computeSmaSeries with arbitrary inputs
 * and verify mathematical invariants that must hold for all valid inputs.
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { DailyCandle } from "../../../src/types/domain";
import { computeSma, computeSmaSeries } from "../../../src/domain/sma-calculator";
import { computeRsiSeries } from "../../../src/domain/rsi-calculator";
import { computeBollingerSeries } from "../../../src/domain/bollinger-calculator";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a DailyCandle array from arbitrary close prices for property tests. */
function makeArbitraryCandles(closes: number[]): DailyCandle[] {
  // Use a fixed start date and increment days using a simple counter
  const base = new Date(2020, 0, 1);
  return closes.map((close, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const date = d.toISOString().split("T")[0]!;
    const hi = Math.max(close, close * 1.01);
    const lo = Math.min(close, close * 0.99);
    return { date, open: close, high: hi, low: lo, close, volume: 1000 };
  });
}

/** Arbitrary for a positive finite number between 1 and 1000. */
const positivePrice = fc.float({ min: 1, max: 1000, noNaN: true });

/** Arbitrary for an array of at least 1 positive price. */
function priceArray(minLen = 1, maxLen = 300) {
  return fc.array(positivePrice, { minLength: minLen, maxLength: maxLen });
}

// ── SMA property tests ────────────────────────────────────────────────────────

describe("computeSma — property tests", () => {
  it("returns null when fewer candles than period", () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 1, max: 50 })
          .chain((period) =>
            fc.tuple(
              fc.constant(period),
              fc.array(positivePrice, { minLength: 0, maxLength: period - 1 }),
            ),
          ),
        ([period, closes]) => {
          const candles = makeArbitraryCandles(closes);
          expect(computeSma(candles, period)).toBeNull();
        },
      ),
    );
  });

  it("returns a finite number when enough candles provided", () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 1, max: 50 })
          .chain((period) =>
            fc.tuple(
              fc.constant(period),
              fc.array(positivePrice, { minLength: period, maxLength: period + 50 }),
            ),
          ),
        ([period, closes]) => {
          const candles = makeArbitraryCandles(closes);
          const result = computeSma(candles, period);
          expect(result).not.toBeNull();
          expect(Number.isFinite(result)).toBe(true);
        },
      ),
    );
  });

  it("SMA of identical prices equals that price", () => {
    fc.assert(
      fc.property(positivePrice, fc.integer({ min: 1, max: 30 }), (price, period) => {
        const candles = makeArbitraryCandles(Array.from({ length: period }, () => price));
        const result = computeSma(candles, period);
        expect(result).toBeCloseTo(price, 6);
      }),
    );
  });

  it("SMA is between min and max close of the window", () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 2, max: 30 })
          .chain((period) =>
            fc.tuple(
              fc.constant(period),
              fc.array(positivePrice, { minLength: period, maxLength: period + 20 }),
            ),
          ),
        ([period, closes]) => {
          const candles = makeArbitraryCandles(closes);
          const result = computeSma(candles, period);
          if (result === null) return;
          const windowSlice = closes.slice(closes.length - period);
          const min = Math.min(...windowSlice);
          const max = Math.max(...windowSlice);
          expect(result).toBeGreaterThanOrEqual(min - 1e-9);
          expect(result).toBeLessThanOrEqual(max + 1e-9);
        },
      ),
    );
  });
});

// ── SMA series property tests ─────────────────────────────────────────────────

describe("computeSmaSeries — property tests", () => {
  it("output length equals input length", () => {
    fc.assert(
      fc.property(priceArray(1, 100), fc.integer({ min: 1, max: 20 }), (closes, period) => {
        const candles = makeArbitraryCandles(closes);
        expect(computeSmaSeries(candles, period)).toHaveLength(candles.length);
      }),
    );
  });

  it("first period-1 entries have null values", () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 2, max: 20 })
          .chain((period) =>
            fc.tuple(
              fc.constant(period),
              fc.array(positivePrice, { minLength: period, maxLength: period + 30 }),
            ),
          ),
        ([period, closes]) => {
          const candles = makeArbitraryCandles(closes);
          const series = computeSmaSeries(candles, period);
          for (let i = 0; i < period - 1; i++) {
            expect(series[i]!.value).toBeNull();
          }
        },
      ),
    );
  });
});

// ── RSI property tests ────────────────────────────────────────────────────────

describe("computeRsiSeries — property tests", () => {
  it("output length equals input length", () => {
    fc.assert(
      fc.property(priceArray(2, 100), (closes) => {
        const candles = makeArbitraryCandles(closes);
        expect(computeRsiSeries(candles)).toHaveLength(candles.length);
      }),
    );
  });

  it("all non-null RSI values are in [0, 100]", () => {
    fc.assert(
      fc.property(priceArray(20, 200), (closes) => {
        const candles = makeArbitraryCandles(closes);
        const series = computeRsiSeries(candles);
        for (const point of series) {
          if (point.value !== null) {
            expect(point.value).toBeGreaterThanOrEqual(0 - 1e-9);
            expect(point.value).toBeLessThanOrEqual(100 + 1e-9);
          }
        }
      }),
    );
  });

  it("constant price series produces RSI of 100 (no losses)", () => {
    fc.assert(
      fc.property(positivePrice, fc.integer({ min: 20, max: 30 }), (price, len) => {
        const closes = Array.from({ length: len }, () => price);
        const candles = makeArbitraryCandles(closes);
        const series = computeRsiSeries(candles, 14);
        const nonNull = series.filter((p) => p.value !== null);
        for (const p of nonNull) {
          // All gains, no losses → RS is undefined → RSI = 100
          expect(p.value).toBe(100);
        }
      }),
    );
  });
});

// ── Bollinger Bands property tests ────────────────────────────────────────────

describe("computeBollingerSeries — property tests", () => {
  it("output length equals input length", () => {
    fc.assert(
      fc.property(priceArray(1, 100), (closes) => {
        const candles = makeArbitraryCandles(closes);
        expect(computeBollingerSeries(candles)).toHaveLength(candles.length);
      }),
    );
  });

  it("upper >= middle >= lower for all non-null values", () => {
    fc.assert(
      fc.property(priceArray(25, 200), (closes) => {
        const candles = makeArbitraryCandles(closes);
        const series = computeBollingerSeries(candles, 20, 2);
        for (const p of series) {
          if (p.upper !== null && p.middle !== null && p.lower !== null) {
            expect(p.upper).toBeGreaterThanOrEqual(p.middle - 1e-9);
            expect(p.middle).toBeGreaterThanOrEqual(p.lower - 1e-9);
          }
        }
      }),
    );
  });

  it("bandwidth is non-negative for all non-null values", () => {
    fc.assert(
      fc.property(priceArray(25, 150), (closes) => {
        const candles = makeArbitraryCandles(closes);
        const series = computeBollingerSeries(candles, 20, 2);
        for (const p of series) {
          if (p.bandwidth !== null) {
            expect(p.bandwidth).toBeGreaterThanOrEqual(-1e-9);
          }
        }
      }),
    );
  });

  it("bands are symmetric around middle (upper - middle ≈ middle - lower)", () => {
    fc.assert(
      fc.property(priceArray(25, 100), (closes) => {
        const candles = makeArbitraryCandles(closes);
        const series = computeBollingerSeries(candles, 20, 2);
        for (const p of series) {
          if (p.upper !== null && p.middle !== null && p.lower !== null) {
            const halfWidth = p.upper - p.middle;
            const halfWidthLow = p.middle - p.lower;
            expect(Math.abs(halfWidth - halfWidthLow)).toBeLessThan(1e-6);
          }
        }
      }),
    );
  });

  it("constant price series has zero bandwidth", () => {
    fc.assert(
      fc.property(positivePrice, fc.integer({ min: 25, max: 40 }), (price, len) => {
        const closes = Array.from({ length: len }, () => price);
        const candles = makeArbitraryCandles(closes);
        const series = computeBollingerSeries(candles, 20, 2);
        for (const p of series) {
          if (p.bandwidth !== null) {
            expect(p.bandwidth).toBeCloseTo(0, 6);
          }
        }
      }),
    );
  });
});
