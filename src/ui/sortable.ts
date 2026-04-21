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
