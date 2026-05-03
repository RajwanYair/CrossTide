/**
 * Core date formatting & parsing utilities (R8).
 *
 * DOM-free, deterministic date helpers usable from domain/core/worker layers.
 * Pattern tokens: YYYY MM DD HH mm ss SSS
 *
 * This module supersedes `ui/date-format.ts` which now re-exports from here.
 */

const pad = (n: number, width: number): string => String(n).padStart(width, "0");

// ── Formatting ───────────────────────────────────────────────────────────

/** Format a Date or unix-ms timestamp using the given pattern. */
export function formatDate(d: Date | number, pattern: string): string {
  const date = typeof d === "number" ? new Date(d) : d;
  const Y = date.getUTCFullYear();
  const M = date.getUTCMonth() + 1;
  const D = date.getUTCDate();
  const H = date.getUTCHours();
  const m = date.getUTCMinutes();
  const s = date.getUTCSeconds();
  const ms = date.getUTCMilliseconds();
  return pattern
    .replace(/YYYY/g, pad(Y, 4))
    .replace(/MM/g, pad(M, 2))
    .replace(/DD/g, pad(D, 2))
    .replace(/HH/g, pad(H, 2))
    .replace(/mm/g, pad(m, 2))
    .replace(/SSS/g, pad(ms, 3))
    .replace(/ss/g, pad(s, 2));
}

/** Format as YYYY-MM-DD. */
export function isoDate(d: Date | number): string {
  return formatDate(d, "YYYY-MM-DD");
}

/** Format as HH:mm:ss. */
export function isoTime(d: Date | number): string {
  return formatDate(d, "HH:mm:ss");
}

/** Format as YYYY-MM-DDTHH:mm:ssZ. */
export function isoDateTime(d: Date | number): string {
  return formatDate(d, "YYYY-MM-DDTHH:mm:ssZ").replace("Z", "Z");
}

// ── Parsing ──────────────────────────────────────────────────────────────

/**
 * Parse a YYYY-MM-DD date string to a Date (midnight UTC).
 * Returns null for invalid input.
 */
export function parseIsoDate(s: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  const year = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10);
  const day = parseInt(match[3]!, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  // Validate round-trip (guards against Feb 30, etc.)
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return d;
}

// ── Relative time ────────────────────────────────────────────────────────

/**
 * Format a timestamp as a human-readable relative time string.
 * E.g., "3s ago", "2m ago", "5h ago", "2d ago".
 */
export function relativeTime(timestampMs: number, nowMs: number = Date.now()): string {
  const diffMs = nowMs - timestampMs;
  if (diffMs < 0) return "just now";
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Trading day helpers ──────────────────────────────────────────────────

/**
 * Check if a Date falls on a weekday (Mon–Fri).
 */
export function isWeekday(d: Date): boolean {
  const day = d.getUTCDay();
  return day >= 1 && day <= 5;
}

/**
 * Get the previous weekday. If d is Monday, returns the prior Friday.
 */
export function previousWeekday(d: Date): Date {
  const result = new Date(d.getTime());
  do {
    result.setUTCDate(result.getUTCDate() - 1);
  } while (!isWeekday(result));
  return result;
}

/**
 * Get the next weekday. If d is Friday, returns Monday.
 */
export function nextWeekday(d: Date): Date {
  const result = new Date(d.getTime());
  do {
    result.setUTCDate(result.getUTCDate() + 1);
  } while (!isWeekday(result));
  return result;
}

/**
 * Count trading days (weekdays) between two dates (inclusive of start, exclusive of end).
 */
export function tradingDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start.getTime());
  while (current < end) {
    if (isWeekday(current)) count++;
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return count;
}
