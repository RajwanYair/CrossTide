import { describe, it, expect } from "vitest";
import {
  parseHexColor,
  relativeLuminance,
  contrastRatio,
  meetsWcag,
  prefersReducedMotion,
  prefersMoreContrast,
} from "../../../src/ui/contrast";

describe("contrast", () => {
  it("parseHexColor handles 6-digit hex", () => {
    expect(parseHexColor("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("parseHexColor handles 3-digit hex", () => {
    expect(parseHexColor("#0f0")).toEqual({ r: 0, g: 255, b: 0 });
  });

  it("parseHexColor rejects invalid input", () => {
    expect(parseHexColor("not-a-color")).toBeNull();
    expect(parseHexColor("#12")).toBeNull();
  });

  it("relativeLuminance: black=0, white=1", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 3);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 3);
  });

  it("contrastRatio black/white = 21", () => {
    const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(ratio).toBeCloseTo(21, 1);
  });

  it("contrastRatio identical colors = 1", () => {
    expect(contrastRatio({ r: 100, g: 100, b: 100 }, { r: 100, g: 100, b: 100 })).toBe(1);
  });

  it("meetsWcag thresholds", () => {
    expect(meetsWcag(4.5)).toBe(true);
    expect(meetsWcag(4.49)).toBe(false);
    expect(meetsWcag(7, "AAA")).toBe(true);
    expect(meetsWcag(6.99, "AAA")).toBe(false);
    expect(meetsWcag(3.1, "AA", "large")).toBe(true);
  });

  it("prefersReducedMotion returns false without matchMedia", () => {
    const original = (globalThis as { matchMedia?: unknown }).matchMedia;
    (globalThis as { matchMedia?: unknown }).matchMedia = undefined;
    expect(prefersReducedMotion()).toBe(false);
    (globalThis as { matchMedia?: unknown }).matchMedia = original;
  });

  it("prefersMoreContrast returns false without matchMedia", () => {
    const original = (globalThis as { matchMedia?: unknown }).matchMedia;
    (globalThis as { matchMedia?: unknown }).matchMedia = undefined;
    expect(prefersMoreContrast()).toBe(false);
    (globalThis as { matchMedia?: unknown }).matchMedia = original;
  });
});
