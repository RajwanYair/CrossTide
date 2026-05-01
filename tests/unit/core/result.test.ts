import { describe, it, expect } from "vitest";
import {
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  andThen,
  unwrap,
  unwrapOr,
  tryCatch,
  tryCatchAsync,
} from "../../../src/core/result";

describe("result", () => {
  it("ok / err / isOk / isErr", () => {
    const a = ok(1);
    const b = err("nope");
    expect(isOk(a)).toBe(true);
    expect(isErr(a)).toBe(false);
    expect(isOk(b)).toBe(false);
    expect(isErr(b)).toBe(true);
  });

  it("map only transforms Ok", () => {
    expect(map(ok(2), (n) => n * 10)).toEqual(ok(20));
    expect(map(err("x") as ReturnType<typeof err<string>>, (n: number) => n * 10)).toEqual(
      err("x"),
    );
  });

  it("mapErr only transforms Err", () => {
    expect(mapErr(err("x"), (s) => s.toUpperCase())).toEqual(err("X"));
    expect(mapErr(ok(2), (s: string) => s.toUpperCase())).toEqual(ok(2));
  });

  it("andThen chains", () => {
    const parse = (s: string) => {
      const n = Number(s);
      return Number.isNaN(n) ? err("bad") : ok(n);
    };
    expect(andThen(ok("3"), parse)).toEqual(ok(3));
    expect(andThen(ok("x"), parse)).toEqual(err("bad"));
    expect(andThen(err("x"), parse)).toEqual(err("x"));
  });

  it("unwrap throws on Err, returns value on Ok", () => {
    expect(unwrap(ok(5))).toBe(5);
    expect(() => unwrap(err(new Error("boom")))).toThrow("boom");
    expect(() => unwrap(err("oops"))).toThrow("oops");
  });

  it("unwrapOr returns fallback on Err", () => {
    expect(unwrapOr(ok(7), 0)).toBe(7);
    expect(unwrapOr(err("x"), 99)).toBe(99);
  });

  it("tryCatch wraps thrown values", () => {
    expect(tryCatch(() => 42)).toEqual(ok(42));
    const r = tryCatch(() => {
      throw new Error("nope");
    });
    expect(isErr(r)).toBe(true);
    expect((r as { error: Error }).error.message).toBe("nope");
  });

  it("tryCatchAsync wraps async errors", async () => {
    expect(await tryCatchAsync(async () => 1)).toEqual(ok(1));
    const r = await tryCatchAsync(async () => {
      throw new Error("async-boom");
    });
    expect(isErr(r)).toBe(true);
  });
});
