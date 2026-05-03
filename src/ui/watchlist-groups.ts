/**
 * Watchlist groups — user-defined collapsible groupings for the watchlist.
 *
 * Users can create named groups (e.g., "Favorites", "Tech Picks") and
 * assign tickers to them. Groups render as collapsible sections in the
 * watchlist view, similar to sector grouping.
 *
 * Storage: groups are persisted in localStorage as a JSON array.
 * Collapse state is persisted per-group via a separate key prefix.
 */

const GROUPS_STORAGE_KEY = "crosstide-watchlist-groups";
const COLLAPSE_KEY_PREFIX = "ct_wlgroup_collapsed_";

/** A user-defined watchlist group. */
export interface WatchlistGroup {
  readonly id: string;
  readonly name: string;
  readonly tickers: readonly string[];
}

// ── Persistence ──────────────────────────────────────────────────────────────

/** Load all user-defined watchlist groups from localStorage. */
export function loadWatchlistGroups(): WatchlistGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (g): g is WatchlistGroup =>
        typeof g === "object" &&
        g !== null &&
        typeof (g as Record<string, unknown>)["id"] === "string" &&
        typeof (g as Record<string, unknown>)["name"] === "string" &&
        Array.isArray((g as Record<string, unknown>)["tickers"]),
    );
  } catch {
    return [];
  }
}

/** Save all user-defined watchlist groups to localStorage. */
export function saveWatchlistGroups(groups: readonly WatchlistGroup[]): void {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch {
    // Quota exceeded or storage unavailable — silently degrade
  }
}

/** Create a new watchlist group. Returns updated groups array. */
export function createGroup(groups: readonly WatchlistGroup[], name: string): WatchlistGroup[] {
  const id = `wlg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const newGroup: WatchlistGroup = { id, name: name.trim(), tickers: [] };
  const updated = [...groups, newGroup];
  saveWatchlistGroups(updated);
  return updated;
}

/** Delete a watchlist group by ID. Returns updated groups array. */
export function deleteGroup(groups: readonly WatchlistGroup[], groupId: string): WatchlistGroup[] {
  const updated = groups.filter((g) => g.id !== groupId);
  saveWatchlistGroups(updated);
  return updated;
}

/** Rename a watchlist group. Returns updated groups array. */
export function renameGroup(
  groups: readonly WatchlistGroup[],
  groupId: string,
  newName: string,
): WatchlistGroup[] {
  const updated = groups.map((g) => (g.id === groupId ? { ...g, name: newName.trim() } : g));
  saveWatchlistGroups(updated);
  return updated;
}

/** Add a ticker to a group. Returns updated groups array. */
export function addTickerToGroup(
  groups: readonly WatchlistGroup[],
  groupId: string,
  ticker: string,
): WatchlistGroup[] {
  const updated = groups.map((g) => {
    if (g.id !== groupId) return g;
    if (g.tickers.includes(ticker)) return g;
    return { ...g, tickers: [...g.tickers, ticker] };
  });
  saveWatchlistGroups(updated);
  return updated;
}

/** Remove a ticker from a group. Returns updated groups array. */
export function removeTickerFromGroup(
  groups: readonly WatchlistGroup[],
  groupId: string,
  ticker: string,
): WatchlistGroup[] {
  const updated = groups.map((g) => {
    if (g.id !== groupId) return g;
    return { ...g, tickers: g.tickers.filter((t) => t !== ticker) };
  });
  saveWatchlistGroups(updated);
  return updated;
}

// ── Collapse state ───────────────────────────────────────────────────────────

/** Check if a group is collapsed. */
export function isGroupCollapsed(groupId: string): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY_PREFIX + groupId) === "1";
  } catch {
    return false;
  }
}

/** Toggle collapse state for a group. Returns new collapsed state. */
export function toggleGroupCollapsed(groupId: string): boolean {
  const next = !isGroupCollapsed(groupId);
  try {
    if (next) {
      localStorage.setItem(COLLAPSE_KEY_PREFIX + groupId, "1");
    } else {
      localStorage.removeItem(COLLAPSE_KEY_PREFIX + groupId);
    }
  } catch {
    // ignore
  }
  return next;
}

// ── Rendering helper ─────────────────────────────────────────────────────────

/** Render a group header HTML (collapsible). */
export function renderGroupHeader(group: WatchlistGroup, collapsed: boolean): string {
  const chevron = collapsed ? "▶" : "▼";
  const count = group.tickers.length;
  return `<tr class="group-header" data-group-id="${group.id}" role="row" aria-expanded="${!collapsed}">
    <td colspan="6" class="group-header-cell">
      <button class="group-toggle-btn" aria-label="${collapsed ? "Expand" : "Collapse"} ${escapeHtml(group.name)}">
        <span class="group-chevron">${chevron}</span>
        <strong>${escapeHtml(group.name)}</strong>
        <span class="group-count">(${count})</span>
      </button>
    </td>
  </tr>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
