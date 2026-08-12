import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  formatPrice,
  formatCompact,
  formatPercent,
  formatChange,
  _clearFormatterCache,
} from "../../../src/ui/number-format";
import { setLocale } from "../../../src/core/i18n";

beforeEach(() => {
  _clearFormatterCache();
});

afterEach(() => {
  setLocale("en-US");
});

describe("number-format", () => {
  it("formatPrice >=1 uses 2 decimals by default", () => {
    expect(formatPrice(123.456)).toBe("123.46");
  });

  it("formatPrice <1 uses 4 decimals", () => {
    expect(formatPrice(0.12345)).toBe("0.1235");
  });

  it("formatPrice with currency", () => {
    const out = formatPrice(99.5, { currency: "USD" });
    expect(out).toContain("99.50");
    expect(out).toMatch(/\$/);
  });

  it("formatPrice non-finite -> dash", () => {
    expect(formatPrice(NaN)).toBe("—");
    expect(formatPrice(Infinity)).toBe("—");
  });

  it("formatCompact thousands/millions/billions", () => {
    expect(formatCompact(1234)).toBe("1.23K");
    expect(formatCompact(1_500_000)).toBe("1.5M");
    expect(formatCompact(2_700_000_000)).toBe("2.7B");
  });

  it("formatPercent of fraction", () => {
    expect(formatPercent(0.0523)).toBe("5.23%");
  });

  it("formatPercent signed prefix for positive", () => {
    expect(formatPercent(0.05, { signed: true })).toMatch(/^\+/);
    expect(formatPercent(-0.05, { signed: true })).not.toMatch(/^\+/);
  });

  it("formatChange prepends + for positive", () => {
    expect(formatChange(1.5)).toBe("+1.50");
    expect(formatChange(-1.5)).toMatch(/^-/);
  });

  it("formatChange zero has no sign", () => {
    expect(formatChange(0)).toBe("0.0000");
  });

  it("formatPrice respects custom min/maxDigits", () => {
    expect(formatPrice(1.5, { minDigits: 0, maxDigits: 0 })).toBe("2");
  });

  it("locale option produces different separators", () => {
    const en = formatPrice(1234.56, { locale: "en-US" });
    const de = formatPrice(1234.56, { locale: "de-DE" });
    expect(en).not.toBe(de);
  });

  it("uses the active locale when no locale option is provided", () => {
    setLocale("de-DE");

    expect(formatPrice(1234.56)).toBe("1.234,56");
  });
});
