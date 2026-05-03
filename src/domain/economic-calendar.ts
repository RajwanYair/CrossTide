/**
 * Economic calendar domain helpers (I10).
 *
 * Parse, classify and filter macro-economic events (FOMC, CPI, NFP, GDP,
 * PMI, etc.).  Events come from an upstream API or RSS feed and are
 * normalised into `EconEvent` records.
 *
 * Exports:
 *   - `EventImpact` — High | Medium | Low
 *   - `EventCategory` — enum of macro categories
 *   - `parseEconEvent(raw)` — normalise a raw API record
 *   - `filterByImpact(events, min)` — keep ≥ impact
 *   - `filterByCountry(events, iso)` — keep matching ISO-3166 code
 *   - `filterByDateRange(events, from, to)` — date window
 *   - `groupByDate(events)` — Map<dateStr, EconEvent[]>
 *   - `groupByCountry(events)` — Map<iso, EconEvent[]>
 *   - `nextEvent(events, now)` — nearest future event
 *   - `classifyImpact(title)` — heuristic impact from title keywords
 *   - `classifyCategory(title)` — heuristic category
 *   - `formatSurprise(actual, forecast)` — "beat" | "miss" | "inline"
 *   - `surprisePct(actual, forecast)` — percentage surprise
 *   - `isMarketMoving(event)` — true for high-impact with surprise
 */

// ── Types ─────────────────────────────────────────────────────────────────

export enum EventImpact {
  High = "high",
  Medium = "medium",
  Low = "low",
}

export enum EventCategory {
  Employment = "employment",
  Inflation = "inflation",
  Growth = "growth",
  CentralBank = "central-bank",
  Manufacturing = "manufacturing",
  Housing = "housing",
  Consumer = "consumer",
  Trade = "trade",
  Other = "other",
}

export interface EconEvent {
  id: string;
  title: string;
  country: string; // ISO-3166-1 alpha-2
  dateTime: number; // epoch ms
  impact: EventImpact;
  category: EventCategory;
  forecast?: number | undefined;
  actual?: number | undefined;
  previous?: number | undefined;
}

export interface RawEconEvent {
  id?: string;
  title?: string;
  country?: string;
  date?: string | number;
  impact?: string;
  category?: string;
  forecast?: number | string | null;
  actual?: number | string | null;
  previous?: number | string | null;
}

export type SurpriseDirection = "beat" | "miss" | "inline";

// ── Parsing ───────────────────────────────────────────────────────────────

/** Normalise a raw API record into a typed EconEvent. */
export function parseEconEvent(raw: RawEconEvent): EconEvent {
  const title = String(raw.title ?? "").trim();
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    title,
    country: String(raw.country ?? "US")
      .toUpperCase()
      .slice(0, 2),
    dateTime: parseDate(raw.date),
    impact: parseImpact(raw.impact) ?? classifyImpact(title),
    category: parseCategory(raw.category) ?? classifyCategory(title),
    forecast: toNum(raw.forecast),
    actual: toNum(raw.actual),
    previous: toNum(raw.previous),
  };
}

function parseDate(d: string | number | undefined): number {
  if (typeof d === "number") return d;
  if (typeof d === "string") {
    const ms = Date.parse(d);
    return Number.isNaN(ms) ? Date.now() : ms;
  }
  return Date.now();
}

function parseImpact(s: string | undefined): EventImpact | undefined {
  if (!s) return undefined;
  const lower = s.toLowerCase();
  if (lower === "high") return EventImpact.High;
  if (lower === "medium" || lower === "med") return EventImpact.Medium;
  if (lower === "low") return EventImpact.Low;
  return undefined;
}

function parseCategory(s: string | undefined): EventCategory | undefined {
  if (!s) return undefined;
  const lower = s.toLowerCase().replace(/[^a-z]/g, "");
  const map: Record<string, EventCategory> = {
    employment: EventCategory.Employment,
    inflation: EventCategory.Inflation,
    growth: EventCategory.Growth,
    centralbank: EventCategory.CentralBank,
    manufacturing: EventCategory.Manufacturing,
    housing: EventCategory.Housing,
    consumer: EventCategory.Consumer,
    trade: EventCategory.Trade,
  };
  return map[lower];
}

function toNum(v: number | string | null | undefined): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? undefined : n;
}

// ── Filters ───────────────────────────────────────────────────────────────

const IMPACT_RANK: Record<EventImpact, number> = {
  [EventImpact.High]: 3,
  [EventImpact.Medium]: 2,
  [EventImpact.Low]: 1,
};

/** Keep events with impact ≥ minImpact. */
export function filterByImpact(events: EconEvent[], minImpact: EventImpact): EconEvent[] {
  const minRank = IMPACT_RANK[minImpact];
  return events.filter((e) => IMPACT_RANK[e.impact] >= minRank);
}

