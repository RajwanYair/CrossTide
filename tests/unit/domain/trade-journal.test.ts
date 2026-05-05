import { describe, it, expect } from "vitest";
import { analyzeTradeJournal } from "../../../src/domain/trade-journal";
import type { TradeEntry } from "../../../src/domain/trade-journal";

const sampleTrades: TradeEntry[] = [
  {
    symbol: "AAPL",
    side: "long",
    entryPrice: 150,
    exitPrice: 165,
    shares: 100,
    entryDate: "2024-01-02",
    exitDate: "2024-01-15",
    riskPerShare: 5,
  },
  {
    symbol: "GOOG",
    side: "long",
    entryPrice: 140,
    exitPrice: 130,
    shares: 50,
    entryDate: "2024-01-10",
    exitDate: "2024-01-20",
    riskPerShare: 5,
  },
  {
    symbol: "MSFT",
    side: "long",
    entryPrice: 400,
    exitPrice: 420,
    shares: 25,
    entryDate: "2024-02-01",
    exitDate: "2024-02-15",
    riskPerShare: 10,
  },
  {
    symbol: "TSLA",
    side: "short",
    entryPrice: 250,
    exitPrice: 230,
    shares: 40,
    entryDate: "2024-02-10",
    exitDate: "2024-02-28",
    riskPerShare: 10,
  },
  {
    symbol: "META",
    side: "long",
    entryPrice: 500,
    exitPrice: 490,
    shares: 20,
    entryDate: "2024-03-01",
    exitDate: "2024-03-10",
    riskPerShare: 8,
  },
];

describe("analyzeTradeJournal", () => {
  it("returns null for empty trades", () => {
    expect(analyzeTradeJournal([])).toBeNull();
  });

  it("returns correct total trade count", () => {
    const result = analyzeTradeJournal(sampleTrades)!;
    expect(result.totalTrades).toBe(5);
  });

  it("classifies wins and losses", () => {
    const result = analyzeTradeJournal(sampleTrades)!;
    // AAPL win (+1500), GOOG loss (-500), MSFT win (+500), TSLA win (+800), META loss (-200)
    expect(result.wins).toBe(3);
    expect(result.losses).toBe(2);
  });

  it("computes win rate", () => {
    const result = analyzeTradeJournal(sampleTrades)!;
    expect(result.winRate).toBeCloseTo(0.6, 2);
  });

  it("computes total P&L", () => {
    const result = analyzeTradeJournal(sampleTrades)!;
    // 1500 - 500 + 500 + 800 - 200 = 2100
    expect(result.totalPnl).toBeCloseTo(2100, 2);
  });

  it("identifies best and worst trades", () => {
    const result = analyzeTradeJournal(sampleTrades)!;
    expect(result.bestTrade.symbol).toBe("AAPL");
    expect(result.bestTrade.pnl).toBeCloseTo(1500, 2);
    expect(result.worstTrade.symbol).toBe("GOOG");
    expect(result.worstTrade.pnl).toBeCloseTo(-500, 2);
  });

  it("computes R-multiples", () => {
    const result = analyzeTradeJournal(sampleTrades)!;
    expect(result.avgRMultiple).not.toBeNull();
    // AAPL: (165-150)/5=3, GOOG: (130-140)/5=-2, MSFT: (420-400)/10=2, TSLA: (250-230)/10=2, META: (490-500)/8=-1.25
    // avg = (3 - 2 + 2 + 2 - 1.25) / 5 = 0.75
    expect(result.avgRMultiple).toBeCloseTo(0.75, 2);
  });

  it("computes profit factor", () => {
    const result = analyzeTradeJournal(sampleTrades)!;
    // grossWins = 1500 + 500 + 800 = 2800, grossLosses = 500 + 200 = 700
    expect(result.profitFactor).toBeCloseTo(4.0, 2);
  });

  it("returns Infinity profit factor when no losses", () => {
    const allWins: TradeEntry[] = [
      {
        symbol: "X",
        side: "long",
        entryPrice: 10,
        exitPrice: 15,
        shares: 10,
        entryDate: "2024-01-01",
        exitDate: "2024-01-10",
      },
    ];
    const result = analyzeTradeJournal(allWins)!;
    expect(result.profitFactor).toBe(Infinity);
  });

  it("computes consecutive streaks", () => {
    const result = analyzeTradeJournal(sampleTrades)!;
    // Order: win, loss, win, win, loss → max wins = 2, max losses = 1
    expect(result.maxConsecutiveWins).toBe(2);
    expect(result.maxConsecutiveLosses).toBe(1);
  });

  it("computes positive expectancy for profitable system", () => {
    const result = analyzeTradeJournal(sampleTrades)!;
    expect(result.expectancy).toBeGreaterThan(0);
  });

  it("handles short trades correctly", () => {
    const shortOnly: TradeEntry[] = [
      {
        symbol: "SPY",
        side: "short",
        entryPrice: 500,
        exitPrice: 480,
        shares: 10,
        entryDate: "2024-01-01",
        exitDate: "2024-01-10",
      },
    ];
    const result = analyzeTradeJournal(shortOnly)!;
    expect(result.totalPnl).toBeCloseTo(200, 2);
    expect(result.wins).toBe(1);
  });

  it("skips invalid entries", () => {
    const withInvalid: TradeEntry[] = [
      {
        symbol: "A",
        side: "long",
        entryPrice: 0,
        exitPrice: 10,
        shares: 10,
        entryDate: "2024-01-01",
        exitDate: "2024-01-10",
      },
      {
        symbol: "B",
        side: "long",
        entryPrice: 50,
        exitPrice: 60,
        shares: 10,
        entryDate: "2024-01-01",
        exitDate: "2024-01-10",
      },
    ];
    const result = analyzeTradeJournal(withInvalid)!;
    expect(result.totalTrades).toBe(1);
  });
});
