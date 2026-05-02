import { describe, it, expect } from "vitest";
import {
  isWithinDays,
  renderEarningsCalendar,
  type EarningsEvent,
} from "../../../src/cards/earnings-calendar-card";

describe("earnings-calendar-card", () => {
  it("isWithinDays returns true for dates in range", () => {
    expect(isWithinDays("2026-05-05", 7, new Date("2026-05-01T00:00:00Z"))).toBe(true);
  });

  it("isWithinDays returns false for dates out of range", () => {
    expect(isWithinDays("2026-05-20", 7, new Date("2026-05-01T00:00:00Z"))).toBe(false);
  });

  it("renderEarningsCalendar shows empty state for no events", () => {
    const el = document.createElement("div");
    renderEarningsCalendar(el, []);
    expect(el.innerHTML).toContain("empty-state");
  });

  it("renderEarningsCalendar renders rows", () => {
    const el = document.createElement("div");
    const events: EarningsEvent[] = [
      {
        ticker: "AAPL",
        companyName: "Apple",
        earningsDate: "2026-05-06",
        epsEstimate: 2.1,
        priorEps: 1.8,
        surprisePct: 4.5,
      },
    ];
    renderEarningsCalendar(el, events);
    expect(el.innerHTML).toContain("AAPL");
    expect(el.innerHTML).toContain("EPS Est.");
  });
});
