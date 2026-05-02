/**
 * Tests for G22: Correlation Heatmap render-data helpers.
 */
import { describe, it, expect } from "vitest";
import {
  rToHslColor,
  buildHeatmapRenderData,
  sliceCorrelationResult,
} from "../../../src/domain/correlation-heatmap";
import { correlationMatrix } from "../../../src/domain/correlation-matrix";

// ─────────────────────────── rToHslColor ─────────────────────────────────────

describe("rToHslColor", () => {
  it("r=1 → red family (hue 0)", () => {
    expect(rToHslColor(1)).toMatch(/^hsl\(0,/);
  });

  it("r=-1 → blue family (hue 220)", () => {
    expect(rToHslColor(-1)).toMatch(/^hsl\(220,/);
  });

  it("r=0 → near-white (0% saturation)", () => {
    const color = rToHslColor(0);
    expect(color).toContain("0%");
  });

  it("r=0.5 → moderate red", () => {
    const color = rToHslColor(0.5);
    expect(color).toMatch(/^hsl\(0,/);
    expect(color).not.toContain("80%"); // not full saturation
  });

  it("clamps r > 1 to r=1", () => {
    expect(rToHslColor(2)).toBe(rToHslColor(1));
  });

  it("clamps r < -1 to r=-1", () => {
    expect(rToHslColor(-2)).toBe(rToHslColor(-1));
  });
});

// ─────────────────────────── buildHeatmapRenderData ──────────────────────────

const SERIES = [
  { id: "AAPL", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: "MSFT", values: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] },
  { id: "RAND", values: [1, -1, 1, -1, 1, -1, 1, -1, 1, -1] },
];

describe("buildHeatmapRenderData", () => {
  const result = correlationMatrix(SERIES);
  const hm = buildHeatmapRenderData(result);

  it("produces n² cells for n×n matrix", () => {
    expect(hm.cells).toHaveLength(9); // 3×3
  });

  it("diagonal cells are marked isDiagonal=true with display='—'", () => {
    const diag = hm.cells.filter((c) => c.isDiagonal);
    expect(diag).toHaveLength(3);
    expect(diag.every((c) => c.display === "—")).toBe(true);
    expect(diag.every((c) => c.r === 1)).toBe(true);
  });

  it("non-diagonal cells have formatted display string", () => {
    const offDiag = hm.cells.filter((c) => !c.isDiagonal);
    expect(offDiag.every((c) => /^-?\d+\.\d{2}$/.test(c.display))).toBe(true);
  });

  it("AAPL-MSFT pair is warning (r=1, |r|>0.85)", () => {
    const cell = hm.cells.find((c) => c.rowId === "AAPL" && c.colId === "MSFT");
    expect(cell?.isWarning).toBe(true);
  });

  it("warningPairs lists high-correlation pairs (not diagonal)", () => {
    expect(hm.warningPairs.length).toBeGreaterThanOrEqual(1);
    expect(hm.warningPairs.every((p) => p.tickerA !== p.tickerB)).toBe(true);
  });

  it("warningPairs sorted by |r| descending", () => {
    for (let i = 0; i < hm.warningPairs.length - 1; i++) {
      expect(Math.abs(hm.warningPairs[i]!.r)).toBeGreaterThanOrEqual(
        Math.abs(hm.warningPairs[i + 1]!.r),
      );
    }
  });

  it("each cell has a color string starting with hsl(", () => {
    expect(hm.cells.every((c) => c.color.startsWith("hsl("))).toBe(true);
  });

  it("respects custom warnThreshold", () => {
    const highThreshold = buildHeatmapRenderData(result, 0.99);
    // AAPL-MSFT r=1 still crosses 0.99
    const strictNoWarn = buildHeatmapRenderData(result, 2.0);
    expect(highThreshold.warningPairs.length).toBeGreaterThanOrEqual(1);
    expect(strictNoWarn.warningPairs).toHaveLength(0);
  });

  it("empty result produces empty cells and warningPairs", () => {
    const empty = buildHeatmapRenderData({ ids: [], matrix: [] });
    expect(empty.cells).toHaveLength(0);
    expect(empty.warningPairs).toHaveLength(0);
  });
});

// ─────────────────────────── sliceCorrelationResult ──────────────────────────

describe("sliceCorrelationResult", () => {
  const result = correlationMatrix(SERIES);

  it("slices to a subset of IDs", () => {
    const sliced = sliceCorrelationResult(result, ["AAPL", "RAND"]);
    expect(sliced.ids).toEqual(["AAPL", "RAND"]);
    expect(sliced.matrix).toHaveLength(2);
    expect(sliced.matrix[0]).toHaveLength(2);
  });

  it("diagonal is still 1 after slicing", () => {
    const sliced = sliceCorrelationResult(result, ["AAPL", "MSFT"]);
    expect(sliced.matrix[0]![0]).toBe(1);
    expect(sliced.matrix[1]![1]).toBe(1);
  });

  it("unknown IDs are dropped silently", () => {
    const sliced = sliceCorrelationResult(result, ["AAPL", "UNKNOWN"]);
    expect(sliced.ids).toEqual(["AAPL"]);
  });

  it("empty keepIds produces empty result", () => {
    const sliced = sliceCorrelationResult(result, []);
    expect(sliced.ids).toHaveLength(0);
    expect(sliced.matrix).toHaveLength(0);
  });
});
