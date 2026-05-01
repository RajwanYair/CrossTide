/**
 * Timezone helpers. Pure, dependency-free utilities for working with
 * IANA time zones via the Intl API.
 *
 *   - currentTimeZone(): IANA name from Intl runtime ("UTC" fallback)
 *   - timeZoneOffsetMinutes(date, tz): offset of `tz` from UTC at instant
 *   - formatInTimeZone(date, tz, opts): localized string in given tz
 */

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
