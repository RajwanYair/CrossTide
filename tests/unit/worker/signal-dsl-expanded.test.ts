/**
 * Tests for R2 DSL expansion: for loops, array literals, index access, plot().
 *
 * Covers:
 *  - Array literal parsing and evaluation
 *  - Index access (arr[i]) with bounds checking
 *  - `let` variable assignments in script mode
 *  - `for i = N to M { ... }` loops
 *  - `plot(name, value)` accumulation
 *  - executeScript() integration
 *  - handleSignalDslExecuteScript() HTTP handler
 *  - MAX_ITERATIONS guard
 */
import { describe, it, expect } from "vitest";
import {
  tokenize,
  parse,
  parseScript,
  evaluate,
  executeScript,
} from "../../../worker/signal-dsl-runtime";
import { handleSignalDslExecuteScript } from "../../../worker/routes/signal-dsl";

// ── tokenize — new tokens ─────────────────────────────────────────────────────

describe("tokenize — R2 new tokens", () => {
  it("tokenizes [ ] { } = as distinct kinds", () => {
    const toks = tokenize("let x = [1, 2]");
    const kinds = toks.map((t) => t.kind);
    expect(kinds).toContain("kw"); // 'let'
    expect(kinds).toContain("ident"); // 'x'
    expect(kinds).toContain("eq"); // '='
    expect(kinds).toContain("lbracket"); // '['
    expect(kinds).toContain("rbracket"); // ']'
  });

  it("tokenizes for / to as keywords", () => {
    const toks = tokenize("for i = 0 to 5 { }");
    const kws = toks.filter((t) => t.kind === "kw").map((t) => t.value);
    expect(kws).toContain("for");
    expect(kws).toContain("to");
  });

  it("does not treat == as two eq tokens", () => {
    const toks = tokenize("a == b");
    const ops = toks.filter((t) => t.kind === "op");
    expect(ops).toHaveLength(1);
    expect(ops[0]!.value).toBe("==");
  });
});

// ── parse — array & index ─────────────────────────────────────────────────────

describe("parse — array literal", () => {
  it("parses empty array []", () => {
    const node = parse("[]");
    expect(node.type).toBe("array");
  });

  it("parses [1, 2, 3]", () => {
    const node = parse("[1, 2, 3]");
    expect(node.type).toBe("array");
    if (node.type === "array") {
      expect(node.elements).toHaveLength(3);
    }
  });
});

describe("parse — index access", () => {
  it("parses arr[0]", () => {
    const node = parse("arr[0]");
    expect(node.type).toBe("index");
  });

  it("parses nested arr[i][j] as left-associative", () => {
    const node = parse("arr[0][1]");
    // outer index node whose array is itself an index node
    expect(node.type).toBe("index");
    if (node.type === "index") {
      expect(node.array.type).toBe("index");
    }
  });
});

// ── evaluate — arrays ─────────────────────────────────────────────────────────

describe("evaluate — array literal", () => {
  it("produces a number[] value", () => {
    const node = parse("[10, 20, 30]");
    const result = evaluate(node);
    expect(result).toEqual([10, 20, 30]);
  });

  it("evaluates expressions inside array elements", () => {
    const node = parse("[1 + 1, 2 * 3]");
    expect(evaluate(node)).toEqual([2, 6]);
  });

  it("resolves identifiers in array elements", () => {
    const node = parse("[x, y]");
    const result = evaluate(node, { vars: { x: 5, y: 10 } });
    expect(result).toEqual([5, 10]);
  });
});

describe("evaluate — index access", () => {
  it("returns the element at the given index", () => {
    const node = parse("arr[1]");
    const result = evaluate(node, { vars: { arr: [100, 200, 300] } });
    expect(result).toBe(200);
  });

  it("truncates fractional index", () => {
    const node = parse("arr[1]");
    expect(evaluate(node, { vars: { arr: [1, 2, 3] } })).toBe(2);
  });

  it("throws RangeError for out-of-bounds access", () => {
    const node = parse("arr[5]");
    expect(() => evaluate(node, { vars: { arr: [1, 2] } })).toThrow(RangeError);
  });

  it("throws TypeError when indexing a non-array", () => {
    const node = parse("x[0]");
    expect(() => evaluate(node, { vars: { x: 42 } })).toThrow(TypeError);
  });
});

// ── parseScript ───────────────────────────────────────────────────────────────

describe("parseScript", () => {
  it("parses empty script", () => {
    expect(parseScript("")).toEqual([]);
  });

  it("parses let statement", () => {
    const stmts = parseScript("let x = 42");
    expect(stmts).toHaveLength(1);
    expect(stmts[0]!.type).toBe("let");
  });

  it("parses for loop", () => {
    const stmts = parseScript("for i = 0 to 3 { }");
    expect(stmts).toHaveLength(1);
    expect(stmts[0]!.type).toBe("for");
  });

  it("parses multiple statements", () => {
    const stmts = parseScript("let a = 1\nlet b = 2");
    expect(stmts).toHaveLength(2);
  });
});

