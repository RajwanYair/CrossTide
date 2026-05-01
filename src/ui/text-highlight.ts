/**
 * Pure (DOM-free) text-highlight helpers. Splits a string into a list of
 * `{ text, match }` segments based on a search query. Useful for command
 * palettes, autocomplete dropdowns, and search results that render
 * highlighted matches without `dangerouslySetInnerHTML`.
 *  - highlightSubstring: case-insensitive substring matches.
 *  - highlightWords: matches any of the supplied whitespace-separated
 *    query tokens, longest tokens first.
 */

export interface TextSegment {
  readonly text: string;
  readonly match: boolean;
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function highlightSubstring(input: string, query: string): TextSegment[] {
  if (input === "") return [];
  if (query === "") return [{ text: input, match: false }];
  const re = new RegExp(escapeRegExp(query), "gi");
  return splitByRegex(input, re);
}

export function highlightWords(input: string, query: string): TextSegment[] {
  if (input === "") return [];
  const tokens = query.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return [{ text: input, match: false }];
  tokens.sort((a, b) => b.length - a.length);
  const re = new RegExp(tokens.map(escapeRegExp).join("|"), "gi");
  return splitByRegex(input, re);
}

function splitByRegex(input: string, re: RegExp): TextSegment[] {
  const out: TextSegment[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(input)) !== null) {
    if (m.index > lastIdx) out.push({ text: input.slice(lastIdx, m.index), match: false });
    out.push({ text: m[0], match: true });
    lastIdx = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++; // safety against zero-width matches
  }
  if (lastIdx < input.length) out.push({ text: input.slice(lastIdx), match: false });
  return out;
}
