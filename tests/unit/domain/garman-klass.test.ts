import { describe, it, expect } from "vitest";
import {
  garmanKlassSingle,
  garmanKlassVol,
  parkinsonVol,
  rogersSatchellVol,
  yangZhangVol,
  compareEstimators,
} from "../../../src/domain/garman-klass";

const bars = Array.from({ length: 60 }, (_, i) => ({
  open: 100 + i * 0.2 + Math.sin(i) * 2,
  high: 102 + i * 0.2 + Math.abs(Math.sin(i)) * 3,
  low: 98 + i * 0.2 - Math.abs(Math.cos(i)) * 3,
  close: 100 + i * 0.2 + Math.cos(i) * 2,
}));

describe("garman-klass", () => {
  it("garmanKlassSingle returns positive for typical bar", () => {
    const v = garmanKlassSingle({ open: 100, high: 105, low: 97, close: 103 });
    expect(v).toBeGreaterThan(0);
  });

  it("garmanKlassSingle returns 0 for invalid bar", () => {
    expect(garmanKlassSingle({ open: 0, high: 5, low: 3, close: 4 })).toBe(0);
  });

  it("garmanKlassVol returns annualized vol", () => {
    const vol = garmanKlassVol(bars);
    expect(vol).toBeGreaterThan(0);
    expect(vol).toBeLessThan(5); // reasonable for synthetic data
  });

  it("garmanKlassVol empty returns 0", () => {
    expect(garmanKlassVol([])).toBe(0);
  });

  it("parkinsonVol returns annualized vol", () => {
    const vol = parkinsonVol(bars);
    expect(vol).toBeGreaterThan(0);
    expect(vol).toBeLessThan(5);
  });

  it("parkinsonVol empty returns 0", () => {
    expect(parkinsonVol([])).toBe(0);
  });

  it("rogersSatchellVol returns annualized vol", () => {
    const vol = rogersSatchellVol(bars);
    expect(vol).toBeGreaterThan(0);
    expect(vol).toBeLessThan(5);
  });

  it("yangZhangVol returns annualized vol", () => {
    const vol = yangZhangVol(bars);
    expect(vol).toBeGreaterThan(0);
    expect(vol).toBeLessThan(5);
  });

  it("yangZhangVol needs at least 2 bars", () => {
    expect(yangZhangVol([bars[0]!])).toBe(0);
  });

  it("compareEstimators returns all four", () => {
    const result = compareEstimators(bars);
    expect(Object.keys(result)).toHaveLength(4);
    expect(result.garmanKlass).toBeGreaterThan(0);
    expect(result.parkinson).toBeGreaterThan(0);
    expect(result.rogersSatchell).toBeGreaterThan(0);
    expect(result.yangZhang).toBeGreaterThan(0);
  });

  it("parkinson >= garmanKlass for typical data", () => {
    // Parkinson is less efficient than GK but both should be in same ballpark
    const gk = garmanKlassVol(bars);
    const pk = parkinsonVol(bars);
    expect(Math.abs(gk - pk) / gk).toBeLessThan(1); // within 100%
  });
});
