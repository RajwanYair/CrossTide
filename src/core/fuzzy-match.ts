/**
 * Lightweight fuzzy matcher for command palette / ticker search.
 * Scores by subsequence match with bonuses for: prefix, word-start,
 * consecutive matches, and shorter targets.
 */

export interface FuzzyMatch<T> {
  readonly item: T;
  readonly score: number;
  readonly indices: readonly number[];
}

export interface FuzzyOptions<T> {
  readonly key?: (item: T) => string;
  readonly limit?: number;
  readonly threshold?: number;
}

/** Returns score >0 on match, 0 on miss; also returns matched indices. */
export function fuzzyScore(query: string, target: string): { score: number; indices: number[] } {
  if (!query) return { score: 1, indices: [] };
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  const indices: number[] = [];
  let score = 0;
  let qi = 0;
  let prevMatch = -2;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      indices.push(i);
      let bonus = 1;
      if (i === 0)
        bonus += 5; // prefix match
      else if (t[i - 1] === " " || t[i - 1] === "-" || t[i - 1] === "_") {
        bonus += 3; // word boundary
      }
      if (i === prevMatch + 1) bonus += 2; // consecutive
      score += bonus;
      prevMatch = i;
      qi++;
    }
  }
  if (qi < q.length) return { score: 0, indices: [] };
  // Length penalty: prefer shorter targets.
  score += Math.max(0, 10 - (t.length - q.length) / 2);
  return { score, indices };
}

export function fuzzySearch<T>(
  query: string,
  items: readonly T[],
  options: FuzzyOptions<T> = {},
): FuzzyMatch<T>[] {
  const key = options.key ?? ((x: T): string => String(x));
  const threshold = options.threshold ?? 0;
  const results: FuzzyMatch<T>[] = [];
  for (const item of items) {
    const { score, indices } = fuzzyScore(query, key(item));
    if (score > threshold) results.push({ item, score, indices });
  }
  results.sort((a, b) => b.score - a.score);
  if (options.limit !== undefined) results.length = Math.min(results.length, options.limit);
  return results;
}
