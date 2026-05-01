/**
 * Structural equality. Handles primitives, NaN === NaN, plain objects,
 * arrays, Map, Set, Date, RegExp, and typed-array-like objects (compared
 * element-wise). Cyclic references compare equal when both sides cycle
 * symmetrically (tracked via WeakMap pairs).
 *
 * Not intended to compare Functions or DOM nodes — those compare by reference.
 */

export function deepEqual(a: unknown, b: unknown): boolean {
  return eq(a, b, new WeakMap());
}

function eq(a: unknown, b: unknown, seen: WeakMap<object, object>): boolean {
  if (a === b) return true;
  // NaN
  if (typeof a === "number" && typeof b === "number" && Number.isNaN(a) && Number.isNaN(b))
    return true;
  if (a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;

  const tracked = seen.get(a);
  if (tracked === b) return true;
  seen.set(a, b);

  // Date
  if (a instanceof Date) return b instanceof Date && a.getTime() === b.getTime();
  if (b instanceof Date) return false;

  // RegExp
  if (a instanceof RegExp)
    return b instanceof RegExp && a.source === b.source && a.flags === b.flags;
  if (b instanceof RegExp) return false;

  // Map
  if (a instanceof Map) {
    if (!(b instanceof Map) || a.size !== b.size) return false;
    for (const [k, v] of a) {
      if (!b.has(k) || !eq(v, b.get(k), seen)) return false;
    }
    return true;
  }
  if (b instanceof Map) return false;

  // Set
  if (a instanceof Set) {
    if (!(b instanceof Set) || a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
  if (b instanceof Set) return false;

  // Array
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!eq(a[i], b[i], seen)) return false;
    return true;
  }
  if (Array.isArray(b)) return false;

  // Plain objects (including typed arrays which expose length-indexed props).
  const ao = a as Record<string | symbol, unknown>;
  const bo = b as Record<string | symbol, unknown>;
  const aKeys = Reflect.ownKeys(ao);
  const bKeys = Reflect.ownKeys(bo);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bo, k)) return false;
    if (!eq(ao[k], bo[k], seen)) return false;
  }
  return true;
}
