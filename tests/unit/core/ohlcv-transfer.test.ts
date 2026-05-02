import { describe, it, expect } from "vitest";
import { candlesToBuffer, bufferToCandles, OHLCV_STRIDE } from "../../../src/core/ohlcv-transfer";
import type { DailyCandle } from "../../../src/types/domain";

const SAMPLE: DailyCandle[] = [
  { date: "2024-01-02", open: 100, high: 110, low: 95, close: 105, volume: 1_000_000 },
  { date: "2024-01-03", open: 105, high: 112, low: 102, close: 108, volume: 1_200_000 },
  { date: "2024-01-04", open: 108, high: 115, low: 107, close: 113, volume: 900_000 },
];

describe("candlesToBuffer", () => {
  it("produces a buffer with length = candles × OHLCV_STRIDE", () => {
    const buf = candlesToBuffer(SAMPLE);
    expect(buf).toBeInstanceOf(Float64Array);
    expect(buf.length).toBe(SAMPLE.length * OHLCV_STRIDE);
  });

  it("packs OHLCV values in the correct slots", () => {
    const buf = candlesToBuffer(SAMPLE);
    const [c] = SAMPLE;
    expect(buf[0]).toBe(Date.parse(c!.date));
    expect(buf[1]).toBe(c!.open);
    expect(buf[2]).toBe(c!.high);
    expect(buf[3]).toBe(c!.low);
    expect(buf[4]).toBe(c!.close);
    expect(buf[5]).toBe(c!.volume);
  });

  it("returns empty buffer for empty input", () => {
    const buf = candlesToBuffer([]);
    expect(buf.length).toBe(0);
  });
});

describe("bufferToCandles", () => {
  it("round-trips DailyCandle[] → buffer → DailyCandle[]", () => {
    const buf = candlesToBuffer(SAMPLE);
    const result = bufferToCandles(buf);
    expect(result).toHaveLength(SAMPLE.length);
    for (let i = 0; i < SAMPLE.length; i++) {
      expect(result[i]!.date).toBe(SAMPLE[i]!.date);
      expect(result[i]!.open).toBeCloseTo(SAMPLE[i]!.open, 10);
      expect(result[i]!.high).toBeCloseTo(SAMPLE[i]!.high, 10);
      expect(result[i]!.low).toBeCloseTo(SAMPLE[i]!.low, 10);
      expect(result[i]!.close).toBeCloseTo(SAMPLE[i]!.close, 10);
      expect(result[i]!.volume).toBeCloseTo(SAMPLE[i]!.volume, 10);
    }
  });

  it("returns empty array for empty buffer", () => {
    expect(bufferToCandles(new Float64Array(0))).toEqual([]);
  });

  it("preserves date as YYYY-MM-DD string", () => {
    const buf = candlesToBuffer(SAMPLE);
    const result = bufferToCandles(buf);
    expect(result[0]!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result[0]!.date).toBe("2024-01-02");
  });
});

describe("G4 extended: Transferable buffer properties", () => {
  it("OHLCV_STRIDE is exactly 6", () => {
    expect(OHLCV_STRIDE).toBe(6);
  });

  it("buffer has an ArrayBuffer backing (suitable for Transferable postMessage)", () => {
    const buf = candlesToBuffer(SAMPLE);
    expect(buf.buffer).toBeInstanceOf(ArrayBuffer);
    expect(buf.buffer.byteLength).toBe(SAMPLE.length * OHLCV_STRIDE * 8);
  });

  it("ignores trailing partial stride in bufferToCandles (length % 6 !== 0)", () => {
    const partial = new Float64Array(7); // 1 full candle (6 slots) + 1 extra
    const result = bufferToCandles(partial);
    expect(result).toHaveLength(1);
  });

  it("handles single candle round-trip", () => {
    const single: DailyCandle[] = [
      { date: "2025-03-15", open: 200, high: 210, low: 195, close: 205, volume: 500_000 },
    ];
    const result = bufferToCandles(candlesToBuffer(single));
    expect(result).toHaveLength(1);
    expect(result[0]!.close).toBe(205);
    expect(result[0]!.date).toBe("2025-03-15");
  });

  it("preserves large volume (9e12) without float64 precision loss", () => {
    const c: DailyCandle[] = [
      { date: "2025-01-01", open: 1, high: 2, low: 0.5, close: 1.5, volume: 9_000_000_000_000 },
    ];
    expect(bufferToCandles(candlesToBuffer(c))[0]!.volume).toBe(9_000_000_000_000);
  });

  it("preserves fractional prices (>2 decimal places)", () => {
    const c: DailyCandle[] = [
      {
        date: "2025-01-01",
        open: 123.456789,
        high: 130.111,
        low: 120.009,
        close: 125.678,
        volume: 1,
      },
    ];
    const result = bufferToCandles(candlesToBuffer(c));
    expect(result[0]!.open).toBeCloseTo(123.456789, 8);
  });

  it("preserves ordering of multiple candles (oldest-first)", () => {
    const ordered: DailyCandle[] = [
      { date: "2025-01-01", open: 10, high: 11, low: 9, close: 10.5, volume: 100 },
      { date: "2025-01-02", open: 10.5, high: 12, low: 10, close: 11, volume: 200 },
      { date: "2025-01-03", open: 11, high: 13, low: 10.5, close: 12, volume: 300 },
    ];
    const result = bufferToCandles(candlesToBuffer(ordered));
    expect(result.map((c) => c.date)).toEqual(["2025-01-01", "2025-01-02", "2025-01-03"]);
  });
});
