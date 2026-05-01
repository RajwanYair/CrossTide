/**
 * Tier promotion / demotion policy for the tiered cache (memory → IDB →
 * network). Pure decision module: given access stats and tier sizes,
 * decide which keys to promote (move to a faster tier) and which to
 * demote / evict (move out of the slower tier).
 */

export type Tier = "hot" | "warm" | "cold";

export interface AccessRecord {
  readonly key: string;
  readonly tier: Tier;
  readonly hits: number;
  readonly lastAccessMs: number;
  readonly bytes: number;
}

export interface PolicyOptions {
  readonly maxHotItems: number;
  readonly maxHotBytes: number;
  readonly maxWarmItems: number;
  /** Hits required in window to promote warm→hot. */
  readonly promotionHits: number;
  /** Idle ms after which a hot item demotes to warm. */
  readonly hotIdleMs: number;
}

export interface PolicyDecision {
  readonly promote: readonly { key: string; from: Tier; to: Tier }[];
  readonly demote: readonly { key: string; from: Tier; to: Tier }[];
  readonly evict: readonly string[];
}

const DEFAULT_OPTIONS: PolicyOptions = {
  maxHotItems: 64,
  maxHotBytes: 4 * 1024 * 1024,
  maxWarmItems: 512,
  promotionHits: 3,
  hotIdleMs: 5 * 60 * 1000,
};

export function decide(
  records: readonly AccessRecord[],
  now: number,
  options: Partial<PolicyOptions> = {},
): PolicyDecision {
  const opt = { ...DEFAULT_OPTIONS, ...options };
  const promote: { key: string; from: Tier; to: Tier }[] = [];
  const demote: { key: string; from: Tier; to: Tier }[] = [];
  const evict: string[] = [];

  // Phase 1: warm items hot enough to promote.
  for (const r of records) {
    if (r.tier === "warm" && r.hits >= opt.promotionHits) {
      promote.push({ key: r.key, from: "warm", to: "hot" });
    }
    if (r.tier === "cold" && r.hits >= opt.promotionHits) {
      promote.push({ key: r.key, from: "cold", to: "warm" });
    }
  }

  // Phase 2: hot items that have gone idle.
  for (const r of records) {
    if (r.tier === "hot" && now - r.lastAccessMs >= opt.hotIdleMs) {
      demote.push({ key: r.key, from: "hot", to: "warm" });
    }
  }

  // Phase 3: enforce size caps on hot tier (LRU by lastAccessMs).
  const hotItems = records
    .filter((r) => r.tier === "hot")
    .filter((r) => !demote.some((d) => d.key === r.key));
  const sortedHot = [...hotItems].sort((a, b) => a.lastAccessMs - b.lastAccessMs);
  let totalBytes = sortedHot.reduce((s, r) => s + r.bytes, 0);
  let count = sortedHot.length;
  for (const r of sortedHot) {
    if (count <= opt.maxHotItems && totalBytes <= opt.maxHotBytes) break;
    demote.push({ key: r.key, from: "hot", to: "warm" });
    count--;
    totalBytes -= r.bytes;
  }

  // Phase 4: enforce warm size cap (evict to cold/storage by LRU).
  const warmItems = records
    .filter((r) => r.tier === "warm")
    .filter((r) => !promote.some((p) => p.key === r.key));
  const sortedWarm = [...warmItems].sort((a, b) => a.lastAccessMs - b.lastAccessMs);
  let warmCount = sortedWarm.length + demote.filter((d) => d.to === "warm").length;
  for (const r of sortedWarm) {
    if (warmCount <= opt.maxWarmItems) break;
    evict.push(r.key);
    warmCount--;
  }

  return { promote, demote, evict };
}
