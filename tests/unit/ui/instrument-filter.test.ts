import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  applyInstrumentFilter,
  instrumentTypeBadge,
  getInstrumentFilter,
  setInstrumentFilter,
  loadInstrumentFilter,
  renderChipBar,
  mountInstrumentFilterBar,
} from "../../../src/ui/instrument-filter";
import type { WatchlistEntry } from "../../../src/types/domain";

const ENTRIES: WatchlistEntry[] = [
  { ticker: "AAPL", addedAt: "2024-01-01", instrumentType: "stock" },
  { ticker: "SPY", addedAt: "2024-01-02", instrumentType: "etf" },
  { ticker: "BTC-USD", addedAt: "2024-01-03", instrumentType: "crypto" },
  { ticker: "UNKNOWN", addedAt: "2024-01-04" },
];

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(i: number) {
      return [...store.keys()][i] ?? null;
    },
    getItem(k: string) {
      return store.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
  };
}

describe("instrument-filter", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
    setInstrumentFilter("all");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("applyInstrumentFilter", () => {
    it("all — returns every entry", () => {
      expect(applyInstrumentFilter(ENTRIES, "all")).toHaveLength(4);
    });

    it("stock — only stock entries", () => {
      const result = applyInstrumentFilter(ENTRIES, "stock");
      expect(result.map((e) => e.ticker)).toEqual(["AAPL"]);
    });

    it("etf — only etf entries", () => {
      const result = applyInstrumentFilter(ENTRIES, "etf");
      expect(result.map((e) => e.ticker)).toEqual(["SPY"]);
    });

    it("crypto — only crypto entries", () => {
      const result = applyInstrumentFilter(ENTRIES, "crypto");
      expect(result.map((e) => e.ticker)).toEqual(["BTC-USD"]);
    });

    it("other — entries without type fall back to other", () => {
      const result = applyInstrumentFilter(ENTRIES, "other");
      expect(result.map((e) => e.ticker)).toEqual(["UNKNOWN"]);
    });

    it("uses current activeFilter when no filter arg given", () => {
      setInstrumentFilter("etf");
      expect(applyInstrumentFilter(ENTRIES)).toHaveLength(1);
      expect(applyInstrumentFilter(ENTRIES)[0]?.ticker).toBe("SPY");
    });
  });

  describe("setInstrumentFilter + getInstrumentFilter", () => {
    it("persists to localStorage", () => {
      setInstrumentFilter("crypto");
      expect(localStorage.getItem("ct_instrument_filter")).toBe("crypto");
      expect(getInstrumentFilter()).toBe("crypto");
    });

    it("invokes onChange callback", () => {
      const cb = vi.fn();
      setInstrumentFilter("stock", cb);
      expect(cb).toHaveBeenCalledOnce();
    });
  });

  describe("loadInstrumentFilter", () => {
    it("loads persisted value from localStorage", () => {
      localStorage.setItem("ct_instrument_filter", "etf");
      const loaded = loadInstrumentFilter();
      expect(loaded).toBe("etf");
    });

    it("ignores invalid stored value", () => {
      localStorage.setItem("ct_instrument_filter", "INVALID");
      setInstrumentFilter("all");
      const loaded = loadInstrumentFilter();
      expect(loaded).toBe("all");
    });
  });

  describe("instrumentTypeBadge", () => {
    it("returns empty string for undefined", () => {
      expect(instrumentTypeBadge(undefined)).toBe("");
    });

    it("returns a badge with correct class for stock", () => {
      const html = instrumentTypeBadge("stock");
      expect(html).toContain("instrument-badge-stock");
      expect(html).toContain("S");
    });

    it("returns E badge for etf", () => {
      expect(instrumentTypeBadge("etf")).toContain("E");
    });

    it("returns C badge for crypto", () => {
      expect(instrumentTypeBadge("crypto")).toContain("C");
    });
  });

  // ── renderChipBar DOM tests (B12) ───────────────────────────────────────────

  describe("renderChipBar", () => {
    let bar: HTMLDivElement;

    beforeEach(() => {
      bar = document.createElement("div");
      bar.id = "instrument-filter-bar";
      document.body.appendChild(bar);
      setInstrumentFilter("all");
    });

    afterEach(() => {
      bar.remove();
    });

    it("renders a chip button for every filter option", () => {
      renderChipBar();
      const buttons = bar.querySelectorAll<HTMLButtonElement>(".filter-chip");
      expect(buttons.length).toBe(5); // all, stock, etf, crypto, other
    });

    it("marks the active filter chip with the 'active' class", () => {
      setInstrumentFilter("etf");
      renderChipBar();
      const activeBtn = bar.querySelector<HTMLButtonElement>(".filter-chip.active");
      expect(activeBtn?.dataset["filter"]).toBe("etf");
    });

    it("each button has a data-filter attribute matching a valid filter", () => {
      renderChipBar();
      const buttons = bar.querySelectorAll<HTMLButtonElement>(".filter-chip");
      const filters = [...buttons].map((b) => b.dataset["filter"]);
      expect(filters).toContain("all");
      expect(filters).toContain("stock");
      expect(filters).toContain("etf");
      expect(filters).toContain("crypto");
      expect(filters).toContain("other");
    });

    it("clicking a chip updates the active filter", () => {
      renderChipBar();
      const stockBtn = bar.querySelector<HTMLButtonElement>('[data-filter="stock"]')!;
      stockBtn.click();
      expect(getInstrumentFilter()).toBe("stock");
    });

    it("clicking a chip invokes onChange callback", () => {
      const onChange = vi.fn();
      renderChipBar(onChange);
      const etfBtn = bar.querySelector<HTMLButtonElement>('[data-filter="etf"]')!;
      etfBtn.click();
      expect(onChange).toHaveBeenCalledOnce();
    });

    it("clicking a chip re-renders bar with correct active chip", () => {
      renderChipBar();
      const cryptoBtn = bar.querySelector<HTMLButtonElement>('[data-filter="crypto"]')!;
      cryptoBtn.click();
      // After click re-renders, active chip should be crypto
      const active = bar.querySelector<HTMLButtonElement>(".filter-chip.active");
      expect(active?.dataset["filter"]).toBe("crypto");
    });

    it("does nothing when bar element is not in DOM", () => {
      bar.remove();
      expect(() => renderChipBar()).not.toThrow();
    });
  });

  // ── mountInstrumentFilterBar DOM tests (B12) ─────────────────────────────────

  describe("mountInstrumentFilterBar", () => {
    let bar: HTMLDivElement;

    beforeEach(() => {
      bar = document.createElement("div");
      bar.id = "instrument-filter-bar";
      document.body.appendChild(bar);
    });

    afterEach(() => {
      bar.remove();
    });

    it("loads persisted filter from localStorage on mount", () => {
      localStorage.setItem("ct_instrument_filter", "stock");
      const onChange = vi.fn();
      mountInstrumentFilterBar(onChange);
      expect(getInstrumentFilter()).toBe("stock");
    });

    it("renders chip buttons after mounting", () => {
      mountInstrumentFilterBar(vi.fn());
      const buttons = bar.querySelectorAll<HTMLButtonElement>(".filter-chip");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
