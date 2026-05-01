import { describe, it, expect } from "vitest";
import { deepClone } from "../../../src/core/deep-clone";

describe("deep-clone", () => {
  it("clones primitives unchanged", () => {
    expect(deepClone(1)).toBe(1);
    expect(deepClone("a")).toBe("a");
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });

  it("clones plain objects (no shared refs)", () => {
    const o = { a: 1, b: { c: 2 } };
    const c = deepClone(o);
    expect(c).toEqual(o);
    expect(c).not.toBe(o);
    expect(c.b).not.toBe(o.b);
    c.b.c = 99;
    expect(o.b.c).toBe(2);
  });

  it("clones arrays deeply", () => {
    const a = [1, [2, [3]]];
    const c = deepClone(a);
    expect(c).toEqual(a);
    expect(c[1]).not.toBe(a[1]);
  });

  it("clones Date / RegExp", () => {
    const d = new Date(1700000000000);
    const cd = deepClone(d);
    expect(cd.getTime()).toBe(d.getTime());
    expect(cd).not.toBe(d);

    const r = /abc/gi;
    const cr = deepClone(r);
    expect(cr.source).toBe("abc");
    expect(cr.flags).toBe("gi");
    expect(cr).not.toBe(r);
  });

  it("clones Map and Set", () => {
    const m = new Map<string, number>([
      ["a", 1],
      ["b", 2],
    ]);
    const cm = deepClone(m);
    expect(cm.get("a")).toBe(1);
    expect(cm).not.toBe(m);

    const s = new Set([1, 2, 3]);
    const cs = deepClone(s);
    expect([...cs]).toEqual([1, 2, 3]);
    expect(cs).not.toBe(s);
  });

  it("clones nested object with mutation isolation", () => {
    const o = { list: [{ id: 1 }, { id: 2 }] };
    const c = deepClone(o);
    c.list[0]!.id = 99;
    expect(o.list[0]!.id).toBe(1);
  });
});
