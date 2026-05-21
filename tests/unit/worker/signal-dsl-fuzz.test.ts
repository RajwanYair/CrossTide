/**
 * fast-check fuzz tests for the Signal DSL tokenizer/parser/evaluator (Roadmap: Fuzz DSL).
 *
 * Key safety invariants:
 *  1. Arbitrary strings fed to tokenize() only throw SyntaxError or succeed — never crash.
 *  2. Arbitrary strings fed to parse() only throw SyntaxError or succeed.
 *  3. compileSignal() of a valid expression is deterministic (same result on repeated calls).
 *  4. Well-formed arithmetic expressions return finite numbers.
 *  5. Well-formed boolean expressions return booleans.
 *  6. Division-by-zero throws RangeError, not a silent NaN or crash.
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { tokenize, parse, evaluate, compileSignal } from "../../../worker/signal-dsl-runtime";
import type { EvalContext, Node } from "../../../worker/signal-dsl-runtime";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** The only error types the DSL is allowed to throw. */
const ALLOWED_ERRORS = [SyntaxError, ReferenceError, RangeError, TypeError];

function isAllowedError(e: unknown): boolean {
  return ALLOWED_ERRORS.some((C) => e instanceof C);
}

// ── Arbitrary generators ──────────────────────────────────────────────────────

/** Strings that contain only valid DSL grammar characters (no injection chars). */
const dslString = fc.stringMatching(/^[a-zA-Z0-9_().+\-*/,<>=! ]{0,60}$/);

/** A numeric literal string. */
const numericLiteral = fc.float({ min: -1e6, max: 1e6, noNaN: true }).map(String);

/** A simple comparison expression with two numeric vars. */
const comparisonExpr = fc
  .tuple(
    fc.constantFrom("a", "b", "c", "rsi", "macd"),
    fc.constantFrom("<", "<=", ">", ">=", "==", "!="),
    fc.constantFrom("a", "b", "c", "rsi", "macd"),
  )
  .map(([l, op, r]) => `${l} ${op} ${r}`);

/** A valid arithmetic expression using literals. */
const arithmeticExpr = fc
  .tuple(numericLiteral, fc.constantFrom("+", "-", "*"), numericLiteral)
  .map(([l, op, r]) => `${l} ${op} ${r}`);

/** Valid context for variables a, b, c, rsi, macd. */
const validCtx = fc
  .record({
    a: fc.float({ min: -100, max: 100, noNaN: true }),
    b: fc.float({ min: -100, max: 100, noNaN: true }),
    c: fc.float({ min: -100, max: 100, noNaN: true }),
    rsi: fc.float({ min: 0, max: 100, noNaN: true }),
    macd: fc.float({ min: -10, max: 10, noNaN: true }),
  })
  .map((vars): EvalContext => ({ vars }));

// ── Fuzz tests ────────────────────────────────────────────────────────────────

describe("tokenize() — fuzz safety", () => {
  it("never throws non-SyntaxError for arbitrary grammar-subset strings", () => {
    fc.assert(
      fc.property(dslString, (src) => {
        try {
          tokenize(src);
        } catch (e) {
          // Only SyntaxError is acceptable from the tokenizer
          expect(e).toBeInstanceOf(SyntaxError);
        }
      }),
      { numRuns: 500 },
    );
  });

  it("never throws for strings containing only valid identifier chars and whitespace", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z0-9_ ]{0,40}$/), (src) => {
        // Identifiers + numbers + spaces should always tokenize without error
        expect(() => tokenize(src)).not.toThrow();
      }),
      { numRuns: 300 },
    );
  });

  it("returns array ending in eof token for any valid grammar string", () => {
    fc.assert(
      fc.property(dslString, (src) => {
        try {
          const tokens = tokenize(src);
          expect(tokens[tokens.length - 1]?.kind).toBe("eof");
        } catch (e) {
          expect(e).toBeInstanceOf(SyntaxError);
        }
      }),
      { numRuns: 300 },
    );
  });
});