/** Keep events matching a specific country code (case-insensitive). */
export function filterByCountry(events: EconEvent[], iso: string): EconEvent[] {
  const code = iso.toUpperCase();
  return events.filter((e) => e.country === code);
}

/** Keep events within a date range [from, to] (epoch ms, inclusive). */
export function filterByDateRange(events: EconEvent[], from: number, to: number): EconEvent[] {
  return events.filter((e) => e.dateTime >= from && e.dateTime <= to);
}

// ── Grouping ──────────────────────────────────────────────────────────────

/** Group events by date string (YYYY-MM-DD). */
export function groupByDate(events: EconEvent[]): Map<string, EconEvent[]> {
  const map = new Map<string, EconEvent[]>();
  for (const e of events) {
    const key = new Date(e.dateTime).toISOString().slice(0, 10);
    const list = map.get(key);
    if (list) list.push(e);
    else map.set(key, [e]);
  }
  return map;
}

/** Group events by country code. */
export function groupByCountry(events: EconEvent[]): Map<string, EconEvent[]> {
  const map = new Map<string, EconEvent[]>();
  for (const e of events) {
    const list = map.get(e.country);
    if (list) list.push(e);
    else map.set(e.country, [e]);
  }
  return map;
}

// ── Lookups ───────────────────────────────────────────────────────────────

/**
 * Find the nearest future event from `now` (epoch ms).
 * Events must be sorted by dateTime ascending for optimal performance,
 * but this performs a full scan for safety.
 */
export function nextEvent(events: EconEvent[], now: number = Date.now()): EconEvent | undefined {
  let best: EconEvent | undefined;
  let bestDist = Infinity;
  for (const e of events) {
    const dist = e.dateTime - now;
    if (dist > 0 && dist < bestDist) {
      best = e;
      bestDist = dist;
    }
  }
  return best;
}

// ── Heuristic classifiers ─────────────────────────────────────────────────

const HIGH_KEYWORDS =
  /\b(nfp|non.?farm|fomc|fed\s+rate|cpi|gdp|pce|unemployment\s+rate|payroll)\b/i;
const MEDIUM_KEYWORDS =
  /\b(pmi|ism|retail\s+sales|housing\s+starts|consumer\s+confidence|durable\s+goods|trade\s+balance|initial\s+claims)\b/i;

/** Heuristic impact classification from event title. */
export function classifyImpact(title: string): EventImpact {
  if (HIGH_KEYWORDS.test(title)) return EventImpact.High;
  if (MEDIUM_KEYWORDS.test(title)) return EventImpact.Medium;
  return EventImpact.Low;
}

const CATEGORY_RULES: [RegExp, EventCategory][] = [
  [/\b(nfp|non.?farm|payroll|employment|unemployment|claims|jobs)\b/i, EventCategory.Employment],
  [/\b(cpi|pce|inflation|price\s+index)\b/i, EventCategory.Inflation],
  [/\b(gdp|growth)\b/i, EventCategory.Growth],
  [
    /\b(fomc|fed|boe|ecb|boj|rba|central\s+bank|rate\s+decision|minutes)\b/i,
    EventCategory.CentralBank,
  ],
  [/\b(pmi|ism|manufacturing|factory|industrial)\b/i, EventCategory.Manufacturing],
  [/\b(housing|home\s+sales|building\s+permits|starts)\b/i, EventCategory.Housing],
  [/\b(retail|consumer|confidence|sentiment)\b/i, EventCategory.Consumer],
  [/\b(trade|exports|imports|balance)\b/i, EventCategory.Trade],
];

/** Heuristic category classification from event title. */
export function classifyCategory(title: string): EventCategory {
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(title)) return cat;
  }
  return EventCategory.Other;
}

// ── Surprise analysis ─────────────────────────────────────────────────────

/** Classify the direction of the surprise. */
export function formatSurprise(
  actual: number | undefined,
  forecast: number | undefined,
): SurpriseDirection {
  if (actual == null || forecast == null) return "inline";
  if (actual > forecast) return "beat";
  if (actual < forecast) return "miss";
  return "inline";
}

/** Percentage surprise relative to forecast. Returns 0 for missing data. */
export function surprisePct(actual: number | undefined, forecast: number | undefined): number {
  if (actual == null || forecast == null || forecast === 0) return 0;
  return ((actual - forecast) / Math.abs(forecast)) * 100;
}

/** True if this is a high-impact event with a meaningful surprise. */
export function isMarketMoving(event: EconEvent): boolean {
  if (event.impact !== EventImpact.High) return false;
  const pct = Math.abs(surprisePct(event.actual, event.forecast));
  return pct > 5;
}
