/**
 * Tests for G19 — Company name enrichment helpers.
 */
import { describe, it, expect } from "vitest";
import {
  normaliseCompanyName,
  extractShortName,
  formatDisplayName,
  enrichWatchlistEntry,
  buildNameMap,
} from "../../../src/domain/name-enrichment";
import type { WatchlistEntry } from "../../../src/types/domain";

// ─── normaliseCompanyName ─────────────────────────────────────────────────────

describe("normaliseCompanyName", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normaliseCompanyName("  Apple  ")).toBe("Apple");
  });

  it("collapses internal whitespace", () => {
    expect(normaliseCompanyName("Apple   Inc")).toBe("Apple Inc");
  });

  it("strips trailing punctuation", () => {
    expect(normaliseCompanyName("Apple.")).toBe("Apple");
    expect(normaliseCompanyName("Apple,")).toBe("Apple");
  });

  it("title-cases normal words", () => {
    expect(normaliseCompanyName("MICROSOFT CORPORATION")).toBe("Microsoft Corporation");
  });

  it("preserves short all-caps acronyms", () => {
    expect(normaliseCompanyName("S&P 500 ETF")).toBe("S&P 500 ETF");
  });

  it("preserves tokens containing &", () => {
    expect(normaliseCompanyName("S&P 500")).toBe("S&P 500");
  });
});

// ─── extractShortName ─────────────────────────────────────────────────────────

describe("extractShortName", () => {
  it("strips Inc. suffix", () => {
    expect(extractShortName("Apple Inc.", "AAPL")).toBe("Apple");
  });

  it("strips comma-separated Inc", () => {
    expect(extractShortName("Apple, Inc.", "AAPL")).toBe("Apple");
  });

  it("strips Corp. suffix", () => {
    expect(extractShortName("Microsoft Corp.", "MSFT")).toBe("Microsoft");
  });

  it("strips Corporation suffix", () => {
    expect(extractShortName("Tesla Corporation", "TSLA")).toBe("Tesla");
  });

  it("strips Class A share-class qualifier", () => {
    expect(extractShortName("Alphabet Inc. Class A", "GOOGL")).toBe("Alphabet");
  });

  it("strips Class B share-class qualifier", () => {
    expect(extractShortName("Berkshire Hathaway Inc Class B", "BRK.B")).toBe("Berkshire Hathaway");
  });

  it("falls back to ticker when result is empty", () => {
    expect(extractShortName("", "AAPL")).toBe("AAPL");
  });

  it("falls back to ticker for all-suffix input", () => {
    expect(extractShortName("Inc.", "XYZ")).toBe("XYZ");
  });

  it("handles Holdings suffix", () => {
    expect(extractShortName("Meta Platforms Holdings", "META")).toBe("Meta Platforms");
  });

  it("handles Ltd suffix", () => {
    expect(extractShortName("ASML Holding Ltd.", "ASML")).toBe("ASML Holding");
  });
});

// ─── formatDisplayName ────────────────────────────────────────────────────────

describe("formatDisplayName", () => {
  it("returns only ticker when no name", () => {
    expect(formatDisplayName("AAPL")).toBe("AAPL");
  });

  it("returns only ticker when name equals ticker", () => {
    expect(formatDisplayName("AAPL", "AAPL")).toBe("AAPL");
  });

  it("returns only ticker when name is empty", () => {
    expect(formatDisplayName("AAPL", "")).toBe("AAPL");
  });

  it("formats ticker · name when both present", () => {
    expect(formatDisplayName("AAPL", "Apple")).toBe("AAPL · Apple");
  });

  it("uppercases ticker", () => {
    expect(formatDisplayName("aapl", "Apple")).toBe("AAPL · Apple");
  });
});

// ─── enrichWatchlistEntry ─────────────────────────────────────────────────────

describe("enrichWatchlistEntry", () => {
  const base: WatchlistEntry = { ticker: "AAPL", addedAt: "2024-01-01T00:00:00Z" };

  it("returns entry with normalised name", () => {
    const result = enrichWatchlistEntry(base, "Apple Inc.");
    expect(result.name).toBe("Apple");
  });

  it("preserves all other fields", () => {
    const result = enrichWatchlistEntry(base, "Apple Inc.");
    expect(result.ticker).toBe("AAPL");
    expect(result.addedAt).toBe("2024-01-01T00:00:00Z");
  });

  it("does not mutate the original entry", () => {
    enrichWatchlistEntry(base, "Apple Inc.");
    expect(base.name).toBeUndefined();
  });
});

// ─── buildNameMap ─────────────────────────────────────────────────────────────

describe("buildNameMap", () => {
  const entries: WatchlistEntry[] = [
    { ticker: "AAPL", addedAt: "2024-01-01T00:00:00Z", name: "Apple" },
    { ticker: "MSFT", addedAt: "2024-01-02T00:00:00Z", name: "Microsoft" },
    { ticker: "NVDA", addedAt: "2024-01-03T00:00:00Z" },
  ];

  it("maps ticker to name", () => {
    const map = buildNameMap(entries);
    expect(map.get("AAPL")).toBe("Apple");
    expect(map.get("MSFT")).toBe("Microsoft");
  });

  it("falls back to ticker when name is absent", () => {
    const map = buildNameMap(entries);
    expect(map.get("NVDA")).toBe("NVDA");
  });

  it("returns a Map with correct size", () => {
    const map = buildNameMap(entries);
    expect(map.size).toBe(3);
  });

  it("returns empty map for empty input", () => {
    expect(buildNameMap([])).toHaveProperty("size", 0);
  });
});
