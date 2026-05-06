/**
 * Q9 — Contract tests: Finnhub API response shapes.
 *
 * These tests use frozen fixture payloads that reflect the actual JSON
 * structure returned by Finnhub REST endpoints. They validate that our
 * Valibot schemas (FinnhubQuoteSchema, FinnhubCandleSchema, FinnhubSearchSchema)
 * correctly accept canonical Finnhub responses and reject malformed ones.
 *
 * No network calls are made — purely offline contract verification.
 */
import { describe, it, expect } from "vitest";
import {
  safeParse,
  FinnhubQuoteSchema,
  FinnhubCandleSchema,
  FinnhubSearchSchema,
} from "../../../src/types/valibot-schemas.js";

const v = { safeParse } as const;

// ── Fixture: Finnhub quote (GET /quote) ─────────────────────────────────────

const finnhubQuoteFixture = {
  c: 175.5, // current price
  o: 174.0, // open
  h: 177.0, // high
  l: 173.5, // low
  pc: 173.0, // previous close
  t: 1_700_000_000, // unix timestamp
};

// Quote with optional timestamp omitted (still valid)
const finnhubQuoteNoTimestampFixture = {
  c: 100.0,
  o: 99.0,
  h: 101.0,
  l: 98.5,
  pc: 99.5,
};

// ── Fixture: Finnhub candle (GET /stock/candle) ───────────────────────────────

const finnhubCandleOkFixture = {
  s: "ok",
  t: [1_700_000_000, 1_700_086_400],
  o: [174.0, 175.0],
  h: [177.0, 176.0],
  l: [173.5, 174.5],
  c: [175.5, 175.0],
  v: [52_000_000, 48_000_000],
};

const finnhubCandleNoDataFixture = {
  s: "no_data",
};

// ── Fixture: Finnhub search (GET /search) ────────────────────────────────────

const finnhubSearchFixture = {
  result: [
    {
      description: "APPLE INC",
      displaySymbol: "AAPL",
      symbol: "AAPL",
      type: "Common Stock",
    },
    {
      description: "APPLE HOSPITALITY REIT INC",
      displaySymbol: "APLE",
      symbol: "APLE",
      type: "Common Stock",
    },
  ],
  count: 2,
};

// Empty search result (valid — no matches)
const finnhubSearchEmptyFixture = {
  result: [],
  count: 0,
};

// Search with missing result field (must still parse; result is optional)
const finnhubSearchNoResultFixture = {};

// ── Contract: FinnhubQuoteSchema ──────────────────────────────────────────────

describe("Finnhub quote schema contract", () => {
  it("accepts canonical quote fixture", () => {
    const result = v.safeParse(FinnhubQuoteSchema, finnhubQuoteFixture);
    expect(result.success).toBe(true);
  });

  it("accepts quote fixture without optional timestamp", () => {
    const result = v.safeParse(FinnhubQuoteSchema, finnhubQuoteNoTimestampFixture);
    expect(result.success).toBe(true);
  });

  it("quote output has all required numeric fields", () => {
    const result = v.safeParse(FinnhubQuoteSchema, finnhubQuoteFixture);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const q = result.output;
    expect(typeof q.c).toBe("number");
    expect(typeof q.o).toBe("number");
    expect(typeof q.h).toBe("number");
    expect(typeof q.l).toBe("number");
    expect(typeof q.pc).toBe("number");
  });

  it("current price matches fixture value", () => {
    const result = v.safeParse(FinnhubQuoteSchema, finnhubQuoteFixture);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.output.c).toBe(175.5);
  });

  it("rejects quote missing required field 'c'", () => {
    const { c: _, ...missing } = finnhubQuoteFixture;
    const result = v.safeParse(FinnhubQuoteSchema, missing);
    expect(result.success).toBe(false);
  });

  it("rejects quote missing required field 'pc'", () => {
    const { pc: _, ...missing } = finnhubQuoteFixture;
    const result = v.safeParse(FinnhubQuoteSchema, missing);
    expect(result.success).toBe(false);
  });

  it("rejects quote with string price field", () => {
    const badType = { ...finnhubQuoteFixture, c: "175.5" };
    const result = v.safeParse(FinnhubQuoteSchema, badType);
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = v.safeParse(FinnhubQuoteSchema, null);
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = v.safeParse(FinnhubQuoteSchema, {});
    expect(result.success).toBe(false);
  });
});

// ── Contract: FinnhubCandleSchema ─────────────────────────────────────────────

