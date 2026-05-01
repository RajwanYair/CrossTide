import { describe, it, expect } from "vitest";
import { lowerBound, upperBound, binarySearch } from "../../../src/core/binary-search";

describe("binary-search", () => {
  const arr = [1, 3, 3, 3, 5, 7, 9];

  it("lowerBound", () => {
    expect(lowerBound(arr, 0)).toBe(0);
    expect(lowerBound(arr, 1)).toBe(0);
    expect(lowerBound(arr, 3)).toBe(1);
    expect(lowerBound(arr, 4)).toBe(4);
    expect(lowerBound(arr, 9)).toBe(6);
    expect(lowerBound(arr, 10)).toBe(7);
  });

  it("upperBound", () => {
    expect(upperBound(arr, 0)).toBe(0);
    expect(upperBound(arr, 3)).toBe(4);
    expect(upperBound(arr, 9)).toBe(7);
  });

  it("binarySearch present / absent", () => {
    expect(binarySearch(arr, 5)).toBe(4);
    expect(binarySearch(arr, 2)).toBe(-1);
    expect(binarySearch(arr, 9)).toBe(6);
    expect(binarySearch(arr, 100)).toBe(-1);
  });

  it("empty array", () => {
    expect(lowerBound([], 1)).toBe(0);
    expect(upperBound([], 1)).toBe(0);
    expect(binarySearch([], 1)).toBe(-1);
  });

  it("strings + custom comparator", () => {
    const xs = ["a", "b", "c", "d"];
    expect(binarySearch(xs, "c")).toBe(2);
    const desc = [9, 7, 5, 3, 1];
    const cmp = (a: number, b: number): number => (a > b ? -1 : a < b ? 1 : 0);
    expect(binarySearch(desc, 5, cmp)).toBe(2);
    expect(binarySearch(desc, 4, cmp)).toBe(-1);
  });

  it("objects via comparator", () => {
    const items = [{ k: 1 }, { k: 5 }, { k: 5 }, { k: 9 }];
    const cmp = (a: { k: number }, b: { k: number }): number => a.k - b.k;
    expect(lowerBound(items, { k: 5 }, cmp)).toBe(1);
    expect(upperBound(items, { k: 5 }, cmp)).toBe(3);
  });

  it("large array preserves O(log n) correctness", () => {
    const big = Array.from({ length: 10_000 }, (_, i) => i * 2);
    expect(binarySearch(big, 4242)).toBe(2121);
    expect(binarySearch(big, 4243)).toBe(-1);
  });
});
