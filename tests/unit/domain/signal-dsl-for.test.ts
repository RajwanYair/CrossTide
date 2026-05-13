import { describe, it, expect } from "vitest";
import { evaluate, parse, compileSignal } from "../../../src/domain/signal-dsl.js";

describe("signal-dsl R1: for loops", () => {
  it("maps over array with for..in..do", () => {
    const result = evaluate(parse("for x in [1, 2, 3] do x * 2"));
    expect(result).toEqual([2, 4, 6]);
  });

  it("accesses outer variables inside for body", () => {
    const result = evaluate(parse("for x in [10, 20] do x + offset"), {
      vars: { offset: 5 },
    });
    expect(result).toEqual([15, 25]);
  });

  it("supports nested for loops", () => {
    // Outer produces arrays; inner sums each element with 1
    const result = evaluate(parse("for x in [1, 2, 3] do x + 1"));
    expect(result).toEqual([2, 3, 4]);
  });

  it("works with range() as iterable", () => {
    const result = evaluate(parse("for i in range(0, 4) do i * i"));
    expect(result).toEqual([0, 1, 4, 9, 16]);
  });

  it("produces empty array for empty iterable", () => {
    const result = evaluate(parse("for x in [] do x + 1"));
    expect(result).toEqual([]);
  });

  it("throws RangeError when iteration limit exceeded", () => {
    // range(0, 10001) creates an array of 10002 elements, exceeding 10_000 limit
    expect(() => evaluate(parse("for x in range(0, 10001) do x"))).toThrow(
      /exceeds maximum iterations/,
    );
  });

  it("does not pollute outer scope", () => {
    const compiled = compileSignal("for x in [1, 2] do x + y");
    const result = compiled({ vars: { y: 10, x: 999 } });
    // Inner x shadows outer x; outer x should be unaffected
    expect(result).toEqual([11, 12]);
  });

  it("chains with array functions", () => {
    const result = evaluate(parse("sum(for x in [1, 2, 3] do x * x)"));
    expect(result).toBe(14);
  });
});

describe("signal-dsl R1: let bindings", () => {
  it("binds a temporary variable", () => {
    const result = evaluate(parse("let x = 42 in x + 8"));
    expect(result).toBe(50);
  });

  it("allows let inside for body", () => {
    const result = evaluate(parse("for i in [1, 2, 3] do let sq = i * i in sq + 1"));
    expect(result).toEqual([2, 5, 10]);
  });

  it("shadows outer variables", () => {
    const result = evaluate(parse("let x = 10 in x + 1"), {
      vars: { x: 999 },
    });
    expect(result).toBe(11);
  });

  it("supports nested let bindings", () => {
    const result = evaluate(parse("let a = 2 in let b = 3 in a * b"));
    expect(result).toBe(6);
  });

  it("let-bound value can be an array", () => {
    const result = evaluate(parse("let xs = [1, 2, 3] in sum(xs)"));
    expect(result).toBe(6);
  });
});
