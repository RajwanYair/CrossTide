/**
 * Screener card adapter tests (A13 — screener card activation).
 *
 * Verifies CardModule mount, preset filter button rendering, and the
 * live-data flow via screener-data bridge (setScreenerData/getScreenerData).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setScreenerData, getScreenerData } from "../../../src/cards/screener-data";

describe("screener-card (CardModule)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    // Reset screener data to empty state before each test
    setScreenerData([]);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("mounts without throwing", async () => {
    const { default: screenerCard } = await import("../../../src/cards/screener-card");
    expect(() => screenerCard.mount(container, { route: "screener", params: {} })).not.toThrow();
  });

  it("renders preset filter buttons", async () => {
    const { default: screenerCard } = await import("../../../src/cards/screener-card");
    screenerCard.mount(container, { route: "screener", params: {} });
    const buttons = container.querySelectorAll(".preset-btn");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no screener data", async () => {
    const { default: screenerCard } = await import("../../../src/cards/screener-card");
    screenerCard.mount(container, { route: "screener", params: {} });
    expect(container.textContent).toContain("Add tickers");
  });

  it("shows ticker count when screener data is available", async () => {
    setScreenerData([
      {
        ticker: "AAPL",
        price: 150,
        consensus: "BUY",
        rsi: 45,
        volumeRatio: 1.2,
        smaValues: new Map(),
      },
      {
        ticker: "MSFT",
        price: 350,
        consensus: "NEUTRAL",
        rsi: 55,
        volumeRatio: 0.9,
        smaValues: new Map(),
      },
    ]);
    const { default: screenerCard } = await import("../../../src/cards/screener-card");
    screenerCard.mount(container, { route: "screener", params: {} });
    expect(container.textContent).toContain("2");
  });

  it("returns a CardHandle with no dispose", async () => {
    const { default: screenerCard } = await import("../../../src/cards/screener-card");
    const handle = screenerCard.mount(container, { route: "screener", params: {} });
    // Returns {} — no dispose needed for static preset list
    expect(handle).toBeDefined();
  });

  it("clicking a preset renders results section", async () => {
    setScreenerData([
      {
        ticker: "AAPL",
        price: 150,
        consensus: "BUY",
        rsi: 28,
        volumeRatio: 1.2,
        smaValues: new Map([[200, 100]]),
      },
    ]);
    const { default: screenerCard } = await import("../../../src/cards/screener-card");
    screenerCard.mount(container, { route: "screener", params: {} });

    const btn = container.querySelector<HTMLButtonElement>(".preset-btn");
    btn?.click();
    await Promise.resolve();

    // After clicking a preset, the results section should have content
    const results = container.querySelector(".screener-results");
    expect(results).not.toBeNull();
    expect(results!.innerHTML.length).toBeGreaterThan(10);
  });

  it("clicking a preset marks it as active", async () => {
    const { default: screenerCard } = await import("../../../src/cards/screener-card");
    screenerCard.mount(container, { route: "screener", params: {} });

    const btns = container.querySelectorAll<HTMLButtonElement>(".preset-btn");
    btns[0]?.click();

    expect(btns[0]?.classList.contains("active")).toBe(true);
    // Other buttons should not be active
    if (btns.length > 1) {
      expect(btns[1]?.classList.contains("active")).toBe(false);
    }
  });

  it("switching presets removes active from previous button", async () => {
    const { default: screenerCard } = await import("../../../src/cards/screener-card");
    screenerCard.mount(container, { route: "screener", params: {} });

    const btns = container.querySelectorAll<HTMLButtonElement>(".preset-btn");
    if (btns.length >= 2) {
      btns[0]?.click();
      btns[1]?.click();

      expect(btns[0]?.classList.contains("active")).toBe(false);
      expect(btns[1]?.classList.contains("active")).toBe(true);
    }
  });

  it("has screener-controls and screener-results sections", async () => {
    const { default: screenerCard } = await import("../../../src/cards/screener-card");
    screenerCard.mount(container, { route: "screener", params: {} });

    expect(container.querySelector(".screener-controls")).not.toBeNull();
    expect(container.querySelector(".screener-results")).not.toBeNull();
  });
});

describe("screener-data bridge", () => {
  it("getScreenerData returns the last set value", () => {
    const inputs = [
      {
        ticker: "X",
        price: 1,
        consensus: "BUY" as const,
        rsi: 50,
        volumeRatio: 1,
        smaValues: new Map<number, number>(),
      },
    ];
    setScreenerData(inputs);
    expect(getScreenerData().length).toBe(1);
    expect(getScreenerData()[0]!.ticker).toBe("X");
    setScreenerData([]); // cleanup
  });

  it("setScreenerData clears data with empty array", () => {
    setScreenerData([
      {
        ticker: "Y",
        price: 10,
        consensus: "SELL" as const,
        rsi: 70,
        volumeRatio: 0.5,
        smaValues: new Map<number, number>(),
      },
    ]);
    setScreenerData([]);
    expect(getScreenerData().length).toBe(0);
  });
});
