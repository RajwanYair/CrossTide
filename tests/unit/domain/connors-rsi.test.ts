import { describe, it, expect } from "vitest";
import { computeConnorsRsi } from "../../../src/domain/connors-rsi";

describe("connors-rsi", () => {
  it("rejects bad periods", () => {
    const data = Array.from({ length: 50 }, (_, i) => 100 + i);
    expect(computeConnorsRsi(data, 0).every((v) => v === null)).toBe(true);
    expect(computeConnorsRsi(data, 3, 0).every((v) => v === null)).toBe(true);
    expect(computeConnorsRsi(data, 3, 2, 0).every((v) => v === null)).toBe(true);
  });

  it("nulls until enough history (default 100)", () => {
    const out = computeConnorsRsi(Array.from({ length: 50 }, (_, i) => i + 1));
    expect(out.every((v) => v === null)).toBe(true);
  });

  it("uptrend -> high CRSI once defined", () => {
    const data = Array.from({ length: 150 }, (_, i) => 100 + i);
    const out = computeConnorsRsi(data);
    const last = out[out.length - 1]!;
    expect(last).toBeGreaterThan(50);
  });

  it("downtrend -> low CRSI once defined", () => {
    const data = Array.from({ length: 150 }, (_, i) => 1000 - i);
    const out = computeConnorsRsi(data);
    expect(out[out.length - 1]!).toBeLessThan(50);
  });

  it("output bounded in [0, 100]", () => {
    const data = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 5) * 10);
    const out = computeConnorsRsi(data);
    for (const v of out) {
      if (v === null) continue;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("output length equals input", () => {
    const data = Array.from({ length: 120 }, (_, i) => i);
    expect(computeConnorsRsi(data).length).toBe(120);
  });
});
