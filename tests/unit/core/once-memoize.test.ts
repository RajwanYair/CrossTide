import { describe, it, expect, vi } from "vitest";
import { once, memoize } from "../../../src/core/once-memoize";

describe("once", () => {
  it("invokes fn at most once", () => {
    const spy = vi.fn((x: number) => x * 2);
    const f = once(spy);
    expect(f(2)).toBe(4);
    expect(f(99)).toBe(4);
    expect(f(0)).toBe(4);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("memoize", () => {
  it("caches by JSON-stringified args", () => {
    const spy = vi.fn((a: number, b: number) => a + b);
    const f = memoize(spy);
    expect(f(1, 2)).toBe(3);
    expect(f(1, 2)).toBe(3);
    expect(f(2, 1)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("supports custom keyFn", () => {
    const spy = vi.fn((u: { id: number }) => u.id * 10);
    const f = memoize(spy, (u) => String(u.id));
    expect(f({ id: 5 })).toBe(50);
    expect(f({ id: 5 })).toBe(50);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("clear() resets cache", () => {
    const spy = vi.fn((x: number) => x + 1);
    const f = memoize(spy);
    f(1); f(1);
    expect(spy).toHaveBeenCalledTimes(1);
    f.clear();
    f(1);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("delete(key) removes a single entry", () => {
    const spy = vi.fn((x: number) => x);
    const f = memoize(spy, (x) => String(x));
    f(7); f(7);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(f.delete("7")).toBe(true);
    expect(f.delete("missing")).toBe(false);
    f(7);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
