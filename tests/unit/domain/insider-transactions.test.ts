import { describe, it, expect } from "vitest";
import { analyzeInsiderTransactions } from "../../../src/domain/insider-transactions";
import type { InsiderTransaction } from "../../../src/domain/insider-transactions";

const sampleTransactions: InsiderTransaction[] = [
  {
    name: "Tim Cook",
    title: "CEO",
    date: "2024-03-15",
    type: "sell",
    shares: 50000,
    pricePerShare: 170,
    totalValue: 8500000,
  },
  {
    name: "Luca Maestri",
    title: "CFO",
    date: "2024-03-20",
    type: "sell",
    shares: 20000,
    pricePerShare: 172,
    totalValue: 3440000,
  },
  {
    name: "Art Levinson",
    title: "Director",
    date: "2024-04-01",
    type: "buy",
    shares: 10000,
    pricePerShare: 168,
    totalValue: 1680000,
  },
  {
    name: "Jeff Williams",
    title: "COO",
    date: "2024-04-10",
    type: "exercise",
    shares: 30000,
    pricePerShare: 165,
    totalValue: 4950000,
  },
  {
    name: "Deirdre O'Brien",
    title: "SVP",
    date: "2024-04-15",
    type: "buy",
    shares: 5000,
    pricePerShare: 175,
    totalValue: 875000,
  },
];

describe("analyzeInsiderTransactions", () => {
  it("returns null for empty transactions", () => {
    expect(analyzeInsiderTransactions([])).toBeNull();
  });

  it("counts buys, sells, and exercises correctly", () => {
    const result = analyzeInsiderTransactions(sampleTransactions)!;
    expect(result.totalBuys).toBe(2);
    expect(result.totalSells).toBe(2);
    expect(result.totalExercises).toBe(1);
  });

  it("computes buy and sell values", () => {
    const result = analyzeInsiderTransactions(sampleTransactions)!;
    expect(result.buyValue).toBeCloseTo(1680000 + 875000, 0);
    expect(result.sellValue).toBeCloseTo(8500000 + 3440000, 0);
  });

  it("computes buy/sell ratio", () => {
    const result = analyzeInsiderTransactions(sampleTransactions)!;
    // 2 buys / 2 sells = 1.0
    expect(result.buySellRatio).toBeCloseTo(1.0, 4);
  });

  it("computes sentiment score", () => {
    const result = analyzeInsiderTransactions(sampleTransactions)!;
    // 2 buys, 2 sells → (2-2)/4 = 0
    expect(result.sentimentScore).toBe(0);
  });

  it("identifies net buying sentiment", () => {
    const buysOnly: InsiderTransaction[] = [
      {
        name: "A",
        title: "CEO",
        date: "2024-01-01",
        type: "buy",
        shares: 1000,
        pricePerShare: 100,
        totalValue: 100000,
      },
      {
        name: "B",
        title: "CFO",
        date: "2024-01-02",
        type: "buy",
        shares: 500,
        pricePerShare: 100,
        totalValue: 50000,
      },
    ];
    const result = analyzeInsiderTransactions(buysOnly)!;
    expect(result.sentimentScore).toBe(100);
    expect(result.buySellRatio).toBe(Infinity);
  });

  it("identifies net selling sentiment", () => {
    const sellsOnly: InsiderTransaction[] = [
      {
        name: "A",
        title: "CEO",
        date: "2024-01-01",
        type: "sell",
        shares: 1000,
        pricePerShare: 100,
        totalValue: 100000,
      },
    ];
    const result = analyzeInsiderTransactions(sellsOnly)!;
    expect(result.sentimentScore).toBe(-100);
  });

  it("counts unique buyers and sellers", () => {
    const result = analyzeInsiderTransactions(sampleTransactions)!;
    expect(result.uniqueBuyers).toBe(2); // Art Levinson, Deirdre O'Brien
    expect(result.uniqueSellers).toBe(2); // Tim Cook, Luca Maestri
  });

  it("identifies largest transaction", () => {
    const result = analyzeInsiderTransactions(sampleTransactions)!;
    expect(result.largestTransaction.name).toBe("Tim Cook");
    expect(result.largestTransaction.totalValue).toBe(8500000);
  });

  it("identifies most recent transaction", () => {
    const result = analyzeInsiderTransactions(sampleTransactions)!;
    expect(result.mostRecent.name).toBe("Deirdre O'Brien");
    expect(result.mostRecent.date).toBe("2024-04-15");
  });

  it("handles exercise-only transactions", () => {
    const exerciseOnly: InsiderTransaction[] = [
      {
        name: "X",
        title: "VP",
        date: "2024-06-01",
        type: "exercise",
        shares: 10000,
        pricePerShare: 150,
        totalValue: 1500000,
      },
    ];
    const result = analyzeInsiderTransactions(exerciseOnly)!;
    expect(result.totalExercises).toBe(1);
    expect(result.totalBuys).toBe(0);
    expect(result.totalSells).toBe(0);
    expect(result.sentimentScore).toBe(0);
  });
});
