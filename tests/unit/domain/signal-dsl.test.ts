import { describe, it, expect } from "vitest";
import { tokenize, parse, evaluate, compileSignal } from "../../../src/domain/signal-dsl";

describe("signal-dsl", () => {
  it("tokenizes numbers, identifiers, operators", () => {
    const t = tokenize("rsi(14) < 30");
    expect(t.map((x) => x.kind)).toEqual(["ident", "lparen", "num", "rparen", "op", "num", "eof"]);
  });

  it("evaluates arithmetic with precedence", () => {
    expect(evaluate(parse("1 + 2 * 3"))).toBe(7);
    expect(evaluate(parse("(1 + 2) * 3"))).toBe(9);
  });

  it("evaluates comparisons", () => {
    expect(evaluate(parse("3 < 5"))).toBe(true);
    expect(evaluate(parse("3 >= 3"))).toBe(true);
    expect(evaluate(parse("3 == 4"))).toBe(false);
  });

  it("evaluates boolean operators with short-circuit", () => {
    expect(evaluate(parse("true and false"))).toBe(false);
    expect(evaluate(parse("true or false"))).toBe(true);
    expect(evaluate(parse("not false"))).toBe(true);
  });

  it("resolves variables from context", () => {
    expect(evaluate(parse("close > 100"), { vars: { close: 105 } })).toBe(true);
  });

  it("calls functions from context", () => {
    const ctx = {
      funcs: {
        rsi: (period: number | boolean) => Number(period) * 2,
      },
    };
    expect(evaluate(parse("rsi(14)"), ctx)).toBe(28);
  });

  it("supports realistic signal expression", () => {
    const expr = "rsi(14) < 30 and close > sma(20)";
    const fn = compileSignal(expr);
    const result = fn({
      vars: { close: 110 },
      funcs: {
        rsi: () => 25,
        sma: () => 100,
      },
    });
    expect(result).toBe(true);
  });

  it("unary minus", () => {
    expect(evaluate(parse("-5 + 3"))).toBe(-2);
    expect(evaluate(parse("--5"))).toBe(5);
  });

  it("throws on unknown identifier", () => {
    expect(() => evaluate(parse("foo"))).toThrow(ReferenceError);
  });

  it("throws on unknown function", () => {
    expect(() => evaluate(parse("foo()"))).toThrow(ReferenceError);
  });

  it("throws on division by zero", () => {
    expect(() => evaluate(parse("1 / 0"))).toThrow(RangeError);
  });

  it("throws on type mismatch", () => {
    expect(() => evaluate(parse("true + 1"))).toThrow(TypeError);
  });

  it("throws on syntax error", () => {
    expect(() => parse("1 +")).toThrow(SyntaxError);
    expect(() => parse("(1 + 2")).toThrow(SyntaxError);
    expect(() => parse("1 @ 2")).toThrow(SyntaxError);
  });

  it("compileSignal can be called repeatedly", () => {
    const fn = compileSignal("x > 5");
    expect(fn({ vars: { x: 10 } })).toBe(true);
    expect(fn({ vars: { x: 1 } })).toBe(false);
  });
});

describe("signal-dsl R2 — arrays and plot()", () => {
  it("tokenizes [ and ] brackets", () => {
    const t = tokenize("[1, 2]");
    expect(t.map((x) => x.kind)).toEqual(["lbracket", "num", "comma", "num", "rbracket", "eof"]);
  });

  it("evaluates array literal", () => {
    const val = evaluate(parse("[1, 2, 3]"));
    expect(val).toEqual([1, 2, 3]);
  });

  it("evaluates empty array literal", () => {
    expect(evaluate(parse("[]"))).toEqual([]);
  });

  it("trailing comma in array is accepted", () => {
    expect(evaluate(parse("[1, 2,]"))).toEqual([1, 2]);
  });

  it("array elements can be expressions", () => {
    expect(evaluate(parse("[1 + 1, 2 * 3]"))).toEqual([2, 6]);
  });

  it("range(1, 5) produces [1,2,3,4,5]", () => {
    expect(evaluate(parse("range(1, 5)"))).toEqual([1, 2, 3, 4, 5]);
  });

  it("range(3, 3) produces single-element array", () => {
    expect(evaluate(parse("range(3, 3)"))).toEqual([3]);
  });

  it("len([1,2,3]) returns 3", () => {
    expect(evaluate(parse("len([1, 2, 3])"))).toBe(3);
  });

  it("at([10, 20, 30], 1) returns 20", () => {
    expect(evaluate(parse("at([10, 20, 30], 1)"))).toBe(20);
  });

  it("at with negative index: at([1,2,3], -1) returns 3", () => {
    expect(evaluate(parse("at([1, 2, 3], -1)"))).toBe(3);
  });

  it("sum([1, 2, 3]) returns 6", () => {
    expect(evaluate(parse("sum([1, 2, 3])"))).toBe(6);
  });

  it("avg([2, 4, 6]) returns 4", () => {
    expect(evaluate(parse("avg([2, 4, 6])"))).toBe(4);
  });

  it("min and max", () => {
    expect(evaluate(parse("min([5, 1, 3])"))).toBe(1);
    expect(evaluate(parse("max([5, 1, 3])"))).toBe(5);
  });

  it("plot() calls onPlot callback and returns the series", () => {
    const plots: { name: string; series: readonly number[] }[] = [];
    const result = evaluate(parse("plot(1, [1, 2, 3])"), {
      onPlot: (name, series) => plots.push({ name, series }),
    });
    expect(plots).toHaveLength(1);
    expect(plots[0]!.name).toBe("1");
    expect(plots[0]!.series).toEqual([1, 2, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  it("plot() without onPlot does not throw", () => {
    expect(() => evaluate(parse("plot(1, [1, 2])"))).not.toThrow();
  });

  it("array variable resolved from context", () => {
    const result = evaluate(parse("sum(prices)"), {
      vars: { prices: [10, 20, 30] },
    });
    expect(result).toBe(60);
  });

  it("user func takes precedence over builtin", () => {
    const result = evaluate(parse("len([1, 2])"), {
      funcs: { len: () => 99 },
    });
    expect(result).toBe(99);
  });

  it("at() throws for out-of-bounds index", () => {
    expect(() => evaluate(parse("at([1, 2], 5)"))).toThrow(RangeError);
  });
});
