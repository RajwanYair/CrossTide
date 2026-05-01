import { describe, it, expect } from "vitest";
import {
  interpolateColor,
  createColorScale,
  createDivergentScale,
} from "../../../src/ui/color-scale";

describe("color-scale", () => {
  const stops = [
    { position: 0, rgb: [0, 0, 0] as [number, number, number] },
    { position: 1, rgb: [255, 255, 255] as [number, number, number] },
  ];

  it("clamps below domain", () => {
    expect(interpolateColor(-1, stops)).toEqual([0, 0, 0]);
  });

  it("clamps above domain", () => {
    expect(interpolateColor(2, stops)).toEqual([255, 255, 255]);
  });

  it("midpoint interpolates linearly", () => {
    const c = interpolateColor(0.5, stops);
    expect(c[0]).toBeCloseTo(127.5, 4);
  });

  it("empty stops returns black", () => {
    expect(interpolateColor(0.5, [])).toEqual([0, 0, 0]);
  });

  it("createColorScale maps domain", () => {
    const s = createColorScale(0, 100, { stops });
    expect(s.rgb(50)[0]).toBeCloseTo(127.5, 4);
  });

  it("css output is rgb() string with rounded ints", () => {
    const s = createColorScale(0, 1, { stops });
    expect(s.css(0.5)).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it("zero-span domain returns midpoint color", () => {
    const s = createColorScale(5, 5, { stops });
    expect(s.rgb(5)[0]).toBeCloseTo(127.5, 4);
  });

  it("divergent scale: 0 -> middle, +absMax -> green", () => {
    const s = createDivergentScale(10);
    const [r, , b] = s.rgb(10);
    expect(r).toBeLessThan(100); // not red
    expect(b).toBeLessThan(100);
    const [r2] = s.rgb(-10);
    expect(r2).toBeGreaterThan(150); // red
  });
});
