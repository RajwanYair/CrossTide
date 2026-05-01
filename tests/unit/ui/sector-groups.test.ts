import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  groupBySector,
  isSectorCollapsed,
  toggleSectorCollapsed,
  renderSectorGroup,
  bindSectorHeaders,
} from "../../../src/ui/sector-groups";
import type { WatchlistEntry } from "../../../src/types/domain";

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

describe("sector-groups", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const ENTRIES: WatchlistEntry[] = [
    { ticker: "AAPL", addedAt: "2024-01-01", instrumentType: "stock" },
    { ticker: "MSFT", addedAt: "2024-01-02", instrumentType: "stock" },
    { ticker: "JNJ", addedAt: "2024-01-03", instrumentType: "stock" },
    { ticker: "SPY", addedAt: "2024-01-04", instrumentType: "etf" },
    { ticker: "BTC-USD", addedAt: "2024-01-05", instrumentType: "crypto" },
    { ticker: "UNKNOWN", addedAt: "2024-01-06" },
  ];

  const SECTOR_MAP = new Map([
    ["AAPL", "Technology"],
    ["MSFT", "Technology"],
    ["JNJ", "Healthcare"],
  ]);

  describe("groupBySector", () => {
    it("groups equities into named sector buckets", () => {
      const groups = groupBySector(ENTRIES, SECTOR_MAP);
      const names = groups.map((g) => g.name);
      expect(names).toContain("Technology");
      expect(names).toContain("Healthcare");
    });

    it("groups ETFs into ETF bucket at the end", () => {
      const groups = groupBySector(ENTRIES, SECTOR_MAP);
      const etfGroup = groups.find((g) => g.name === "— ETFs —");
      expect(etfGroup).toBeDefined();
      expect(etfGroup!.entries.map((e) => e.ticker)).toEqual(["SPY"]);
    });

    it("groups Crypto into Crypto bucket", () => {
      const groups = groupBySector(ENTRIES, SECTOR_MAP);
      const cryptoGroup = groups.find((g) => g.name === "— Crypto —");
      expect(cryptoGroup).toBeDefined();
    });

    it("entries without sector or type go to Unknown", () => {
      const groups = groupBySector(ENTRIES, SECTOR_MAP);
      const unknown = groups.find((g) => g.name === "— Unknown —");
      expect(unknown).toBeDefined();
      expect(unknown!.entries.map((e) => e.ticker)).toContain("UNKNOWN");
    });

    it("named sectors are sorted alphabetically", () => {
      const groups = groupBySector(ENTRIES, SECTOR_MAP);
      const namedGroups = groups.filter((g) => !g.name.startsWith("—"));
      const names = namedGroups.map((g) => g.name);
      expect(names).toEqual([...names].sort());
    });

    it("computes buyRatio from consensusMap", () => {
      const cm = new Map<string, "BUY" | "SELL" | "NEUTRAL">([
        ["AAPL", "BUY"],
        ["MSFT", "BUY"],
      ]);
      const groups = groupBySector(ENTRIES, SECTOR_MAP, cm);
      const tech = groups.find((g) => g.name === "Technology");
      expect(tech?.buyRatio).toBe(1); // both AAPL and MSFT are BUY
    });

    it("buyRatio is 0 when no consensus data", () => {
      const groups = groupBySector(ENTRIES, SECTOR_MAP);
      for (const g of groups) {
        expect(g.buyRatio).toBe(0);
      }
    });
  });

  describe("collapse state", () => {
    it("is not collapsed by default", () => {
      expect(isSectorCollapsed("Technology")).toBe(false);
    });

    it("toggleSectorCollapsed flips state", () => {
      expect(toggleSectorCollapsed("Technology")).toBe(true);
      expect(isSectorCollapsed("Technology")).toBe(true);
      expect(toggleSectorCollapsed("Technology")).toBe(false);
      expect(isSectorCollapsed("Technology")).toBe(false);
    });

    it("different sectors have independent state", () => {
      toggleSectorCollapsed("Technology");
      expect(isSectorCollapsed("Technology")).toBe(true);
      expect(isSectorCollapsed("Healthcare")).toBe(false);
    });
  });

  describe("renderSectorGroup", () => {
    it("renders a sector header row with chevron and count", () => {
      const group = {
        name: "Technology",
        entries: [
          { ticker: "AAPL", sector: "Technology" },
          { ticker: "MSFT", sector: "Technology" },
        ],
        buyRatio: 0,
      };
      const html = renderSectorGroup(group, (t) => `<tr><td>${t}</td></tr>`);
      expect(html).toContain("Technology");
      expect(html).toContain("(2)");
      expect(html).toContain("▼"); // expanded by default
    });

    it("renders data rows when expanded", () => {
      const group = {
        name: "Healthcare",
        entries: [{ ticker: "JNJ", sector: "Healthcare" }],
        buyRatio: 0,
      };
      const html = renderSectorGroup(group, (t) => `<tr><td>${t}</td></tr>`);
      expect(html).toContain("JNJ");
    });

    it("hides data rows when collapsed", () => {
      toggleSectorCollapsed("Collapsed");
      const group = {
        name: "Collapsed",
        entries: [{ ticker: "X", sector: "Collapsed" }],
        buyRatio: 0,
      };
      const html = renderSectorGroup(group, (t) => `<tr><td>${t}</td></tr>`);
      expect(html).toContain("▶"); // collapsed chevron
      expect(html).not.toContain("<tr><td>X</td></tr>");
    });

    it("renders consensus badge when there are entries with consensus", () => {
      const group = {
        name: "Finance",
        entries: [
          { ticker: "GS", sector: "Finance", consensus: "BUY" as const },
          { ticker: "MS", sector: "Finance", consensus: "BUY" as const },
        ],
        buyRatio: 1.0,
      };
      const html = renderSectorGroup(group, () => "");
      expect(html).toContain("badge-buy");
      expect(html).toContain("100% BUY");
    });
  });

  describe("bindSectorHeaders", () => {
    it("toggles collapse state on click", () => {
      const container = document.createElement("div");
      container.innerHTML = `<table><tbody>
        <tr data-sector="${encodeURIComponent("Technology")}"><td>Tech</td></tr>
      </tbody></table>`;
      document.body.appendChild(container);

      let called = 0;
      bindSectorHeaders(container, () => { called++; });

      const row = container.querySelector<HTMLElement>("[data-sector]")!;
      row.click();
      expect(called).toBe(1);
      expect(isSectorCollapsed("Technology")).toBe(true);

      document.body.removeChild(container);
    });

    it("toggles collapse state on Enter key", () => {
      const container = document.createElement("div");
      container.innerHTML = `<table><tbody>
        <tr data-sector="${encodeURIComponent("Energy")}"><td>Energy</td></tr>
      </tbody></table>`;
      document.body.appendChild(container);

      let called = 0;
      bindSectorHeaders(container, () => {
        called++;
      });

      const row = container.querySelector<HTMLElement>("[data-sector]")!;
      row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      expect(called).toBe(1);
      expect(isSectorCollapsed("Energy")).toBe(true);

      document.body.removeChild(container);
    });

    it("ignores keydown for non-Enter/Space keys", () => {
      const container = document.createElement("div");
      container.innerHTML = `<table><tbody>
        <tr data-sector="${encodeURIComponent("Materials")}"><td>M</td></tr>
      </tbody></table>`;
      document.body.appendChild(container);

      let called = 0;
      bindSectorHeaders(container, () => {
        called++;
      });

      const row = container.querySelector<HTMLElement>("[data-sector]")!;
      row.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      expect(called).toBe(0);

      document.body.removeChild(container);
    });
  });
});
