/**
 * Type-safe pick / omit helpers for plain objects. Both return a new
 * shallow copy; the original object is unchanged.
 */

export function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      out[k] = obj[k];
    }
  }
  return out;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const skip = new Set<PropertyKey>(keys);
  const out = {} as Record<PropertyKey, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (!skip.has(k)) out[k] = v;
  }
  return out as Omit<T, K>;
}

export function pickBy<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean,
): Partial<T> {
  const out = {} as Partial<T>;
  for (const [k, v] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
    if (predicate(v, k)) out[k] = v;
  }
  return out;
}
