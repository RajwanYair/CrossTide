import { describe, it, expect } from "vitest";
import { computeElderImpulse } from "../../../src/domain/elder-impulse";

describe("elder-impulse", () => {
  it("empty / too short -> nulls", () => {
    expect(computeElderImpulse([])).toEqual([]);
    expect(computeElderImpulse([1, 2, 3]).every((v) => v === null)).toBe(true);
  });

  it("rejects bad params", () => {
    expect(computeElderImpulse([1, 2, 3], { emaPeriod: 0 }).every((v) => v === null)).toBe(true);
  });

  it("accelerating uptrend yields GREEN bars", () => {
    const data = Array.from({ length: 80 }, (_, i) => 100 + i * i * 0.05);
    const out = computeElderImpulse(data);
    expect(out.filter((v) => v === "GREEN").length).toBeGreaterThan(0);
    expect(out[out.length - 1]).toBe("GREEN");
  });

  it("accelerating downtrend yields RED bars", () => {
    const data = Array.from({ length: 80 }, (_, i) => 1000 - i * i * 0.05);
    const out = computeElderImpulse(data);
    expect(out.filter((v) => v === "RED").length).toBeGreaterThan(0);
    expect(out[out.length - 1]).toBe("RED");
  });

  it("mixed market -> BLUE appears", () => {
    const data = Array.from({ length: 80 }, (_, i) => 100 + Math.sin(i / 3) * 5);
    const out = computeElderImpulse(data);
    expect(out.some((v) => v === "BLUE")).toBe(true);
  });

  it("output length matches input", () => {
    const data = Array.from({ length: 40 }, (_, i) => i);
    expect(computeElderImpulse(data).length).toBe(40);
  });
});
