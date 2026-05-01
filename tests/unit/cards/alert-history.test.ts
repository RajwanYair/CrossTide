/**
 * Alert history card tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  filterAlerts,
  renderAlertHistory,
  type AlertRecord,
} from "../../../src/cards/alert-history";

const ALERTS: AlertRecord[] = [
  {
    id: "1",
    ticker: "AAPL",
    alertType: "rsiMethodBuy",
    direction: "BUY",
    description: "RSI oversold bounce",
    firedAt: "2025-06-01T10:00:00Z",
  },
  {
    id: "2",
    ticker: "GOOG",
    alertType: "macdMethodSell",
    direction: "SELL",
    description: "MACD bearish cross",
    firedAt: "2025-06-02T12:00:00Z",
  },
  {
    id: "3",
    ticker: "AAPL",
    alertType: "consensusBuy",
    direction: "BUY",
    description: "Consensus BUY 75%",
    firedAt: "2025-06-03T08:30:00Z",
  },
  {
    id: "4",
    ticker: "MSFT",
    alertType: "bollingerMethodBuy",
    direction: "NEUTRAL",
    description: "Bollinger neutral",
    firedAt: "2025-06-04T09:00:00Z",
  },
];

describe("alert-history card", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  describe("filterAlerts", () => {
    it("returns all alerts when no filter", () => {
      expect(filterAlerts(ALERTS, {})).toHaveLength(4);
    });

    it("filters by ticker", () => {
      const result = filterAlerts(ALERTS, { ticker: "AAPL" });
      expect(result).toHaveLength(2);
      expect(result.every((a) => a.ticker === "AAPL")).toBe(true);
    });

    it("filters by direction", () => {
      const result = filterAlerts(ALERTS, { direction: "BUY" });
      expect(result).toHaveLength(2);
    });

    it("filters by since date", () => {
      const result = filterAlerts(ALERTS, { since: "2025-06-03T00:00:00Z" });
      expect(result).toHaveLength(2);
    });

    it("combines filters", () => {
      const result = filterAlerts(ALERTS, { ticker: "AAPL", direction: "BUY" });
      expect(result).toHaveLength(2);
    });

    it("returns empty for non-matching filter", () => {
      const result = filterAlerts(ALERTS, { ticker: "XYZ" });
      expect(result).toHaveLength(0);
    });
  });

  describe("renderAlertHistory", () => {
    it("renders table with alert rows", () => {
      renderAlertHistory(container, ALERTS);
      expect(container.querySelector("table")).not.toBeNull();
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(4);
    });

    it("shows empty state when no alerts", () => {
      renderAlertHistory(container, []);
      expect(container.textContent).toContain("No alerts");
    });

    it("shows empty state when filter matches nothing", () => {
      renderAlertHistory(container, ALERTS, { ticker: "XYZ" });
      expect(container.textContent).toContain("No alerts");
    });

    it("shows alert count", () => {
      renderAlertHistory(container, ALERTS);
      expect(container.textContent).toContain("4 alerts");
    });

    it("sorts newest first", () => {
      renderAlertHistory(container, ALERTS);
      const firstRow = container.querySelector("tbody tr");
      expect(firstRow?.textContent).toContain("MSFT");
    });

    it("escapes HTML in ticker and description", () => {
      const xss: AlertRecord = {
        id: "x",
        ticker: "<script>",
        alertType: "test",
        direction: "BUY",
        description: '<img onerror="alert(1)">',
        firedAt: "2025-06-01T00:00:00Z",
      };
      renderAlertHistory(container, [xss]);
      expect(container.innerHTML).not.toContain("<script>");
      expect(container.innerHTML).toContain("&lt;script&gt;");
      expect(container.innerHTML).not.toContain("<img ");
    });
  });
});
