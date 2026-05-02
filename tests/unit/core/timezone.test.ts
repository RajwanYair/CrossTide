import { describe, it, expect } from "vitest";
import {
  currentTimeZone,
  timeZoneOffsetMinutes,
  formatInTimeZone,
  Temporal,
  toPlainDate,
  plainDateRange,
  addTradingDays,
} from "../../../src/core/timezone";

describe("currentTimeZone", () => {
  it("returns a non-empty IANA-like string", () => {
    const tz = currentTimeZone();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });
});

describe("timeZoneOffsetMinutes", () => {
  it("UTC offset is 0", () => {
    expect(timeZoneOffsetMinutes(new Date("2024-06-01T12:00:00Z"), "UTC")).toBe(0);
  });
  it("Asia/Tokyo is +540 in summer", () => {
    expect(timeZoneOffsetMinutes(new Date("2024-06-01T12:00:00Z"), "Asia/Tokyo")).toBe(540);
  });
  it("America/New_York is -240 (EDT) in summer", () => {
    expect(timeZoneOffsetMinutes(new Date("2024-06-01T12:00:00Z"), "America/New_York")).toBe(-240);
  });
  it("America/New_York is -300 (EST) in winter", () => {
    expect(timeZoneOffsetMinutes(new Date("2024-01-15T12:00:00Z"), "America/New_York")).toBe(-300);
  });
});

describe("formatInTimeZone", () => {
  it("formats date in given tz", () => {
    const s = formatInTimeZone(new Date("2024-06-01T12:00:00Z"), "UTC", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    expect(s).toContain("2024");
  });
});

// ── G7: Temporal-based helpers ────────────────────────────────────────────

describe("toPlainDate", () => {
  it("converts UTC epoch to PlainDate", () => {
    const d = toPlainDate(new Date("2024-06-15T12:00:00Z"), "UTC");
    expect(d).toBeInstanceOf(Temporal.PlainDate);
    expect(d.year).toBe(2024);
    expect(d.month).toBe(6);
    expect(d.day).toBe(15);
  });

  it("applies time-zone offset correctly (NY midnight UTC = June 14 in NY)", () => {
    // 2024-06-15T00:30:00Z = 2024-06-14T20:30:00-04:00 (EDT)
    const d = toPlainDate(new Date("2024-06-15T00:30:00Z"), "America/New_York");
    expect(d.year).toBe(2024);
    expect(d.month).toBe(6);
    expect(d.day).toBe(14);
  });

  it("accepts epoch milliseconds", () => {
    const ms = Date.UTC(2024, 0, 1, 12); // 2024-01-01T12:00:00Z
    const d = toPlainDate(ms, "UTC");
    expect(d.toString()).toBe("2024-01-01");
  });
});

describe("plainDateRange", () => {
  it("returns inclusive range of dates", () => {
    const from = Temporal.PlainDate.from("2024-01-01");
    const to = Temporal.PlainDate.from("2024-01-05");
    const range = plainDateRange(from, to);
    expect(range).toHaveLength(5);
    expect(range[0]!.toString()).toBe("2024-01-01");
    expect(range[4]!.toString()).toBe("2024-01-05");
  });

  it("returns single element when from === to", () => {
    const d = Temporal.PlainDate.from("2024-03-15");
    expect(plainDateRange(d, d)).toHaveLength(1);
  });

  it("returns empty array when from > to", () => {
    const from = Temporal.PlainDate.from("2024-01-05");
    const to = Temporal.PlainDate.from("2024-01-01");
    expect(plainDateRange(from, to)).toHaveLength(0);
  });
});

describe("addTradingDays", () => {
  it("skips weekends when advancing forward", () => {
    // 2024-01-05 is a Friday; +1 trading day => Monday 2024-01-08
    const friday = Temporal.PlainDate.from("2024-01-05");
    expect(addTradingDays(friday, 1).toString()).toBe("2024-01-08");
  });

  it("advances 5 trading days = one full week (no holidays)", () => {
    // Monday 2024-01-08 + 5 = Monday 2024-01-15
    const monday = Temporal.PlainDate.from("2024-01-08");
    expect(addTradingDays(monday, 5).toString()).toBe("2024-01-15");
  });

  it("supports negative n (go backwards)", () => {
    // Monday 2024-01-08 - 1 trading day = Friday 2024-01-05
    const monday = Temporal.PlainDate.from("2024-01-08");
    expect(addTradingDays(monday, -1).toString()).toBe("2024-01-05");
  });

  it("returns same date when n=0", () => {
    const date = Temporal.PlainDate.from("2024-01-10");
    expect(addTradingDays(date, 0).toString()).toBe("2024-01-10");
  });

  it("accepts a JS Date as input", () => {
    // 2024-01-05T12:00:00Z = Friday
    const d = new Date("2024-01-05T12:00:00Z");
    expect(addTradingDays(d, 1, "UTC").toString()).toBe("2024-01-08");
  });
});
