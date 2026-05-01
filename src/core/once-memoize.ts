/**
 * Tiny function utilities:
 *  - once: invoke `fn` at most once, cache and return its result thereafter.
 *  - memoize: cache results by string key derived from arguments. Default
 *    key uses JSON.stringify; supply a custom keyFn for non-serializable
 *    arguments. Provides .clear() and .delete(key).
 */

export type AnyFn = (...args: never[]) => unknown;

export interface MemoizedFn<F extends AnyFn> {
  (...args: Parameters<F>): ReturnType<F>;
  clear(): void;
  delete(key: string): boolean;
}

export function once<F extends AnyFn>(fn: F): (...args: Parameters<F>) => ReturnType<F> {
  let called = false;
  let result: ReturnType<F>;
  return (...args: Parameters<F>): ReturnType<F> => {
    if (!called) {
      called = true;
      result = fn(...args) as ReturnType<F>;
    }
    return result;
  };
}

export function memoize<F extends AnyFn>(
  fn: F,
  keyFn?: (...args: Parameters<F>) => string,
): MemoizedFn<F> {
  const cache = new Map<string, ReturnType<F>>();
  const wrapped = ((...args: Parameters<F>): ReturnType<F> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key) as ReturnType<F>;
    const result = fn(...args) as ReturnType<F>;
    cache.set(key, result);
    return result;
  }) as MemoizedFn<F>;
  wrapped.clear = (): void => cache.clear();
  wrapped.delete = (key: string): boolean => cache.delete(key);
  return wrapped;
}