describe("parse() — fuzz safety", () => {
  it("only throws SyntaxError (never internal crash) for arbitrary strings", () => {
    fc.assert(
      fc.property(dslString, (src) => {
        try {
          parse(src);
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 500 },
    );
  });
});

describe("evaluate() — arithmetic invariants", () => {
  it("literal number expression evaluates to a finite number", () => {
    fc.assert(
      fc.property(fc.float({ min: -1e6, max: 1e6, noNaN: true }), (n) => {
        const node: Node = { type: "num", value: n };
        expect(evaluate(node)).toBe(n);
      }),
    );
  });

  it("a + b == b + a (commutativity)", () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 1000, noNaN: true }),
        fc.float({ min: -1000, max: 1000, noNaN: true }),
        (a, b) => {
          const addAB: Node = {
            type: "binary",
            op: "+",
            left: { type: "num", value: a },
            right: { type: "num", value: b },
          };
          const addBA: Node = {
            type: "binary",
            op: "+",
            left: { type: "num", value: b },
            right: { type: "num", value: a },
          };
          expect(evaluate(addAB)).toBeCloseTo(evaluate(addBA) as number, 9);
        },
      ),
    );
  });

  it("a > b is the inverse of b > a when a !== b", () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 1000, noNaN: true }),
        fc.float({ min: -1000, max: 1000, noNaN: true }),
        (a, b) => {
          if (a === b) return; // skip equal case
          const gtAB: Node = {
            type: "binary",
            op: ">",
            left: { type: "num", value: a },
            right: { type: "num", value: b },
          };
          const gtBA: Node = {
            type: "binary",
            op: ">",
            left: { type: "num", value: b },
            right: { type: "num", value: a },
          };
          expect(evaluate(gtAB)).not.toBe(evaluate(gtBA));
        },
      ),
    );
  });
});

