/**
 * Keyboard shortcut catalog. A pure data + helper module that powers
 * the in-app "?" help overlay and any contextual UI listing shortcuts.
 */

export interface KeyboardShortcut {
  readonly id: string;
  readonly keys: readonly string[];
  readonly description: string;
  readonly category: ShortcutCategory;
}

export type ShortcutCategory = "navigation" | "search" | "view" | "data" | "alerts" | "system";

export const SHORTCUTS: readonly KeyboardShortcut[] = [
  {
    id: "open-palette",
    keys: ["Ctrl", "K"],
    description: "Open command palette",
    category: "search",
  },
  { id: "search", keys: ["/"], description: "Focus search box", category: "search" },
  { id: "help", keys: ["?"], description: "Show keyboard help", category: "system" },
  { id: "toggle-theme", keys: ["T"], description: "Toggle light/dark theme", category: "view" },
  { id: "next-card", keys: ["J"], description: "Move to next card", category: "navigation" },
  { id: "prev-card", keys: ["K"], description: "Move to previous card", category: "navigation" },
  { id: "go-watchlist", keys: ["G", "W"], description: "Go to watchlist", category: "navigation" },
  { id: "go-screener", keys: ["G", "S"], description: "Go to screener", category: "navigation" },
  { id: "go-portfolio", keys: ["G", "P"], description: "Go to portfolio", category: "navigation" },
  { id: "go-alerts", keys: ["G", "A"], description: "Go to alerts", category: "navigation" },
  { id: "refresh", keys: ["R"], description: "Refresh current view", category: "data" },
  { id: "export", keys: ["Ctrl", "E"], description: "Export current data", category: "data" },
  { id: "ack-alert", keys: ["A"], description: "Acknowledge selected alert", category: "alerts" },
  { id: "snooze-alert", keys: ["S"], description: "Snooze selected alert", category: "alerts" },
  { id: "fullscreen", keys: ["F"], description: "Toggle fullscreen card", category: "view" },
  { id: "close-modal", keys: ["Escape"], description: "Close dialog or modal", category: "system" },
];

export function shortcutsByCategory(): Record<ShortcutCategory, KeyboardShortcut[]> {
  const out: Record<ShortcutCategory, KeyboardShortcut[]> = {
    navigation: [],
    search: [],
    view: [],
    data: [],
    alerts: [],
    system: [],
  };
  for (const s of SHORTCUTS) {
    out[s.category].push(s);
  }
  return out;
}

export function findShortcut(id: string): KeyboardShortcut | undefined {
  return SHORTCUTS.find((s) => s.id === id);
}

export function formatKeys(keys: readonly string[]): string {
  return keys.join(" + ");
}

export function searchShortcuts(query: string): KeyboardShortcut[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...SHORTCUTS];
  return SHORTCUTS.filter(
    (s) =>
      s.description.toLowerCase().includes(q) ||
      s.keys.some((k) => k.toLowerCase().includes(q)) ||
      s.id.includes(q),
  );
}
