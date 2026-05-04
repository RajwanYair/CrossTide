import { describe, it, expect } from "vitest";
import {
  calculateProximity,
  checkAlertProximity,
  checkMultipleAlerts,
  getAlertsWithinThreshold,
  formatProximity,
} from "../../../src/domain/alert-proximity";

describe("alert-proximity", () => {
  it("calculateProximity returns positive when price above alert", () => {
    expect(calculateProximity(110, 100)).toBeCloseTo(10, 5);
  });

  it("calculateProximity returns negative when price below alert", () => {
    expect(calculateProximity(90, 100)).toBeCloseTo(-10, 5);
  });

  it("calculateProximity returns 0 when at alert level", () => {
    expect(calculateProximity(100, 100)).toBe(0);
  });

  it("calculateProximity handles zero alertPrice", () => {
    expect(calculateProximity(50, 0)).toBe(0);
  });

  it("checkAlertProximity returns correct direction", () => {
    const above = checkAlertProximity("AAPL", 155, 150);
    expect(above.direction).toBe("above");
    expect(above.ticker).toBe("AAPL");

    const below = checkAlertProximity("msft", 290, 300);
    expect(below.direction).toBe("below");
    expect(below.ticker).toBe("MSFT");

    const at = checkAlertProximity("GOOG", 100, 100);
    expect(at.direction).toBe("at");
  });

  it("checkMultipleAlerts sorts by closest first", () => {
    const alerts = [
      { ticker: "AAPL", price: 150 },
      { ticker: "MSFT", price: 300 },
      { ticker: "GOOG", price: 100 },
    ];
    const prices = new Map([
      ["AAPL", 149], // 0.67% away
      ["MSFT", 280], // 6.67% away
      ["GOOG", 98], // 2% away
    ]);

    const results = checkMultipleAlerts(alerts, prices);
    expect(results[0]!.ticker).toBe("AAPL");
    expect(results[1]!.ticker).toBe("GOOG");
    expect(results[2]!.ticker).toBe("MSFT");
  });

  it("checkMultipleAlerts skips tickers without current price", () => {
    const alerts = [
      { ticker: "AAPL", price: 150 },
      { ticker: "UNKNOWN", price: 50 },
    ];
    const prices = new Map([["AAPL", 148]]);
    const results = checkMultipleAlerts(alerts, prices);
    expect(results).toHaveLength(1);
    expect(results[0]!.ticker).toBe("AAPL");
  });

  it("getAlertsWithinThreshold filters by percentage", () => {
    const alerts = [
      {
        ticker: "A",
        alertPrice: 100,
        currentPrice: 99,
        distancePercent: -1,
        direction: "below" as const,
      },
      {
        ticker: "B",
        alertPrice: 100,
        currentPrice: 90,
        distancePercent: -10,
        direction: "below" as const,
      },
      {
        ticker: "C",
        alertPrice: 100,
        currentPrice: 102,
        distancePercent: 2,
        direction: "above" as const,
      },
    ];
    const within5 = getAlertsWithinThreshold(alerts, 5);
    expect(within5).toHaveLength(2);
    expect(within5.map((a) => a.ticker)).toContain("A");
    expect(within5.map((a) => a.ticker)).toContain("C");
  });

  it("formatProximity for above direction", () => {
    const result = formatProximity({
      ticker: "AAPL",
      alertPrice: 150,
      currentPrice: 155,
      distancePercent: 3.33,
      direction: "above",
    });
    expect(result).toContain("AAPL");
    expect(result).toContain("↑");
    expect(result).toContain("150");
  });

  it("formatProximity for at alert level", () => {
    const result = formatProximity({
      ticker: "GOOG",
      alertPrice: 100,
      currentPrice: 100,
      distancePercent: 0,
      direction: "at",
    });
    expect(result).toContain("AT alert");
  });
});
