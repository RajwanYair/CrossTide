import { describe, it, expect } from "vitest";
import { formatDate, isoDate, isoTime, isoDateTime } from "../../../src/core/date-format";

const REF_MS = Date.UTC(2024, 0, 5, 7, 8, 9, 123); // 2024-01-05T07:08:09.123Z

describe("formatDate", () => {
  it("expands all tokens", () => {
    expect(formatDate(REF_MS, "YYYY-MM-DD HH:mm:ss.SSS")).toBe("2024-01-05 07:08:09.123");
  });
  it("accepts a Date instance", () => {
    expect(formatDate(new Date(REF_MS), "YYYY")).toBe("2024");
  });
  it("pads single-digit components", () => {
    const ms = Date.UTC(123, 0, 1, 0, 0, 0, 1);
    expect(formatDate(ms, "YYYY MM DD HH:mm:ss.SSS")).toBe("0123 01 01 00:00:00.001");
  });
});

describe("isoDate / isoTime / isoDateTime", () => {
  it("isoDate", () => {
    expect(isoDate(REF_MS)).toBe("2024-01-05");
  });
  it("isoTime", () => {
    expect(isoTime(REF_MS)).toBe("07:08:09");
  });
  it("isoDateTime ends with Z", () => {
    expect(isoDateTime(REF_MS)).toBe("2024-01-05T07:08:09Z");
  });
});
