/**
 * Extended keyboard shortcut manager tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createShortcutManager } from "../../../src/core/keyboard";

describe("keyboard manager extended", () => {
  let manager: ReturnType<typeof createShortcutManager>;

  beforeEach(() => {
    manager = createShortcutManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  function fireKey(
    key: string,
    opts: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {},
  ): void {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        ctrlKey: opts.ctrlKey ?? false,
        shiftKey: opts.shiftKey ?? false,
        altKey: opts.altKey ?? false,
        bubbles: true,
      }),
    );
  }

  it("handler fires on matching keydown", () => {
    const spy = vi.fn();
    manager.register({ key: "r", description: "Refresh", handler: spy });
    fireKey("r");
    expect(spy).toHaveBeenCalledOnce();
  });

  it("handler does not fire for non-matching key", () => {
    const spy = vi.fn();
    manager.register({ key: "r", description: "Refresh", handler: spy });
    fireKey("x");
    expect(spy).not.toHaveBeenCalled();
  });

  it("Ctrl+key combo works", () => {
    const spy = vi.fn();
    manager.register({ key: "s", ctrl: true, description: "Save", handler: spy });
    fireKey("s", { ctrlKey: true });
    expect(spy).toHaveBeenCalledOnce();
  });

  it("unregister stops handler", () => {
    const spy = vi.fn();
    const unsub = manager.register({ key: "r", description: "Refresh", handler: spy });
    unsub();
    fireKey("r");
    expect(spy).not.toHaveBeenCalled();
  });

  it("list returns registered shortcuts", () => {
    manager.register({ key: "r", description: "Refresh", handler: () => {} });
    manager.register({ key: "/", description: "Search", handler: () => {} });
    const list = manager.list();
    expect(list).toHaveLength(2);
    expect(list.map((s) => s.description)).toContain("Refresh");
    expect(list.map((s) => s.description)).toContain("Search");
  });

  it("destroy clears all shortcuts", () => {
    manager.register({ key: "r", description: "Refresh", handler: () => {} });
    manager.destroy();
    expect(manager.list()).toHaveLength(0);
  });

  it("ignores keystrokes when input is focused", () => {
    const spy = vi.fn();
    manager.register({ key: "r", description: "Refresh", handler: spy });
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireKey("r");
    expect(spy).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
