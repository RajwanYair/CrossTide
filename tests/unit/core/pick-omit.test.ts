import { describe, it, expect } from "vitest";
import { pick, omit, pickBy } from "../../../src/core/pick-omit";

describe("pick", () => {
  it("keeps only requested keys", () => {
    const o = { a: 1, b: 2, c: 3 };
    expect(pick(o, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });
  it("ignores missing keys", () => {
    const o = { a: 1 } as { a: number; b?: number };
    expect(pick(o, ["a", "b"])).toEqual({ a: 1 });
  });
  it("returns shallow copy", () => {
    const o = { a: { x: 1 } };
    const p = pick(o, ["a"]);
    expect(p.a).toBe(o.a);
    expect(p).not.toBe(o);
  });
});

describe("omit", () => {
  it("removes requested keys", () => {
    const o = { a: 1, b: 2, c: 3 };
    expect(omit(o, ["b"])).toEqual({ a: 1, c: 3 });
  });
  it("returns shallow copy", () => {
    const o = { a: 1, b: 2 };
    const r = omit(o, ["b"]);
    expect(r).not.toBe(o);
  });
  it("empty keys -> full copy", () => {
    expect(omit({ a: 1, b: 2 }, [])).toEqual({ a: 1, b: 2 });
  });
});

describe("pickBy", () => {
  it("keeps entries where predicate is true", () => {
    const r = pickBy({ a: 1, b: 2, c: 3 }, (v) => v > 1);
    expect(r).toEqual({ b: 2, c: 3 });
  });
  it("predicate receives key", () => {
    const r = pickBy({ a: 1, bb: 2 }, (_, k) => k.length === 1);
    expect(r).toEqual({ a: 1 });
  });
});
