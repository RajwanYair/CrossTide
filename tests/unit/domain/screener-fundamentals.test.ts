import { describe, it, expect } from "vitest";
import {
  matchesFundamentalFilters,
  applyFundamentalFilters,
  GICS_SECTORS,
} from "../../../src/domain/screener-fundamentals";
import type { FundamentalData } from "../../../src/types/domain";

// Helper: build a complete FundamentalData fixture
function makeFundamentals(overrides: Partial<FundamentalData> = {}): FundamentalData {
  return {
    fetchedAt: "2024-06-01T00:00:00.000Z",
    peRatio: 20,
    forwardPe: 18,
    eps: 5.0,
    revenue: 1e10,
    marketCap: 5e11,
    dividendYield: 0.02,
    priceToBook: 3.0,
    debtToEquity: 0.5,
    returnOnEquity: 0.15,
    profitMargin: 0.12,
    ...overrides,
  };
}

describe("matchesFundamentalFilters", () => {
  it("returns true when no filters are supplied", () => {
    expect(matchesFundamentalFilters(makeFundamentals(), {})).toBe(true);
  });

  describe("P/E filters", () => {
    it("passes when peRatio is within maxPe", () => {
      expect(matchesFundamentalFilters(makeFundamentals({ peRatio: 15 }), { maxPe: 20 })).toBe(
        true,
      );
    });

    it("fails when peRatio exceeds maxPe", () => {
      expect(matchesFundamentalFilters(makeFundamentals({ peRatio: 25 }), { maxPe: 20 })).toBe(
        false,
      );
    });

    it("passes when peRatio meets maxPe exactly", () => {
      expect(matchesFundamentalFilters(makeFundamentals({ peRatio: 20 }), { maxPe: 20 })).toBe(
        true,
      );
    });

    it("passes when peRatio meets minPe", () => {
      expect(matchesFundamentalFilters(makeFundamentals({ peRatio: 10 }), { minPe: 5 })).toBe(true);
    });

    it("fails when peRatio is below minPe", () => {
      expect(matchesFundamentalFilters(makeFundamentals({ peRatio: 3 }), { minPe: 5 })).toBe(false);
    });

    it("passes when peRatio is absent (benefit of the doubt)", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ peRatio: undefined }), { maxPe: 20 }),
      ).toBe(true);
    });
  });

  describe("market cap filters", () => {
    it("passes when marketCap >= minMarketCap", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ marketCap: 2e12 }), {
          minMarketCap: 1e9,
        }),
      ).toBe(true);
    });

    it("fails when marketCap < minMarketCap", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ marketCap: 5e8 }), {
          minMarketCap: 1e9,
        }),
      ).toBe(false);
    });

    it("passes when marketCap <= maxMarketCap", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ marketCap: 5e11 }), {
          maxMarketCap: 1e12,
        }),
      ).toBe(true);
    });

    it("fails when marketCap > maxMarketCap", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ marketCap: 2e12 }), {
          maxMarketCap: 1e12,
        }),
      ).toBe(false);
    });
  });

  describe("dividend yield filters", () => {
    it("passes when dividendYield >= minDividendYield", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ dividendYield: 0.03 }), {
          minDividendYield: 0.02,
        }),
      ).toBe(true);
    });

    it("fails when dividendYield < minDividendYield", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ dividendYield: 0.01 }), {
          minDividendYield: 0.02,
        }),
      ).toBe(false);
    });
  });

  describe("profit margin, price-to-book, debt-to-equity, ROE", () => {
    it("fails when profitMargin < minProfitMargin", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ profitMargin: 0.05 }), {
          minProfitMargin: 0.1,
        }),
      ).toBe(false);
    });

    it("passes when profitMargin >= minProfitMargin", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ profitMargin: 0.15 }), {
          minProfitMargin: 0.1,
        }),
      ).toBe(true);
    });

    it("fails when priceToBook > maxPriceToBook", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ priceToBook: 5.0 }), {
          maxPriceToBook: 3.0,
        }),
      ).toBe(false);
    });

    it("fails when debtToEquity > maxDebtToEquity", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ debtToEquity: 1.5 }), {
          maxDebtToEquity: 1.0,
        }),
      ).toBe(false);
    });

    it("fails when returnOnEquity < minReturnOnEquity", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ returnOnEquity: 0.05 }), {
          minReturnOnEquity: 0.15,
        }),
      ).toBe(false);
    });

    it("passes when all constraints satisfied simultaneously", () => {
      expect(
        matchesFundamentalFilters(
          makeFundamentals({
            peRatio: 18,
            marketCap: 1e12,
            dividendYield: 0.025,
            profitMargin: 0.15,
            priceToBook: 2.5,
            debtToEquity: 0.4,
            returnOnEquity: 0.2,
          }),
          {
            maxPe: 25,
            minMarketCap: 1e9,
            minDividendYield: 0.01,
            minProfitMargin: 0.1,
            maxPriceToBook: 4.0,
            maxDebtToEquity: 1.0,
            minReturnOnEquity: 0.1,
          },
        ),
      ).toBe(true);
    });

    it("fails when any single constraint is violated in a multi-filter check", () => {
      expect(
        matchesFundamentalFilters(makeFundamentals({ peRatio: 30, marketCap: 1e12 }), {
          maxPe: 25,
          minMarketCap: 1e9,
        }),
      ).toBe(false);
    });
  });
});

describe("applyFundamentalFilters", () => {
  const entries = [
    { ticker: "AAPL", data: makeFundamentals({ peRatio: 28, marketCap: 3e12 }) },
    { ticker: "MSFT", data: makeFundamentals({ peRatio: 32, marketCap: 2.5e12 }) },
    { ticker: "VZ", data: makeFundamentals({ peRatio: 9, marketCap: 4e10 }) },
    { ticker: "T", data: makeFundamentals({ peRatio: 7, marketCap: 1e11 }) },
  ];

  it("returns all entries when no filters applied", () => {
    expect(applyFundamentalFilters(entries, {})).toHaveLength(4);
  });

  it("filters by maxPe correctly", () => {
    const result = applyFundamentalFilters(entries, { maxPe: 10 });
    expect(result.map((e) => e.ticker)).toEqual(["VZ", "T"]);
  });

  it("filters by minMarketCap correctly", () => {
    const result = applyFundamentalFilters(entries, { minMarketCap: 1e12 });
    expect(result.map((e) => e.ticker)).toEqual(["AAPL", "MSFT"]);
  });

  it("combines multiple filters with AND logic", () => {
    const result = applyFundamentalFilters(entries, { maxPe: 30, minMarketCap: 1e11 });
    // AAPL: PE=28 ✓, cap=3T ✓ | MSFT: PE=32 ✗ | VZ: cap=40B ✗ | T: PE=7 ✓, cap=100B ✓
    expect(result.map((e) => e.ticker)).toEqual(["AAPL", "T"]);
  });

  it("returns empty array when nothing matches", () => {
    const result = applyFundamentalFilters(entries, { maxPe: 5 });
    expect(result).toHaveLength(0);
  });
});

describe("GICS_SECTORS constant", () => {
  it("contains at least 11 recognised sectors", () => {
    expect(GICS_SECTORS.length).toBeGreaterThanOrEqual(11);
  });

  it("includes Technology and Financials", () => {
    expect(GICS_SECTORS).toContain("Technology");
    expect(GICS_SECTORS).toContain("Financials");
  });
});
