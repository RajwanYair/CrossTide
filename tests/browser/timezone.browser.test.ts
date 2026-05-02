/**
 * Browser-mode tests for Intl / Temporal helpers.  (G17 / G7)
 *
 * Run in real Chromium to verify that Temporal polyfill + Intl.DateTimeFormat
 * behave consistently with the happy-dom unit tests.
 */
import { describe, it, expect } from "vitest";
import { currentTimeZone, toPlainDate, addTradingDays, Temporal } from "../../src/core/timezone";

describe("currentTimeZone (real browser)", () => {
  it("returns a non-empty IANA-like string", () => {
    const tz = currentTimeZone();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });

  it("matches Intl.DateTimeFormat().resolvedOptions().timeZone", () => {
    const tz = currentTimeZone();
    const expected = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    expect(tz).toBe(expected);
  });
});

describe("toPlainDate + addTradingDays (real browser / Temporal polyfill)", () => {
  it("toPlainDate converts a known UTC instant correctly", () => {
    const d = toPlainDate(new Date("2024-06-15T12:00:00Z"), "UTC");
    expect(d).toBeInstanceOf(Temporal.PlainDate);
    expect(d.toString()).toBe("2024-06-15");
  });

  it("addTradingDays advances past weekends", () => {
    // 2024-01-05 is Friday; +1 trading day = Monday 2024-01-08
    const friday = Temporal.PlainDate.from("2024-01-05");
    expect(addTradingDays(friday, 1).toString()).toBe("2024-01-08");
  });

  it("Temporal.PlainDate.compare works correctly", () => {
    const earlier = Temporal.PlainDate.from("2024-01-01");
    const later = Temporal.PlainDate.from("2024-12-31");
    expect(Temporal.PlainDate.compare(earlier, later)).toBeLessThan(0);
    expect(Temporal.PlainDate.compare(later, earlier)).toBeGreaterThan(0);
    expect(Temporal.PlainDate.compare(earlier, earlier)).toBe(0);
  });
});
