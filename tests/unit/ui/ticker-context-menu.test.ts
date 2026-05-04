import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initTickerContextMenu,
  registerTickerActions,
  showTickerMenu,
  hideTickerMenu,
  getRegisteredActions,
} from "../../../src/ui/ticker-context-menu";

describe("ticker-context-menu", () => {
  let cleanup: () => void;

  beforeEach(() => {
    document.body.innerHTML = "";
    cleanup = initTickerContextMenu();
  });

  afterEach(() => {
    cleanup();
  });

  it("creates a menu element in DOM", () => {
    const menu = document.querySelector(".ticker-context-menu");
    expect(menu).not.toBeNull();
    expect(menu?.getAttribute("role")).toBe("menu");
  });

  it("menu is hidden by default", () => {
    const menu = document.querySelector<HTMLElement>(".ticker-context-menu");
    expect(menu?.style.display).toBe("none");
  });

  it("showTickerMenu makes menu visible", () => {
    registerTickerActions([{ id: "chart", label: "View Chart", handler: vi.fn() }]);
    showTickerMenu("AAPL", 100, 200);
    const menu = document.querySelector<HTMLElement>(".ticker-context-menu");
    expect(menu?.style.display).toBe("block");
  });

  it("renders ticker name in header", () => {
    registerTickerActions([{ id: "chart", label: "View Chart", handler: vi.fn() }]);
    showTickerMenu("MSFT", 100, 200);
    const header = document.querySelector(".context-menu-header");
    expect(header?.textContent).toBe("MSFT");
  });

  it("renders registered actions as buttons", () => {
    registerTickerActions([
      { id: "chart", label: "View Chart", handler: vi.fn() },
      { id: "copy", label: "Copy Ticker", handler: vi.fn() },
    ]);
    showTickerMenu("GOOG", 50, 50);
    const buttons = document.querySelectorAll(".context-menu-item");
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain("View Chart");
    expect(buttons[1].textContent).toContain("Copy Ticker");
  });

  it("clicking action calls handler with ticker", () => {
    const handler = vi.fn();
    registerTickerActions([{ id: "chart", label: "View Chart", handler }]);
    showTickerMenu("TSLA", 50, 50);
    const btn = document.querySelector<HTMLElement>(".context-menu-item");
    btn?.click();
    expect(handler).toHaveBeenCalledWith("TSLA");
  });

  it("hideTickerMenu hides the menu", () => {
    showTickerMenu("AAPL", 100, 200);
    hideTickerMenu();
    const menu = document.querySelector<HTMLElement>(".ticker-context-menu");
    expect(menu?.style.display).toBe("none");
  });

  it("Escape key hides the menu", () => {
    showTickerMenu("AAPL", 100, 200);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    const menu = document.querySelector<HTMLElement>(".ticker-context-menu");
    expect(menu?.style.display).toBe("none");
  });

  it("cleanup removes menu from DOM", () => {
    cleanup();
    expect(document.querySelector(".ticker-context-menu")).toBeNull();
    // Re-init for afterEach
    cleanup = initTickerContextMenu();
  });

  it("getRegisteredActions returns actions", () => {
    const actions = [{ id: "test", label: "Test", handler: vi.fn() }];
    registerTickerActions(actions);
    expect(getRegisteredActions()).toEqual(actions);
  });
});
