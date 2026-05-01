import { describe, it, expect } from "vitest";
import {
  currentTimeZone,
  timeZoneOffsetMinutes,
  formatInTimeZone,
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
