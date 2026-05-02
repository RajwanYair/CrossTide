/**
 * Tests for H19: Macro Dashboard domain.
 */
import { describe, it, expect } from "vitest";
import {
  classifyMacroRegime,
  classifyMacroRegimeExtended,
  formatMacroChange,
  regimeLabel,
  regimeCssClass,
  getMacroTicker,
  MACRO_TICKERS,
} from "../../../src/domain/macro-dashboard";

// ─────────────────────────── classifyMacroRegime ─────────────────────────────

describe("classifyMacroRegime", () => {
  it("risk-off when VIX >= 22", () => {
    expect(classifyMacroRegime(22, 0)).toBe("risk-off");
    expect(classifyMacroRegime(30, -1)).toBe("risk-off");
  });

  it("risk-off when DXY change > 0.35%", () => {
    expect(classifyMacroRegime(15, 0.5)).toBe("risk-off");
  });

  it("risk-on when VIX <= 16 and DXY change <= 0", () => {
    expect(classifyMacroRegime(15, -0.2)).toBe("risk-on");
    expect(classifyMacroRegime(16, 0)).toBe("risk-on");
  });

  it("neutral when VIX between 16 and 22 and DXY flat", () => {
    expect(classifyMacroRegime(19, 0.1)).toBe("neutral");
  });

  it("neutral when VIX <= 16 but DXY rising slightly", () => {
    expect(classifyMacroRegime(14, 0.2)).toBe("neutral");
  });

  it("risk-off takes priority over risk-on thresholds", () => {
    // VIX=22 (risk-off) even though DXY is negative (would be risk-on otherwise)
    expect(classifyMacroRegime(22, -1)).toBe("risk-off");
  });
});

// ─────────────────────────── classifyMacroRegimeExtended ─────────────────────

describe("classifyMacroRegimeExtended", () => {
  it("matches base regime for normal conditions", () => {
    expect(classifyMacroRegimeExtended({ vix: 18, dxyChangePct: 0.1 })).toBe("neutral");
    expect(classifyMacroRegimeExtended({ vix: 14, dxyChangePct: -0.5 })).toBe("risk-on");
  });

  it("risk-off when 10Y yield spikes > 2% on the day", () => {
    expect(classifyMacroRegimeExtended({ vix: 18, dxyChangePct: 0.1, us10yChangePct: 3 })).toBe(
      "risk-off",
    );
  });

  it("base risk-off not overridden by rising yield (stays risk-off)", () => {
    expect(classifyMacroRegimeExtended({ vix: 25, dxyChangePct: 0, us10yChangePct: 4 })).toBe(
      "risk-off",
    );
  });

  it("ignores yield when undefined", () => {
    expect(classifyMacroRegimeExtended({ vix: 14, dxyChangePct: -0.1 })).toBe("risk-on");
  });
});

// ─────────────────────────── formatMacroChange ───────────────────────────────

describe("formatMacroChange", () => {
  it("prepends + for positive values", () => {
    expect(formatMacroChange(1.5)).toBe("+1.50%");
  });

  it("does not add + for negative values", () => {
    expect(formatMacroChange(-0.75)).toBe("-0.75%");
  });

  it("formats zero as +0.00%", () => {
    expect(formatMacroChange(0)).toBe("+0.00%");
  });

  it("respects custom decimals", () => {
    expect(formatMacroChange(2.5, 1)).toBe("+2.5%");
  });
});

// ─────────────────────────── regimeLabel / regimeCssClass ────────────────────

describe("regimeLabel", () => {
  it("returns human-readable label", () => {
    expect(regimeLabel("risk-on")).toBe("Risk On");
    expect(regimeLabel("risk-off")).toBe("Risk Off");
    expect(regimeLabel("neutral")).toBe("Neutral");
  });
});

describe("regimeCssClass", () => {
  it("returns badge-- prefixed class", () => {
    expect(regimeCssClass("risk-on")).toBe("badge--risk-on");
    expect(regimeCssClass("risk-off")).toBe("badge--risk-off");
    expect(regimeCssClass("neutral")).toBe("badge--neutral");
  });
});

// ─────────────────────────── MACRO_TICKERS / getMacroTicker ──────────────────

describe("MACRO_TICKERS", () => {
  it("includes the expected 5 standard tickers", () => {
    const keys = MACRO_TICKERS.map((t) => t.key);
    expect(keys).toContain("vix");
    expect(keys).toContain("us10y");
    expect(keys).toContain("dxy");
    expect(keys).toContain("gold");
    expect(keys).toContain("wti");
  });

  it("VIX has the highest weight", () => {
    const vix = MACRO_TICKERS.find((t) => t.key === "vix");
    const maxWeight = Math.max(...MACRO_TICKERS.map((t) => t.weight));
    expect(vix?.weight).toBe(maxWeight);
  });
});

describe("getMacroTicker", () => {
  it("returns the correct ticker for a known key", () => {
    expect(getMacroTicker("gold")?.symbol).toBe("GC=F");
  });

  it("returns undefined for unknown key", () => {
    expect(getMacroTicker("bitcoin")).toBeUndefined();
  });
});
