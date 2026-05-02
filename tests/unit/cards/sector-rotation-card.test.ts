import { describe, it, expect } from "vitest";
import {
  computeReturn,
  classifyRelativeStrength,
  renderSectorRotation,
} from "../../../src/cards/sector-rotation-card";

describe("sector-rotation-card", () => {
  it("computeReturn returns 0 when insufficient candles", () => {
    expect(computeReturn([], 5)).toBe(0);
  });

  it("computeReturn computes percent return", () => {
    const candles = [
      { date: "2026-01-01", open: 0, high: 0, low: 0, close: 100, volume: 0 },
      { date: "2026-01-02", open: 0, high: 0, low: 0, close: 110, volume: 0 },
    ];
    expect(computeReturn(candles, 1)).toBeCloseTo(0.1);
  });

  it("classifyRelativeStrength marks outperform", () => {
    expect(classifyRelativeStrength(0.01)).toBe("outperform");
  });

  it("renders table structure", () => {
    const el = document.createElement("div");
    renderSectorRotation(el, { XLC: { "1w": 0.01 } });
    expect(el.innerHTML).toContain("Sector Rotation");
    expect(el.innerHTML).toContain("rotation-table");
  });
});