describe("Finnhub candle schema contract", () => {
  it("accepts canonical 'ok' candle fixture with all arrays", () => {
    const result = v.safeParse(FinnhubCandleSchema, finnhubCandleOkFixture);
    expect(result.success).toBe(true);
  });

  it("accepts 'no_data' candle fixture (no arrays needed)", () => {
    const result = v.safeParse(FinnhubCandleSchema, finnhubCandleNoDataFixture);
    expect(result.success).toBe(true);
  });

  it("'ok' candle output has status 'ok'", () => {
    const result = v.safeParse(FinnhubCandleSchema, finnhubCandleOkFixture);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.output.s).toBe("ok");
  });

  it("'ok' candle output has timestamp array", () => {
    const result = v.safeParse(FinnhubCandleSchema, finnhubCandleOkFixture);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.output.t).toHaveLength(2);
  });

  it("candle arrays have the same length in fixture", () => {
    // Contract: all arrays must be the same length
    const { t, o, h, l, c, v } = finnhubCandleOkFixture;
    expect(t.length).toBe(o.length);
    expect(o.length).toBe(h.length);
    expect(h.length).toBe(l.length);
    expect(l.length).toBe(c.length);
    expect(c.length).toBe(v.length);
  });

  it("rejects candle with invalid status literal", () => {
    const bad = { s: "error" };
    const result = v.safeParse(FinnhubCandleSchema, bad);
    expect(result.success).toBe(false);
  });

  it("rejects candle with missing status field", () => {
    const { o, h, l, c, v: vol } = finnhubCandleOkFixture;
    const result = v.safeParse(FinnhubCandleSchema, { o, h, l, c, v: vol });
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = v.safeParse(FinnhubCandleSchema, null);
    expect(result.success).toBe(false);
  });
});

// ── Contract: FinnhubSearchSchema ─────────────────────────────────────────────

describe("Finnhub search schema contract", () => {
  it("accepts canonical search fixture with result array", () => {
    const result = v.safeParse(FinnhubSearchSchema, finnhubSearchFixture);
    expect(result.success).toBe(true);
  });

  it("accepts empty result array", () => {
    const result = v.safeParse(FinnhubSearchSchema, finnhubSearchEmptyFixture);
    expect(result.success).toBe(true);
  });

  it("accepts fixture with missing result field (optional)", () => {
    const result = v.safeParse(FinnhubSearchSchema, finnhubSearchNoResultFixture);
    expect(result.success).toBe(true);
  });

  it("search item has required string fields: description, displaySymbol, symbol, type", () => {
    const result = v.safeParse(FinnhubSearchSchema, finnhubSearchFixture);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const items = result.output.result ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(typeof item.description).toBe("string");
      expect(typeof item.displaySymbol).toBe("string");
      expect(typeof item.symbol).toBe("string");
      expect(typeof item.type).toBe("string");
    }
  });

  it("first search result matches fixture symbol", () => {
    const result = v.safeParse(FinnhubSearchSchema, finnhubSearchFixture);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.output.result?.[0].symbol).toBe("AAPL");
  });

  it("rejects item missing required 'symbol' field", () => {
    const badItem = {
      result: [
        {
          description: "APPLE INC",
          displaySymbol: "AAPL",
          // symbol: missing
          type: "Common Stock",
        },
      ],
    };
    const result = v.safeParse(FinnhubSearchSchema, badItem);
    expect(result.success).toBe(false);
  });

  it("rejects item with numeric 'description' field", () => {
    const badType = {
      result: [
        {
          description: 12345,
          displaySymbol: "AAPL",
          symbol: "AAPL",
          type: "Common Stock",
        },
      ],
    };
    const result = v.safeParse(FinnhubSearchSchema, badType);
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = v.safeParse(FinnhubSearchSchema, null);
    expect(result.success).toBe(false);
  });
});

// ── Cross-schema invariant: Finnhub candle lengths ────────────────────────────

describe("Finnhub data invariants", () => {
  it("'ok' candle fixture: all arrays share the same length", () => {
    const result = v.safeParse(FinnhubCandleSchema, finnhubCandleOkFixture);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const { t = [], o = [], h = [], l = [], c = [], v: vol = [] } = result.output;
    const len = t.length;
    expect(o).toHaveLength(len);
    expect(h).toHaveLength(len);
    expect(l).toHaveLength(len);
    expect(c).toHaveLength(len);
    expect(vol).toHaveLength(len);
  });

  it("quote high >= low in fixture", () => {
    expect(finnhubQuoteFixture.h).toBeGreaterThanOrEqual(finnhubQuoteFixture.l);
  });

  it("candle high >= low for each bar in fixture", () => {
    const { h, l } = finnhubCandleOkFixture;
    for (let i = 0; i < h.length; i++) {
      expect(h[i]).toBeGreaterThanOrEqual(l[i]);
    }
  });
});
