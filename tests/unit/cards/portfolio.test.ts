/**
 * Portfolio card tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  computePortfolioSummary,
  renderPortfolio,
  type Holding,
} from "../../../src/cards/portfolio";

const HOLDINGS: Holding[] = [
  { ticker: "AAPL", shares: 10, avgCost: 150, currentPrice: 175 },
  { ticker: "GOOG", shares: 5, avgCost: 2800, currentPrice: 2700 },
];

describe("portfolio card", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  describe("computePortfolioSummary", () => {
    it("computes total cost and value", () => {
      const s = computePortfolioSummary(HOLDINGS);
      expect(s.totalCost).toBe(10 * 150 + 5 * 2800); // 1500 + 14000 = 15500
      expect(s.totalValue).toBe(10 * 175 + 5 * 2700); // 1750 + 13500 = 15250
    });

    it("computes gain/loss", () => {
      const s = computePortfolioSummary(HOLDINGS);
      expect(s.totalGain).toBe(15250 - 15500); // -250
      expect(s.totalGainPercent).toBeCloseTo((-250 / 15500) * 100, 1);
    });

    it("returns zeros for empty holdings", () => {
      const s = computePortfolioSummary([]);
      expect(s.totalCost).toBe(0);
      expect(s.totalValue).toBe(0);
      expect(s.totalGain).toBe(0);
      expect(s.totalGainPercent).toBe(0);
    });

    it("positive gain for winning position", () => {
      const s = computePortfolioSummary([
        { ticker: "TSLA", shares: 10, avgCost: 100, currentPrice: 200 },
      ]);
      expect(s.totalGain).toBe(1000);
      expect(s.totalGainPercent).toBe(100);
    });
  });

  describe("renderPortfolio", () => {
    it("renders table with holdings", () => {
      renderPortfolio(container, HOLDINGS);
      expect(container.querySelector("table")).not.toBeNull();
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(2);
    });

    it("shows empty state for no holdings", () => {
      renderPortfolio(container, []);
      expect(container.textContent).toContain("No holdings");
    });

    it("shows total value in summary", () => {
      renderPortfolio(container, HOLDINGS);
      expect(container.textContent).toContain("15250.00");
    });

    it("escapes HTML in ticker", () => {
      const xss: Holding = {
        ticker: "<script>alert(1)</script>",
        shares: 1,
        avgCost: 100,
        currentPrice: 100,
      };
      renderPortfolio(container, [xss]);
      expect(container.innerHTML).not.toContain("<script>");
    });
  });
});
