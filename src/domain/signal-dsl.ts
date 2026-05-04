/**
 * Tiny safe expression evaluator for user-authored signal rules.
 *
 * Grammar (BNF-ish):
 *   expr   := or
 *   or     := and ('or' and)*
 *   and    := not ('and' not)*
 *   not    := 'not' not | cmp
 *   cmp    := add (('<'|'<='|'>'|'>='|'=='|'!=') add)?
 *   add    := mul (('+'|'-') mul)*
 *   mul    := unary (('*'|'/') unary)*
 *   unary  := '-' unary | call
 *   call   := IDENT '(' (expr (',' expr)*)? ')' | atom
 *   atom   := NUMBER | IDENT | '(' expr ')' | 'true' | 'false' | '[' (expr,*)? ']'
 *
 * Identifiers are looked up in the supplied context (variables) or
 * called as functions if followed by `(`. No string literals, no
 * property access, no member chains — designed to be safe for untrusted
 * input.
 *
 * R2 extensions:
 *  - Value now includes `readonly number[]` for numeric series
 *  - Array literal syntax: `[1, 2, 3]`
 *  - Built-in array functions: range, len, at, sum, avg, map, filter, reduce
 *  - plot(name, series) — registers a named series output via PlotSink
 */

/**
 * A scalar or array value in the DSL.
 * R2: arrays (`readonly number[]`) are first-class values.
 */
export type Value = number | boolean | readonly number[];

export type FnImpl = (...args: Value[]) => Value;

/** R2: Callback called by `plot(name, series)` to register a named output series. */
export type PlotSink = (name: string, series: readonly number[]) => void;

export interface EvalContext {
  readonly vars?: Readonly<Record<string, Value>>;
  readonly funcs?: Readonly<Record<string, FnImpl>>;
  /** R2: Receives `plot(name, series)` calls. */
  readonly onPlot?: PlotSink;
}

type TokKind =
  | "num"
  | "ident"
  | "lparen"
  | "rparen"
  | "lbracket"
  | "rbracket"
  | "comma"
  | "op"
  | "kw"
  | "eof";

interface Token {
  readonly kind: TokKind;
  readonly value: string;
  readonly pos: number;
}

const KEYWORDS = new Set(["and", "or", "not", "true", "false"]);
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
    if (ch === ",") {
      tokens.push({ kind: "comma", value: ",", pos: i });
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
  | { type: "arr"; elements: Node[] }
  | { type: "ident"; name: string }
  | { type: "call"; name: string; args: Node[] }
  | { type: "unary"; op: "-" | "not"; operand: Node }
  | { type: "binary"; op: string; left: Node; right: Node };

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
    return this.parseCall();
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
    if (t.kind === "lparen") {
      const inner = this.parseOr();
      this.expect("rparen");
      return inner;
    }
    // R2: Array literal [ expr, expr, ... ]
    if (t.kind === "lbracket") {
      const elements: Node[] = [];
      if (this.peek().kind !== "rbracket") {
        elements.push(this.parseOr());
        while (this.peek().kind === "comma") {
          this.eat();
          if (this.peek().kind === "rbracket") break; // trailing comma
          elements.push(this.parseOr());
        }
      }
      this.expect("rbracket");
      return { type: "arr", elements };
    }
    throw new SyntaxError(`Unexpected token ${t.kind} '${t.value}' at ${t.pos}`);
  }
}

export function parse(src: string): Node {
  return new Parser(tokenize(src)).parse();
}

function asNumber(v: Value): number {
  if (typeof v !== "number") {
    throw new TypeError(`Expected number, got ${Array.isArray(v) ? "array" : typeof v}`);
  }
  return v;
}

function asArray(v: Value): readonly number[] {
  if (!Array.isArray(v)) {
    throw new TypeError(`Expected array, got ${typeof v}`);
  }
  return v as readonly number[];
}

function asBool(v: Value): boolean {
  if (typeof v !== "boolean") {
    throw new TypeError(`Expected boolean, got ${Array.isArray(v) ? "array" : typeof v}`);
  }
  return v;
}

/**
 * R2: Built-in array functions available in every EvalContext.
 * These are merged with any user-supplied `funcs` (user funcs take precedence).
 */
function builtinFuncs(ctx: EvalContext): Record<string, FnImpl> {
  return {
    /** range(from, to) → array of integers [from .. to] (inclusive). */
    range: (from: Value, to: Value): Value => {
      const a = Math.ceil(asNumber(from));
      const b = Math.floor(asNumber(to));
      const result: number[] = [];
      for (let i = a; i <= b; i++) result.push(i);
      return result;
    },
    /** len(arr) → number of elements. */
    len: (arr: Value): Value => asArray(arr).length,
    /** at(arr, index) → element at index (0-based). Negative indexing supported. */
    at: (arr: Value, idx: Value): Value => {
      const a = asArray(arr);
      let i = Math.trunc(asNumber(idx));
      if (i < 0) i += a.length;
      if (i < 0 || i >= a.length) throw new RangeError(`Array index ${i} out of bounds`);
      return a[i]!;
    },
    /** sum(arr) → sum of all elements. */
    sum: (arr: Value): Value => asArray(arr).reduce((acc, v) => acc + v, 0),
    /** avg(arr) → arithmetic mean. Returns 0 for empty array. */
    avg: (arr: Value): Value => {
      const a = asArray(arr);
      return a.length === 0 ? 0 : a.reduce((s, v) => s + v, 0) / a.length;
    },
    /** min(arr) → smallest element. Returns Infinity for empty array. */
    min: (arr: Value): Value => {
      const a = asArray(arr);
      return a.length === 0 ? Infinity : Math.min(...a);
    },
    /** max(arr) → largest element. Returns -Infinity for empty array. */
    max: (arr: Value): Value => {
      const a = asArray(arr);
      return a.length === 0 ? -Infinity : Math.max(...a);
    },
    /**
     * plot(name, series) → registers the series via onPlot and returns the series.
     * `name` must be a number (DSL has no strings) — treated as a numeric ID.
     */
    plot: (nameVal: Value, seriesVal: Value): Value => {
      const name = String(asNumber(nameVal));
      const series = asArray(seriesVal);
      ctx.onPlot?.(name, series);
      return series;
    },
    ...ctx.funcs,
  };
}

export function evaluate(node: Node, ctx: EvalContext = {}): Value {
  switch (node.type) {
    case "num":
      return node.value;
    case "bool":
      return node.value;
    // R2: Array literal — evaluate each element as a number.
    case "arr":
      return node.elements.map((el) => asNumber(evaluate(el, ctx)));
    case "ident": {
      const v = ctx.vars?.[node.name];
      if (v === undefined) {
        throw new ReferenceError(`Unknown identifier '${node.name}'`);
      }
      return v;
    }
    case "call": {
      const allFuncs = builtinFuncs(ctx);
      const fn = allFuncs[node.name];
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

export function compileSignal(src: string): (ctx: EvalContext) => Value {
  const ast = parse(src);
  return (ctx) => evaluate(ast, ctx);
}
