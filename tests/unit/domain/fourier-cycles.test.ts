import { describe, it, expect } from "vitest";
import {
  dft,
  dominantCycles,
  spectralDensity,
  reconstructSignal,
  cyclePhaseEstimate,
} from "../../../src/domain/fourier-cycles";

// Generate a signal with known 20-bar and 50-bar cycles
const n = 200;
const series = Array.from(
  { length: n },
  (_, t) => 100 + 5 * Math.sin((2 * Math.PI * t) / 20) + 3 * Math.sin((2 * Math.PI * t) / 50),
);

describe("fourier-cycles", () => {
  it("dft returns components sorted by power", () => {
    const components = dft(series);
    expect(components.length).toBeGreaterThan(0);
    for (let i = 1; i < components.length; i++) {
      expect(components[i]!.power).toBeLessThanOrEqual(components[i - 1]!.power);
    }
  });

  it("dft detects 20-bar cycle as dominant", () => {
    const components = dft(series);
    // The strongest component should have period ~20
    expect(components[0]!.period).toBeCloseTo(20, 0);
  });

  it("dft detects 50-bar cycle as second", () => {
    const components = dft(series);
    expect(components[1]!.period).toBeCloseTo(50, 0);
  });

  it("dft returns empty for short series", () => {
    expect(dft([1, 2, 3])).toEqual([]);
  });

  it("dominantCycles returns top N", () => {
    const top = dominantCycles(series, 3);
    expect(top).toHaveLength(3);
  });

  it("dominantCycles default is 5", () => {
    const top = dominantCycles(series);
    expect(top).toHaveLength(5);
  });

  it("spectralDensity sorted by period ascending", () => {
    const sd = spectralDensity(series);
    for (let i = 1; i < sd.length; i++) {
      expect(sd[i]!.period).toBeGreaterThanOrEqual(sd[i - 1]!.period);
    }
  });

  it("reconstructSignal has same length as input", () => {
    const recon = reconstructSignal(series, 2);
    expect(recon).toHaveLength(n);
  });

  it("reconstructSignal approximates original for pure signal", () => {
    const recon = reconstructSignal(series, 2);
    // Should closely match since signal only has 2 cycles
    const mse = recon.reduce((s, v, i) => s + (v - series[i]!) ** 2, 0) / n;
    expect(mse).toBeLessThan(10); // reasonable approximation
  });

  it("cyclePhaseEstimate returns value in [0, 1]", () => {
    const phase = cyclePhaseEstimate(series);
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThanOrEqual(1);
  });

  it("dft amplitudes match input magnitudes", () => {
    const components = dft(series);
    // 20-bar cycle has amplitude 5
    expect(components[0]!.amplitude).toBeCloseTo(5, 0);
    // 50-bar cycle has amplitude 3
    expect(components[1]!.amplitude).toBeCloseTo(3, 0);
  });
});
