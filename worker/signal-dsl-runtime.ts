/**
 * Safe expression + script evaluator for user-authored signal rules — R2.
 *
 * Expression grammar (BNF-ish):
 *   expr   := or
 *   or     := and ('or' and)*
 *   and    := not ('and' not)*
 *   not    := 'not' not | cmp
 *   cmp    := add (('<'|'<='|'>'|'>='|'=='|'!=') add)?
 *   add    := mul (('+'|'-') mul)*
 *   mul    := unary (('*'|'/') unary)*
 *   unary  := '-' unary | index
 *   index  := call ('[' expr ']')*
 *   call   := IDENT '(' (expr (',' expr)*)? ')' | atom
 *   atom   := NUMBER | IDENT | '[' (expr (',' expr)*)? ']' | '(' expr ')' | 'true' | 'false'
 *
 * Script statements (R2 expansion):
 *   stmt   := let_stmt | for_stmt | expr_stmt
 *   let_stmt  := 'let' IDENT '=' expr
 *   for_stmt  := 'for' IDENT '=' expr 'to' expr '{' stmt* '}'
 *   expr_stmt := expr
 *
 * The `plot(name, value)` built-in accumulates series into `ScriptResult.plots`.
 * Array values (`number[]`) are supported alongside `number` and `boolean`.
 *
 * Identifiers are looked up in the supplied context (variables) or
 * called as functions if followed by `(`. No string literals, no
 * property access, no member chains — designed to be safe for untrusted
 * input.
 */

/** Supported value types — scalars and numeric arrays. */
export type Value = number | boolean | number[];

export type FnImpl = (...args: Value[]) => Value;

export interface EvalContext {
  readonly vars?: Readonly<Record<string, Value>>;
  readonly funcs?: Readonly<Record<string, FnImpl>>;
}

type TokKind =
  | "num"
  | "ident"
  | "lparen"
  | "rparen"
  | "lbracket"
  | "rbracket"
  | "lbrace"
  | "rbrace"
  | "comma"
  | "eq"
  | "op"
  | "kw"
  | "eof";

interface Token {
  readonly kind: TokKind;
  readonly value: string;
  readonly pos: number;
}

const KEYWORDS = new Set(["and", "or", "not", "true", "false", "let", "for", "to"]);
const TWO_CHAR_OPS = new Set(["<=", ">=", "==", "!="]);
const ONE_CHAR_OPS = new Set(["<", ">", "+", "-", "*", "/"]);

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ kind: "lparen", value: "(", pos: i });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "rparen", value: ")", pos: i });
      i++;
      continue;
    }
    if (ch === "[") {
      tokens.push({ kind: "lbracket", value: "[", pos: i });
      i++;
      continue;
    }
    if (ch === "]") {
      tokens.push({ kind: "rbracket", value: "]", pos: i });
      i++;
      continue;
    }
    if (ch === "{") {
      tokens.push({ kind: "lbrace", value: "{", pos: i });
      i++;
      continue;
    }
    if (ch === "}") {
      tokens.push({ kind: "rbrace", value: "}", pos: i });
      i++;
      continue;
    }
    if (ch === ",") {
      tokens.push({ kind: "comma", value: ",", pos: i });
      i++;
      continue;
    }
    // '=' by itself is assignment; '==' is an operator
    if (ch === "=" && src[i + 1] !== "=") {
      tokens.push({ kind: "eq", value: "=", pos: i });
      i++;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (TWO_CHAR_OPS.has(two)) {
      tokens.push({ kind: "op", value: two, pos: i });
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPS.has(ch)) {
      tokens.push({ kind: "op", value: ch, pos: i });
      i++;
      continue;
    }
    if (ch >= "0" && ch <= "9") {
      const start = i;
      while (i < src.length && /[0-9.]/.test(src[i]!)) i++;
      tokens.push({ kind: "num", value: src.slice(start, i), pos: start });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      while (i < src.length && /[A-Za-z0-9_]/.test(src[i]!)) i++;
      const word = src.slice(start, i);
      tokens.push({
        kind: KEYWORDS.has(word) ? "kw" : "ident",
        value: word,
        pos: start,
      });
      continue;
    }
    throw new SyntaxError(`Unexpected character '${ch}' at position ${i}`);
  }
  tokens.push({ kind: "eof", value: "", pos: src.length });
  return tokens;
}

