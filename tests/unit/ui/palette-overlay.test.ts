/**
 * Tests for src/ui/palette-overlay.ts
 *
 * DOM environment: happy-dom (configured in vitest.config.ts).
 * `dialog.showModal()` / `dialog.close()` are supported by happy-dom.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { openPalette, closePalette, isPaletteOpen } from "../../../src/ui/palette-overlay";
import type { PaletteCommand } from "../../../src/ui/command-palette";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCmd(id: string, label: string, hint?: string): PaletteCommand {
  return {
    id,
    label,
    ...(hint !== undefined && { hint }),
    run: vi.fn(),
  };
}

const CMD_DARK: PaletteCommand = makeCmd("theme-dark", "Toggle Dark Mode", "Ctrl+D");
const CMD_REFRESH: PaletteCommand = makeCmd("refresh", "Refresh Data");
const CMD_EXPORT: PaletteCommand = makeCmd("export", "Export Watchlist");

function getDialog(): HTMLDialogElement | null {
  return document.getElementById("command-palette-dialog") as HTMLDialogElement | null;
}

function getInput(): HTMLInputElement | null {
  return getDialog()?.querySelector<HTMLInputElement>(".palette-input") ?? null;
}

function getResults(): HTMLUListElement | null {
  return getDialog()?.querySelector<HTMLUListElement>(".palette-results") ?? null;
}

function dispatch(el: HTMLElement | EventTarget, type: string, init?: KeyboardEventInit): void {
  const event = new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("palette-overlay", () => {
  beforeEach(() => {
    // Close any open palette so the singleton is in a clean, closed state.
    // We do NOT remove the element — the module-level singleton retains the
    // same <dialog> reference; removing it would detach the element while the
    // module still holds the stale pointer.
    closePalette();
  });

  describe("openPalette", () => {
    it("creates the dialog element if not present", () => {
      openPalette([CMD_DARK]);
      const dialog = getDialog();
      expect(dialog).not.toBeNull();
      expect(dialog!.id).toBe("command-palette-dialog");
    });

    it("reuses the same dialog element on subsequent opens", () => {
      openPalette([CMD_DARK]);
      const first = getDialog();
      closePalette();
      openPalette([CMD_REFRESH]);
      const second = getDialog();
      expect(first).toBe(second);
    });

    it("renders all commands as list items when query is empty", () => {
      openPalette([CMD_DARK, CMD_REFRESH, CMD_EXPORT]);
      const items = getResults()?.querySelectorAll(".palette-item");
      expect(items?.length).toBe(3);
    });

    it("renders 'No matching commands' when command list is empty", () => {
      openPalette([]);
      const empty = getResults()?.querySelector(".palette-empty");
      expect(empty).not.toBeNull();
      expect(empty!.textContent).toContain("No matching commands");
    });

    it("renders hint text when command has a hint", () => {
      openPalette([CMD_DARK]);
      const hint = getResults()?.querySelector(".palette-hint");
      expect(hint?.textContent).toBe("Ctrl+D");
    });

    it("escapes HTML in label and hint", () => {
      const evil = makeCmd("xss", "<script>alert(1)</script>", "<b>bold</b>");
      openPalette([evil]);
      const html = getResults()!.innerHTML;
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
      expect(html).not.toContain("<b>");
    });

    it("first item has selected class by default", () => {
      openPalette([CMD_DARK, CMD_REFRESH]);
      const items = getResults()?.querySelectorAll(".palette-item");
      expect(items![0]!.classList.contains("selected")).toBe(true);
      expect(items![1]!.classList.contains("selected")).toBe(false);
    });

    it("clears input value on open", () => {
      openPalette([CMD_DARK]);
      const input = getInput();
      input!.value = "stale";
      closePalette();
      openPalette([CMD_DARK]);
      expect(getInput()!.value).toBe("");
    });
  });

  describe("closePalette / isPaletteOpen", () => {
    it("isPaletteOpen returns false before any open", () => {
      expect(isPaletteOpen()).toBe(false);
    });

    it("isPaletteOpen returns true after openPalette", () => {
      openPalette([CMD_DARK]);
      expect(isPaletteOpen()).toBe(true);
    });

    it("closePalette closes the dialog", () => {
      openPalette([CMD_DARK]);
      closePalette();
      expect(isPaletteOpen()).toBe(false);
    });
  });

  describe("keyboard navigation", () => {
    it("ArrowDown moves selection forward", () => {
      openPalette([CMD_DARK, CMD_REFRESH, CMD_EXPORT]);
      const input = getInput()!;
      dispatch(input, "keydown", { key: "ArrowDown" });
      const items = getResults()?.querySelectorAll(".palette-item");
      expect(items![1]!.classList.contains("selected")).toBe(true);
    });

    it("ArrowUp moves selection backward", () => {
      openPalette([CMD_DARK, CMD_REFRESH, CMD_EXPORT]);
      const input = getInput()!;
      // Move to index 2
      dispatch(input, "keydown", { key: "ArrowDown" });
      dispatch(input, "keydown", { key: "ArrowDown" });
      // Move back to index 1
      dispatch(input, "keydown", { key: "ArrowUp" });
      const items = getResults()?.querySelectorAll(".palette-item");
      expect(items![1]!.classList.contains("selected")).toBe(true);
    });

    it("Escape closes the dialog", () => {
      openPalette([CMD_DARK]);
      dispatch(getInput()!, "keydown", { key: "Escape" });
      expect(isPaletteOpen()).toBe(false);
    });

    it("Enter executes the selected command and closes dialog", () => {
      const run = vi.fn();
      const cmd = makeCmd("run-me", "Run Command");
      (cmd as { run: () => void }).run = run;
      openPalette([cmd]);
      dispatch(getInput()!, "keydown", { key: "Enter" });
      expect(run).toHaveBeenCalledOnce();
      expect(isPaletteOpen()).toBe(false);
    });

    it("Enter is no-op when no commands are present", () => {
      openPalette([]);
      expect(() => dispatch(getInput()!, "keydown", { key: "Enter" })).not.toThrow();
    });
  });

  describe("search input", () => {
    it("filters results as user types", () => {
      openPalette([CMD_DARK, CMD_REFRESH, CMD_EXPORT]);
      const input = getInput()!;
      input.value = "dark";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      const items = getResults()?.querySelectorAll(".palette-item");
      // Only "Toggle Dark Mode" matches "dark"
      expect(items?.length).toBe(1);
    });

    it("shows 'No matching commands' when no results match query", () => {
      openPalette([CMD_DARK, CMD_REFRESH]);
      const input = getInput()!;
      input.value = "zzznomatch";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      const empty = getResults()?.querySelector(".palette-empty");
      expect(empty).not.toBeNull();
    });
  });

  describe("click on result item", () => {
    it("executes the clicked command", () => {
      const run = vi.fn();
      const cmd = { ...CMD_REFRESH, run };
      openPalette([CMD_DARK, cmd]);
      const items = getResults()?.querySelectorAll<HTMLElement>(".palette-item");
      // "Refresh Data" sorts before "Toggle Dark Mode" alphabetically (index 0)
      items![0]!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(run).toHaveBeenCalledOnce();
    });

    it("ignores clicks outside palette-item elements", () => {
      openPalette([CMD_DARK]);
      expect(() =>
        getResults()!.dispatchEvent(new MouseEvent("click", { bubbles: true })),
      ).not.toThrow();
    });
  });

  describe("backdrop click", () => {
    it("clicking directly on the dialog element closes it", () => {
      openPalette([CMD_DARK]);
      const dialog = getDialog()!;
      // Simulate click where e.target === overlay (the dialog itself)
      dialog.dispatchEvent(new MouseEvent("click", { bubbles: false }));
      expect(isPaletteOpen()).toBe(false);
    });
  });
});
