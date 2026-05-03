/**
 * Screener column customization — lets users toggle column visibility.
 *
 * Persists preferences to localStorage. Provides a UI toggle panel and
 * filters columns in the rendered output.
 */

/** All available screener columns. */
export type ScreenerColumn = "ticker" | "price" | "consensus" | "matched" | "rsi" | "volume";

export interface ColumnDef {
  readonly id: ScreenerColumn;
  readonly label: string;
  readonly defaultVisible: boolean;
}

export const ALL_COLUMNS: readonly ColumnDef[] = [
  { id: "ticker", label: "Symbol", defaultVisible: true },
  { id: "price", label: "Price", defaultVisible: true },
  { id: "consensus", label: "Signal", defaultVisible: true },
  { id: "matched", label: "Matched", defaultVisible: true },
  { id: "rsi", label: "RSI", defaultVisible: false },
  { id: "volume", label: "Vol Ratio", defaultVisible: false },
];

const STORAGE_KEY = "crosstide-screener-columns";

/** Load visible column IDs from localStorage (returns defaults on first use). */
export function loadVisibleColumns(): Set<ScreenerColumn> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      const validIds = new Set<string>(ALL_COLUMNS.map((c) => c.id));
      const filtered = arr.filter((id) => validIds.has(id)) as ScreenerColumn[];
      if (filtered.length > 0) return new Set(filtered);
    }
  } catch {
    // Fall through to defaults
  }
  return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id));
}

/** Save visible column IDs to localStorage. */
export function saveVisibleColumns(columns: ReadonlySet<ScreenerColumn>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...columns]));
}

import { createDelegate } from "../ui/delegate";

/** Render the column toggle panel HTML. */
export function renderColumnToggles(
  visible: ReadonlySet<ScreenerColumn>,
  onChange: (col: ScreenerColumn, checked: boolean) => void,
): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "screener-column-toggles";
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", "Toggle screener columns");

  for (const col of ALL_COLUMNS) {
    const label = document.createElement("label");
    label.className = "column-toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = visible.has(col.id);
    checkbox.dataset["column"] = col.id;
    checkbox.dataset["action"] = "column-toggle";

    const span = document.createElement("span");
    span.textContent = col.label;

    label.appendChild(checkbox);
    label.appendChild(span);
    panel.appendChild(label);
  }

  createDelegate(
    panel,
    {
      "column-toggle": (target) => {
        const cb = target as HTMLInputElement;
        const col = cb.dataset["column"] as ScreenerColumn | undefined;
        if (col) onChange(col, cb.checked);
      },
    },
    { eventTypes: ["change"] },
  );

  return panel;
}
