/**
 * Tests for H18: Earnings Calendar domain.
 */
import { describe, it, expect } from "vitest";
import {
  parseEarningsResponse,
  sortByDate,
  filterUpcoming,
  getDaysUntilEarnings,
  classifySurprise,
  type EarningsEntry,
  type RawEarningsItem,
} from "../../../src/domain/earnings-calendar";

// ─────────────────────────── parseEarningsResponse ───────────────────────────

describe("parseEarningsResponse", () => {
  it("parses valid items from raw API response", () => {
    const raw: RawEarningsItem[] = [
      { ticker: "aapl", date: "2026-05-10", epsEstimate: 2.1, priorEps: 1.8, companyName: "Apple" },
    ];
    const result = parseEarningsResponse(raw);
    expect(result).toHaveLength(1);
    expect(result[0]?.ticker).toBe("AAPL");
    expect(result[0]?.epsEstimate).toBe(2.1);
  });

  it("normalises ticker to uppercase", () => {
    const raw: RawEarningsItem[] = [{ symbol: "msft", date: "2026-05-15" }];
    const result = parseEarningsResponse(raw);
    expect(result[0]?.ticker).toBe("MSFT");
  });

  it("drops items with missing ticker", () => {
    const raw: RawEarningsItem[] = [{ date: "2026-05-10" }];
    expect(parseEarningsResponse(raw)).toHaveLength(0);
  });

  it("drops items with invalid date", () => {
    const raw: RawEarningsItem[] = [{ ticker: "GOOG", date: "not-a-date" }];
    expect(parseEarningsResponse(raw)).toHaveLength(0);
  });

  it("calculates surprisePct from epsActual and epsEstimate when not provided", () => {
    const raw: RawEarningsItem[] = [
      { ticker: "AMZN", date: "2026-05-10", epsEstimate: 2.0, epsActual: 2.5 },
    ];
    const result = parseEarningsResponse(raw);
    // (2.5 - 2.0) / 2.0 * 100 = 25%
    expect(result[0]?.surprisePct).toBeCloseTo(25);
  });

  it("accepts alternative field names (symbol, earningsDate, epsPrior)", () => {
    const raw: RawEarningsItem[] = [
      { symbol: "NVDA", earningsDate: "2026-06-01", epsEstimate: 5.0, epsPrior: 4.5 },
    ];
    const result = parseEarningsResponse(raw);
    expect(result[0]?.ticker).toBe("NVDA");
    expect(result[0]?.earningsDate).toBe("2026-06-01");
    expect(result[0]?.priorEps).toBe(4.5);
  });

  it("sets timing to BMO or AMC when provided", () => {
    const raw: RawEarningsItem[] = [{ ticker: "META", date: "2026-05-12", timing: "BMO" }];
    expect(parseEarningsResponse(raw)[0]?.timing).toBe("BMO");
  });

  it("omits timing when unknown string provided", () => {
    const raw: RawEarningsItem[] = [{ ticker: "TSLA", date: "2026-05-12", timing: "UNKNOWN" }];
    expect(parseEarningsResponse(raw)[0]?.timing).toBeUndefined();
  });
});

// ─────────────────────────── sortByDate ──────────────────────────────────────

describe("sortByDate", () => {
  const entries: EarningsEntry[] = [
    {
      ticker: "C",
      companyName: "C",
      earningsDate: "2026-05-15",
      epsEstimate: 0,
      priorEps: 0,
      surprisePct: 0,
    },
    {
      ticker: "A",
      companyName: "A",
      earningsDate: "2026-05-10",
      epsEstimate: 0,
      priorEps: 0,
      surprisePct: 0,
    },
    {
      ticker: "B",
      companyName: "B",
      earningsDate: "2026-05-12",
      epsEstimate: 0,
      priorEps: 0,
      surprisePct: 0,
    },
  ];

  it("sorts entries earliest-first", () => {
    const sorted = sortByDate(entries);
    expect(sorted[0]?.ticker).toBe("A");
    expect(sorted[1]?.ticker).toBe("B");
    expect(sorted[2]?.ticker).toBe("C");
  });

  it("does not mutate the input array", () => {
    const copy = [...entries];
    sortByDate(entries);
    expect(entries[0]?.ticker).toBe(copy[0]?.ticker);
  });
});

