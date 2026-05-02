/**
 * Unit tests for economic calendar domain helpers (I10).
 */
import { describe, it, expect } from "vitest";
import {
  EventImpact,
  EventCategory,
  parseEconEvent,
  filterByImpact,
  filterByCountry,
  filterByDateRange,
  groupByDate,
  groupByCountry,
  nextEvent,
  classifyImpact,
  classifyCategory,
  formatSurprise,
  surprisePct,
  isMarketMoving,
} from "../../../src/domain/economic-calendar";
import type { EconEvent } from "../../../src/domain/economic-calendar";

// ── helpers ──────────────────────────────────────────────────────────────

function mkEvent(overrides: Partial<EconEvent> = {}): EconEvent {
  return {
    id: "e1",
    title: "CPI m/m",
    country: "US",
    dateTime: Date.parse("2025-07-01T08:30:00Z"),
    impact: EventImpact.High,
    category: EventCategory.Inflation,
    forecast: 0.3,
    actual: 0.4,
    previous: 0.2,
    ...overrides,
  };
}

// ── parseEconEvent ────────────────────────────────────────────────────────

describe("parseEconEvent", () => {
  it("parses a fully populated raw record", () => {
    const e = parseEconEvent({
      id: "abc",
      title: "CPI m/m",
      country: "us",
      date: "2025-07-01T08:30:00Z",
      impact: "high",
      category: "inflation",
      forecast: 0.3,
      actual: 0.4,
      previous: 0.2,
    });
    expect(e.id).toBe("abc");
    expect(e.country).toBe("US");
    expect(e.impact).toBe(EventImpact.High);
    expect(e.category).toBe(EventCategory.Inflation);
    expect(e.forecast).toBe(0.3);
    expect(e.actual).toBe(0.4);
  });

  it("handles numeric date", () => {
    const ts = 1719820200000;
    const e = parseEconEvent({ date: ts, title: "test" });
    expect(e.dateTime).toBe(ts);
  });

  it("handles missing fields with defaults", () => {
    const e = parseEconEvent({});
    expect(e.country).toBe("US");
    expect(e.title).toBe("");
    expect(e.forecast).toBeUndefined();
  });

  it("falls back to classifyImpact when impact missing", () => {
    const e = parseEconEvent({ title: "Non-Farm Payrolls" });
    expect(e.impact).toBe(EventImpact.High);
  });

  it("falls back to classifyCategory when category missing", () => {
    const e = parseEconEvent({ title: "GDP Growth Rate" });
    expect(e.category).toBe(EventCategory.Growth);
  });

  it("parses string numbers", () => {
    const e = parseEconEvent({ title: "test", forecast: "1.5", actual: "1.6" });
    expect(e.forecast).toBe(1.5);
    expect(e.actual).toBe(1.6);
  });

  it("handles non-parseable numbers as undefined", () => {
    const e = parseEconEvent({ title: "test", forecast: "n/a" });
    expect(e.forecast).toBeUndefined();
  });
});

// ── filterByImpact ────────────────────────────────────────────────────────

describe("filterByImpact", () => {
  const events = [
    mkEvent({ id: "1", impact: EventImpact.High }),
    mkEvent({ id: "2", impact: EventImpact.Medium }),
    mkEvent({ id: "3", impact: EventImpact.Low }),
  ];

  it("filters High: keeps only high", () => {
    expect(filterByImpact(events, EventImpact.High)).toHaveLength(1);
  });

  it("filters Medium: keeps high + medium", () => {
    expect(filterByImpact(events, EventImpact.Medium)).toHaveLength(2);
  });

  it("filters Low: keeps all", () => {
    expect(filterByImpact(events, EventImpact.Low)).toHaveLength(3);
  });
});

// ── filterByCountry ───────────────────────────────────────────────────────

describe("filterByCountry", () => {
  it("matches country code case-insensitive", () => {
    const events = [mkEvent({ country: "US" }), mkEvent({ country: "GB" })];
    expect(filterByCountry(events, "us")).toHaveLength(1);
    expect(filterByCountry(events, "GB")).toHaveLength(1);
  });

  it("returns empty for no match", () => {
    expect(filterByCountry([mkEvent()], "JP")).toHaveLength(0);
  });
});

// ── filterByDateRange ─────────────────────────────────────────────────────

describe("filterByDateRange", () => {
  it("filters by inclusive date range", () => {
    const base = Date.parse("2025-07-01T00:00:00Z");
    const events = [
      mkEvent({ dateTime: base }),
      mkEvent({ dateTime: base + 86_400_000 }),
      mkEvent({ dateTime: base + 172_800_000 }),
    ];
    const result = filterByDateRange(events, base, base + 86_400_000);
    expect(result).toHaveLength(2);
  });
});

// ── groupByDate ───────────────────────────────────────────────────────────

describe("groupByDate", () => {
  it("groups events by YYYY-MM-DD", () => {
    const events = [
      mkEvent({ dateTime: Date.parse("2025-07-01T08:30:00Z") }),
      mkEvent({ dateTime: Date.parse("2025-07-01T14:00:00Z") }),
      mkEvent({ dateTime: Date.parse("2025-07-02T08:30:00Z") }),
    ];
    const groups = groupByDate(events);
    expect(groups.size).toBe(2);
    expect(groups.get("2025-07-01")).toHaveLength(2);
    expect(groups.get("2025-07-02")).toHaveLength(1);
  });
});

// ── groupByCountry ────────────────────────────────────────────────────────

