import { describe, it, expect } from "vitest";
import {
  totalValue,
  positionValue,
  unrealizedPnl,
  sectorAllocation,
  positionMetrics,
  topConcentration,
  type Holding,
} from "../../../src/domain/portfolio-analytics";

const h = (
  ticker: string,
  qty: number,
  avgCost: number,
  price: number,
  sector?: string,
): Holding => ({
  ticker,
  quantity: qty,
  avgCost,
  currentPrice: price,
  sector,
});

const PORTFOLIO: Holding[] = [
  h("AAPL", 10, 100, 150, "Tech"),
  h("MSFT", 5, 200, 300, "Tech"),
  h("XOM", 20, 50, 60, "Energy"),
  h("UNK", 1, 1, 10),
];

describe("portfolio-analytics", () => {
  it("positionValue", () => {
    expect(positionValue(PORTFOLIO[0]!)).toBe(1500);
  });

  it("unrealizedPnl", () => {
    expect(unrealizedPnl(PORTFOLIO[0]!)).toBe(500);
    expect(unrealizedPnl(PORTFOLIO[1]!)).toBe(500);
  });

  it("totalValue sums all positions", () => {
    expect(totalValue(PORTFOLIO)).toBe(1500 + 1500 + 1200 + 10);
  });

  it("sectorAllocation groups by sector", () => {
    const a = sectorAllocation(PORTFOLIO);
    const tech = a.find((s) => s.sector === "Tech")!;
    expect(tech.value).toBe(3000);
    expect(tech.tickers).toBe(2);
  });

  it("sectorAllocation puts missing sector in Uncategorized", () => {
    const a = sectorAllocation(PORTFOLIO);
    expect(a.some((s) => s.sector === "Uncategorized")).toBe(true);
  });

  it("sectorAllocation weights sum to 1", () => {
    const a = sectorAllocation(PORTFOLIO);
    const sum = a.reduce((s, x) => s + x.weight, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("sectorAllocation empty when no holdings", () => {
    expect(sectorAllocation([])).toEqual([]);
  });

  it("sectorAllocation sorted descending by value", () => {
    const a = sectorAllocation(PORTFOLIO);
    for (let i = 1; i < a.length; i++) {
      expect(a[i]!.value).toBeLessThanOrEqual(a[i - 1]!.value);
    }
  });

  it("positionMetrics computes weight and pnl", () => {
    const m = positionMetrics(PORTFOLIO);
    expect(m[0]!.ticker).toBe("AAPL");
    expect(m[0]!.value).toBe(1500);
    expect(m[0]!.unrealizedReturnPct).toBeCloseTo(0.5, 5);
  });

  it("topConcentration of top 1", () => {
    const c = topConcentration(PORTFOLIO, 1);
    expect(c).toBeCloseTo(1500 / (1500 + 1500 + 1200 + 10), 5);
  });

  it("topConcentration n>=length is 1", () => {
    expect(topConcentration(PORTFOLIO, 99)).toBeCloseTo(1, 5);
  });

  it("topConcentration on empty is 0", () => {
    expect(topConcentration([], 5)).toBe(0);
  });
});