// ─────────────────────────── filterUpcoming ──────────────────────────────────

describe("filterUpcoming", () => {
  const now = new Date("2026-05-01T00:00:00Z");

  const entries: EarningsEntry[] = [
    {
      ticker: "TODAY",
      companyName: "",
      earningsDate: "2026-05-01",
      epsEstimate: 0,
      priorEps: 0,
      surprisePct: 0,
    },
    {
      ticker: "IN3",
      companyName: "",
      earningsDate: "2026-05-04",
      epsEstimate: 0,
      priorEps: 0,
      surprisePct: 0,
    },
    {
      ticker: "IN7",
      companyName: "",
      earningsDate: "2026-05-08",
      epsEstimate: 0,
      priorEps: 0,
      surprisePct: 0,
    },
    {
      ticker: "PAST",
      companyName: "",
      earningsDate: "2026-04-30",
      epsEstimate: 0,
      priorEps: 0,
      surprisePct: 0,
    },
    {
      ticker: "FAR",
      companyName: "",
      earningsDate: "2026-06-01",
      epsEstimate: 0,
      priorEps: 0,
      surprisePct: 0,
    },
  ];

  it("includes today's events (diffDays=0)", () => {
    const result = filterUpcoming(entries, 7, now);
    expect(result.some((e) => e.ticker === "TODAY")).toBe(true);
  });

  it("excludes past events", () => {
    const result = filterUpcoming(entries, 7, now);
    expect(result.some((e) => e.ticker === "PAST")).toBe(false);
  });

  it("includes events within the window", () => {
    const result = filterUpcoming(entries, 7, now);
    expect(result.some((e) => e.ticker === "IN3")).toBe(true);
    expect(result.some((e) => e.ticker === "IN7")).toBe(true);
  });

  it("excludes events beyond the window", () => {
    const result = filterUpcoming(entries, 7, now);
    expect(result.some((e) => e.ticker === "FAR")).toBe(false);
  });

  it("defaults to 7-day window", () => {
    expect(filterUpcoming(entries, undefined, now)).toHaveLength(3);
  });
});

// ─────────────────────────── getDaysUntilEarnings ────────────────────────────

describe("getDaysUntilEarnings", () => {
  const now = new Date("2026-05-01T00:00:00Z");

  function entry(date: string): EarningsEntry {
    return {
      ticker: "X",
      companyName: "X",
      earningsDate: date,
      epsEstimate: 0,
      priorEps: 0,
      surprisePct: 0,
    };
  }

  it("returns 0 for today", () => {
    expect(getDaysUntilEarnings(entry("2026-05-01"), now)).toBe(0);
  });

  it("returns positive days for future date", () => {
    expect(getDaysUntilEarnings(entry("2026-05-08"), now)).toBe(7);
  });

  it("returns negative days for past date", () => {
    expect(getDaysUntilEarnings(entry("2026-04-24"), now)).toBe(-7);
  });
});

// ─────────────────────────── classifySurprise ────────────────────────────────

describe("classifySurprise", () => {
  function entry(surprisePct: number, reported = true): EarningsEntry {
    return {
      ticker: "X",
      companyName: "",
      earningsDate: "2026-05-01",
      epsEstimate: 2,
      priorEps: 1,
      surprisePct,
      reported,
    };
  }

  it("beat when surprisePct > 2 and reported", () => {
    expect(classifySurprise(entry(5))).toBe("beat");
  });

  it("miss when surprisePct < -2 and reported", () => {
    expect(classifySurprise(entry(-5))).toBe("miss");
  });

  it("inline when within threshold and reported", () => {
    expect(classifySurprise(entry(1.5))).toBe("inline");
  });

  it("inline when not yet reported regardless of surprisePct", () => {
    expect(classifySurprise(entry(10, false))).toBe("inline");
  });

  it("respects custom threshold", () => {
    expect(classifySurprise(entry(3), 5)).toBe("inline");
    expect(classifySurprise(entry(6), 5)).toBe("beat");
  });
});
