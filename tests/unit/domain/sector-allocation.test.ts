import { describe, it, expect } from "vitest";
import {
  calculateAllocations,
  herfindahlIndex,
  allocationSummary,
  overweightSectors,
  underweightSectors,
  deviationFromEqual,
} from "../../../src/domain/sector-allocation";

describe("sector-allocation", () => {
  const holdings = [
    { ticker: "AAPL", sector: "Technology", value: 5000 },
    { ticker: "MSFT", sector: "Technology", value: 3000 },
    { ticker: "JNJ", sector: "Healthcare", value: 2000 },
    { ticker: "XOM", sector: "Energy", value: 1000 },
  ];

  it("calculateAllocations returns sorted allocations", () => {
    const result = calculateAllocations(holdings);
    expect(result).toHaveLength(3);
    expect(result[0]!.sector).toBe("Technology");
    expect(result[0]!.weight).toBeCloseTo(0.7273, 3);
    expect(result[0]!.count).toBe(2);
  });

  it("calculateAllocations returns empty for no holdings", () => {
    expect(calculateAllocations([])).toEqual([]);
  });

  it("herfindahlIndex is 1 for single sector", () => {
    const allocs = calculateAllocations([
      { ticker: "AAPL", sector: "Tech", value: 100 },
      { ticker: "MSFT", sector: "Tech", value: 200 },
    ]);
    expect(herfindahlIndex(allocs)).toBeCloseTo(1, 5);
  });

  it("herfindahlIndex is low for diversified portfolio", () => {
    const diversified = [
      { ticker: "A", sector: "S1", value: 100 },
      { ticker: "B", sector: "S2", value: 100 },
      { ticker: "C", sector: "S3", value: 100 },
      { ticker: "D", sector: "S4", value: 100 },
    ];
    const allocs = calculateAllocations(diversified);
    expect(herfindahlIndex(allocs)).toBeCloseTo(0.25, 5);
  });

  it("allocationSummary provides correct metrics", () => {
    const summary = allocationSummary(holdings);
    expect(summary.totalValue).toBe(11000);
    expect(summary.sectorCount).toBe(3);
    expect(summary.topSector).toBe("Technology");
    expect(summary.herfindahlIndex).toBeGreaterThan(0);
  });

  it("overweightSectors detects concentrated sectors", () => {
    const allocs = calculateAllocations(holdings);
    const over = overweightSectors(allocs, 0.3);
    expect(over).toHaveLength(1);
    expect(over[0]!.sector).toBe("Technology");
  });

  it("underweightSectors detects small sectors", () => {
    const allocs = calculateAllocations(holdings);
    const under = underweightSectors(allocs, 0.1);
    expect(under).toHaveLength(1);
    expect(under[0]!.sector).toBe("Energy");
  });

  it("deviationFromEqual shows positive for overweight", () => {
    const allocs = calculateAllocations(holdings);
    const devs = deviationFromEqual(allocs);
    expect(devs.get("Technology")!).toBeGreaterThan(0);
    expect(devs.get("Energy")!).toBeLessThan(0);
  });

  it("deviationFromEqual returns empty for no allocations", () => {
    expect(deviationFromEqual([])).toEqual(new Map());
  });

  it("totalValue in allocation matches sum", () => {
    const allocs = calculateAllocations(holdings);
    const sum = allocs.reduce((s, a) => s + a.totalValue, 0);
    expect(sum).toBe(11000);
  });
});