describe("groupByCountry", () => {
  it("groups events by country code", () => {
    const events = [
      mkEvent({ country: "US" }),
      mkEvent({ country: "US" }),
      mkEvent({ country: "GB" }),
    ];
    const groups = groupByCountry(events);
    expect(groups.get("US")).toHaveLength(2);
    expect(groups.get("GB")).toHaveLength(1);
  });
});

// ── nextEvent ─────────────────────────────────────────────────────────────

describe("nextEvent", () => {
  it("finds nearest future event", () => {
    const now = 1000;
    const events = [
      mkEvent({ id: "past", dateTime: 500 }),
      mkEvent({ id: "soon", dateTime: 1500 }),
      mkEvent({ id: "later", dateTime: 3000 }),
    ];
    const next = nextEvent(events, now);
    expect(next?.id).toBe("soon");
  });

  it("returns undefined when no future events", () => {
    const events = [mkEvent({ dateTime: 100 })];
    expect(nextEvent(events, 200)).toBeUndefined();
  });

  it("returns undefined for empty array", () => {
    expect(nextEvent([], 100)).toBeUndefined();
  });
});

// ── classifyImpact ────────────────────────────────────────────────────────

describe("classifyImpact", () => {
  it("NFP → High", () => expect(classifyImpact("Non-Farm Payrolls")).toBe(EventImpact.High));
  it("CPI → High", () => expect(classifyImpact("CPI m/m")).toBe(EventImpact.High));
  it("FOMC → High", () => expect(classifyImpact("FOMC Rate Decision")).toBe(EventImpact.High));
  it("GDP → High", () => expect(classifyImpact("GDP q/q")).toBe(EventImpact.High));
  it("PMI → Medium", () => expect(classifyImpact("Manufacturing PMI")).toBe(EventImpact.Medium));
  it("Retail Sales → Medium", () =>
    expect(classifyImpact("Retail Sales m/m")).toBe(EventImpact.Medium));
  it("Unknown → Low", () => expect(classifyImpact("Some Minor Report")).toBe(EventImpact.Low));
});

// ── classifyCategory ──────────────────────────────────────────────────────

describe("classifyCategory", () => {
  it("NFP → Employment", () =>
    expect(classifyCategory("Non-Farm Payrolls")).toBe(EventCategory.Employment));
  it("CPI → Inflation", () => expect(classifyCategory("CPI m/m")).toBe(EventCategory.Inflation));
  it("GDP → Growth", () => expect(classifyCategory("GDP Growth Rate")).toBe(EventCategory.Growth));
  it("FOMC → CentralBank", () =>
    expect(classifyCategory("FOMC Minutes")).toBe(EventCategory.CentralBank));
  it("PMI → Manufacturing", () =>
    expect(classifyCategory("ISM Manufacturing PMI")).toBe(EventCategory.Manufacturing));
  it("Housing → Housing", () =>
    expect(classifyCategory("Housing Starts")).toBe(EventCategory.Housing));
  it("Retail → Consumer", () =>
    expect(classifyCategory("Retail Sales")).toBe(EventCategory.Consumer));
  it("Trade → Trade", () => expect(classifyCategory("Trade Balance")).toBe(EventCategory.Trade));
  it("Other fallback", () => expect(classifyCategory("Some Report")).toBe(EventCategory.Other));
});

// ── formatSurprise ────────────────────────────────────────────────────────

describe("formatSurprise", () => {
  it("beat", () => expect(formatSurprise(0.5, 0.3)).toBe("beat"));
  it("miss", () => expect(formatSurprise(0.1, 0.3)).toBe("miss"));
  it("inline when equal", () => expect(formatSurprise(0.3, 0.3)).toBe("inline"));
  it("inline when actual missing", () => expect(formatSurprise(undefined, 0.3)).toBe("inline"));
  it("inline when forecast missing", () => expect(formatSurprise(0.3, undefined)).toBe("inline"));
});

// ── surprisePct ───────────────────────────────────────────────────────────

describe("surprisePct", () => {
  it("positive surprise", () => {
    expect(surprisePct(1.1, 1.0)).toBeCloseTo(10, 1);
  });

  it("negative surprise", () => {
    expect(surprisePct(0.9, 1.0)).toBeCloseTo(-10, 1);
  });

  it("returns 0 for missing data", () => {
    expect(surprisePct(undefined, 1.0)).toBe(0);
    expect(surprisePct(1.0, undefined)).toBe(0);
  });

  it("returns 0 for zero forecast", () => {
    expect(surprisePct(1.0, 0)).toBe(0);
  });
});

// ── isMarketMoving ────────────────────────────────────────────────────────

describe("isMarketMoving", () => {
  it("high-impact with large surprise → true", () => {
    const e = mkEvent({ impact: EventImpact.High, actual: 0.5, forecast: 0.3 });
    expect(isMarketMoving(e)).toBe(true);
  });

  it("high-impact with small surprise → false", () => {
    const e = mkEvent({ impact: EventImpact.High, actual: 0.31, forecast: 0.3 });
    expect(isMarketMoving(e)).toBe(false);
  });

  it("medium-impact → false", () => {
    const e = mkEvent({ impact: EventImpact.Medium, actual: 1.0, forecast: 0.3 });
    expect(isMarketMoving(e)).toBe(false);
  });

  it("missing actual → false", () => {
    const e = mkEvent({ impact: EventImpact.High, actual: undefined });
    expect(isMarketMoving(e)).toBe(false);
  });
});
