/**
 * Data export utility tests.
 */
import { describe, it, expect } from "vitest";
import {
  exportAlertsCsv,
  exportAlertsJson,
  exportPortfolioCsv,
  exportPortfolioJson,
  exportBacktestTradesCsv,
  exportBacktestJson,
  importAlertsCsv,
} from "../../../src/core/data-export";
import type { AlertRecord } from "../../../src/cards/alert-history";
import type { Holding } from "../../../src/cards/portfolio";
import type { BacktestResult, BacktestTrade } from "../../../src/domain/backtest-engine";

const ALERTS: AlertRecord[] = [
  { id: "1", ticker: "AAPL", alertType: "rsiBuy", direction: "BUY", description: "RSI bounce", firedAt: "2025-06-01T10:00:00Z" },
  { id: "2", ticker: "GOOG", alertType: "macdSell", direction: "SELL", description: "MACD cross", firedAt: "2025-06-02T12:00:00Z" },
];

const HOLDINGS: Holding[] = [
  { ticker: "AAPL", shares: 10, avgCost: 150, currentPrice: 175 },
  { ticker: "MSFT", shares: 5, avgCost: 300, currentPrice: 310 },
];

const TRADES: BacktestTrade[] = [
  { entryDate: "2025-01-01", exitDate: "2025-01-10", entryPrice: 100, exitPrice: 110, profitPercent: 10 },
  { entryDate: "2025-02-01", exitDate: "2025-02-15", entryPrice: 110, exitPrice: 105, profitPercent: -4.545 },
];

describe("exportAlertsCsv", () => {
  it("produces valid CSV header + rows", () => {
    const csv = exportAlertsCsv(ALERTS);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("id,ticker,alertType,direction,description,firedAt");
    expect(lines.length).toBe(3);
    expect(lines[1]).toContain("AAPL");
  });

  it("returns header only for empty alerts", () => {
    const csv = exportAlertsCsv([]);
    expect(csv.split("\n").length).toBe(1);
  });

  it("escapes commas in description", () => {
    const a: AlertRecord[] = [
      { id: "1", ticker: "X", alertType: "t", direction: "BUY", description: "a, b", firedAt: "2025-01-01" },
    ];
    const csv = exportAlertsCsv(a);
    expect(csv).toContain('"a, b"');
  });
});

describe("exportAlertsJson", () => {
  it("produces valid JSON with alerts array", () => {
    const json = exportAlertsJson(ALERTS);
    const parsed = JSON.parse(json);
    expect(parsed.alerts).toHaveLength(2);
    expect(parsed.exportedAt).toBeDefined();
  });
});

describe("exportPortfolioCsv", () => {
  it("produces correct header and rows", () => {
    const csv = exportPortfolioCsv(HOLDINGS);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("ticker,shares,avgCost,currentPrice");
    expect(lines.length).toBe(3);
  });
});

describe("exportPortfolioJson", () => {
  it("round-trips holdings", () => {
    const json = exportPortfolioJson(HOLDINGS);
    const parsed = JSON.parse(json);
    expect(parsed.holdings).toEqual(HOLDINGS);
  });
});

describe("exportBacktestTradesCsv", () => {
  it("produces correct header and rows", () => {
    const csv = exportBacktestTradesCsv(TRADES);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("entryDate,exitDate,entryPrice,exitPrice,profitPercent");
    expect(lines.length).toBe(3);
    expect(lines[1]).toContain("100.00");
    expect(lines[1]).toContain("10.00"); // profitPercent = 10%
  });
});

describe("exportBacktestJson", () => {
  it("includes result and exportedAt", () => {
    const result: BacktestResult = {
      trades: TRADES,
      equityCurve: [
        { date: "2025-01-01", equity: 10000 },
        { date: "2025-01-10", equity: 11000 },
        { date: "2025-02-15", equity: 10500 },
      ],
      totalReturn: 500,
      totalReturnPercent: 5,
      winRate: 0.5,
      maxDrawdown: 0.04545,
    };
    const json = exportBacktestJson(result);
    const parsed = JSON.parse(json);
    expect(parsed.result.trades).toHaveLength(2);
    expect(parsed.exportedAt).toBeDefined();
  });
});

describe("importAlertsCsv", () => {
  it("round-trips with exportAlertsCsv", () => {
    const csv = exportAlertsCsv(ALERTS);
    const imported = importAlertsCsv(csv);
    expect(imported).toHaveLength(2);
    expect(imported[0].ticker).toBe("AAPL");
    expect(imported[1].direction).toBe("SELL");
  });

  it("returns empty for header-only CSV", () => {
    expect(importAlertsCsv("id,ticker,alertType,direction,description,firedAt")).toEqual([]);
  });

  it("handles quoted fields", () => {
    const csv = 'id,ticker,alertType,direction,description,firedAt\n1,X,t,BUY,"hello, world",2025-01-01';
    const imported = importAlertsCsv(csv);
    expect(imported[0].description).toBe("hello, world");
  });

  it("throws for invalid CSV", () => {
    expect(() => importAlertsCsv("id,ticker\nonly,two")).toThrow();
  });
});
