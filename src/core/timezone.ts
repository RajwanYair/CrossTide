/**
 * Timezone helpers. Pure utilities for working with IANA time zones.
 *
 *   - currentTimeZone(): IANA name from Intl runtime ("UTC" fallback)
 *   - timeZoneOffsetMinutes(date, tz): offset of `tz` from UTC at instant
 *   - formatInTimeZone(date, tz, opts): localized string in given tz
 *   - toPlainDate(date, tz): Temporal.PlainDate for wall-clock date in tz  (G7)
 *   - plainDateRange(from, to): ordered array of PlainDates (inclusive)    (G7)
 *   - addTradingDays(date, n, tz): advance by n weekdays                   (G7)
 *
 * Temporal polyfill: @js-temporal/polyfill is used so that code running in
 * Node / Vitest (which may not have native Temporal) behaves identically to
 * the browser build.  The polyfill is tree-shaken out whenever the runtime
 * already exposes a native `Temporal` global.
 */

// G7: import Temporal from the polyfill. The polyfill re-exports the native
// Temporal global when available, so there is no double-polyfill risk.
// P15: temporal-init.ts provides ensureTemporal() for conditional loading in
// the app entry point, allowing Vite to code-split the polyfill into a lazy
// chunk that is skipped on Chrome 131+ / Firefox 139+.
import { Temporal } from "@js-temporal/polyfill";
export { isTemporalNative, ensureTemporal } from "./temporal-init";

export { Temporal };

export function currentTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Offset of the given IANA tz from UTC at the given instant, in minutes.
 * Positive for zones east of UTC (e.g. Asia/Tokyo => 540).
 */
export function timeZoneOffsetMinutes(date: Date | number, timeZone: string): number {
  const d = typeof date === "number" ? new Date(date) : date;
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(d);
  const lookup: Record<string, string> = {};
  for (const p of parts) lookup[p.type] = p.value;
  const asUtcMs = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour) === 24 ? 0 : Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second),
  );
  return Math.round((asUtcMs - d.getTime()) / 60000);
}

export function formatInTimeZone(
  date: Date | number,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", { timeZone, ...options }).format(d);
}

// ── G7: Temporal-based helpers ────────────────────────────────────────────

/**
 * Convert a JS `Date` (or epoch ms) to a `Temporal.PlainDate` representing
 * the calendar date in the specified IANA time zone.
 *
 * @example
 *   toPlainDate(new Date("2024-01-15T23:00:00Z"), "America/New_York")
 *   // => Temporal.PlainDate { year: 2024, month: 1, day: 15 }
 */
export function toPlainDate(date: Date | number, timeZone = "UTC"): Temporal.PlainDate {
  const epochMs = typeof date === "number" ? date : date.getTime();
  const instant = Temporal.Instant.fromEpochMilliseconds(epochMs);
  return instant.toZonedDateTimeISO(timeZone).toPlainDate();
}

/**
 * Return an ordered, inclusive array of `Temporal.PlainDate` values covering
 * the range [`from`, `to`].  Both endpoints must be in the same calendar
 * (ISO 8601 assumed).  If `from` > `to` an empty array is returned.
 */
export function plainDateRange(
  from: Temporal.PlainDate,
  to: Temporal.PlainDate,
): Temporal.PlainDate[] {
  const result: Temporal.PlainDate[] = [];
  let current = from;
  while (Temporal.PlainDate.compare(current, to) <= 0) {
    result.push(current);
    current = current.add({ days: 1 });
  }
  return result;
}

/**
 * Advance `date` by `n` trading days (Mon–Fri), skipping weekends.
 * Supports negative `n` to go backwards.
 *
 * @param date - starting PlainDate (or convertible Date / epoch ms via `toPlainDate`)
 * @param n    - number of trading days to advance (may be negative)
 * @param timeZone - only used when `date` is a JS Date / epoch ms
 */
export function addTradingDays(
  date: Temporal.PlainDate | Date | number,
  n: number,
  timeZone = "UTC",
): Temporal.PlainDate {
  let current: Temporal.PlainDate =
    date instanceof Temporal.PlainDate ? date : toPlainDate(date, timeZone);
  const step = n >= 0 ? 1 : -1;
  let remaining = Math.abs(n);
  while (remaining > 0) {
    current = current.add({ days: step });
    // dayOfWeek: 1=Mon … 7=Sun per ISO 8601
    if (current.dayOfWeek <= 5) remaining -= 1;
  }
  return current;
}
