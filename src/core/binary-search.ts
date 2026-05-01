/**
 * Generic O(log n) binary-search helpers over a sorted array. The default
 * comparator handles numbers and strings via `<` / `>`.
 *   - lowerBound: first index `i` where arr[i] >= target
 *   - upperBound: first index `i` where arr[i] > target
 *   - binarySearch: any matching index, or -1
 */

export type Comparator<T> = (a: T, b: T) => number;

const defaultCmp = <T>(a: T, b: T): number => (a < b ? -1 : a > b ? 1 : 0);

export function lowerBound<T>(
  arr: readonly T[],
  target: T,
  cmp: Comparator<T> = defaultCmp,
): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (cmp(arr[mid]!, target) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function upperBound<T>(
  arr: readonly T[],
  target: T,
  cmp: Comparator<T> = defaultCmp,
): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (cmp(arr[mid]!, target) <= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function binarySearch<T>(
  arr: readonly T[],
  target: T,
  cmp: Comparator<T> = defaultCmp,
): number {
  const i = lowerBound(arr, target, cmp);
  if (i < arr.length && cmp(arr[i]!, target) === 0) return i;
  return -1;
}