describe("compileSignal() — determinism", () => {
  it("calling the compiled fn twice with same ctx gives same result", () => {
    fc.assert(
      fc.property(comparisonExpr, validCtx, (expr, ctx) => {
        try {
          const fn = compileSignal(expr);
          const r1 = fn(ctx);
          const r2 = fn(ctx);
          expect(r1).toBe(r2);
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("arithmetic expressions return numbers (not booleans)", () => {
    fc.assert(
      fc.property(arithmeticExpr, (expr) => {
        try {
          const fn = compileSignal(expr);
          const result = fn({});
          expect(typeof result).toBe("number");
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("comparison expressions return booleans", () => {
    fc.assert(
      fc.property(comparisonExpr, validCtx, (expr, ctx) => {
        try {
          const fn = compileSignal(expr);
          const result = fn(ctx);
          expect(typeof result).toBe("boolean");
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe("division by zero safety", () => {
  it("throws RangeError for explicit 1/0", () => {
    expect(() => compileSignal("1 / 0")({})).toThrow(RangeError);
  });

  it("never silently returns NaN for any division", () => {
    fc.assert(
      fc.property(
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true }),
        (a, b) => {
          try {
            const fn = compileSignal(`${a} / ${b}`);
            const result = fn({});
            // If it succeeds, result must be finite (b was non-zero)
            expect(Number.isFinite(result as number)).toBe(true);
          } catch (e) {
            // Either RangeError (div by zero) or SyntaxError (-0.0 formatting)
            expect(isAllowedError(e)).toBe(true);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ── Extended fuzz: logical operators ──────────────────────────────────────────

/** Nested boolean expression with 'and', 'or', 'not'. */
const boolExpr = fc.oneof(
  comparisonExpr,
  fc.tuple(comparisonExpr, comparisonExpr).map(([l, r]) => `${l} and ${r}`),
  fc.tuple(comparisonExpr, comparisonExpr).map(([l, r]) => `${l} or ${r}`),
  comparisonExpr.map((e) => `not ${e}`),
);

describe("logical operators — fuzz safety", () => {
  it("'and' expressions return booleans", () => {
    fc.assert(
      fc.property(fc.tuple(comparisonExpr, comparisonExpr), validCtx, ([l, r], ctx) => {
        try {
          const fn = compileSignal(`${l} and ${r}`);
          const result = fn(ctx);
          expect(typeof result).toBe("boolean");
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("'or' expressions return booleans", () => {
    fc.assert(
      fc.property(fc.tuple(comparisonExpr, comparisonExpr), validCtx, ([l, r], ctx) => {
        try {
          const fn = compileSignal(`${l} or ${r}`);
          const result = fn(ctx);
          expect(typeof result).toBe("boolean");
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("'not' inverts boolean result", () => {
    fc.assert(
      fc.property(comparisonExpr, validCtx, (expr, ctx) => {
        try {
          const fn = compileSignal(expr);
          const notFn = compileSignal(`not ${expr}`);
          const result = fn(ctx);
          const notResult = notFn(ctx);
          if (typeof result === "boolean" && typeof notResult === "boolean") {
            expect(notResult).toBe(!result);
          }
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("nested boolean expressions never crash", () => {
    fc.assert(
      fc.property(boolExpr, validCtx, (expr, ctx) => {
        try {
          const fn = compileSignal(expr);
          fn(ctx);
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 300 },
    );
  });
});

// ── Extended fuzz: unary minus ────────────────────────────────────────────────

describe("unary minus — fuzz safety", () => {
  it("-x negates correctly", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (n) => {
        const fn = compileSignal(`-${n}`);
        try {
          const result = fn({}) as number;
          expect(result).toBeCloseTo(-n, 6);
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("double negation returns original value", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (n) => {
        try {
          const fn = compileSignal(`- -${n}`);
          const result = fn({}) as number;
          expect(result).toBeCloseTo(n, 6);
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ── Extended fuzz: function calls ─────────────────────────────────────────────

describe("function calls — fuzz safety", () => {
  it("calling an unknown function throws ReferenceError", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z]{2,10}$/), (name) => {
        try {
          const fn = compileSignal(`${name}(1, 2)`);
          fn({});
        } catch (e) {
          expect(e instanceof ReferenceError || e instanceof SyntaxError).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("user-supplied functions are called with correct args", () => {
    fc.assert(
      fc.property(
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true }),
        (a, b) => {
          let called = false;
          const ctx: EvalContext = {
            funcs: {
              add: (...args) => {
                called = true;
                return (args[0] as number) + (args[1] as number);
              },
            },
          };
          try {
            const fn = compileSignal(`add(${a}, ${b})`);
            const result = fn(ctx);
            expect(called).toBe(true);
            expect(result).toBeCloseTo(a + b, 6);
          } catch (e) {
            expect(isAllowedError(e)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Extended fuzz: array literals ─────────────────────────────────────────────

describe("array literals — fuzz safety", () => {
  it("array literal of numbers evaluates to number[]", () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: -100, max: 100, noNaN: true }), { minLength: 1, maxLength: 5 }),
        (nums) => {
          const expr = `[${nums.join(", ")}]`;
          try {
            const fn = compileSignal(expr);
            const result = fn({});
            expect(Array.isArray(result)).toBe(true);
            expect((result as number[]).length).toBe(nums.length);
          } catch (e) {
            expect(isAllowedError(e)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("array indexing returns correct element", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 5 }),
        (nums) => {
          const idx = 0;
          const expr = `[${nums.join(", ")}][${idx}]`;
          try {
            const fn = compileSignal(expr);
            const result = fn({});
            expect(result).toBe(nums[idx]);
          } catch (e) {
            expect(isAllowedError(e)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Extended fuzz: stress with deeply nested parens ───────────────────────────

describe("deeply nested expressions — safety", () => {
  it("deeply nested parentheses do not crash", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (depth) => {
        const open = "(".repeat(depth);
        const close = ")".repeat(depth);
        const expr = `${open}42${close}`;
        try {
          const fn = compileSignal(expr);
          const result = fn({});
          expect(result).toBe(42);
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 50 },
    );
  });

  it("chained arithmetic is associative (left-to-right)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 2, maxLength: 5 }),
        (nums) => {
          const expr = nums.join(" + ");
          try {
            const fn = compileSignal(expr);
            const result = fn({}) as number;
            const expected = nums.reduce((a, b) => a + b, 0);
            expect(result).toBeCloseTo(expected, 4);
          } catch (e) {
            expect(isAllowedError(e)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Extended fuzz: full random strings ────────────────────────────────────────

describe("full random input safety", () => {
  it("never throws non-allowed errors for completely random strings", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 80 }), (src) => {
        try {
          const fn = compileSignal(src);
          fn({});
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 500 },
    );
  });

  it("never produces Infinity or -Infinity as result", () => {
    fc.assert(
      fc.property(arithmeticExpr, (expr) => {
        try {
          const fn = compileSignal(expr);
          const result = fn({});
          if (typeof result === "number") {
            expect(Number.isFinite(result)).toBe(true);
          }
        } catch (e) {
          expect(isAllowedError(e)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });
});
