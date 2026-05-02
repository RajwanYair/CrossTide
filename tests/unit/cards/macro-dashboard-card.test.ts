import { describe, it, expect } from "vitest";
import { deriveRiskRegime, renderMacroDashboard } from "../../../src/cards/macro-dashboard-card";

describe("macro-dashboard-card", () => {
  it("deriveRiskRegime returns risk-off for high VIX", () => {
    expect(deriveRiskRegime(25, -0.1)).toBe("risk-off");
  });

  it("deriveRiskRegime returns risk-on for low VIX and weak DXY", () => {
    expect(deriveRiskRegime(14, -0.2)).toBe("risk-on");
  });

  it("deriveRiskRegime returns neutral otherwise", () => {
    expect(deriveRiskRegime(18, 0.1)).toBe("neutral");
  });

  it("renders macro dashboard shell", () => {
    const el = document.createElement("div");
    renderMacroDashboard(el, new Map());
    expect(el.innerHTML).toContain("Macro Dashboard");
    expect(el.innerHTML).toContain("macro-grid");
  });
});
