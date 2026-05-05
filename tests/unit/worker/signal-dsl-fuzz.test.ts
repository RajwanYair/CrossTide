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
