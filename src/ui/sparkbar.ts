/**
 * Sparkbar — pure SVG-string mini bar chart for tables, screeners,
 * tooltips, etc. No DOM dependency. Returns a self-contained `<svg>`
 * markup string with width/height set to numeric pixel values. Bars are
 * normalised to the data range; positive and negative values use
 * separate colors and are anchored on a zero baseline when the data
 * crosses it (otherwise on min).
 */

export interface SparkbarOptions {
  readonly width?: number;
  readonly height?: number;
  readonly gap?: number;
  readonly color?: string;
  readonly negativeColor?: string;
  readonly background?: string | null;
  readonly precision?: number;
}

const escapeAttr = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const fmt = (n: number, p: number): string => {
  if (!Number.isFinite(n)) return "0";
  const s = n.toFixed(p);
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
};

export function buildSparkbar(values: readonly number[], opts: SparkbarOptions = {}): string {
  const width = opts.width ?? 120;
  const height = opts.height ?? 24;
  const gap = opts.gap ?? 1;
  const p = opts.precision ?? 2;
  const positiveColor = opts.color ?? "currentColor";
  const negativeColor = opts.negativeColor ?? positiveColor;
  const background = opts.background ?? null;

  const bg = background
    ? `<rect width="${width}" height="${height}" fill="${escapeAttr(background)}"/>`
    : "";
  if (values.length === 0)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${bg}</svg>`;

  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  // If all equal, render a flat baseline.
  if (min === max) {
    const y = height / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${bg}<line x1="0" y1="${fmt(y, p)}" x2="${width}" y2="${fmt(y, p)}" stroke="${escapeAttr(positiveColor)}" stroke-width="1"/></svg>`;
  }
  const crossesZero = min < 0 && max > 0;
  const baseline = crossesZero ? 0 : min;
  const span = Math.max(Math.abs(max - baseline), Math.abs(min - baseline));

  const totalGap = gap * (values.length - 1);
  const barW = Math.max(0, (width - totalGap) / values.length);
  const baseY = crossesZero
    ? height * (max / (max - min)) // proportional zero line
    : height; // baseline at bottom

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
  ];
  if (bg) parts.push(bg);
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    const x = i * (barW + gap);
    const fill = v < 0 ? negativeColor : positiveColor;
    let y: number;
    let h: number;
    if (crossesZero) {
      const norm = Math.abs(v) / span;
      h = norm * (v < 0 ? height - baseY : baseY);
      y = v < 0 ? baseY : baseY - h;
    } else {
      const norm = (v - baseline) / span;
      h = norm * height;
      y = height - h;
    }
    if (h < 0.5) h = 0.5; // minimum visible height
    parts.push(
      `<rect x="${fmt(x, p)}" y="${fmt(y, p)}" width="${fmt(barW, p)}" height="${fmt(h, p)}" fill="${escapeAttr(fill)}"/>`,
    );
  }
  parts.push("</svg>");
  return parts.join("");
}
