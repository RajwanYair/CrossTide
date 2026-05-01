import { describe, it, expect } from "vitest";
import { buildSparklinePaths } from "../../../src/ui/multi-sparkline";

describe("multi-sparkline", () => {
  it("builds a path for each series", () => {
    const paths = buildSparklinePaths(
      [
        { id: "a", values: [1, 2, 3, 4] },
        { id: "b", values: [4, 3, 2, 1] },
      ],
      { width: 100, height: 50 },
    );
    expect(paths).toHaveLength(2);
    expect(paths[0].d).toMatch(/^M[\d.]+ [\d.]+ L/);
    expect(paths[1].d).toMatch(/^M/);
  });

  it("shared scale uses overall min/max", () => {
    const paths = buildSparklinePaths(
      [
        { id: "a", values: [0, 10] },
        { id: "b", values: [5, 5] },
      ],
      { width: 100, height: 100, sharedScale: true },
    );
    expect(paths[0].min).toBe(0);
    expect(paths[0].max).toBe(10);
    expect(paths[1].min).toBe(0);
    expect(paths[1].max).toBe(10);
  });

  it("independent scale uses per-series range", () => {
    const paths = buildSparklinePaths(
      [
        { id: "a", values: [0, 10] },
        { id: "b", values: [100, 200] },
      ],
      { width: 100, height: 100, sharedScale: false },
    );
    expect(paths[1].min).toBe(100);
    expect(paths[1].max).toBe(200);
  });

  it("empty values produce empty path", () => {
    const paths = buildSparklinePaths([{ id: "x", values: [] }], { width: 50, height: 50 });
    expect(paths[0].d).toBe("");
  });

  it("constant series places points at vertical midpoint", () => {
    const paths = buildSparklinePaths([{ id: "x", values: [5, 5, 5] }], {
      width: 100,
      height: 100,
      padding: 0,
    });
    expect(paths[0].d).toMatch(/M0\.00 50\.00 L/);
  });

  it("skips NaN values gracefully", () => {
    const paths = buildSparklinePaths([{ id: "x", values: [1, NaN, 3] }], {
      width: 30,
      height: 10,
      padding: 0,
    });
    expect(paths[0].d).not.toMatch(/NaN/);
  });

  it("propagates color", () => {
    const paths = buildSparklinePaths([{ id: "x", values: [1, 2], color: "red" }], {
      width: 10,
      height: 10,
    });
    expect(paths[0].color).toBe("red");
  });
});
