import { describe, it, expect } from "vitest";
import {
  SHORTCUTS,
  shortcutsByCategory,
  findShortcut,
  formatKeys,
  searchShortcuts,
} from "../../../src/ui/shortcuts-catalog";

describe("shortcuts-catalog", () => {
  it("has unique ids", () => {
    const ids = new Set(SHORTCUTS.map((s) => s.id));
    expect(ids.size).toBe(SHORTCUTS.length);
  });

  it("every shortcut has at least one key", () => {
    for (const s of SHORTCUTS) {
      expect(s.keys.length).toBeGreaterThan(0);
    }
  });

  it("shortcutsByCategory groups all shortcuts", () => {
    const grouped = shortcutsByCategory();
    const total = Object.values(grouped).reduce((n, arr) => n + arr.length, 0);
    expect(total).toBe(SHORTCUTS.length);
  });

  it("findShortcut returns matching item", () => {
    expect(findShortcut("open-palette")?.keys).toEqual(["Ctrl", "K"]);
  });

  it("findShortcut returns undefined when missing", () => {
    expect(findShortcut("does-not-exist")).toBeUndefined();
  });

  it("formatKeys joins with plus", () => {
    expect(formatKeys(["Ctrl", "Shift", "P"])).toBe("Ctrl + Shift + P");
  });

  it("searchShortcuts filters by description", () => {
    const found = searchShortcuts("watchlist");
    expect(found.length).toBeGreaterThan(0);
    expect(
      found.every(
        (s) => s.description.toLowerCase().includes("watchlist") || s.id.includes("watchlist"),
      ),
    ).toBe(true);
  });

  it("searchShortcuts filters by key", () => {
    expect(searchShortcuts("Escape").length).toBeGreaterThan(0);
  });

  it("empty query returns all", () => {
    expect(searchShortcuts("")).toHaveLength(SHORTCUTS.length);
  });
});