export type Node =
  | { type: "num"; value: number }
  | { type: "bool"; value: boolean }
  | { type: "array"; elements: Node[] }
  | { type: "index"; array: Node; idx: Node }
  | { type: "ident"; name: string }
  | { type: "call"; name: string; args: Node[] }
  | { type: "unary"; op: "-" | "not"; operand: Node }
  | { type: "binary"; op: string; left: Node; right: Node };

/** Statement node types (script mode only). */
export type Stmt =
  | { type: "let"; name: string; value: Node }
  | { type: "for"; var: string; from: Node; to: Node; body: Stmt[] }
  | { type: "expr_stmt"; expr: Node };

class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos]!;
  }

  private eat(): Token {
    return this.tokens[this.pos++]!;
  }

  private expect(kind: TokKind, value?: string): Token {
    const t = this.eat();
    if (t.kind !== kind || (value !== undefined && t.value !== value)) {
      throw new SyntaxError(
        `Expected ${kind}${value ? ` '${value}'` : ""} at ${t.pos}, got ${t.kind} '${t.value}'`,
      );
    }
    return t;
  }

  parse(): Node {
    const node = this.parseOr();
    this.expect("eof");
    return node;
  }

  private parseOr(): Node {
    let left = this.parseAnd();
    while (this.peek().kind === "kw" && this.peek().value === "or") {
      this.eat();
      const right = this.parseAnd();
      left = { type: "binary", op: "or", left, right };
    }
    return left;
  }

  private parseAnd(): Node {
    let left = this.parseNot();
    while (this.peek().kind === "kw" && this.peek().value === "and") {
      this.eat();
      const right = this.parseNot();
      left = { type: "binary", op: "and", left, right };
    }
    return left;
  }

  private parseNot(): Node {
    if (this.peek().kind === "kw" && this.peek().value === "not") {
      this.eat();
      return { type: "unary", op: "not", operand: this.parseNot() };
    }
    return this.parseCmp();
  }

  private parseCmp(): Node {
    const left = this.parseAdd();
    const t = this.peek();
    if (t.kind === "op" && /^(<=|>=|==|!=|<|>)$/.test(t.value)) {
      this.eat();
      const right = this.parseAdd();
      return { type: "binary", op: t.value, left, right };
    }
    return left;
  }

  private parseAdd(): Node {
    let left = this.parseMul();
    while (this.peek().kind === "op" && (this.peek().value === "+" || this.peek().value === "-")) {
      const op = this.eat().value;
      const right = this.parseMul();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  private parseMul(): Node {
    let left = this.parseUnary();
    while (this.peek().kind === "op" && (this.peek().value === "*" || this.peek().value === "/")) {
      const op = this.eat().value;
      const right = this.parseUnary();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  private parseUnary(): Node {
    if (this.peek().kind === "op" && this.peek().value === "-") {
      this.eat();
      return { type: "unary", op: "-", operand: this.parseUnary() };
    }
    return this.parseIndex();
  }

  private parseIndex(): Node {
    let base = this.parseCall();
    while (this.peek().kind === "lbracket") {
      this.eat();
      const idx = this.parseOr();
      this.expect("rbracket");
      base = { type: "index", array: base, idx };
    }
    return base;
  }

  private parseCall(): Node {
    const t = this.peek();
    if (t.kind === "ident" && this.tokens[this.pos + 1]?.kind === "lparen") {
      this.eat();
      this.expect("lparen");
      const args: Node[] = [];
      if (this.peek().kind !== "rparen") {
        args.push(this.parseOr());
        while (this.peek().kind === "comma") {
          this.eat();
          args.push(this.parseOr());
        }
      }
      this.expect("rparen");
      return { type: "call", name: t.value, args };
    }
    return this.parseAtom();
  }

  private parseAtom(): Node {
    const t = this.eat();
    if (t.kind === "num") {
      return { type: "num", value: Number(t.value) };
    }
    if (t.kind === "kw" && (t.value === "true" || t.value === "false")) {
      return { type: "bool", value: t.value === "true" };
    }
    if (t.kind === "ident") {
      return { type: "ident", name: t.value };
    }
    if (t.kind === "lbracket") {
      // Array literal: [e1, e2, ...]
      const elements: Node[] = [];
      if (this.peek().kind !== "rbracket") {
        elements.push(this.parseOr());
        while (this.peek().kind === "comma") {
          this.eat();
          elements.push(this.parseOr());
        }
      }
      this.expect("rbracket");
      return { type: "array", elements };
    }
    if (t.kind === "lparen") {
      const inner = this.parseOr();
      this.expect("rparen");
      return inner;
    }
    throw new SyntaxError(`Unexpected token ${t.kind} '${t.value}' at ${t.pos}`);
  }

  // ── Script-level statement parser (R2) ─────────────────────────────────────

  parseScript(): Stmt[] {
    const stmts: Stmt[] = [];
    while (this.peek().kind !== "eof" && this.peek().kind !== "rbrace") {
      stmts.push(this.parseStmt());
    }
    return stmts;
  }

  private parseStmt(): Stmt {
    const t = this.peek();
    if (t.kind === "kw" && t.value === "let") {
      return this.parseLetStmt();
    }
    if (t.kind === "kw" && t.value === "for") {
      return this.parseForStmt();
    }
    return { type: "expr_stmt", expr: this.parseOr() };
  }

  private parseLetStmt(): Stmt {
    this.expect("kw", "let");
    const name = this.expect("ident").value;
    this.expect("eq");
    const value = this.parseOr();
    return { type: "let", name, value };
  }

  private parseForStmt(): Stmt {
    this.expect("kw", "for");
    const varName = this.expect("ident").value;
    this.expect("eq");
    const from = this.parseOr();
    this.expect("kw", "to");
    const to = this.parseOr();
    this.expect("lbrace");
    const body = this.parseScript();
    this.expect("rbrace");
    return { type: "for", var: varName, from, to, body };
  }
}

export function parse(src: string): Node {
  return new Parser(tokenize(src)).parse();
}

export function parseScript(src: string): Stmt[] {
  const parser = new Parser(tokenize(src));
  return parser.parseScript();
}

function asNumber(v: Value): number {
  if (typeof v !== "number") {
    throw new TypeError(`Expected number, got ${typeof v}`);
  }
  return v;
}

function asNumberArray(v: Value): number[] {
  if (!Array.isArray(v)) {
    throw new TypeError(`Expected array, got ${typeof v}`);
  }
  return v;
}

function asBool(v: Value): boolean {
  if (typeof v !== "boolean") {
    throw new TypeError(`Expected boolean, got ${typeof v}`);
  }
  return v;
}

export function evaluate(node: Node, ctx: EvalContext = {}): Value {
  switch (node.type) {
    case "num":
      return node.value;
    case "bool":
      return node.value;
    case "array":
      return node.elements.map((e) => asNumber(evaluate(e, ctx)));
    case "index": {
      const arr = asNumberArray(evaluate(node.array, ctx));
      const idx = Math.trunc(asNumber(evaluate(node.idx, ctx)));
      if (idx < 0 || idx >= arr.length) {
        throw new RangeError(`Array index ${idx} out of bounds (length ${arr.length})`);
      }
      return arr[idx]!;
    }
    case "ident": {
      const v = ctx.vars?.[node.name];
      if (v === undefined) {
        throw new ReferenceError(`Unknown identifier '${node.name}'`);
      }
      return v;
    }
    case "call": {
      const fn = ctx.funcs?.[node.name];
      if (!fn) throw new ReferenceError(`Unknown function '${node.name}'`);
      const args = node.args.map((a) => evaluate(a, ctx));
      return fn(...args);
    }
    case "unary": {
      const operand = evaluate(node.operand, ctx);
      if (node.op === "-") return -asNumber(operand);
      return !asBool(operand);
    }
    case "binary": {
      // Short-circuit boolean ops.
      if (node.op === "and") {
        return asBool(evaluate(node.left, ctx)) && asBool(evaluate(node.right, ctx));
      }
      if (node.op === "or") {
        return asBool(evaluate(node.left, ctx)) || asBool(evaluate(node.right, ctx));
      }
      const l = evaluate(node.left, ctx);
      const r = evaluate(node.right, ctx);
      switch (node.op) {
        case "+":
          return asNumber(l) + asNumber(r);
        case "-":
          return asNumber(l) - asNumber(r);
        case "*":
          return asNumber(l) * asNumber(r);
        case "/": {
          const rn = asNumber(r);
          if (rn === 0) throw new RangeError("Division by zero");
          return asNumber(l) / rn;
        }
        case "<":
          return asNumber(l) < asNumber(r);
        case "<=":
          return asNumber(l) <= asNumber(r);
        case ">":
          return asNumber(l) > asNumber(r);
        case ">=":
          return asNumber(l) >= asNumber(r);
        case "==":
          return l === r;
        case "!=":
          return l !== r;
      }
      throw new SyntaxError(`Unknown operator '${node.op}'`);
    }
  }
}

// ── Script execution (R2 — for loops, let, plot) ──────────────────────────────

/** Per-series plot data accumulated by the `plot()` built-in. */
export interface PlotSeries {
  readonly name: string;
  readonly values: number[];
}

/** Result returned by `executeScript()`. */
export interface ScriptResult {
  /** All plot series accumulated via `plot(name, value)` calls. */
  readonly plots: PlotSeries[];
  /** Final value of every `let` variable at script completion. */
  readonly vars: Readonly<Record<string, Value>>;
}

/** Max iterations across all `for` loops in a single script execution. */
const MAX_ITERATIONS = 10_000;

/**
 * Execute a multi-statement DSL script and return accumulated plots + vars.
 *
 * The `plot(name, value)` built-in is always available; you may also supply
 * additional functions via `ctx.funcs` and seed variables via `ctx.vars`.
 */
export function executeScript(src: string, ctx: EvalContext = {}): ScriptResult {
  const stmts = parseScript(src);
  const plots = new Map<string, number[]>();
  let totalIterations = 0;

  // Mutable local scope inheriting from ctx.vars.
  const scope: Record<string, Value> = { ...(ctx.vars ?? {}) };

  const plotFn = (...args: Value[]): Value => {
    const name = String(args[0]);
    const v = args[1];
    if (typeof v !== "number") throw new TypeError(`plot() second argument must be a number`);
    let series = plots.get(name);
    if (!series) {
      series = [];
      plots.set(name, series);
    }
    series.push(v);
    return v;
  };

  const localCtx = (): EvalContext => ({
    vars: scope as Readonly<Record<string, Value>>,
    funcs: { ...ctx.funcs, plot: plotFn },
  });

  function execStmts(statements: Stmt[]): void {
    for (const stmt of statements) {
      if (stmt.type === "let") {
        scope[stmt.name] = evaluate(stmt.value, localCtx());
      } else if (stmt.type === "for") {
        const from = Math.trunc(asNumber(evaluate(stmt.from, localCtx())));
        const to = Math.trunc(asNumber(evaluate(stmt.to, localCtx())));
        for (let i = from; i <= to; i++) {
          totalIterations++;
          if (totalIterations > MAX_ITERATIONS) {
            throw new RangeError(`Script exceeded maximum of ${MAX_ITERATIONS} loop iterations`);
          }
          scope[stmt.var] = i;
          execStmts(stmt.body);
        }
      } else {
        // expr_stmt — evaluate for side effects (e.g. plot())
        evaluate(stmt.expr, localCtx());
      }
    }
  }

  execStmts(stmts);

  const plotsResult: PlotSeries[] = [];
  for (const [name, values] of plots) {
    plotsResult.push({ name, values });
  }

  return {
    plots: plotsResult,
    vars: { ...scope } as Readonly<Record<string, Value>>,
  };
}

export function compileSignal(src: string): (ctx: EvalContext) => Value {
  const ast = parse(src);
  return (ctx) => evaluate(ast, ctx);
}
