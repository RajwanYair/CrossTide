/**
 * Visual accessibility helpers — relative luminance, contrast ratio,
 * and WCAG pass/fail checks for AA / AAA, plus a motion-preference
 * helper that stays readable in tests.
 */

export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export function parseHexColor(hex: string): RGB | null {
  const m = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1] ?? "";
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length !== 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb: RGB): number {
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type WcagLevel = "AA" | "AAA";
export type WcagSize = "normal" | "large";

export function meetsWcag(
  ratio: number,
  level: WcagLevel = "AA",
  size: WcagSize = "normal",
): boolean {
  if (level === "AAA") return ratio >= (size === "large" ? 4.5 : 7);
  return ratio >= (size === "large" ? 3 : 4.5);
}

/**
 * Returns true if the user has indicated they prefer reduced motion.
 * Safe in non-DOM environments (returns false).
 */
export function prefersReducedMotion(): boolean {
  const m = (globalThis as { matchMedia?: (q: string) => MediaQueryList }).matchMedia;
  if (typeof m !== "function") return false;
  try {
    return m("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Returns true if the user has indicated a preference for higher
 * contrast (Windows high-contrast, macOS Increase Contrast).
 */
export function prefersMoreContrast(): boolean {
  const m = (globalThis as { matchMedia?: (q: string) => MediaQueryList }).matchMedia;
  if (typeof m !== "function") return false;
  try {
    return m("(prefers-contrast: more)").matches;
  } catch {
    return false;
  }
}
