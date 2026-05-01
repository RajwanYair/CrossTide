import { describe, it, expect } from "vitest";
import { seasonalityByMonth, seasonalityByDayOfWeek } from "../../../src/domain/seasonality";

const day = (year: number, month0: number, day1: number): number => Date.UTC(year, month0, day1);

describe("seasonality", () => {
  it("empty input returns empty", () => {
    expect(seasonalityByMonth([])).toEqual([]);
    expect(seasonalityByDayOfWeek([])).toEqual([]);
  });

  it("groups by month (UTC)", () => {
    const data = [
      { time: day(2025, 0, 5), returnFraction: 0.01 },
      { time: day(2025, 0, 12), returnFraction: -0.02 },
      { time: day(2025, 1, 1), returnFraction: 0.03 },
    ];
    const out = seasonalityByMonth(data);
    expect(out.length).toBe(2);
    const jan = out.find((b) => b.key === 0)!;
    expect(jan.count).toBe(2);
    expect(jan.label).toBe("Jan");
    expect(jan.meanReturn).toBeCloseTo(-0.005, 6);
    expect(jan.winRate).toBe(0.5);
  });

  it("groups by day-of-week (UTC)", () => {
    // 2025-01-05 is Sunday (UTC), 2025-01-06 Monday
    const data = [
      { time: day(2025, 0, 5), returnFraction: 0.01 },
      { time: day(2025, 0, 6), returnFraction: 0.02 },
      { time: day(2025, 0, 12), returnFraction: -0.01 }, // Sun
    ];
    const out = seasonalityByDayOfWeek(data);
    const sun = out.find((b) => b.key === 0)!;
    const mon = out.find((b) => b.key === 1)!;
    expect(sun.count).toBe(2);
    expect(sun.label).toBe("Sun");
    expect(mon.count).toBe(1);
    expect(mon.label).toBe("Mon");
  });

  it("winRate counts strictly positive returns", () => {
    const data = [
      { time: day(2025, 0, 1), returnFraction: 0 },
      { time: day(2025, 0, 2), returnFraction: 0.5 },
      { time: day(2025, 0, 3), returnFraction: -0.5 },
    ];
    const jan = seasonalityByMonth(data)[0]!;
    expect(jan.winRate).toBeCloseTo(1 / 3, 6);
  });

  it("buckets sorted by key ascending", () => {
    const data = [
      { time: day(2025, 11, 1), returnFraction: 0.01 },
      { time: day(2025, 0, 1), returnFraction: 0.01 },
      { time: day(2025, 5, 1), returnFraction: 0.01 },
    ];
    const out = seasonalityByMonth(data);
    expect(out.map((b) => b.key)).toEqual([0, 5, 11]);
  });
});
