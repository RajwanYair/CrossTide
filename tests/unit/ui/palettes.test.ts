import { describe, it, expect } from "vitest";
import {
  getPalette,
  pickColor,
  isHexColor,
  PALETTE_NAMES,
  type SemanticColor,
} from "../../../src/ui/palettes";

const ALL_KINDS: SemanticColor[] = [
  "bullish",
  "bearish",
  "neutral",
  "accent1",
  "accent2",
  "accent3",
  "warning",
  "info",
];

describe("palettes", () => {
  it("PALETTE_NAMES contains four palettes", () => {
    expect(PALETTE_NAMES).toHaveLength(4);
  });

  it("every palette defines every semantic color", () => {
    for (const name of PALETTE_NAMES) {
      const p = getPalette(name);
      for (const k of ALL_KINDS) {
        expect(p[k]).toBeDefined();
        expect(isHexColor(p[k])).toBe(true);
      }
    }
  });

  it("pickColor returns the same value as getPalette", () => {
    for (const name of PALETTE_NAMES) {
      expect(pickColor(name, "bullish")).toBe(getPalette(name).bullish);
    }
  });

  it("default palette uses red/green for bull/bear", () => {
    expect(getPalette("default").bullish).toBe("#16a34a");
    expect(getPalette("default").bearish).toBe("#dc2626");
  });

  it("deuteranopia avoids red/green confusion", () => {
    const p = getPalette("deuteranopia");
    expect(p.bullish).not.toBe("#16a34a");
    expect(p.bearish).not.toBe("#dc2626");
  });

  it("isHexColor accepts valid 6-digit hex", () => {
    expect(isHexColor("#abcdef")).toBe(true);
    expect(isHexColor("#ABCDEF")).toBe(true);
    expect(isHexColor("#123456")).toBe(true);
  });

  it("isHexColor rejects invalid", () => {
    expect(isHexColor("abcdef")).toBe(false);
    expect(isHexColor("#abc")).toBe(false);
    expect(isHexColor("#abcdefg")).toBe(false);
    expect(isHexColor("")).toBe(false);
  });

  it("palettes have no duplicate colors within a single palette", () => {
    for (const name of PALETTE_NAMES) {
      const p = getPalette(name);
      const colors = ALL_KINDS.map((k) => p[k]);
      expect(new Set(colors).size).toBe(colors.length);
    }
  });
});
