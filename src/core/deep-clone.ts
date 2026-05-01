/**
 * Deep clone helper. Prefers the platform `structuredClone` (handles
 * Maps, Sets, Dates, RegExp, ArrayBuffers, cycles) and falls back to a
 * recursive clone for environments that lack it. The fallback covers
 * plain objects, arrays, dates, maps, sets and primitives, plus
 * cycles via a WeakMap.
 */

const hasStructuredClone: boolean = typeof globalThis.structuredClone === "function";

export function deepClone<T>(value: T): T {
  if (hasStructuredClone) return globalThis.structuredClone(value);
  return fallbackClone(value, new WeakMap<object, unknown>()) as T;
}

function fallbackClone(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (value === null || typeof value !== "object") return value;
  const obj = value;
  if (seen.has(obj)) return seen.get(obj);
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (Array.isArray(value)) {
    const arr: unknown[] = [];
    seen.set(obj, arr);
    for (const item of value) arr.push(fallbackClone(item, seen));
    return arr;
  }
  if (value instanceof Map) {
    const m = new Map<unknown, unknown>();
    seen.set(obj, m);
    for (const [k, v] of value) m.set(fallbackClone(k, seen), fallbackClone(v, seen));
    return m;
  }
  if (value instanceof Set) {
    const s = new Set<unknown>();
    seen.set(obj, s);
    for (const v of value) s.add(fallbackClone(v, seen));
    return s;
  }
  const out: Record<string, unknown> = {};
  seen.set(obj, out);
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = fallbackClone(v, seen);
  }
  return out;
}

/** @internal exposed for unit testing of the non-structuredClone fallback path */
export function _fallbackCloneForTests<T>(value: T): T {
  return fallbackClone(value, new WeakMap<object, unknown>()) as T;
}
