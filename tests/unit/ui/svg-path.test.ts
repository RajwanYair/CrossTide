import { describe, it, expect } from "vitest";
import { buildLinePath, buildAreaPath, buildSmoothLinePath } from "../../../src/ui/svg-path";

describe("svg-path", () => {
  it("buildLinePath: empty / single -> ''", () => {
    expect(buildLinePath([])).toBe("");
    expect(buildLinePath([{ x: 1, y: 2 }])).toBe("");
  });

  it("buildLinePath: basic", () => {
    const d = buildLinePath([
      { x: 0, y: 10 },
      { x: 5, y: 20 },
      { x: 10, y: 0 },
    ]);
    expect(d).toBe("M0 10 L5 20 L10 0");
  });

  it("buildLinePath: precision strips trailing zeros", () => {
    const d = buildLinePath(
      [
        { x: 1.234567, y: 2 },
        { x: 3, y: 4 },
      ],
      { precision: 3 },
    );
    expect(d).toBe("M1.235 2 L3 4");
  });

  it("buildAreaPath: closes with baseline", () => {
    const d = buildAreaPath(
      [
        { x: 0, y: 5 },
        { x: 10, y: 15 },
      ],
      0,
    );
    expect(d).toBe("M0 0 L0 5 L10 15 L10 0 Z");
  });

  it("buildAreaPath: empty / single -> ''", () => {
    expect(buildAreaPath([], 0)).toBe("");
    expect(buildAreaPath([{ x: 1, y: 2 }], 0)).toBe("");
  });

  it("buildSmoothLinePath: < 3 points falls back", () => {
    expect(buildSmoothLinePath([])).toBe("");
    expect(
      buildSmoothLinePath([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]),
    ).toBe("M0 0 L1 1");
  });

  it("buildSmoothLinePath: produces C commands for 3+ points", () => {
    const d = buildSmoothLinePath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ]);
    expect(d.startsWith("M0 0 ")).toBe(true);
    expect(d.split(" C").length).toBe(3); // two C commands
  });

  it("buildSmoothLinePath: zero tension ~ straight lines (control points = endpoints)", () => {
    const d = buildSmoothLinePath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 0 },
      ],
      { tension: 0 },
    );
    // All y values stay zero
    expect(/[a-z\d.\-]+/i.test(d)).toBe(true);
    expect(d.includes("NaN")).toBe(false);
  });
});
