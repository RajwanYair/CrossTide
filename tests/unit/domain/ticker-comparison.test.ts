import { describe, it, expect } from "vitest";
import {
  buildComparison,
  rankByMetric,
  distanceFrom52WeekHigh,
  distanceFrom52WeekLow,
  performanceRank,
} from "../../../src/domain/ticker-comparison";

describe("ticker-comparison", () => {
  const data = [
    {
      ticker: "AAPL",
      price: 190,
      changePercent: 1.5,
      volume: 5_000_000,
      pe: 28,
      week52High: 200,
      week52Low: 140,
    },
    {
      ticker: "MSFT",
      price: 380,
      changePercent: 0.8,
      volume: 3_000_000,
      pe: 32,
      week52High: 400,
      week52Low: 300,
    },
    {
      ticker: "GOOG",
      price: 140,
      changePercent: -0.5,
      volume: 2_000_000,
      pe: 24,
      week52High: 160,
      week52Low: 110,
    },
  ];

  it("buildComparison returns columns and rows", () => {
    const result = buildComparison(data);
    expect(result.rows).toHaveLength(3);
    expect(result.columns.length).toBeGreaterThan(0);
  });

  it("buildComparison identifies best values per metric", () => {
    const result = buildComparison(data);
    expect(result.best.get("price")).toBe("MSFT");
    expect(result.best.get("changePercent")).toBe("AAPL");
    expect(result.best.get("volume")).toBe("AAPL");
  });

  it("buildComparison identifies worst values per metric", () => {
    const result = buildComparison(data);
    expect(result.worst.get("changePercent")).toBe("GOOG");
    expect(result.worst.get("price")).toBe("GOOG");
  });

  it("rankByMetric sorts descending", () => {
    const ranked = rankByMetric(data, "volume");
    expect(ranked[0]!.ticker).toBe("AAPL");
    expect(ranked[2]!.ticker).toBe("GOOG");
  });

  it("rankByMetric by pe", () => {
    const ranked = rankByMetric(data, "pe");
    expect(ranked[0]!.ticker).toBe("MSFT"); // highest P/E
  });

  it("distanceFrom52WeekHigh calculates correctly", () => {
    const result = distanceFrom52WeekHigh(data[0]!);
    expect(result).toBeCloseTo(5, 1); // (200-190)/200*100 = 5%
  });

  it("distanceFrom52WeekHigh returns null if no high", () => {
    const result = distanceFrom52WeekHigh({ ticker: "X", price: 10, changePercent: 0, volume: 0 });
    expect(result).toBeNull();
  });

  it("distanceFrom52WeekLow calculates correctly", () => {
    const result = distanceFrom52WeekLow(data[0]!);
    // (190-140)/140*100 = 35.71%
    expect(result).toBeCloseTo(35.71, 1);
  });

  it("distanceFrom52WeekLow returns null if no low", () => {
    const result = distanceFrom52WeekLow({ ticker: "X", price: 10, changePercent: 0, volume: 0 });
    expect(result).toBeNull();
  });

  it("performanceRank assigns sequential ranks", () => {
    const ranks = performanceRank(data);
    expect(ranks.get("AAPL")).toBe(1);
    expect(ranks.get("MSFT")).toBe(2);
    expect(ranks.get("GOOG")).toBe(3);
  });

  it("buildComparison works with custom columns", () => {
    const result = buildComparison(data, [{ key: "pe", label: "P/E Ratio" }]);
    expect(result.columns).toHaveLength(1);
    expect(result.best.get("pe")).toBe("MSFT");
  });
});
