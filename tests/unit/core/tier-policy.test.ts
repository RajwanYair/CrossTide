import { describe, it, expect } from "vitest";
import { decide, type AccessRecord } from "../../../src/core/tier-policy";

const rec = (
  key: string,
  tier: AccessRecord["tier"],
  hits: number,
  lastAccessMs: number,
  bytes = 100,
): AccessRecord => ({ key, tier, hits, lastAccessMs, bytes });

describe("tier-policy", () => {
  it("empty records produce empty decision", () => {
    const d = decide([], 0);
    expect(d.promote).toHaveLength(0);
    expect(d.demote).toHaveLength(0);
    expect(d.evict).toHaveLength(0);
  });

  it("promotes warm items above hit threshold", () => {
    const d = decide([rec("a", "warm", 5, 0), rec("b", "warm", 1, 0)], 0, {
      promotionHits: 3,
    });
    expect(d.promote).toEqual([{ key: "a", from: "warm", to: "hot" }]);
  });

  it("promotes cold items above hit threshold to warm", () => {
    const d = decide([rec("a", "cold", 5, 0)], 0, { promotionHits: 3 });
    expect(d.promote).toEqual([{ key: "a", from: "cold", to: "warm" }]);
  });

  it("demotes idle hot items", () => {
    const d = decide([rec("a", "hot", 1, 0)], 10_000, { hotIdleMs: 5000 });
    expect(d.demote).toEqual([{ key: "a", from: "hot", to: "warm" }]);
  });

  it("enforces maxHotItems with LRU demotion", () => {
    const d = decide(
      [rec("a", "hot", 1, 100), rec("b", "hot", 1, 200), rec("c", "hot", 1, 300)],
      300,
      { maxHotItems: 2, hotIdleMs: 99_999 },
    );
    expect(d.demote.map((x) => x.key)).toContain("a");
  });

  it("enforces maxHotBytes", () => {
    const d = decide([rec("big", "hot", 1, 100, 5_000_000)], 100, {
      maxHotBytes: 1_000_000,
      hotIdleMs: 99_999,
    });
    expect(d.demote.map((x) => x.key)).toContain("big");
  });

  it("evicts excess warm items", () => {
    const records = [rec("a", "warm", 1, 100), rec("b", "warm", 1, 200), rec("c", "warm", 1, 300)];
    const d = decide(records, 300, { maxWarmItems: 1, promotionHits: 99 });
    expect(d.evict.length).toBe(2);
    expect(d.evict).toContain("a");
    expect(d.evict).toContain("b");
  });

  it("does not double-demote a key being promoted", () => {
    const d = decide([rec("hot1", "warm", 5, 0)], 999_999, { promotionHits: 3 });
    expect(d.promote).toHaveLength(1);
    expect(d.evict).toHaveLength(0);
  });
});
