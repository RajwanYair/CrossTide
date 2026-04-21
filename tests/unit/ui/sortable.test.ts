import { describe, it, expect } from "vitest";
import { sortRows, toggleSort } from "../../../src/ui/sortable";

describe("sortRows", () => {
  const data = [
    { name: "AAPL", price: 150, volume: 5000 },
    { name: "MSFT", price: 300, volume: 3000 },
    { name: "GOOG", price: 100, volume: 2000 },
    { name: "AMZN", price: 200, volume: 4000 },
  ];

  it("sorts numerically ascending", () => {
    const sorted = sortRows(data, { column: "price", direction: "asc" });
    expect(sorted.map((r) => r.price)).toEqual([100, 150, 200, 300]);
  });

  it("sorts numerically descending", () => {
    const sorted = sortRows(data, { column: "price", direction: "desc" });
    expect(sorted.map((r) => r.price)).toEqual([300, 200, 150, 100]);
  });

  it("sorts strings alphabetically ascending", () => {
    const sorted = sortRows(data, { column: "name", direction: "asc" });
    expect(sorted.map((r) => r.name)).toEqual(["AAPL", "AMZN", "GOOG", "MSFT"]);
  });

  it("sorts strings alphabetically descending", () => {
    const sorted = sortRows(data, { column: "name", direction: "desc" });
    expect(sorted.map((r) => r.name)).toEqual(["MSFT", "GOOG", "AMZN", "AAPL"]);
  });

  it("does not mutate the original array", () => {
    const original = [...data];
    sortRows(data, { column: "price", direction: "asc" });
    expect(data).toEqual(original);
  });

  it("handles null values (pushes to end)", () => {
    const withNulls = [
      { name: "A", price: 10 as number | null },
      { name: "B", price: null },
      { name: "C", price: 5 },
    ];
    const sorted = sortRows(withNulls, { column: "price", direction: "asc" });
    expect(sorted.map((r) => r.price)).toEqual([5, 10, null]);
  });

  it("handles empty array", () => {
    expect(sortRows([], { column: "x", direction: "asc" })).toEqual([]);
  });
});

describe("toggleSort", () => {
  it("toggles direction on same column", () => {
    const result = toggleSort({ column: "price", direction: "asc" }, "price");
    expect(result).toEqual({ column: "price", direction: "desc" });
  });

  it("toggles back to asc", () => {
    const result = toggleSort({ column: "price", direction: "desc" }, "price");
    expect(result).toEqual({ column: "price", direction: "asc" });
  });

  it("defaults to asc on new column", () => {
    const result = toggleSort({ column: "price", direction: "desc" }, "name");
    expect(result).toEqual({ column: "name", direction: "asc" });
  });
});
