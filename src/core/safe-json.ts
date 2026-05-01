/**
 * Safe JSON parse/stringify that never throw.
 *  - safeParse: returns { ok: true, value } or { ok: false, error }.
 *  - safeStringify: handles cyclic references and BigInt by replacing them
 *    with sentinel strings; returns the supplied fallback if anything fails.
 */

export type SafeResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: Error };

export function safeParse<T = unknown>(input: string): SafeResult<T> {
  try {
    return { ok: true, value: JSON.parse(input) as T };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export interface SafeStringifyOptions {
  readonly space?: number | string;
  readonly fallback?: string;
}

export function safeStringify(value: unknown, options: SafeStringifyOptions = {}): string {
  const fallback = options.fallback ?? "";
  if (value === undefined) return fallback;
  try {
    const seen = new WeakSet<object>();
    const replacer = (_key: string, v: unknown): unknown => {
      if (typeof v === "bigint") return `[BigInt:${v.toString()}]`;
      if (typeof v === "function") return `[Function:${v.name || "anonymous"}]`;
      if (typeof v === "undefined") return "[Undefined]";
      if (v !== null && typeof v === "object") {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    };
    const result = JSON.stringify(value, replacer, options.space);
    return result === undefined ? fallback : result;
  } catch {
    return fallback;
  }
}
