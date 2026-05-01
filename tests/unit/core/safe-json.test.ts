import { describe, it, expect } from "vitest";
import { safeParse, safeStringify } from "../../../src/core/safe-json";

describe("safeParse", () => {
  it("parses valid JSON", () => {
    const r = safeParse<{ a: number }>('{"a":1}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.a).toBe(1);
  });

  it("returns error result on invalid JSON", () => {
    const r = safeParse("not json");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(Error);
  });

  it("handles empty string as error", () => {
    expect(safeParse("").ok).toBe(false);
  });
});

describe("safeStringify", () => {
  it("stringifies plain objects", () => {
    expect(safeStringify({ a: 1, b: "x" })).toBe('{"a":1,"b":"x"}');
  });

  it("supports indentation", () => {
    expect(safeStringify({ a: 1 }, { space: 2 })).toContain("\n  ");
  });

  it("handles cyclic references via [Circular]", () => {
    const o: Record<string, unknown> = { a: 1 };
    o.self = o;
    const s = safeStringify(o);
    expect(s).toContain("[Circular]");
  });

  it("handles BigInt", () => {
    expect(safeStringify({ n: 42n })).toContain("[BigInt:42]");
  });

  it("returns fallback for undefined-only value", () => {
    expect(safeStringify(undefined, { fallback: "FB" })).toBe("FB");
  });

  it("handles function values", () => {
    expect(
      safeStringify({
        fn: function named() {
          /* noop */
        },
      }),
    ).toContain("[Function:named]");
  });
});
