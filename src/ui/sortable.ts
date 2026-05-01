/**
 * Sortable columns — generic table sort utility.
 *
 * Pure function: takes rows + sort config, returns sorted rows.
 */

export type SortDirection = "asc" | "desc";

export interface SortConfig<K extends string = string> {
  readonly column: K;
  readonly direction: SortDirection;
}

/**
 * Sort an array of objects by a column key.
 * Returns a new sorted array (does not mutate input).
 */
export function sortRows<T extends Record<string, unknown>>(
  rows: readonly T[],
  config: SortConfig<Extract<keyof T, string>>,
): T[] {
  const { column, direction } = config;
  const mult = direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const va = a[column];
    const vb = b[column];

    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;

    if (typeof va === "number" && typeof vb === "number") {
      return (va - vb) * mult;
    }

    return String(va).localeCompare(String(vb)) * mult;
  });
}

/**
 * Toggle sort direction. If the column changes, default to "asc".
 */
export function toggleSort<K extends string>(
  current: SortConfig<K>,
  clickedColumn: K,
): SortConfig<K> {
  if (current.column === clickedColumn) {
    return { column: clickedColumn, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { column: clickedColumn, direction: "asc" };
}

/**
 * Return the aria-sort attribute value for a given column header.
 */
export function ariaSort<K extends string>(
  sort: SortConfig<K>,
  col: K,
): "ascending" | "descending" | "none" {
  if (sort.column !== col) return "none";
  return sort.direction === "asc" ? "ascending" : "descending";
}

/**
 * Wire keyboard activation (Enter / Space) on all [data-sort] <th> elements.
 * Call this after re-rendering a sortable thead.
 *
 * @param thead       The <thead> element (or any ancestor containing [data-sort] elements).
 * @param onSort      Callback invoked with the column key when a header is activated.
 * @param liveRegion  Optional aria-live region to announce the new sort state.
 * @param getAria     Optional function to read the current aria-sort value for announcements.
 */
export function bindSortableTable<K extends string>(
  thead: HTMLElement | null,
  onSort: (col: K) => void,
  liveRegion?: HTMLElement | null,
  getAria?: (col: K) => string,
): void {
  if (!thead) return;
  const ths = thead.querySelectorAll<HTMLElement>("[data-sort]");
  for (const th of ths) {
    th.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const col = th.dataset["sort"] as K;
        onSort(col);
        if (liveRegion && getAria) {
          const ariaValue = getAria(col);
          liveRegion.textContent = `Sorted by ${col} ${ariaValue}`;
        }
      }
    });
  }
}
