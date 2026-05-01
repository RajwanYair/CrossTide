/**
 * Color blending helpers operating on hex strings (#rgb, #rrggbb,
 * optional #rrggbbaa). Pure / DOM-free.
 *  - parseHex / toHex: round-trip a color
 *  - blend(a, b, t): linear interpolation in sRGB (t=0 returns a, t=1 returns b)
 *  - lighten / darken: shift toward white / black
 */

export interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

export function parseHex(hex: string): Rgba {
  let h = hex.trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (!/^[0-9a-f]+$/i.test(h)) throw new Error(`Invalid hex color: ${hex}`);
  if (h.length === 3) {
    return {
      r: parseInt(h[0]! + h[0]!, 16),
      g: parseInt(h[1]! + h[1]!, 16),
      b: parseInt(h[2]! + h[2]!, 16),
      a: 1,
    };
  }
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  if (h.length === 8) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255,
    };
  }
  throw new Error(`Invalid hex color: ${hex}`);
}

const byteHex = (n: number): string => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");

export function toHex(c: Rgba, includeAlpha = false): string {
  const base = `#${byteHex(c.r)}${byteHex(c.g)}${byteHex(c.b)}`;
  if (!includeAlpha) return base;
  return base + byteHex(clamp(c.a, 0, 1) * 255);
}

export function blend(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const u = clamp(t, 0, 1);
  return toHex({
    r: ca.r + (cb.r - ca.r) * u,
    g: ca.g + (cb.g - ca.g) * u,
    b: ca.b + (cb.b - ca.b) * u,
    a: ca.a + (cb.a - ca.a) * u,
  });
}

export function lighten(color: string, amount: number): string {
  return blend(color, "#ffffff", amount);
}

export function darken(color: string, amount: number): string {
  return blend(color, "#000000", amount);
}
