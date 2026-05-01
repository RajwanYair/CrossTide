import { describe, it, expect } from "vitest";
import { detectMaCrossovers, crossoverFlags } from "../../../src/domain/ma-crossover";

describe("ma-crossover", () => {
  it("empty inputs return no events", () => {
    expect(detectMaCrossovers([], [])).toEqual([]);
  });

  it("detects golden cross (fast crosses above slow)", () => {
    const fast = [1, 2, 3, 5, 7];
    const slow = [4, 4, 4, 4, 4];
    const ev = detectMaCrossovers(fast, slow);
    expect(ev.length).toBe(1);
    expect(ev[0]!.kind).toBe("golden");
    expect(ev[0]!.index).toBe(3);
  });

  it("detects death cross (fast crosses below slow)", () => {
    const fast = [10, 8, 6, 3, 1];
    const slow = [5, 5, 5, 5, 5];
    const ev = detectMaCrossovers(fast, slow);
    expect(ev.length).toBe(1);
    expect(ev[0]!.kind).toBe("death");
    expect(ev[0]!.index).toBe(3);
  });

  it("multiple crossovers in sequence", () => {
    const fast = [1, 5, 1, 5, 1];
    const slow = [3, 3, 3, 3, 3];
    const ev = detectMaCrossovers(fast, slow);
    expect(ev.length).toBe(4);
    expect(ev.map((e) => e.kind)).toEqual(["golden", "death", "golden", "death"]);
  });

  it("ignores leading nulls (warm-up)", () => {
    const fast = [null, null, 2, 6];
    const slow = [null, null, 4, 4];
    const ev = detectMaCrossovers(fast, slow);
    expect(ev.length).toBe(1);
    expect(ev[0]!.index).toBe(3);
  });

  it("no false event on equal then move", () => {
    const fast = [3, 3, 5];
    const slow = [3, 3, 3];
    const ev = detectMaCrossovers(fast, slow);
    // first non-zero sign establishes baseline; no cross
    expect(ev.length).toBe(0);
  });

  it("crossoverFlags marks event indices", () => {
    const fast = [1, 5, 1];
    const slow = [3, 3, 3];
    const flags = crossoverFlags(fast, slow);
    expect(flags[0]).toBeNull();
    expect(flags[1]).toBe("golden");
    expect(flags[2]).toBe("death");
  });

  it("truncates to shortest length", () => {
    const fast = [1, 2, 3, 5, 9, 9, 9];
    const slow = [4, 4, 4];
    const ev = detectMaCrossovers(fast, slow);
    expect(ev.length).toBe(0);
  });
});
