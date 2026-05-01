import { describe, it, expect, beforeEach } from "vitest";
import {
  formatRelativeTime,
  _clearRelativeTimeCache,
} from "../../../src/ui/relative-time";

const NOW = Date.UTC(2025, 5, 15, 12, 0, 0); // 2025-06-15 12:00 UTC
const opt = { now: NOW, locale: "en-US" };

beforeEach(() => {
  _clearRelativeTimeCache();
});

describe("relative-time", () => {
  it("under 30s -> just now", () => {
    expect(formatRelativeTime(NOW - 5_000, opt)).toBe("just now");
    expect(formatRelativeTime(NOW + 10_000, opt)).toBe("just now");
  });

  it("seconds returns seconds form", () => {
    const out = formatRelativeTime(NOW - 45_000, opt);
    expect(out).toMatch(/sec|ago/i);
  });

  it("minutes ago", () => {
    const out = formatRelativeTime(NOW - 5 * 60_000, opt);
    expect(out).toMatch(/5/);
    expect(out).toMatch(/min|ago/i);
  });

  it("hours ago", () => {
    const out = formatRelativeTime(NOW - 3 * 60 * 60_000, opt);
    expect(out).toMatch(/3/);
    expect(out).toMatch(/hr|hour|ago/i);
  });

  it("days ago", () => {
    const out = formatRelativeTime(NOW - 2 * 24 * 60 * 60_000, opt);
    expect(out).toMatch(/2|yesterday/i);
  });

  it("future minutes", () => {
    const out = formatRelativeTime(NOW + 5 * 60_000, opt);
    expect(out).toMatch(/in 5|5/i);
  });

  it("beyond a week -> locale date (same year)", () => {
    const out = formatRelativeTime(Date.UTC(2025, 2, 5), opt);
    expect(out).toMatch(/Mar/);
    expect(out).not.toMatch(/2025/);
  });

  it("different year includes year", () => {
    const out = formatRelativeTime(Date.UTC(2024, 2, 5), opt);
    expect(out).toMatch(/2024/);
  });
});
