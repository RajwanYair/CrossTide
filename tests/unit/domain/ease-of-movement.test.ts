import { describe, it, expect } from "vitest";
import { computeEaseOfMovement } from "../../../src/domain/ease-of-movement";
import type { VolumeCandle } from "../../../src/domain/klinger-oscillator";

function make(midpoints: number[], vols: number[]): VolumeCandle[] {
  return midpoints.map((m, i) => ({
    time: i,
    open: m,
    high: m + 1,
    low: m - 1,
    close: m,
    volume: vols[i] ?? 1000,
  }));
}

describe("computeEaseOfMovement", () => {
  it("empty -> empty", () => {
    expect(computeEaseOfMovement([])).toEqual([]);
  });
  it("nulls before period bars", () => {
    const out = computeEaseOfMovement(make([1, 2, 3, 4, 5], [10, 10, 10, 10, 10]), { period: 14 });
    expect(out.every((v) => v === null)).toBe(true);
  });
  it("rising midpoint with low volume -> positive EMV", () => {
    const mids = Array.from({ length: 20 }, (_, i) => 100 + i);
    const vols = Array.from({ length: 20 }, () => 100);
    const out = computeEaseOfMovement(make(mids, vols), { period: 5, scale: 100 });
    expect(out[10]!).toBeGreaterThan(0);
  });
  it("falling midpoint -> negative EMV", () => {
    const mids = Array.from({ length: 20 }, (_, i) => 100 - i);
    const vols = Array.from({ length: 20 }, () => 100);
    const out = computeEaseOfMovement(make(mids, vols), { period: 5, scale: 100 });
    expect(out[10]!).toBeLessThan(0);
  });
  it("zero range bar contributes 0 to average", () => {
    const candles: VolumeCandle[] = Array.from({ length: 10 }, (_, i) => ({
      time: i,
      open: 5,
      high: 5,
      low: 5,
      close: 5,
      volume: 100,
    }));
    const out = computeEaseOfMovement(candles, { period: 3 });
    expect(out[5]).toBe(0);
  });
});
