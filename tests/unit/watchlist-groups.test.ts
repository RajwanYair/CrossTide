/**
 * Unit tests for watchlist groups.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadWatchlistGroups,
  saveWatchlistGroups,
  createGroup,
  deleteGroup,
  renameGroup,
  addTickerToGroup,
  removeTickerFromGroup,
  isGroupCollapsed,
  toggleGroupCollapsed,
  renderGroupHeader,
  type WatchlistGroup,
} from "../../src/ui/watchlist-groups";

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

describe("watchlist-groups", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
  });

  describe("loadWatchlistGroups", () => {
    it("returns empty array when no data stored", () => {
      expect(loadWatchlistGroups()).toEqual([]);
    });

    it("loads valid groups from localStorage", () => {
      const groups: WatchlistGroup[] = [{ id: "g1", name: "Favorites", tickers: ["AAPL", "MSFT"] }];
      localStorage.setItem("crosstide-watchlist-groups", JSON.stringify(groups));
      const loaded = loadWatchlistGroups();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]!.name).toBe("Favorites");
      expect(loaded[0]!.tickers).toEqual(["AAPL", "MSFT"]);
    });

    it("returns empty on invalid JSON", () => {
      localStorage.setItem("crosstide-watchlist-groups", "not-json");
      expect(loadWatchlistGroups()).toEqual([]);
    });

    it("filters out invalid entries", () => {
      localStorage.setItem(
        "crosstide-watchlist-groups",
        JSON.stringify([
          { id: "g1", name: "Valid", tickers: [] },
          { id: 123, name: "Bad ID" }, // invalid
          "not an object", // invalid
        ]),
      );
      const loaded = loadWatchlistGroups();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]!.id).toBe("g1");
    });
  });

  describe("saveWatchlistGroups", () => {
    it("persists groups to localStorage", () => {
      const groups: WatchlistGroup[] = [{ id: "g1", name: "Tech", tickers: ["NVDA"] }];
      saveWatchlistGroups(groups);
      const stored = JSON.parse(localStorage.getItem("crosstide-watchlist-groups")!);
      expect(stored).toEqual(groups);
    });
  });

  describe("createGroup", () => {
    it("adds a new group and saves", () => {
      const result = createGroup([], "My Group");
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("My Group");
      expect(result[0]!.tickers).toEqual([]);
      expect(result[0]!.id).toMatch(/^wlg_/);
      // Verify persisted
      const stored = JSON.parse(localStorage.getItem("crosstide-watchlist-groups")!);
      expect(stored).toHaveLength(1);
    });

    it("trims whitespace from name", () => {
      const result = createGroup([], "  Trimmed  ");
      expect(result[0]!.name).toBe("Trimmed");
    });
  });

  describe("deleteGroup", () => {
    it("removes the group by ID", () => {
      const groups: WatchlistGroup[] = [
        { id: "g1", name: "A", tickers: [] },
        { id: "g2", name: "B", tickers: [] },
      ];
      const result = deleteGroup(groups, "g1");
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe("g2");
    });
  });

  describe("renameGroup", () => {
    it("renames the group", () => {
      const groups: WatchlistGroup[] = [{ id: "g1", name: "Old", tickers: [] }];
      const result = renameGroup(groups, "g1", "New Name");
      expect(result[0]!.name).toBe("New Name");
    });
  });

  describe("addTickerToGroup", () => {
    it("adds a ticker to the group", () => {
      const groups: WatchlistGroup[] = [{ id: "g1", name: "Fav", tickers: ["AAPL"] }];
      const result = addTickerToGroup(groups, "g1", "MSFT");
      expect(result[0]!.tickers).toEqual(["AAPL", "MSFT"]);
    });

    it("does not add duplicates", () => {
      const groups: WatchlistGroup[] = [{ id: "g1", name: "Fav", tickers: ["AAPL"] }];
      const result = addTickerToGroup(groups, "g1", "AAPL");
      expect(result[0]!.tickers).toEqual(["AAPL"]);
    });
  });

  describe("removeTickerFromGroup", () => {
    it("removes a ticker from the group", () => {
      const groups: WatchlistGroup[] = [{ id: "g1", name: "Fav", tickers: ["AAPL", "MSFT"] }];
      const result = removeTickerFromGroup(groups, "g1", "AAPL");
      expect(result[0]!.tickers).toEqual(["MSFT"]);
    });
  });

  describe("collapse state", () => {
    it("returns false by default", () => {
      expect(isGroupCollapsed("g1")).toBe(false);
    });

    it("toggles collapse state", () => {
      const collapsed = toggleGroupCollapsed("g1");
      expect(collapsed).toBe(true);
      expect(isGroupCollapsed("g1")).toBe(true);

      const expanded = toggleGroupCollapsed("g1");
      expect(expanded).toBe(false);
      expect(isGroupCollapsed("g1")).toBe(false);
    });
  });

  describe("renderGroupHeader", () => {
    it("renders expanded header", () => {
      const group: WatchlistGroup = { id: "g1", name: "Tech", tickers: ["AAPL", "MSFT"] };
      const html = renderGroupHeader(group, false);
      expect(html).toContain("Tech");
      expect(html).toContain("(2)");
      expect(html).toContain("▼");
      expect(html).toContain('aria-expanded="true"');
    });

    it("renders collapsed header", () => {
      const group: WatchlistGroup = { id: "g1", name: "Fav", tickers: [] };
      const html = renderGroupHeader(group, true);
      expect(html).toContain("▶");
      expect(html).toContain('aria-expanded="false"');
    });

    it("escapes HTML in group name", () => {
      const group: WatchlistGroup = { id: "g1", name: "<script>", tickers: [] };
      const html = renderGroupHeader(group, false);
      expect(html).toContain("&lt;script&gt;");
      expect(html).not.toContain("<script>");
    });
  });
});
