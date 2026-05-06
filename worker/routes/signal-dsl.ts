/**
 * POST /api/signal-dsl/execute
 * POST /api/signal-dsl/execute-script  (R2 — script mode with for/let/plot)
 *
 * Executes a user-authored Signal DSL expression or script in the Worker sandbox.
 * Uses the same parser/evaluator as the browser for deterministic results.
 */
import {
  compileSignal,
  executeScript,
  type Value,
  type ScriptResult,
} from "../signal-dsl-runtime.js";

export interface SignalDslExecuteRequest {
  expression: string;
  vars?: Record<string, number | boolean>;
}

export interface SignalDslExecuteResponse {
  result: Value;
}

export interface SignalDslScriptRequest {
  script: string;
  vars?: Record<string, number | boolean | number[]>;
}

export interface SignalDslScriptResponse {
  result: ScriptResult;
}

const BUILTIN_FUNCS: Readonly<Record<string, (...args: Value[]) => Value>> = {
  abs: (x) => Math.abs(Number(x)),
  min: (a, b) => Math.min(Number(a), Number(b)),
  max: (a, b) => Math.max(Number(a), Number(b)),
  round: (x) => Math.round(Number(x)),
  floor: (x) => Math.floor(Number(x)),
  ceil: (x) => Math.ceil(Number(x)),
};

function parseVars(raw: unknown): Record<string, Value> {
  if (raw === undefined) return {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("vars must be an object of number/boolean/number[] values");
  }
  const out: Record<string, Value> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else if (Array.isArray(v) && v.every((item) => typeof item === "number")) {
      out[k] = v as number[];
    } else {
      throw new Error(`vars.${k} must be number|boolean|number[]`);
    }
  }
  return out;
}

export async function handleSignalDslExecute(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof body !== "object" || body === null || !("expression" in body)) {
    return new Response(JSON.stringify({ error: "Missing required field: expression" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = body as SignalDslExecuteRequest;
  const expression = String(payload.expression ?? "").trim();
  if (!expression) {
    return new Response(JSON.stringify({ error: "expression must be a non-empty string" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const vars = parseVars(payload.vars);
    const compiled = compileSignal(expression);
    const result = compiled({ vars, funcs: BUILTIN_FUNCS });
    const responseBody: SignalDslExecuteResponse = { result };
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * POST /api/signal-dsl/execute-script — R2
 *
 * Runs a multi-statement DSL script supporting `let`, `for` loops, arrays,
 * index access, and the `plot(name, value)` built-in for custom overlays.
 */
export async function handleSignalDslExecuteScript(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof body !== "object" || body === null || !("script" in body)) {
    return new Response(JSON.stringify({ error: "Missing required field: script" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = body as SignalDslScriptRequest;
  const script = String(payload.script ?? "").trim();
  if (!script) {
    return new Response(JSON.stringify({ error: "script must be a non-empty string" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const vars = parseVars(payload.vars);
    const result = executeScript(script, { vars, funcs: BUILTIN_FUNCS });
    const responseBody: SignalDslScriptResponse = { result };
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
