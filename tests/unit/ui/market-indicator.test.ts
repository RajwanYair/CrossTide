/**
 * Market hours indicator tests.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { mountMarketIndicator } from "../../../src/ui/market-indicator";

describe("market-indicator", () => {
  let container: HTMLElement;
  let dispose: () => void;

  afterEach(() => {
    dispose?.();
    vi.restoreAllMocks();
  });

  it("renders market status into the container", () => {
    container = document.createElement("span");
    dispose = mountMarketIndicator(container);
    expect(container.querySelector(".market-indicator")).not.toBeNull();
  });

  it("shows all exchange badges", () => {
    container = document.createElement("span");
    dispose = mountMarketIndicator(container);
    const exchanges = container.querySelectorAll(".market-exchange");
    // 6 exchanges: NYSE, NASDAQ, LSE, TSE, HKEX, EURONEXT
    expect(exchanges.length).toBe(6);
  });

  it("has role=status for accessibility", () => {
    container = document.createElement("span");
    dispose = mountMarketIndicator(container);
    const indicator = container.querySelector(".market-indicator");
    expect(indicator?.getAttribute("role")).toBe("status");
  });

  it("displays Market Open when at least one is open", () => {
    // Mock a weekday during NYSE hours (Tuesday 10:00 ET)
    const mockDate = new Date("2025-01-07T15:00:00.000Z"); // Tue 10:00 ET
    vi.setSystemTime(mockDate);

    container = document.createElement("span");
    dispose = mountMarketIndicator(container);
    const label = container.querySelector(".market-label");
    expect(label?.textContent).toBe("Market Open");

    vi.useRealTimers();
  });

  it("displays Markets Closed on weekends", () => {
    // Saturday midnight UTC
    const mockDate = new Date("2025-01-04T04:00:00.000Z"); // Sat 04:00 UTC
    vi.setSystemTime(mockDate);

    container = document.createElement("span");
    dispose = mountMarketIndicator(container);
    const label = container.querySelector(".market-label");
    expect(label?.textContent).toBe("Markets Closed");

    vi.useRealTimers();
  });
});
