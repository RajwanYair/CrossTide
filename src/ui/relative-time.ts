/**
 * Relative time formatter: "just now", "5m ago", "2h ago", "yesterday",
 * "3d ago", "2w ago", "Mar 5". Uses `Intl.RelativeTimeFormat` for the
 * shorthand units and locale-aware dates beyond a week.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export interface RelativeTimeOptions {
  readonly locale?: string;
  readonly now?: number;
  readonly numeric?: "auto" | "always";
}

const cache = new Map<string, Intl.RelativeTimeFormat>();
const dateFmtCache = new Map<string, Intl.DateTimeFormat>();

const getRtf = (locale: string, numeric: "auto" | "always"): Intl.RelativeTimeFormat => {
  const key = `${locale}|${numeric}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.RelativeTimeFormat(locale, { numeric, style: "short" });
    cache.set(key, f);
  }
  return f;
};

const getDateFmt = (locale: string, sameYear: boolean): Intl.DateTimeFormat => {
  const key = `${locale}|${sameYear}`;
  let f = dateFmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, sameYear
      ? { month: "short", day: "numeric" }
      : { year: "numeric", month: "short", day: "numeric" });
    dateFmtCache.set(key, f);
  }
  return f;
};

export function formatRelativeTime(
  time: number,
  options: RelativeTimeOptions = {},
): string {
  const now = options.now ?? Date.now();
  const locale = options.locale ?? "en-US";
  const numeric = options.numeric ?? "auto";
  const diff = time - now; // negative = past
  const abs = Math.abs(diff);
  const rtf = getRtf(locale, numeric);

  if (abs < 30 * SECOND) return "just now";
  if (abs < MINUTE) return rtf.format(Math.round(diff / SECOND), "second");
  if (abs < HOUR) return rtf.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), "hour");
  if (abs < WEEK) return rtf.format(Math.round(diff / DAY), "day");
  // Beyond a week: locale date.
  const d = new Date(time);
  const sameYear = d.getUTCFullYear() === new Date(now).getUTCFullYear();
  return getDateFmt(locale, sameYear).format(d);
}

/** Clear internal Intl caches (useful in tests). */
export function _clearRelativeTimeCache(): void {
  cache.clear();
  dateFmtCache.clear();
}
