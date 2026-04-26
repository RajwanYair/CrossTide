/**
 * Branded type smart constructor tests.
 */
import { describe, it, expect } from "vitest";
import {
  ticker,
  tryTicker,
  isoDate,
  isoTimestamp,
  uuid,
  nonNegativeInt,
  nonNegativeNumber,
  unitInterval,
  percent,
  BrandError,
} from "../../../src/types/branded";

describe("ticker", () => {
  it("uppercases and trims valid input", () => {
    expect(ticker(" aapl ")).toBe("AAPL");
  });

  it("accepts dot/dash variants", () => {
    expect(ticker("BRK.A")).toBe("BRK.A");
    expect(ticker("BF-B")).toBe("BF-B");
  });

  it.each(["", "1ABC", "TOOLONGSYMBOL", " ", "AB C"])(
    "rejects invalid: %s",
    (input) => {
      expect(() => ticker(input)).toThrow(BrandError);
    },
  );

  it("tryTicker returns null on invalid", () => {
    expect(tryTicker("123")).toBeNull();
    expect(tryTicker("AAPL")).toBe("AAPL");
  });
});

describe("isoDate", () => {
  it("accepts valid YYYY-MM-DD", () => {
    expect(isoDate("2025-06-15")).toBe("2025-06-15");
  });

  it.each(["2025-13-01", "2025-02-30", "20250101", "2025-1-1"])(
    "rejects invalid: %s",
    (input) => {
      expect(() => isoDate(input)).toThrow(BrandError);
    },
  );
});

describe("isoTimestamp", () => {
  it("accepts ISO datetime", () => {
    expect(isoTimestamp("2025-06-15T12:34:56Z")).toBe("2025-06-15T12:34:56Z");
  });

  it("rejects junk", () => {
    expect(() => isoTimestamp("not a date")).toThrow(BrandError);
  });
});

describe("uuid", () => {
  it("accepts valid v4", () => {
    const u = "9f7e0a3a-1b2c-4d5e-8f0a-1234567890ab";
    expect(uuid(u)).toBe(u);
  });

  it("rejects invalid", () => {
    expect(() => uuid("not-a-uuid")).toThrow(BrandError);
  });
});

describe("nonNegativeInt", () => {
  it("accepts 0+", () => {
    expect(nonNegativeInt(0)).toBe(0);
    expect(nonNegativeInt(42)).toBe(42);
  });

  it.each([-1, 1.5, NaN, Infinity])("rejects %s", (n) => {
    expect(() => nonNegativeInt(n)).toThrow(BrandError);
  });
});

describe("nonNegativeNumber", () => {
  it("accepts finite >= 0", () => {
    expect(nonNegativeNumber(0)).toBe(0);
    expect(nonNegativeNumber(3.14)).toBe(3.14);
  });

  it.each([-0.5, NaN, Infinity, -Infinity])("rejects %s", (n) => {
    expect(() => nonNegativeNumber(n)).toThrow(BrandError);
  });
});

describe("unitInterval", () => {
  it("accepts 0..1", () => {
    expect(unitInterval(0)).toBe(0);
    expect(unitInterval(0.5)).toBe(0.5);
    expect(unitInterval(1)).toBe(1);
  });

  it.each([-0.01, 1.01, NaN])("rejects %s", (n) => {
    expect(() => unitInterval(n)).toThrow(BrandError);
  });
});

describe("percent", () => {
  it("accepts any finite number", () => {
    expect(percent(-5)).toBe(-5);
    expect(percent(150.5)).toBe(150.5);
  });

  it("rejects NaN/Inf", () => {
    expect(() => percent(NaN)).toThrow(BrandError);
    expect(() => percent(Infinity)).toThrow(BrandError);
  });
});
