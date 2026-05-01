/**
 * Data freshness classifier. Maps an "age in milliseconds" to a
 * discrete freshness bucket and human-readable label, so cards can
 * render a "(stale 12s)" or "live" badge consistently.
 */

export type FreshnessBucket = "live" | "fresh" | "recent" | "stale" | "expired";

export interface FreshnessConfig {
  /** Up to this age, classify as "live". Default 2_000ms. */
  readonly liveMs?: number;
  /** Up to this age, classify as "fresh". Default 15_000ms. */
  readonly freshMs?: number;
  /** Up to this age, classify as "recent". Default 60_000ms. */
  readonly recentMs?: number;
  /** Up to this age, classify as "stale". Default 5 * 60_000. Beyond -> expired. */
  readonly staleMs?: number;
}

const DEFAULT: Required<FreshnessConfig> = {
  liveMs: 2_000,
  freshMs: 15_000,
  recentMs: 60_000,
  staleMs: 5 * 60_000,
};

export function classifyFreshness(ageMs: number, config: FreshnessConfig = {}): FreshnessBucket {
  const c = { ...DEFAULT, ...config };
  if (!Number.isFinite(ageMs) || ageMs < 0) return "expired";
  if (ageMs <= c.liveMs) return "live";
  if (ageMs <= c.freshMs) return "fresh";
  if (ageMs <= c.recentMs) return "recent";
  if (ageMs <= c.staleMs) return "stale";
  return "expired";
}

export function ageBetween(timestamp: number, now: number): number {
  return Math.max(0, now - timestamp);
}

/**
 * Compact human-readable age, e.g. "3s", "12s", "5m", "2h".
 */
export function formatAge(ageMs: number): string {
  if (!Number.isFinite(ageMs) || ageMs < 0) return "—";
  const sec = Math.round(ageMs / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h`;
  const day = Math.round(hr / 24);
  return `${day}d`;
}

export function freshnessLabel(
  timestamp: number,
  now: number,
  config?: FreshnessConfig,
): { bucket: FreshnessBucket; label: string } {
  const age = ageBetween(timestamp, now);
  const bucket = classifyFreshness(age, config);
  if (bucket === "live") return { bucket, label: "live" };
  if (bucket === "expired") return { bucket, label: "expired" };
  return { bucket, label: `${bucket} ${formatAge(age)}` };
}
