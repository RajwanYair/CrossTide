import { describe, it, expect, beforeEach } from "vitest";
import { enableTableKeyNav, enableAllTableKeyNav } from "../../src/ui/table-keyboard-nav";

function createTable(rows: number, cols: number): HTMLTableElement {
  const table = document.createElement("table");
  table.setAttribute("role", "table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (let c = 0; c < cols; c++) {
    const th = document.createElement("th");
    th.textContent = `H${c}`;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < cols; c++) {
      const td = document.createElement("td");
      td.textContent = `R${r}C${c}`;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  document.body.appendChild(table);
  return table;
}

function press(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

describe("enableTableKeyNav", () => {
  let table: HTMLTableElement;
  let dispose: () => void;

  beforeEach(() => {
    document.body.innerHTML = "";
    table = createTable(5, 4);
    dispose = enableTableKeyNav(table);
  });

  it("sets role=grid and tabindex on table", () => {
    expect(table.getAttribute("role")).toBe("grid");
    expect(table.getAttribute("tabindex")).toBe("0");
  });

  it("focuses first cell on table focus", () => {
    table.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    const focused = table.querySelector("[data-table-focus]");
    expect(focused).not.toBeNull();
    expect(focused?.textContent).toBe("R0C0");
  });

  it("navigates down with ArrowDown", () => {
    table.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    press(table, "ArrowDown");
    const focused = table.querySelector("[data-table-focus]");
    expect(focused?.textContent).toBe("R1C0");
  });

  it("navigates right with ArrowRight", () => {
    table.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    press(table, "ArrowRight");
    const focused = table.querySelector("[data-table-focus]");
    expect(focused?.textContent).toBe("R0C1");
  });

  it("navigates up with ArrowUp (clamps to first row)", () => {
    table.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    press(table, "ArrowUp");
    const focused = table.querySelector("[data-table-focus]");
    expect(focused?.textContent).toBe("R0C0");
  });

  it("navigates left with ArrowLeft (clamps to first col)", () => {
    table.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    press(table, "ArrowLeft");
    const focused = table.querySelector("[data-table-focus]");
    expect(focused?.textContent).toBe("R0C0");
  });

  it("End key moves to last cell in row", () => {
    table.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    press(table, "End");
    const focused = table.querySelector("[data-table-focus]");
    expect(focused?.textContent).toBe("R0C3");
  });

  it("Home key moves to first cell in row", () => {
    table.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    press(table, "ArrowRight");
    press(table, "ArrowRight");
    press(table, "Home");
    const focused = table.querySelector("[data-table-focus]");
    expect(focused?.textContent).toBe("R0C0");
  });

  it("Escape removes focus from cells", () => {
    table.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    press(table, "Escape");
    const focused = table.querySelector("[data-table-focus]");
    expect(focused).toBeNull();
  });

  it("Enter activates interactive element in cell", () => {
    // Add a button to first cell
    const firstCell = table.querySelector("tbody td")!;
    const btn = document.createElement("button");
    btn.textContent = "Click me";
    let clicked = false;
    btn.addEventListener("click", () => {
      clicked = true;
    });
    firstCell.appendChild(btn);

    table.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    press(table, "Enter");
    expect(clicked).toBe(true);
  });

  it("dispose removes listeners", () => {
    dispose();
    table.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    // After dispose, focusin should not trigger cell focus
    // (table still has tabindex from setup, but no active navigation)
    const focused = table.querySelector("[data-table-focus]");
    expect(focused).toBeNull();
  });
});

describe("enableAllTableKeyNav", () => {
  it("enables nav on all matching tables", () => {
    document.body.innerHTML = "";
    const t1 = createTable(3, 3);
    t1.classList.add("data-table");
    const t2 = createTable(2, 2);
    t2.setAttribute("role", "table");

    const dispose = enableAllTableKeyNav(document.body);
    expect(t1.getAttribute("role")).toBe("grid");
    expect(t2.getAttribute("role")).toBe("grid");
    dispose();
  });
});
