import { describe, it, expect } from "vitest";
import { computeAttribution } from "../../../src/domain/performance-attribution";
import type { SectorWeight } from "../../../src/domain/performance-attribution";

const twoSectors: SectorWeight[] = [
  {
    sector: "Tech",
    portfolioWeight: 0.6,
    benchmarkWeight: 0.4,
    portfolioReturn: 0.1,
    benchmarkReturn: 0.08,
  },
  {
    sector: "Healthcare",
    portfolioWeight: 0.4,
    benchmarkWeight: 0.6,
    portfolioReturn: 0.04,
    benchmarkReturn: 0.05,
  },
];

describe("computeAttribution", () => {
  it("returns null for empty sectors", () => {
    expect(computeAttribution([])).toBeNull();
  });

  it("returns null when portfolio weights do not sum to 1", () => {
    const bad: SectorWeight[] = [
      {
        sector: "A",
        portfolioWeight: 0.3,
        benchmarkWeight: 1,
        portfolioReturn: 0.1,
        benchmarkReturn: 0.05,
      },
    ];
    expect(computeAttribution(bad)).toBeNull();
  });

  it("returns null when benchmark weights do not sum to 1", () => {
    const bad: SectorWeight[] = [
      {
        sector: "A",
        portfolioWeight: 1,
        benchmarkWeight: 0.5,
        portfolioReturn: 0.1,
        benchmarkReturn: 0.05,
      },
    ];
    expect(computeAttribution(bad)).toBeNull();
  });

  it("returns null for negative weights", () => {
    const bad: SectorWeight[] = [
      {
        sector: "A",
        portfolioWeight: -0.5,
        benchmarkWeight: 1,
        portfolioReturn: 0.1,
        benchmarkReturn: 0.05,
      },
      {
        sector: "B",
        portfolioWeight: 1.5,
        benchmarkWeight: 0,
        portfolioReturn: 0.02,
        benchmarkReturn: 0.03,
      },
    ];
    expect(computeAttribution(bad)).toBeNull();
  });

  it("computes correct portfolio and benchmark returns", () => {
    const result = computeAttribution(twoSectors)!;
    expect(result).not.toBeNull();
    // Portfolio: 0.6*0.1 + 0.4*0.04 = 0.076
    expect(result.portfolioReturn).toBeCloseTo(0.076, 6);
    // Benchmark: 0.4*0.08 + 0.6*0.05 = 0.062
    expect(result.benchmarkReturn).toBeCloseTo(0.062, 6);
    expect(result.excessReturn).toBeCloseTo(0.014, 6);
  });

  it("effects sum to excess return", () => {
    const result = computeAttribution(twoSectors)!;
    const totalEffect = result.totalAllocation + result.totalSelection + result.totalInteraction;
    expect(totalEffect).toBeCloseTo(result.excessReturn, 6);
  });

  it("per-sector total = allocation + selection + interaction", () => {
    const result = computeAttribution(twoSectors)!;
    for (const e of result.effects) {
      expect(e.total).toBeCloseTo(e.allocation + e.selection + e.interaction, 8);
    }
  });

  it("returns correct number of effects", () => {
    const result = computeAttribution(twoSectors)!;
    expect(result.effects.length).toBe(2);
    expect(result.effects[0]!.sector).toBe("Tech");
    expect(result.effects[1]!.sector).toBe("Healthcare");
  });

  it("identical portfolio and benchmark yields zero effects", () => {
    const identical: SectorWeight[] = [
      {
        sector: "A",
        portfolioWeight: 0.5,
        benchmarkWeight: 0.5,
        portfolioReturn: 0.1,
        benchmarkReturn: 0.1,
      },
      {
        sector: "B",
        portfolioWeight: 0.5,
        benchmarkWeight: 0.5,
        portfolioReturn: 0.05,
        benchmarkReturn: 0.05,
      },
    ];
    const result = computeAttribution(identical)!;
    expect(result.excessReturn).toBeCloseTo(0, 8);
    expect(result.totalAllocation).toBeCloseTo(0, 8);
    expect(result.totalSelection).toBeCloseTo(0, 8);
    expect(result.totalInteraction).toBeCloseTo(0, 8);
  });

  it("single sector has zero allocation effect", () => {
    const single: SectorWeight[] = [
      {
        sector: "Market",
        portfolioWeight: 1,
        benchmarkWeight: 1,
        portfolioReturn: 0.12,
        benchmarkReturn: 0.08,
      },
    ];
    const result = computeAttribution(single)!;
    expect(result.effects[0]!.allocation).toBeCloseTo(0, 8);
    expect(result.effects[0]!.selection).toBeCloseTo(0.04, 6);
    expect(result.excessReturn).toBeCloseTo(0.04, 6);
  });

  it("overweight winning sector produces positive allocation", () => {
    // Tech: overweight (0.6 vs 0.4) and tech benchmark return (0.08) > total benchmark (0.062)
    const result = computeAttribution(twoSectors)!;
    const techEffect = result.effects.find((e) => e.sector === "Tech")!;
    expect(techEffect.allocation).toBeGreaterThan(0);
  });
});
