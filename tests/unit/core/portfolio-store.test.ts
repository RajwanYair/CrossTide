import { describe, it, expect, beforeEach } from "vitest";
import { portfolioStore, type PortfolioPosition } from "../../../src/core/portfolio-store";

describe("portfolioStore", () => {
  beforeEach(() => {
    portfolioStore.reset();
  });

  it("initializes with empty positions and USD currency", () => {
    const state = portfolioStore.state();
    expect(state.positions).toEqual([]);
    expect(state.currency).toBe("USD");
    expect(state.name).toBe("My Portfolio");
  });

  describe("addPosition", () => {
    it("adds a new position", () => {
      const pos: PortfolioPosition = {
        ticker: "AAPL",
        costBasis: 150,
        shares: 10,
        openDate: "2024-01-10",
      };
      portfolioStore.actions.addPosition(pos);
      expect(portfolioStore.state().positions).toEqual([pos]);
    });

    it("merges duplicate tickers with weighted average cost basis", () => {
      portfolioStore.actions.addPosition({
        ticker: "AAPL",
        costBasis: 100,
        shares: 10,
        openDate: "2024-01-10",
      });
      portfolioStore.actions.addPosition({
        ticker: "AAPL",
        costBasis: 200,
        shares: 10,
        openDate: "2024-06-01",
      });
      const positions = portfolioStore.state().positions;
      expect(positions.length).toBe(1);
      expect(positions[0]!.shares).toBe(20);
      // Weighted avg: (100×10 + 200×10) / 20 = 150
      expect(positions[0]!.costBasis).toBe(150);
    });

    it("keeps multiple different tickers separate", () => {
      portfolioStore.actions.addPosition({
        ticker: "AAPL",
        costBasis: 150,
        shares: 5,
        openDate: "2024-01-01",
      });
      portfolioStore.actions.addPosition({
        ticker: "MSFT",
        costBasis: 300,
        shares: 3,
        openDate: "2024-01-02",
      });
      expect(portfolioStore.state().positions.length).toBe(2);
    });
  });

  describe("removePosition", () => {
    it("removes a position by ticker", () => {
      portfolioStore.actions.addPosition({
        ticker: "AAPL",
        costBasis: 150,
        shares: 10,
        openDate: "2024-01-01",
      });
      portfolioStore.actions.addPosition({
        ticker: "MSFT",
        costBasis: 300,
        shares: 5,
        openDate: "2024-01-02",
      });
      portfolioStore.actions.removePosition("AAPL");
      const tickers = portfolioStore.state().positions.map((p) => p.ticker);
      expect(tickers).toEqual(["MSFT"]);
    });

    it("is a no-op for unknown ticker", () => {
      portfolioStore.actions.addPosition({
        ticker: "AAPL",
        costBasis: 150,
        shares: 10,
        openDate: "2024-01-01",
      });
      portfolioStore.actions.removePosition("UNKNOWN");
      expect(portfolioStore.state().positions.length).toBe(1);
    });
  });

  describe("updatePosition", () => {
    it("updates shares for an existing position", () => {
      portfolioStore.actions.addPosition({
        ticker: "AAPL",
        costBasis: 150,
        shares: 10,
        openDate: "2024-01-01",
      });
      portfolioStore.actions.updatePosition("AAPL", { shares: 20 });
      expect(portfolioStore.state().positions[0]!.shares).toBe(20);
    });

    it("does not affect other positions", () => {
      portfolioStore.actions.addPosition({
        ticker: "AAPL",
        costBasis: 150,
        shares: 10,
        openDate: "2024-01-01",
      });
      portfolioStore.actions.addPosition({
        ticker: "MSFT",
        costBasis: 300,
        shares: 5,
        openDate: "2024-01-02",
      });
      portfolioStore.actions.updatePosition("AAPL", { costBasis: 200 });
      const msft = portfolioStore.state().positions.find((p) => p.ticker === "MSFT");
      expect(msft!.costBasis).toBe(300);
    });

    it("is a no-op for unknown ticker", () => {
      portfolioStore.actions.addPosition({
        ticker: "AAPL",
        costBasis: 150,
        shares: 10,
        openDate: "2024-01-01",
      });
      portfolioStore.actions.updatePosition("UNKNOWN", { shares: 99 });
      expect(portfolioStore.state().positions[0]!.shares).toBe(10);
    });
  });

  describe("setCurrency", () => {
    it("updates the portfolio currency", () => {
      portfolioStore.actions.setCurrency("EUR");
      expect(portfolioStore.state().currency).toBe("EUR");
    });
  });

  describe("setName", () => {
    it("updates the portfolio name", () => {
      portfolioStore.actions.setName("Tech Portfolio");
      expect(portfolioStore.state().name).toBe("Tech Portfolio");
    });
  });

  it("select returns a derived value", () => {
    portfolioStore.actions.addPosition({
      ticker: "AAPL",
      costBasis: 150,
      shares: 10,
      openDate: "2024-01-01",
    });
    portfolioStore.actions.addPosition({
      ticker: "MSFT",
      costBasis: 300,
      shares: 5,
      openDate: "2024-01-02",
    });
    const count = portfolioStore.select((s) => s.positions.length);
    expect(count()).toBe(2);
  });
});
