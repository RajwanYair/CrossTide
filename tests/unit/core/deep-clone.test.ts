import { describe, it, expect } from "vitest";
import { deepClone, _fallbackCloneForTests as fb } from "../../../src/core/deep-clone";

describe("deep-clone (structuredClone path)", () => {
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

// ── fallback clone path (all branches) ────────────────────────────────────────

describe("deep-clone (fallback path via _fallbackCloneForTests)", () => {
  it("returns primitives unchanged", () => {
    expect(fb(42)).toBe(42);
    expect(fb("hello")).toBe("hello");
    expect(fb(null)).toBe(null);
    expect(fb(undefined)).toBe(undefined);
    expect(fb(false)).toBe(false);
  });

  it("clones plain objects deeply", () => {
    const o = { x: 1, nested: { y: 2 } };
    const c = fb(o);
    expect(c).toEqual(o);
    expect(c).not.toBe(o);
    expect(c.nested).not.toBe(o.nested);
  });

  it("clones arrays deeply", () => {
    const a = [1, [2, 3], { z: 4 }];
    const c = fb(a);
    expect(c).toEqual(a);
    expect(c[1]).not.toBe(a[1]);
  });

  it("clones Date objects as new instances", () => {
    const d = new Date(2000000000000);
    const c = fb(d);
    expect(c).not.toBe(d);
    expect(c.getTime()).toBe(d.getTime());
  });

  it("clones RegExp objects", () => {
    const r = /foo/im;
    const c = fb(r);
    expect(c).not.toBe(r);
    expect(c.source).toBe("foo");
    expect(c.flags).toBe("im");
  });

  it("clones Map with cloned keys and values", () => {
    const m = new Map([["k", { v: 1 }]]);
    const c = fb(m);
    expect(c).not.toBe(m);
    expect(c.get("k")).toEqual({ v: 1 });
    expect(c.get("k")).not.toBe(m.get("k"));
  });

  it("clones Set with cloned members", () => {
    const inner = { id: 7 };
    const s = new Set([inner]);
    const c = fb(s);
    expect(c).not.toBe(s);
    const [item] = [...c] as [{ id: number }];
    expect(item).toEqual(inner);
    expect(item).not.toBe(inner);
  });

  it("handles circular references via WeakMap (cycle detection)", () => {
    const a: Record<string, unknown> = { x: 1 };
    a["self"] = a; // circular
    const c = fb(a) as typeof a;
    expect(c).not.toBe(a);
    expect(c["self"]).toBe(c); // cycle resolved to cloned object
  });

  it("handles array cycle", () => {
    const arr: unknown[] = [1, 2];
    arr.push(arr); // cyclic array
    const c = fb(arr) as unknown[];
    expect(c).not.toBe(arr);
    expect(c[2]).toBe(c); // cycle points back to clone
  });
});


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
