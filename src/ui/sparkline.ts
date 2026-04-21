/**
 * SVG sparkline — inline mini chart for watchlist rows.
 *
 * Pure function: takes closes, returns an SVG string.
 */

export interface SparklineOptions {
  readonly width?: number;
  readonly height?: number;
  readonly strokeColor?: string;
  readonly strokeWidth?: number;
  readonly fillColor?: string;
}

const DEFAULTS = {
  width: 80,
  height: 24,
  strokeColor: "currentColor",
  strokeWidth: 1.5,
  fillColor: "none",
};

/**
 * Render a sparkline SVG string from an array of close prices.
 * Returns empty string for fewer than 2 data points.
 */
export function renderSparkline(closes: readonly number[], opts: SparklineOptions = {}): string {
  if (closes.length < 2) return "";

  const w = opts.width ?? DEFAULTS.width;
  const h = opts.height ?? DEFAULTS.height;
  const stroke = opts.strokeColor ?? DEFAULTS.strokeColor;
  const sw = opts.strokeWidth ?? DEFAULTS.strokeWidth;
  const fill = opts.fillColor ?? DEFAULTS.fillColor;

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1; // avoid division by zero for flat data
  const pad = sw; // padding for stroke width

  const points = closes
    .map((v, i) => {
      const x = (i / (closes.length - 1)) * (w - 2 * pad) + pad;
      const y = h - pad - ((v - min) / range) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Price sparkline"><polyline points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
