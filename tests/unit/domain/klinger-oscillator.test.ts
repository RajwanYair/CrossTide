import { describe, it, expect } from "vitest";
import { computeKlingerOscillator, type VolumeCandle } from "../../../src/domain/klinger-oscillator";

function make(closes: number[], vols: number[]): VolumeCandle[] {
  return closes.map((c, i) => ({ time: i, open: c, high: c + 1, low: c - 1, close: c, volume: vols[i] ?? 1000 }));
}

describe("computeKlingerOscillator", () => {
  it("empty -> empty", () => {
    expect(computeKlingerOscillator([])).toEqual([]);
  });
  it("first bar is null", () => {
    const out = computeKlingerOscillator(make([1, 2], [10, 10]));
    expect(out[0]).toBeNull();
  });
  it("returns numbers for sufficient data", () => {
    const closes = Array.from({ length: 80 }, (_, i) => 100 + Math.sin(i / 4) * 10);
    const vols = Array.from({ length: 80 }, () => 1000);
    const out = computeKlingerOscillator(make(closes, vols));
    expect(out[60]).not.toBeNull();
    expect(typeof out[60]).toBe("number");
  });
  it("custom fast/slow", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const vols = Array.from({ length: 30 }, () => 500);
    const out = computeKlingerOscillator(make(closes, vols), { fast: 5, slow: 10 });
    expect(out[15]).not.toBeNull();
  });
  it("flat HLC produces ~0 volume force (oscillator ~0)", () => {
    const closes = Array.from({ length: 30 }, () => 50);
    const vols = Array.from({ length: 30 }, () => 100);
    const out = computeKlingerOscillator(make(closes, vols), { fast: 3, slow: 5 });
    expect(Math.abs(out[20]!)).toBeLessThan(1e-6);
  });
});
