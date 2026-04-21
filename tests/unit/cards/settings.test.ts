import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderSettings } from "../../../src/cards/settings";
import type { AppConfig } from "../../../src/types/domain";

function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    theme: "dark",
    watchlist: [{ ticker: "AAPL", addedAt: "2025-01-01T00:00:00Z" }],
    ...overrides,
  };
}

describe("renderSettings", () => {
  let container: HTMLElement;
  const callbacks = {
    onThemeChange: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onClearWatchlist: vi.fn(),
    onClearCache: vi.fn(),
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  it("renders theme select with current value", () => {
    renderSettings(container, makeConfig({ theme: "light" }), callbacks);
    const select = container.querySelector("#theme-select") as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe("light");
  });

  it("renders high-contrast option", () => {
    renderSettings(container, makeConfig({ theme: "high-contrast" }), callbacks);
    const select = container.querySelector("#theme-select") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain("high-contrast");
  });

  it("shows watchlist ticker count", () => {
    renderSettings(container, makeConfig(), callbacks);
    expect(container.innerHTML).toContain("1 tickers");
  });

  it("calls onThemeChange when theme changes", () => {
    renderSettings(container, makeConfig(), callbacks);
    const select = container.querySelector("#theme-select") as HTMLSelectElement;
    select.value = "light";
    select.dispatchEvent(new Event("change"));
    expect(callbacks.onThemeChange).toHaveBeenCalledWith("light");
  });

  it("calls onExport when export button clicked", () => {
    renderSettings(container, makeConfig(), callbacks);
    (container.querySelector("#btn-export") as HTMLButtonElement).click();
    expect(callbacks.onExport).toHaveBeenCalled();
  });

  it("calls onImport when import button clicked", () => {
    renderSettings(container, makeConfig(), callbacks);
    (container.querySelector("#btn-import") as HTMLButtonElement).click();
    expect(callbacks.onImport).toHaveBeenCalled();
  });

  it("calls onClearWatchlist when clear button clicked", () => {
    renderSettings(container, makeConfig(), callbacks);
    (container.querySelector("#btn-clear") as HTMLButtonElement).click();
    expect(callbacks.onClearWatchlist).toHaveBeenCalled();
  });

  it("calls onClearCache when clear cache button clicked", () => {
    renderSettings(container, makeConfig(), callbacks);
    (container.querySelector("#btn-clear-cache") as HTMLButtonElement).click();
    expect(callbacks.onClearCache).toHaveBeenCalled();
  });
});
