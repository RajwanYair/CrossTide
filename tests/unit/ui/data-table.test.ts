/**
 * Unit tests for `<ct-data-table>` Web Component (P9).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import "../../../src/ui/data-table";
import type { CtDataTable, DataTableColumn } from "../../../src/ui/data-table";

function createElement(): CtDataTable {
  return document.createElement("ct-data-table") as CtDataTable;
}

const sampleColumns: DataTableColumn[] = [
  { key: "symbol", label: "Symbol", sortable: true },
  { key: "price", label: "Price", align: "right", sortable: true },
  { key: "volume", label: "Volume", align: "right" },
];

const sampleRows = [
  { symbol: "AAPL", price: 150, volume: 50000000 },
  { symbol: "MSFT", price: 300, volume: 30000000 },
  { symbol: "TSLA", price: 200, volume: 70000000 },
];

describe("ct-data-table", () => {
  let el: CtDataTable;

  beforeEach(() => {
    el = createElement();
  });

  it("is defined as a custom element", () => {
    expect(customElements.get("ct-data-table")).toBeDefined();
  });

  it("renders nothing before connected", () => {
    el.columns = sampleColumns;
    el.rows = sampleRows;
    expect(el.innerHTML).toBe("");
  });

  it("renders table with headers and rows on connect", () => {
    el.columns = sampleColumns;
    el.rows = sampleRows;
    document.body.appendChild(el);

    const table = el.querySelector("table");
    expect(table).not.toBeNull();
    expect(table!.querySelectorAll("th")).toHaveLength(3);
    expect(table!.querySelectorAll("tr.ct-dt-row")).toHaveLength(3);

    document.body.removeChild(el);
  });

  it("renders column labels correctly", () => {
    el.columns = sampleColumns;
    el.rows = sampleRows;
    document.body.appendChild(el);

    const headers = el.querySelectorAll("th");
    expect(headers[0]!.textContent).toBe("Symbol");
    expect(headers[1]!.textContent).toBe("Price");
    expect(headers[2]!.textContent).toBe("Volume");

    document.body.removeChild(el);
  });

  it("renders cell values", () => {
    el.columns = sampleColumns;
    el.rows = sampleRows;
    document.body.appendChild(el);

    const cells = el.querySelectorAll("td");
    expect(cells[0]!.textContent).toBe("AAPL");
    expect(cells[1]!.textContent).toBe("150");

    document.body.removeChild(el);
  });

  it("applies align attribute to cells", () => {
    el.columns = sampleColumns;
    el.rows = sampleRows;
    document.body.appendChild(el);

    const priceTh = el.querySelectorAll("th")[1]!;
    expect(priceTh.dataset["align"]).toBe("right");

    document.body.removeChild(el);
  });

  it("uses custom render function for cells", () => {
    const cols: DataTableColumn[] = [
      { key: "name", label: "Name", render: (v) => `<strong>${v}</strong>` },
    ];
    el.columns = cols;
    el.rows = [{ name: "Test" }];
    document.body.appendChild(el);

    const cell = el.querySelector("td")!;
    expect(cell.innerHTML).toContain("<strong>Test</strong>");

    document.body.removeChild(el);
  });

  it("supports sorting via header click", () => {
    el.columns = sampleColumns;
    el.rows = sampleRows;
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener("sort-change", handler);

    const priceHeader = el.querySelector('[data-sort-key="price"]') as HTMLElement;
    priceHeader.click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]![0].detail).toEqual({ column: "price", direction: "asc" });

    document.body.removeChild(el);
  });

  it("toggles sort direction on repeated click", () => {
    el.columns = sampleColumns;
    el.rows = sampleRows;
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener("sort-change", handler);

    const header = el.querySelector('[data-sort-key="price"]') as HTMLElement;
    header.click(); // asc
    header.click(); // desc

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[1]![0].detail.direction).toBe("desc");

    document.body.removeChild(el);
  });

  it("escapes HTML in cell values", () => {
    el.columns = [{ key: "x", label: "X" }];
    el.rows = [{ x: "<script>alert(1)</script>" }];
    document.body.appendChild(el);

    const cell = el.querySelector("td")!;
    expect(cell.textContent).toBe("<script>alert(1)</script>");
    expect(cell.innerHTML).not.toContain("<script>");

    document.body.removeChild(el);
  });

  it("has aria-label on table", () => {
    el.columns = sampleColumns;
    el.rows = sampleRows;
    el.options = { ariaLabel: "Stock data" };
    document.body.appendChild(el);

    const table = el.querySelector("table")!;
    expect(table.getAttribute("aria-label")).toBe("Stock data");

    document.body.removeChild(el);
  });

  it("re-renders when rows are updated after connect", () => {
    el.columns = sampleColumns;
    el.rows = sampleRows;
    document.body.appendChild(el);

    el.rows = [{ symbol: "GOOG", price: 2800, volume: 10000 }];
    const rows = el.querySelectorAll("tr.ct-dt-row");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.querySelector("td")!.textContent).toBe("GOOG");

    document.body.removeChild(el);
  });

  it("cleans up on disconnect", () => {
    el.columns = sampleColumns;
    el.rows = sampleRows;
    document.body.appendChild(el);
    document.body.removeChild(el);
    // Should not throw on subsequent property set
    el.rows = [{ symbol: "NEW", price: 1, volume: 1 }];
    // Not connected, so no re-render
    expect(el.querySelector("td")!.textContent).toBe("AAPL");
  });
});
