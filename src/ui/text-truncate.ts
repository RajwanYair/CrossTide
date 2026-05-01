/**
 * Pure (DOM-free) text truncation helpers. Grapheme-aware via
 * `Intl.Segmenter` when available; falls back to code-unit slicing.
 *  - truncateEnd: keep prefix, append ellipsis.
 *  - truncateMiddle: keep both ends, ellipsis in the middle.
 * Counts graphemes, not UTF-16 code units, so an emoji counts as 1.
 */

export const DEFAULT_ELLIPSIS = "\u2026";

const segmenterSupported: boolean =
  typeof Intl !== "undefined" && typeof (Intl as { Segmenter?: unknown }).Segmenter === "function";

function toGraphemes(s: string): string[] {
  if (!segmenterSupported) return Array.from(s);
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const out: string[] = [];
  for (const part of seg.segment(s)) out.push(part.segment);
  return out;
}

export function graphemeLength(s: string): number {
  return toGraphemes(s).length;
}

export function truncateEnd(
  input: string,
  max: number,
  ellipsis: string = DEFAULT_ELLIPSIS,
): string {
  if (max <= 0) return "";
  const parts = toGraphemes(input);
  if (parts.length <= max) return input;
  const ellLen = graphemeLength(ellipsis);
  if (max <= ellLen) return ellipsis.slice(0, max);
  return parts.slice(0, max - ellLen).join("") + ellipsis;
}

export function truncateMiddle(
  input: string,
  max: number,
  ellipsis: string = DEFAULT_ELLIPSIS,
): string {
  if (max <= 0) return "";
  const parts = toGraphemes(input);
  if (parts.length <= max) return input;
  const ellLen = graphemeLength(ellipsis);
  if (max <= ellLen) return ellipsis.slice(0, max);
  const remaining = max - ellLen;
  const headLen = Math.ceil(remaining / 2);
  const tailLen = Math.floor(remaining / 2);
  return parts.slice(0, headLen).join("") + ellipsis + parts.slice(parts.length - tailLen).join("");
}
