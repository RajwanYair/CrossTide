import { describe, it, expect } from "vitest";
import { parseHex, toHex, blend, lighten, darken } from "../../../src/ui/color-blend";

describe("parseHex / toHex", () => {
  it("parses #rgb shorthand", () => {
    expect(parseHex("#f00")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });
  it("parses #rrggbb", () => {
    expect(parseHex("#00ff00")).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });
  it("parses #rrggbbaa", () => {
    const c = parseHex("#80808080");
    expect(c.r).toBe(128);
    expect(c.a).toBeCloseTo(128 / 255, 5);
  });
  it("rejects invalid input", () => {
    expect(() => parseHex("not")).toThrow();
    expect(() => parseHex("#ggg")).toThrow();
  });
  it("toHex round-trips", () => {
    expect(toHex(parseHex("#abcdef"))).toBe("#abcdef");
  });
  it("toHex with alpha", () => {
    expect(toHex({ r: 255, g: 0, b: 0, a: 0.5 }, true)).toBe("#ff000080");
  });
});

describe("blend", () => {
  it("t=0 returns first color", () => {
    expect(blend("#ff0000", "#00ff00", 0)).toBe("#ff0000");
  });
  it("t=1 returns second color", () => {
    expect(blend("#ff0000", "#00ff00", 1)).toBe("#00ff00");
  });
  it("t=0.5 mixes 50/50", () => {
    expect(blend("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
  it("clamps t outside [0,1]", () => {
    expect(blend("#000000", "#ffffff", -1)).toBe("#000000");
    expect(blend("#000000", "#ffffff", 2)).toBe("#ffffff");
  });
});

describe("lighten / darken", () => {
  it("lighten moves toward white", () => {
    expect(lighten("#000000", 0.5)).toBe("#808080");
    expect(lighten("#808080", 1)).toBe("#ffffff");
  });
  it("darken moves toward black", () => {
    expect(darken("#ffffff", 0.5)).toBe("#808080");
    expect(darken("#808080", 1)).toBe("#000000");
  });
});
