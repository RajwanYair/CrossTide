import { describe, it, expect } from "vitest";
import { computeHeatmap, heatmapColor, type HeatmapItem } from "../../../src/cards/heatmap-layout";

const BOUNDS = { x: 0, y: 0, width: 100, height: 100 };

describe("computeHeatmap", () => {
  it("returns empty for empty input", () => {
    expect(computeHeatmap([], BOUNDS)).toEqual([]);
  });

  it("returns empty for zero bounds", () => {
    const items: HeatmapItem[] = [{ ticker: "A", weight: 1, changePct: 0 }];
    expect(computeHeatmap(items, { x: 0, y: 0, width: 0, height: 100 })).toEqual([]);
  });

  it("filters non-positive weights", () => {
    const items: HeatmapItem[] = [
      { ticker: "A", weight: 1, changePct: 0 },
      { ticker: "B", weight: 0, changePct: 0 },
      { ticker: "C", weight: -1, changePct: 0 },
    ];
    const r = computeHeatmap(items, BOUNDS);
    expect(r.every((x) => x.ticker === "A")).toBe(true);
  });

  it("conserves total area within rounding", () => {
    const items: HeatmapItem[] = [
      { ticker: "A", weight: 50, changePct: 1 },
      { ticker: "B", weight: 30, changePct: -1 },
      { ticker: "C", weight: 20, changePct: 0 },
    ];
    const r = computeHeatmap(items, BOUNDS);
    const totalArea = r.reduce((s, x) => s + x.w * x.h, 0);
    expect(totalArea).toBeCloseTo(100 * 100, 1);
  });

  it("emits rects within bounds", () => {
    const items: HeatmapItem[] = [
      { ticker: "A", weight: 10, changePct: 1 },
      { ticker: "B", weight: 5, changePct: 1 },
      { ticker: "C", weight: 3, changePct: 1 },
      { ticker: "D", weight: 2, changePct: 1 },
    ];
    const r = computeHeatmap(items, BOUNDS);
    for (const rect of r) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.w).toBeLessThanOrEqual(100 + 1e-6);
      expect(rect.y + rect.h).toBeLessThanOrEqual(100 + 1e-6);
    }
  });

  it("returns one rect per positive item", () => {
    const items: HeatmapItem[] = [
      { ticker: "A", weight: 10, changePct: 1 },
      { ticker: "B", weight: 5, changePct: 1 },
    ];
    expect(computeHeatmap(items, BOUNDS)).toHaveLength(2);
  });
});

describe("heatmapColor", () => {
  it("returns green hue for gains", () => {
    expect(heatmapColor(2)).toMatch(/hsl\(140 /);
  });

  it("returns red hue for losses", () => {
    expect(heatmapColor(-2)).toMatch(/hsl\(0 /);
  });

  it("clamps to ±5", () => {
    expect(heatmapColor(20)).toBe(heatmapColor(5));
    expect(heatmapColor(-20)).toBe(heatmapColor(-5));
  });
});
