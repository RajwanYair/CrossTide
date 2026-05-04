/**
 * `<ct-data-table>` — Reusable data table Web Component.
 *
 * Composes existing utilities:
 * - VirtualScroller for performant large datasets
 * - sortRows for column sorting
 * - enableTableKeyNav for keyboard navigation
 *
 * Usage:
 *   const table = document.createElement("ct-data-table");
 *   table.columns = [
 *     { key: "symbol", label: "Symbol" },
 *     { key: "price", label: "Price", align: "right" },
 *   ];
 *   table.rows = [...];
 *   container.appendChild(table);
 */
import { VirtualScroller } from "./virtual-scroller";
import { sortRows, type SortConfig, type SortDirection } from "./sortable";
import { enableTableKeyNav } from "./table-keyboard-nav";

export interface DataTableColumn<K extends string = string> {
  readonly key: K;
  readonly label: string;
  readonly align?: "left" | "center" | "right";
  readonly sortable?: boolean;
  readonly width?: string;
  /** Custom cell renderer — return HTML string. Falls back to textContent. */
  readonly render?: (value: unknown, row: Record<string, unknown>) => string;
}

export interface DataTableOptions {
  readonly rowHeight?: number;
  readonly overscan?: number;
  readonly ariaLabel?: string;
  readonly virtualThreshold?: number;
}

const DEFAULT_ROW_HEIGHT = 36;
const DEFAULT_OVERSCAN = 5;
const VIRTUAL_THRESHOLD = 100;

class CtDataTable extends HTMLElement {
  private _columns: DataTableColumn[] = [];
  private _rows: Record<string, unknown>[] = [];
  private _sort: SortConfig | null = null;
  private _options: DataTableOptions = {};
  private _scroller: VirtualScroller | null = null;
  private _keyNavCleanup: (() => void) | null = null;
  private _connected = false;

  set columns(cols: DataTableColumn[]) {
    this._columns = cols;
    if (this._connected) this.render();
  }

  get columns(): DataTableColumn[] {
    return this._columns;
  }

  set rows(data: Record<string, unknown>[]) {
    this._rows = data;
    if (this._connected) this.render();
  }

  get rows(): Record<string, unknown>[] {
    return this._rows;
  }

  set sort(config: SortConfig | null) {
    this._sort = config;
    if (this._connected) this.render();
  }

  get sort(): SortConfig | null {
    return this._sort;
  }

  set options(opts: DataTableOptions) {
    this._options = opts;
    if (this._connected) this.render();
  }

  get options(): DataTableOptions {
    return this._options;
  }

  connectedCallback(): void {
    this._connected = true;
    this.render();
  }

  disconnectedCallback(): void {
    this._connected = false;
    this.cleanup();
  }

  private cleanup(): void {
    this._keyNavCleanup?.();
    this._keyNavCleanup = null;
    this._scroller?.dispose();
    this._scroller = null;
  }

  private getSortedRows(): Record<string, unknown>[] {
    if (!this._sort) return this._rows;
    return sortRows(this._rows, this._sort);
  }

  private buildHeaderHtml(): string {
    const ths = this._columns
      .map((col) => {
        const align = col.align ?? "left";
        const sortable = col.sortable !== false;
        const ariaSort = this.getAriaSort(col.key);
        const widthStyle = col.width ? ` style="width:${col.width}"` : "";
        const sortAttr = sortable
          ? ` data-sort-key="${col.key}" aria-sort="${ariaSort}" role="columnheader"`
          : "";
        return `<th class="ct-dt-th" data-align="${align}"${widthStyle}${sortAttr}>${escapeHtml(col.label)}</th>`;
      })
      .join("");
    return `<thead><tr>${ths}</tr></thead>`;
  }

  private getAriaSort(key: string): string {
    if (this._sort?.column !== key) return "none";
    return this._sort.direction === "asc" ? "ascending" : "descending";
  }

  private renderRowHtml(row: Record<string, unknown>): string {
    const tds = this._columns
      .map((col) => {
        const value = row[col.key];
        const align = col.align ?? "left";
        const content = col.render ? col.render(value, row) : escapeHtml(String(value ?? ""));
        return `<td class="ct-dt-td" data-align="${align}">${content}</td>`;
      })
      .join("");
    return `<tr class="ct-dt-row">${tds}</tr>`;
  }

  private render(): void {
    this.cleanup();
    const sorted = this.getSortedRows();
    const rowHeight = this._options.rowHeight ?? DEFAULT_ROW_HEIGHT;
    const overscan = this._options.overscan ?? DEFAULT_OVERSCAN;
    const threshold = this._options.virtualThreshold ?? VIRTUAL_THRESHOLD;
    const ariaLabel = this._options.ariaLabel ?? "Data table";

    if (sorted.length >= threshold) {
      // Virtual scroll mode
      this._scroller = new VirtualScroller({
        container: this,
        rowHeight,
        totalRows: sorted.length,
        renderRow: (index: number): string => this.renderRowHtml(sorted[index]!),
        overscan,
        headerHtml: this.buildHeaderHtml(),
        ariaLabel,
      });
    } else {
      // Simple DOM mode for smaller datasets
      const rows = sorted.map((r) => this.renderRowHtml(r)).join("");
      this.innerHTML = `<table class="ct-dt" role="grid" aria-label="${escapeHtml(ariaLabel)}">${this.buildHeaderHtml()}<tbody>${rows}</tbody></table>`;
    }

    // Wire keyboard nav
    const table = this.querySelector("table");
    if (table) {
      this._keyNavCleanup = enableTableKeyNav(table);
    }

    // Wire sort click handlers on headers
    this.querySelectorAll<HTMLElement>("[data-sort-key]").forEach((th) => {
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        const key = th.dataset["sortKey"];
        if (!key) return;
        const direction: SortDirection =
          this._sort?.column === key && this._sort.direction === "asc" ? "desc" : "asc";
        this._sort = { column: key, direction };
        this.dispatchEvent(
          new CustomEvent("sort-change", {
            detail: this._sort,
            bubbles: true,
          }),
        );
        this.render();
      });
    });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

customElements.define("ct-data-table", CtDataTable);

export { CtDataTable };
