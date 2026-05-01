/**
 * Moving-average crossover detector. Given two pre-computed series
 * (typically fast SMA/EMA over slow SMA/EMA), emits crossover events
 * with type "golden" (fast crosses above slow) or "death" (below).
 * The two series are aligned by index and may contain leading nulls
 * (warm-up period); only paired non-null bars are considered.
 */

export type CrossKind = "golden" | "death";

export interface MaCrossEvent {
  readonly index: number;
  readonly kind: CrossKind;
  readonly fast: number;
  readonly slow: number;
}

export function detectMaCrossovers(
  fast: readonly (number | null)[],
  slow: readonly (number | null)[],
): MaCrossEvent[] {
  const n = Math.min(fast.length, slow.length);
  const events: MaCrossEvent[] = [];
  let prevSign = 0; // -1, 0, +1
  for (let i = 0; i < n; i++) {
    const f = fast[i];
    const s = slow[i];
    if (f == null || s == null) continue;
    const diff = f - s;
    const sign = diff > 0 ? 1 : diff < 0 ? -1 : 0;
    if (prevSign !== 0 && sign !== 0 && sign !== prevSign) {
      events.push({
        index: i,
        kind: sign > 0 ? "golden" : "death",
        fast: f,
        slow: s,
      });
    }
    if (sign !== 0) prevSign = sign;
  }
  return events;
}

/** Boolean per index: true if a crossover happened at that bar. */
export function crossoverFlags(
  fast: readonly (number | null)[],
  slow: readonly (number | null)[],
): (CrossKind | null)[] {
  const n = Math.min(fast.length, slow.length);
  const out = new Array<CrossKind | null>(n).fill(null);
  for (const ev of detectMaCrossovers(fast, slow)) {
    out[ev.index] = ev.kind;
  }
  return out;
}
