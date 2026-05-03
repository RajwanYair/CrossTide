/**
 * Unit tests for screener column customization.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadVisibleColumns,
  saveVisibleColumns,
  renderColumnToggles,
  ALL_COLUMNS,
  type ScreenerColumn,
} from "../../src/cards/screener-columns";

function storageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe("screener-columns", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
  });

  describe("loadVisibleColumns", () => {
    it("returns default columns on first use", () => {
      const cols = loadVisibleColumns();
      expect(cols.has("ticker")).toBe(true);
      expect(cols.has("price")).toBe(true);
      expect(cols.has("consensus")).toBe(true);
      expect(cols.has("matched")).toBe(true);
      expect(cols.has("rsi")).toBe(false);
      expect(cols.has("volume")).toBe(false);
    });

    it("loads saved columns from localStorage", () => {
      localStorage.setItem("crosstide-screener-columns", JSON.stringify(["ticker", "rsi"]));
      const cols = loadVisibleColumns();
      expect(cols.has("ticker")).toBe(true);
      expect(cols.has("rsi")).toBe(true);
      expect(cols.has("price")).toBe(false);
    });

    it("ignores invalid column IDs in storage", () => {
      localStorage.setItem("crosstide-screener-columns", JSON.stringify(["ticker", "invalid"]));
      const cols = loadVisibleColumns();
      expect(cols.has("ticker")).toBe(true);
      expect(cols.size).toBe(1);
    });

    it("returns defaults on corrupted JSON", () => {
      localStorage.setItem("crosstide-screener-columns", "not-json");
      const cols = loadVisibleColumns();
      expect(cols.size).toBeGreaterThan(0);
      expect(cols.has("ticker")).toBe(true);
    });
  });

  describe("saveVisibleColumns", () => {
    it("persists columns to localStorage", () => {
      const cols = new Set<ScreenerColumn>(["ticker", "rsi", "volume"]);
      saveVisibleColumns(cols);
      const stored = JSON.parse(localStorage.getItem("crosstide-screener-columns")!) as string[];
      expect(stored).toContain("ticker");
      expect(stored).toContain("rsi");
      expect(stored).toContain("volume");
      expect(stored).toHaveLength(3);
    });
  });

  describe("renderColumnToggles", () => {
    it("renders checkboxes for all columns", () => {
      const visible = new Set<ScreenerColumn>(["ticker", "price"]);
      const panel = renderColumnToggles(visible, vi.fn());
      const checkboxes = panel.querySelectorAll("input[type='checkbox']");
      expect(checkboxes).toHaveLength(ALL_COLUMNS.length);
    });

    it("checks boxes for visible columns", () => {
      const visible = new Set<ScreenerColumn>(["ticker", "rsi"]);
      const panel = renderColumnToggles(visible, vi.fn());
      const checkboxes = panel.querySelectorAll<HTMLInputElement>("input[type='checkbox']");
      const checkedCols = Array.from(checkboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.dataset["column"]);
      expect(checkedCols).toContain("ticker");
      expect(checkedCols).toContain("rsi");
      expect(checkedCols).not.toContain("price");
    });

    it("calls onChange when a checkbox is toggled", () => {
      const visible = new Set<ScreenerColumn>(["ticker"]);
      const onChange = vi.fn();
      const panel = renderColumnToggles(visible, onChange);
      const checkboxes = panel.querySelectorAll<HTMLInputElement>("input[type='checkbox']");
      // Find the "price" checkbox and toggle it
      const priceCheckbox = Array.from(checkboxes).find((cb) => cb.dataset["column"] === "price")!;
      priceCheckbox.checked = true;
      priceCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
      expect(onChange).toHaveBeenCalledWith("price", true);
    });

    it("has proper ARIA attributes", () => {
      const visible = new Set<ScreenerColumn>(["ticker"]);
      const panel = renderColumnToggles(visible, vi.fn());
      expect(panel.getAttribute("role")).toBe("group");
      expect(panel.getAttribute("aria-label")).toBe("Toggle screener columns");
    });
  });
});
