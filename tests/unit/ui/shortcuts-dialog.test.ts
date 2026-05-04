/**
 * Shortcuts dialog tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { openShortcutsDialog } from "../../../src/ui/shortcuts-dialog";
import { SHORTCUTS } from "../../../src/ui/shortcuts-catalog";

describe("openShortcutsDialog", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("opens a dialog with data-shortcuts-dialog attribute", () => {
    openShortcutsDialog();
    const dialog = document.querySelector("dialog");
    expect(dialog).not.toBeNull();
    const inner = dialog!.querySelector("[data-shortcuts-dialog]");
    expect(inner).not.toBeNull();
  });

  it("renders all categories as sections", () => {
    openShortcutsDialog();
    const sections = document.querySelectorAll(".shortcuts-section");
    expect(sections.length).toBeGreaterThanOrEqual(4);
  });

  it("renders kbd elements for shortcut keys", () => {
    openShortcutsDialog();
    const kbds = document.querySelectorAll(".shortcuts-keys kbd");
    expect(kbds.length).toBeGreaterThan(0);
  });

  it("includes all shortcuts from the catalog", () => {
    openShortcutsDialog();
    const descs = document.querySelectorAll(".shortcuts-desc");
    const texts = Array.from(descs).map((el) => el.textContent);
    for (const s of SHORTCUTS) {
      expect(texts).toContain(s.description);
    }
  });

  it("uses proper heading for each category", () => {
    openShortcutsDialog();
    const headings = document.querySelectorAll(".shortcuts-category");
    const texts = Array.from(headings).map((el) => el.textContent);
    expect(texts).toContain("Navigation");
    expect(texts).toContain("System");
  });
});
