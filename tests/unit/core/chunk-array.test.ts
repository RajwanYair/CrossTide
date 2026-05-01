import { describe, it, expect } from "vitest";
import { chunk, window, zip } from "../../../src/core/chunk-array";

describe("chunk", () => {
  it("partitions evenly", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
  it("last chunk shorter when uneven", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("pads when padWith provided", () => {
    expect(chunk([1, 2, 3, 4, 5], 2, 0)).toEqual([
      [1, 2],
      [3, 4],
      [5, 0],
    ]);
  });
  it("rejects bad size", () => {
    expect(chunk([1, 2, 3], 0)).toEqual([]);
    expect(chunk([1, 2, 3], -1)).toEqual([]);
  });
  it("empty input -> []", () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

describe("window", () => {
  it("sliding by 1 by default", () => {
    expect(window([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [2, 3],
      [3, 4],
    ]);
  });
  it("custom step", () => {
    expect(window([1, 2, 3, 4, 5], 2, 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
  it("size > length -> []", () => {
    expect(window([1, 2], 5)).toEqual([]);
  });
  it("rejects bad params", () => {
    expect(window([1, 2, 3], 0)).toEqual([]);
    expect(window([1, 2, 3], 2, 0)).toEqual([]);
  });
});

describe("zip", () => {
  it("zips equal length", () => {
    expect(zip([1, 2, 3], [4, 5, 6])).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });
  it("truncates to shortest", () => {
    expect(zip([1, 2, 3], [4, 5])).toEqual([
      [1, 4],
      [2, 5],
    ]);
  });
  it("supports 3+ arrays", () => {
    expect(zip([1, 2], [3, 4], [5, 6])).toEqual([
      [1, 3, 5],
      [2, 4, 6],
    ]);
  });
  it("zero arrays -> []", () => {
    expect(zip()).toEqual([]);
  });
  it("any empty -> []", () => {
    expect(zip([1, 2], [])).toEqual([]);
  });
});
