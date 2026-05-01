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
