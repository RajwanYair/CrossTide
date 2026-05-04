import { describe, it, expect } from "vitest";
import {
  calculateSurprise,
  batchSurprises,
  beatRate,
  averageSurprise,
  topBeats,
  topMisses,
  beatStreak,
  classifySurprise,
} from "../../../src/domain/earnings-surprise";

describe("earnings-surprise", () => {
  const results = [
    { ticker: "AAPL", date: "2026-01-25", actualEps: 2.1, estimatedEps: 2.0 },
    { ticker: "MSFT", date: "2026-01-25", actualEps: 3.0, estimatedEps: 2.8 },
    { ticker: "GOOG", date: "2026-01-25", actualEps: 1.5, estimatedEps: 1.8 },
  ];

  it("calculateSurprise detects beat", () => {
    const s = calculateSurprise(results[0]!);
    expect(s.beat).toBe(true);
    expect(s.surpriseAmount).toBeCloseTo(0.1, 5);
    expect(s.surprisePercent).toBeCloseTo(5, 1);
  });

  it("calculateSurprise detects miss", () => {
    const s = calculateSurprise(results[2]!);
    expect(s.beat).toBe(false);
    expect(s.surpriseAmount).toBeCloseTo(-0.3, 5);
  });

  it("calculateSurprise includes revenue surprise", () => {
    const s = calculateSurprise({
      ticker: "AAPL",
      date: "2026-01-25",
      actualEps: 2.0,
      estimatedEps: 2.0,
      revenue: 110,
      estimatedRevenue: 100,
    });
    expect(s.revenueSurprisePercent).toBeCloseTo(10, 5);
  });

  it("batchSurprises processes all results", () => {
    const surprises = batchSurprises(results);
    expect(surprises).toHaveLength(3);
  });

  it("beatRate returns correct ratio", () => {
    const surprises = batchSurprises(results);
    expect(beatRate(surprises)).toBeCloseTo(2 / 3, 3);
  });

  it("averageSurprise computes mean", () => {
    const surprises = batchSurprises(results);
    const avg = averageSurprise(surprises);
    expect(typeof avg).toBe("number");
  });

  it("topBeats returns sorted beats", () => {
    const surprises = batchSurprises(results);
    const beats = topBeats(surprises, 2);
    expect(beats).toHaveLength(2);
    expect(beats[0]!.surprisePercent).toBeGreaterThanOrEqual(beats[1]!.surprisePercent);
  });

  it("topMisses returns sorted misses", () => {
    const surprises = batchSurprises(results);
    const misses = topMisses(surprises, 5);
    expect(misses).toHaveLength(1);
    expect(misses[0]!.ticker).toBe("GOOG");
  });

  it("beatStreak counts consecutive beats from end", () => {
    const surprises = [
      {
        ticker: "A",
        date: "2026-01",
        surpriseAmount: -1,
        surprisePercent: -5,
        beat: false,
        revenueSurprisePercent: null,
      },
      {
        ticker: "A",
        date: "2026-04",
        surpriseAmount: 1,
        surprisePercent: 5,
        beat: true,
        revenueSurprisePercent: null,
      },
      {
        ticker: "A",
        date: "2026-07",
        surpriseAmount: 1,
        surprisePercent: 3,
        beat: true,
        revenueSurprisePercent: null,
      },
    ];
    expect(beatStreak(surprises)).toBe(2);
  });

  it("classifySurprise categorizes correctly", () => {
    expect(classifySurprise(25)).toBe("massive-beat");
    expect(classifySurprise(5)).toBe("beat");
    expect(classifySurprise(0)).toBe("inline");
    expect(classifySurprise(-10)).toBe("miss");
    expect(classifySurprise(-30)).toBe("massive-miss");
  });

  it("beatRate returns 0 for empty", () => {
    expect(beatRate([])).toBe(0);
  });
});
