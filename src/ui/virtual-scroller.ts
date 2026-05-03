/**
 * VirtualScroller — renders only visible rows for large tables.
 *
 * Usage:
 *   const vs = new VirtualScroller({
 *     container,
 *     rowHeight: 32,
 *     totalRows: 500,
 *     renderRow: (index) => `<tr>...</tr>`,
 *     overscan: 5,
 *   });
 *   vs.update(newTotalRows); // when data changes
 *   vs.dispose();           // cleanup
 *
 * Benefits:
 * - O(visible) DOM nodes instead of O(total)
 * - Smooth scrolling with overscan buffer
 * - Works with any table body content
 */

export interface VirtualScrollerOptions {
  /** The scrollable container element */
  container: HTMLElement;
  /** Fixed height of each row in px */
  rowHeight: number;
  /** Total number of rows in the dataset */
  totalRows: number;
  /** Render function for a single row by index */
  renderRow: (index: number) => string;
  /** Number of extra rows to render above/below viewport */
  overscan?: number;
  /** Optional table header HTML (rendered once, outside the scroll area) */
  headerHtml?: string;
  /** Optional aria-label for the table */
  ariaLabel?: string;
}

export class VirtualScroller {
  private container: HTMLElement;
  private rowHeight: number;
  private totalRows: number;
  private renderRow: (index: number) => string;
  private overscan: number;
  private headerHtml: string;
  private ariaLabel: string;
  private scrollEl!: HTMLElement;
  private spacerEl!: HTMLElement;
  private tbodyEl!: HTMLElement;
  private lastStart = -1;
  private lastEnd = -1;
  private disposed = false;

  constructor(options: VirtualScrollerOptions) {
    this.container = options.container;
    this.rowHeight = options.rowHeight;
    this.totalRows = options.totalRows;
    this.renderRow = options.renderRow;
    this.overscan = options.overscan ?? 5;
    this.headerHtml = options.headerHtml ?? "";
    this.ariaLabel = options.ariaLabel ?? "Data table";

    this.mount();
  }

  private mount(): void {
    const totalHeight = this.totalRows * this.rowHeight;

    this.container.innerHTML = `
      <table class="virtual-table" role="table" aria-label="${this.ariaLabel}">
        ${this.headerHtml ? `<thead>${this.headerHtml}</thead>` : ""}
      </table>
      <div class="virtual-scroll-viewport" style="overflow-y:auto;position:relative;">
        <div class="virtual-spacer" style="height:${totalHeight}px;"></div>
        <div class="virtual-tbody" style="position:absolute;top:0;left:0;right:0;"></div>
      </div>`;

    this.scrollEl = this.container.querySelector(".virtual-scroll-viewport")!;
    this.spacerEl = this.container.querySelector(".virtual-spacer")!;
    this.tbodyEl = this.container.querySelector(".virtual-tbody")!;

    this.scrollEl.addEventListener("scroll", this.onScroll, { passive: true });
    this.renderVisible();
  }

  private onScroll = (): void => {
    if (!this.disposed) this.renderVisible();
  };

  private renderVisible(): void {
    const scrollTop = this.scrollEl.scrollTop;
    const viewportHeight = this.scrollEl.clientHeight || 400;

    const startIdx = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.overscan);
    const endIdx = Math.min(
      this.totalRows,
      Math.ceil((scrollTop + viewportHeight) / this.rowHeight) + this.overscan,
    );

    // Skip re-render if range hasn't changed
    if (startIdx === this.lastStart && endIdx === this.lastEnd) return;
    this.lastStart = startIdx;
    this.lastEnd = endIdx;

    const rows: string[] = [];
    for (let i = startIdx; i < endIdx; i++) {
      rows.push(this.renderRow(i));
    }

    this.tbodyEl.style.top = `${startIdx * this.rowHeight}px`;
    this.tbodyEl.innerHTML = `<table class="virtual-table-inner"><tbody>${rows.join("")}</tbody></table>`;
  }

  /** Update the total row count (e.g., after data refresh) and re-render */
  update(totalRows: number, renderRow?: (index: number) => string): void {
    this.totalRows = totalRows;
    if (renderRow) this.renderRow = renderRow;
    this.spacerEl.style.height = `${totalRows * this.rowHeight}px`;
    this.lastStart = -1;
    this.lastEnd = -1;
    this.renderVisible();
  }

  /** Get the maximum viewport height (for CSS sizing) */
  setViewportHeight(height: number): void {
    this.scrollEl.style.maxHeight = `${height}px`;
    this.renderVisible();
  }

  dispose(): void {
    this.disposed = true;
    this.scrollEl.removeEventListener("scroll", this.onScroll);
  }
}

/**
 * Helper: determine if virtual scrolling should be used based on row count.
 * Returns true when there are more than `threshold` rows.
 */
export function shouldVirtualize(rowCount: number, threshold = 50): boolean {
  return rowCount > threshold;
}