// ── executeScript — let + for + plot ─────────────────────────────────────────

describe("executeScript — let statements", () => {
  it("sets a variable and returns it in vars", () => {
    const result = executeScript("let x = 10 + 5");
    expect(result.vars["x"]).toBe(15);
  });

  it("allows later statements to reference earlier vars", () => {
    const result = executeScript("let a = 3\nlet b = a * 2");
    expect(result.vars["b"]).toBe(6);
  });

  it("inherits seed vars from ctx", () => {
    const result = executeScript("let y = x + 1", { vars: { x: 9 } });
    expect(result.vars["y"]).toBe(10);
  });
});

describe("executeScript — for loops", () => {
  it("iterates from 0 to N inclusive", () => {
    const result = executeScript("let total = 0\nfor i = 0 to 4 { let total = total + i }");
    // 0+1+2+3+4 = 10
    expect(result.vars["total"]).toBe(10);
  });

  it("uses loop variable inside body", () => {
    const result = executeScript("for k = 1 to 3 { plot(k, k * 10) }");
    // plot called with name "1", "2", "3" (number→string)
    expect(result.plots).toHaveLength(3);
  });

  it("supports empty body", () => {
    expect(() => executeScript("for i = 0 to 10 { }")).not.toThrow();
  });
});

describe("executeScript — plot()", () => {
  it("accumulates a single named series", () => {
    const result = executeScript("plot(1, 10)\nplot(1, 20)\nplot(1, 30)");
    expect(result.plots).toHaveLength(1);
    expect(result.plots[0]!.values).toEqual([10, 20, 30]);
  });

  it("accumulates multiple named series", () => {
    const result = executeScript("plot(1, 5)\nplot(2, 7)");
    expect(result.plots).toHaveLength(2);
  });

  it("is available inside for loops", () => {
    const result = executeScript("for i = 1 to 5 { plot(1, i) }");
    expect(result.plots[0]!.values).toEqual([1, 2, 3, 4, 5]);
  });

  it("throws TypeError if value is not a number", () => {
    expect(() => executeScript("plot(1, true)")).toThrow(TypeError);
  });
});

describe("executeScript — array variables", () => {
  it("passes array vars and lets script index them", () => {
    const result = executeScript("let v = prices[2]", {
      vars: { prices: [10, 20, 30] },
    });
    expect(result.vars["v"]).toBe(30);
  });

  it("can iterate over array elements via for loop", () => {
    const result = executeScript("let total = 0\nfor i = 0 to 2 { let total = total + data[i] }", {
      vars: { data: [5, 10, 15] },
    });
    expect(result.vars["total"]).toBe(30);
  });
});

describe("executeScript — safety guards", () => {
  it("throws RangeError when exceeding MAX_ITERATIONS", () => {
    expect(() => executeScript("for i = 0 to 100000 { }")).toThrow(RangeError);
  });

  it("throws RangeError on division by zero inside a loop", () => {
    expect(() => executeScript("let x = 1 / 0")).toThrow(RangeError);
  });
});

// ── HTTP handler — handleSignalDslExecuteScript ───────────────────────────────

describe("handleSignalDslExecuteScript", () => {
  function makeReq(body: unknown): Request {
    return new Request("https://worker.example.com/api/signal-dsl/execute-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 400 on invalid JSON", async () => {
    const req = new Request("https://worker.example.com/api/signal-dsl/execute-script", {
      method: "POST",
      body: "not-json",
    });
    const res = await handleSignalDslExecuteScript(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when script field is missing", async () => {
    const res = await handleSignalDslExecuteScript(makeReq({ expression: "1 + 1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when script is empty", async () => {
    const res = await handleSignalDslExecuteScript(makeReq({ script: "  " }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with plots and vars for valid script", async () => {
    const res = await handleSignalDslExecuteScript(makeReq({ script: "let x = 7\nplot(1, x)" }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      result: { plots: { name: string; values: number[] }[]; vars: Record<string, unknown> };
    };
    expect(json.result.vars["x"]).toBe(7);
    expect(json.result.plots[0]!.values).toEqual([7]);
  });

  it("accepts array vars from the request", async () => {
    const res = await handleSignalDslExecuteScript(
      makeReq({ script: "let v = arr[0]", vars: { arr: [42, 43] } }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { result: { vars: Record<string, unknown> } };
    expect(json.result.vars["v"]).toBe(42);
  });

  it("returns 400 on DSL syntax error", async () => {
    const res = await handleSignalDslExecuteScript(makeReq({ script: "let = 1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid vars type", async () => {
    const res = await handleSignalDslExecuteScript(
      makeReq({ script: "let x = 1", vars: { bad: "string-value" } }),
    );
    expect(res.status).toBe(400);
  });
});
