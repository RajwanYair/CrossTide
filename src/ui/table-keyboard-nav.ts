/**
 * Table Keyboard Navigation — arrow key navigation for data tables.
 *
 * Enables:
 * - Arrow Up/Down: move between rows
 * - Arrow Left/Right: move between cells in a row
 * - Enter: activate the focused cell (triggers click on first link/button)
 * - Escape: move focus back to the table element
 * - Home/End: jump to first/last cell in the row
 *
 * Usage:
 *   enableTableKeyNav(tableElement);
 */

export function enableTableKeyNav(table: HTMLTableElement): () => void {
  let currentRow = 0;
  let currentCol = 0;

  const getRows = (): HTMLTableRowElement[] => Array.from(table.querySelectorAll("tbody tr"));

  const getCells = (row: HTMLTableRowElement): HTMLTableCellElement[] =>
    Array.from(row.querySelectorAll("td, th"));

  function focusCell(rowIdx: number, colIdx: number): void {
    const rows = getRows();
    if (rows.length === 0) return;

    // Clamp indices
    rowIdx = Math.max(0, Math.min(rows.length - 1, rowIdx));
    const row = rows[rowIdx]!;
    const cells = getCells(row);
    if (cells.length === 0) return;
    colIdx = Math.max(0, Math.min(cells.length - 1, colIdx));

    // Remove previous focus
    table.querySelectorAll("[data-table-focus]").forEach((el) => {
      el.removeAttribute("data-table-focus");
      el.removeAttribute("tabindex");
    });

    const cell = cells[colIdx]!;
    cell.setAttribute("tabindex", "0");
    cell.setAttribute("data-table-focus", "true");
    cell.focus();

    currentRow = rowIdx;
    currentCol = colIdx;
  }

  function onKeyDown(e: KeyboardEvent): void {
    const rows = getRows();
    if (rows.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusCell(currentRow + 1, currentCol);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusCell(currentRow - 1, currentCol);
        break;
      case "ArrowRight":
        e.preventDefault();
        focusCell(currentRow, currentCol + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusCell(currentRow, currentCol - 1);
        break;
      case "Home":
        e.preventDefault();
        focusCell(currentRow, 0);
        break;
      case "End": {
        e.preventDefault();
        const cells = getCells(rows[currentRow]!);
        focusCell(currentRow, cells.length - 1);
        break;
      }
      case "Enter": {
        e.preventDefault();
        const cell = table.querySelector("[data-table-focus]");
        const interactive = cell?.querySelector<HTMLElement>("a, button, input, select");
        if (interactive) interactive.click();
        break;
      }
      case "Escape":
        e.preventDefault();
        table.querySelectorAll("[data-table-focus]").forEach((el) => {
          el.removeAttribute("data-table-focus");
          el.removeAttribute("tabindex");
        });
        escapedToTable = true;
        table.focus();
        break;
    }
  }

  let escapedToTable = false;

  function onFocusIn(e: FocusEvent): void {
    const target = e.target as HTMLElement;
    if (target.tagName === "TD" || target.tagName === "TH") return;
    // If the table itself is focused (not a cell), focus the first cell
    if (target === table) {
      if (escapedToTable) {
        escapedToTable = false;
        return;
      }
      focusCell(0, 0);
    }
  }

  // Make table focusable if it isn't
  if (!table.getAttribute("tabindex")) {
    table.setAttribute("tabindex", "0");
  }
  table.setAttribute("role", "grid");

  table.addEventListener("keydown", onKeyDown);
  table.addEventListener("focusin", onFocusIn);

  return () => {
    table.removeEventListener("keydown", onKeyDown);
    table.removeEventListener("focusin", onFocusIn);
  };
}

/**
 * Auto-enable keyboard navigation for all data tables in a container.
 * Returns a dispose function that removes all listeners.
 */
export function enableAllTableKeyNav(container: HTMLElement): () => void {
  const disposers: Array<() => void> = [];
  const tables = container.querySelectorAll<HTMLTableElement>(
    "table[role='table'], table.data-table, table.screener-table, table.portfolio-table, table.alert-history-table",
  );
  tables.forEach((table) => {
    disposers.push(enableTableKeyNav(table));
  });
  return () => disposers.forEach((d) => d());
}
