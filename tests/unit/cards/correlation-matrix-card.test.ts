/**
 * Correlation Matrix card tests (G22).
 */
import { describe, it, expect } from "vitest";
import {
  correlationToColor,
  renderCorrelationTable,
  findOverConcentration,
} from "../../../src/cards/correlation-matrix-card";
import { correlationMatrix } from "../../../src/domain/correlation-matrix";

// ── correlationToColor ─────────────────────────────────────────────────────
describe("correlationToColor", () => {
  it("returns a red-ish hsl for r=1", () => {
    expect(correlationToColor(1)).toMatch(/^hsl\(0,/);
  });

  it("returns a blue-ish hsl for r=-1", () => {
    expect(correlationToColor(-1)).toMatch(/^hsl\(220,/);
  });

  it("has low saturation near r=0", () => {
    const color = correlationToColor(0);
    // saturation should be 0%
    expect(color).toContain("0%");
  });

  it("clamps r > 1 to 1", () => {
    expect(correlationToColor(1.5)).toBe(correlationToColor(1));
  });

  it("clamps r < -1 to -1", () => {
    expect(correlationToColor(-2)).toBe(correlationToColor(-1));
  });
});

// ── renderCorrelationTable ─────────────────────────────────────────────────
describe("renderCorrelationTable", () => {
  it("renders empty state when no ids", () => {
    const html = renderCorrelationTable([], []);
    expect(html).toContain("empty-state");
  });

  it("renders a table with correct id headers", () => {
    const { ids, matrix } = correlationMatrix([
      { id: "AAPL", values: [1, 2, 3, 4, 5] },
      { id: "MSFT", values: [2, 4, 6, 8, 10] },
    ]);
    const html = renderCorrelationTable(ids, matrix);
    expect(html).toContain("AAPL");
    expect(html).toContain("MSFT");
    expect(html).toContain("<table");
  });

  it("marks the diagonal with corr-diagonal class", () => {
    const { ids, matrix } = correlationMatrix([
      { id: "A", values: [1, 2, 3] },
      { id: "B", values: [1, 2, 3] },
    ]);
    const html = renderCorrelationTable(ids, matrix);
    expect(html).toContain("corr-diagonal");
  });

  it("adds corr-warn class for |r| > 0.85", () => {
    // Perfectly correlated → r = 1.0
    const { ids, matrix } = correlationMatrix([
      { id: "X", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      { id: "Y", values: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] },
    ]);
    const html = renderCorrelationTable(ids, matrix);
    expect(html).toContain("corr-warn");
  });

  it("does not add corr-warn for uncorrelated tickers", () => {
    const { ids, matrix } = correlationMatrix([
      { id: "P", values: [1, -1, 1, -1, 1, -1, 1, -1, 1, -1] },
      { id: "Q", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    ]);
    const html = renderCorrelationTable(ids, matrix);
    expect(html).not.toContain("corr-warn");
  });

  it("escapes html special characters in ticker names", () => {
    const { ids, matrix } = correlationMatrix([
      { id: "A&B", values: [1, 2, 3] },
      { id: "C<D>", values: [3, 2, 1] },
    ]);
    const html = renderCorrelationTable(ids, matrix);
    expect(html).toContain("A&amp;B");
    expect(html).toContain("C&lt;D&gt;");
  });
});

// ── findOverConcentration ──────────────────────────────────────────────────
describe("findOverConcentration", () => {
  it("returns empty array when no pairs above threshold", () => {
    const ids = ["A", "B"];
    const matrix = [
      [1, 0.5],
      [0.5, 1],
    ];
    expect(findOverConcentration(ids, matrix)).toEqual([]);
  });

  it("returns pair when |r| > 0.85", () => {
    const { ids, matrix } = correlationMatrix([
      { id: "X", values: [1, 2, 3, 4, 5] },
      { id: "Y", values: [2, 4, 6, 8, 10] },
    ]);
    const warnings = findOverConcentration(ids, matrix);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.a).toBe("X");
    expect(warnings[0]!.b).toBe("Y");
    expect(Math.abs(warnings[0]!.r)).toBeGreaterThan(0.85);
  });

  it("detects strong negative correlation", () => {
    const { ids, matrix } = correlationMatrix([
      { id: "A", values: [10, 8, 6, 4, 2] },
      { id: "B", values: [2, 4, 6, 8, 10] },
    ]);
    const warnings = findOverConcentration(ids, matrix);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.r).toBeLessThan(-0.85);
  });

  it("does not include self-correlation pairs", () => {
    const ids = ["A"];
    const matrix = [[1]];
    expect(findOverConcentration(ids, matrix)).toEqual([]);
  });
});
