import { describe, it, expect } from "vitest";
import { computePpo } from "../../../src/domain/ppo";

describe("ppo", () => {
  it("rejects bad params / too short", () => {
    expect(computePpo([], 12, 26)).toEqual([]);
    expect(
      computePpo(
        Array.from({ length: 10 }, (_, i) => i),
        12,
        26,
      ),
    ).toEqual([]);
    expect(computePpo([1, 2, 3], 0)).toEqual([]);
  });

  it("constant series -> PPO = 0", () => {
    const out = computePpo(Array.from({ length: 60 }, () => 100));
    expect(out.length).toBeGreaterThan(0);
    for (const p of out) expect(p.ppo).toBeCloseTo(0, 9);
  });

  it("uptrend -> PPO eventually positive", () => {
    const out = computePpo(Array.from({ length: 60 }, (_, i) => 100 + i));
    expect(out[out.length - 1]!.ppo).toBeGreaterThan(0);
  });

  it("downtrend -> PPO eventually negative", () => {
    const out = computePpo(Array.from({ length: 60 }, (_, i) => 200 - i));
    expect(out[out.length - 1]!.ppo).toBeLessThan(0);
  });

  it("histogram = ppo - signal once both defined", () => {
    const out = computePpo(Array.from({ length: 80 }, (_, i) => 100 + Math.sin(i / 5) * 5));
    for (const p of out) {
      if (p.signal === null) continue;
      expect(p.histogram).not.toBeNull();
      expect(Math.abs(p.histogram! - (p.ppo - p.signal))).toBeLessThan(1e-9);
    }
  });

  it("first point has index >= slow-1", () => {
    const out = computePpo(
      Array.from({ length: 60 }, (_, i) => 100 + i),
      12,
      26,
      9,
    );
    expect(out[0]!.index).toBeGreaterThanOrEqual(25);
  });
});
