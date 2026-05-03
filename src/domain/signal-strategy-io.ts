/**
 * Shared signal strategy I/O (I6).
 *
 * Import and export signal-DSL strategies as portable JSON payloads.
 * Supports validation, versioning, checksumming, and batch operations
 * so users can share strategies via files, URLs, or clipboard.
 *
 * Exports:
 *   - `StrategyPayload` — the portable JSON envelope
 *   - `exportStrategy(name, expression, vars)` — build payload
 *   - `importStrategy(json)` — parse + validate JSON
 *   - `exportBundle(strategies)` — multi-strategy export
 *   - `importBundle(json)` — multi-strategy import
 *   - `validateExpression(expr)` — basic syntax sanity check
 *   - `validateVars(vars)` — ensure vars are number|boolean
 *   - `checksumPayload(p)` — deterministic hash for integrity
 *   - `encodeShareUrl(payload, base)` — encode to shareable URL
 *   - `decodeShareUrl(url)` — decode from URL
 *   - `payloadToClipboardText(payload)` — pretty-print for clipboard
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface StrategyPayload {
  version: 1;
  name: string;
  expression: string;
  vars: Record<string, number | boolean>;
  createdAt: string; // ISO 8601
  checksum: string;
}

export interface StrategyBundle {
  version: 1;
  strategies: StrategyPayload[];
  exportedAt: string;
}

export interface ImportResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Export ─────────────────────────────────────────────────────────────────

/**
 * Build a portable strategy payload.
 */
export function exportStrategy(
  name: string,
  expression: string,
  vars: Record<string, number | boolean> = {},
): StrategyPayload {
  const payload: StrategyPayload = {
    version: 1,
    name: name.trim() || "Untitled",
    expression: expression.trim(),
    vars: { ...vars },
    createdAt: new Date().toISOString(),
    checksum: "",
  };
  payload.checksum = checksumPayload(payload);
  return payload;
}

/**
 * Bundle multiple strategies into a single export.
 */
export function exportBundle(strategies: StrategyPayload[]): StrategyBundle {
  return {
    version: 1,
    strategies: [...strategies],
    exportedAt: new Date().toISOString(),
  };
}

// ── Import ────────────────────────────────────────────────────────────────

/**
 * Parse and validate a single strategy from JSON string.
 */
export function importStrategy(json: string): ImportResult<StrategyPayload> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Payload must be an object" };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj["version"] !== 1) {
    return { ok: false, error: `Unsupported version: ${String(obj["version"])}` };
  }

  if (typeof obj["name"] !== "string" || !obj["name"]) {
    return { ok: false, error: "Missing or empty 'name'" };
  }

  if (typeof obj["expression"] !== "string" || !obj["expression"]) {
    return { ok: false, error: "Missing or empty 'expression'" };
  }

  const exprCheck = validateExpression(obj["expression"]);
  if (!exprCheck.ok) return exprCheck as unknown as ImportResult<StrategyPayload>;

  if (typeof obj["vars"] !== "object" || obj["vars"] === null || Array.isArray(obj["vars"])) {
    return { ok: false, error: "'vars' must be a plain object" };
  }

  const varsCheck = validateVars(obj["vars"] as Record<string, unknown>);
  if (!varsCheck.ok) return varsCheck as unknown as ImportResult<StrategyPayload>;

  if (typeof obj["createdAt"] !== "string") {
    return { ok: false, error: "Missing 'createdAt'" };
  }

  const payload: StrategyPayload = {
    version: 1,
    name: obj["name"],
    expression: obj["expression"],
    vars: obj["vars"] as Record<string, number | boolean>,
    createdAt: obj["createdAt"],
    checksum: typeof obj["checksum"] === "string" ? obj["checksum"] : "",
  };

  // Verify checksum if present
  if (payload.checksum) {
    const expected = checksumPayload(payload);
    if (payload.checksum !== expected) {
      return { ok: false, error: "Checksum mismatch — payload may have been tampered with" };
    }
  }

  return { ok: true, data: payload };
}

/**
 * Import a strategy bundle from JSON string.
 */
export function importBundle(json: string): ImportResult<StrategyBundle> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Payload must be an object" };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj["version"] !== 1) {
    return { ok: false, error: `Unsupported version: ${String(obj["version"])}` };
  }

  if (!Array.isArray(obj["strategies"])) {
    return { ok: false, error: "'strategies' must be an array" };
  }

  const strategies: StrategyPayload[] = [];
  const arr = obj["strategies"] as unknown[];
  for (let i = 0; i < arr.length; i++) {
    const result = importStrategy(JSON.stringify(arr[i]));
    if (!result.ok) {
      return { ok: false, error: `Strategy[${i}]: ${result.error}` };
    }
    strategies.push(result.data!);
  }

  return {
    ok: true,
    data: {
      version: 1,
      strategies,
      exportedAt: typeof obj["exportedAt"] === "string" ? obj["exportedAt"] : "",
    },
  };
}

// ── Validation ────────────────────────────────────────────────────────────

/** Basic expression syntax sanity check (no full parse, just red flags). */
export function validateExpression(expr: string): ImportResult<void> {
  if (!expr.trim()) {
    return { ok: false, error: "Expression is empty" };
  }

  // Reject obvious injection attempts
  const dangerous = /\b(import|require|eval|Function|fetch|XMLHttpRequest|document|window)\b/;
  if (dangerous.test(expr)) {
    return { ok: false, error: "Expression contains forbidden keywords" };
  }

  // Check balanced parentheses
  let depth = 0;
  for (const ch of expr) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth < 0) return { ok: false, error: "Unbalanced parentheses" };
  }
  if (depth !== 0) return { ok: false, error: "Unbalanced parentheses" };

  return { ok: true };
}

/** Ensure all variable values are number or boolean. */
export function validateVars(vars: Record<string, unknown>): ImportResult<void> {
  for (const [key, val] of Object.entries(vars)) {
    if (typeof val !== "number" && typeof val !== "boolean") {
      return { ok: false, error: `Variable '${key}' must be number or boolean, got ${typeof val}` };
    }
  }
  return { ok: true };
}

// ── Checksum ──────────────────────────────────────────────────────────────

/**
 * Compute a deterministic checksum for integrity verification.
 * Uses DJB2 hash over the canonical fields (excluding checksum itself).
 */
export function checksumPayload(p: StrategyPayload): string {
  const canonical = `${p.version}|${p.name}|${p.expression}|${JSON.stringify(p.vars)}|${p.createdAt}`;
  return djb2(canonical);
}

function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

// ── URL sharing ───────────────────────────────────────────────────────────

/**
 * Encode a strategy payload into a shareable URL using base64url in the
 * hash fragment (no server round-trip needed).
 */
export function encodeShareUrl(
  payload: StrategyPayload,
  base: string = "https://crosstide.app/strategy",
): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  const b64url = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${base}#${b64url}`;
}

/**
 * Decode a strategy payload from a share URL.
 */
export function decodeShareUrl(url: string): ImportResult<StrategyPayload> {
  const hashIndex = url.indexOf("#");
  if (hashIndex < 0) {
    return { ok: false, error: "URL has no hash fragment" };
  }

  const b64url = url.slice(hashIndex + 1);
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);

  let json: string;
  try {
    json = decodeURIComponent(escape(atob(padded)));
  } catch {
    return { ok: false, error: "Invalid base64 encoding" };
  }

  return importStrategy(json);
}

// ── Clipboard ─────────────────────────────────────────────────────────────

/** Pretty-print a payload for clipboard sharing. */
export function payloadToClipboardText(payload: StrategyPayload): string {
  return JSON.stringify(payload, null, 2);
}
