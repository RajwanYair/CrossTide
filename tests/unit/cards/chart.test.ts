import { describe, it, expect, beforeEach } from "vitest";
import { renderChart } from "../../../src/cards/chart";
import type { DailyCandle } from "../../../src/types/domain";

function makeCandle(date: string, close: number): DailyCandle {
  return { date, open: close - 1, high: close + 2, low: close - 2, close, volume: 1_000_000 };
}

describe("renderChart", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("shows empty state for no candles", () => {
    renderChart(container, { ticker: "AAPL", candles: [] });
    expect(container.innerHTML).toContain("No chart data");
    expect(container.innerHTML).toContain("AAPL");
  });

  it("renders chart header with ticker and latest price", () => {
    const candles = [makeCandle("2025-01-01", 100), makeCandle("2025-01-02", 110)];
    renderChart(container, { ticker: "AAPL", candles });
    expect(container.innerHTML).toContain("AAPL");
    expect(container.innerHTML).toContain("110.00");
  });

  it("shows change percentage", () => {
    const candles = [makeCandle("2025-01-01", 100), makeCandle("2025-01-02", 105)];
    renderChart(container, { ticker: "AAPL", candles });
    expect(container.innerHTML).toContain("+5.00%");
  });

  it("renders OHLC table with last 10 candles", () => {
    const candles = Array.from({ length: 15 }, (_, i) =>
      makeCandle(`2025-01-${String(i + 1).padStart(2, "0")}`, 100 + i),
    );
    renderChart(container, { ticker: "AAPL", candles });
    const rows = container.querySelectorAll(".ohlc-table tbody tr");
    expect(rows.length).toBe(10);
  });

  it("names the DOM data alternative for assistive technology", () => {
    renderChart(container, { ticker: "AAPL", candles: [makeCandle("2025-01-01", 100)] });
    expect(container.querySelector(".ohlc-table")?.getAttribute("aria-label")).toBe(
      "Recent OHLCV data for AAPL",
    );
  });

  it("shows candle count", () => {
    const candles = [makeCandle("2025-01-01", 100), makeCandle("2025-01-02", 102)];
    renderChart(container, { ticker: "AAPL", candles });
    expect(container.innerHTML).toContain("2 candles");
  });

  it("applies signal-sell class for negative change", () => {
    const candles = [makeCandle("2025-01-01", 110), makeCandle("2025-01-02", 100)];
    renderChart(container, { ticker: "AAPL", candles });
    expect(container.innerHTML).toContain("signal-sell");
  });

  it("creates chart-canvas with data-ticker attribute", () => {
    const candles = [makeCandle("2025-01-01", 100)];
    renderChart(container, { ticker: "TSLA", candles });
    const canvas = container.querySelector(".chart-canvas");
    expect(canvas).not.toBeNull();
    expect(canvas!.getAttribute("data-ticker")).toBe("TSLA");
  });
});
