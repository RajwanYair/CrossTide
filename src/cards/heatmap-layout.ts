/**
 * Heatmap (treemap) layout — squarified treemap of weighted tickers, intended
 * to be rendered to a Canvas2D context. Pure layout function (no DOM) so it
 * can be unit-tested off the main thread.
 *
 * Algorithm: greedy "row" packing — group items into stripes whose worst
 * aspect ratio is minimized, alternating between horizontal and vertical
 * orientation depending on whether width or height is shorter.
 */

export interface HeatmapItem {
  readonly ticker: string;
  readonly weight: number; // market cap, volume, etc.
  readonly changePct: number; // for color
}

export interface HeatmapRect {
  readonly ticker: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly changePct: number;
}

export interface HeatmapBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

function aspect(side: number, area: number): number {
  if (side <= 0 || area <= 0) return Infinity;
  const other = area / side;
  return Math.max(side / other, other / side);
}

function worst(row: HeatmapItem[], side: number, scale: number): number {
  if (row.length === 0) return Infinity;
  let s = 0;
  let mx = -Infinity;
  let mn = Infinity;
  for (const r of row) {
    const w = r.weight * scale;
    s += w;
    if (w > mx) mx = w;
    if (w < mn) mn = w;
  }
  if (s <= 0) return Infinity;
  const a1 = aspect(side, mx * (s / s));
  const a2 = aspect(side, mn * (s / s));
  // worst aspect ratio in this row
  const sideArea = (side * side) / s;
  return Math.max((mx * sideArea) / (s * s), (s * s) / (mn * sideArea), a1, a2);
}

function placeRow(row: HeatmapItem[], frame: Frame, scale: number, out: HeatmapRect[]): void {
  if (row.length === 0) return;
  let total = 0;
  for (const r of row) total += r.weight * scale;
  if (total <= 0) return;
  const horizontal = frame.w >= frame.h;
  if (horizontal) {
    const rowH = total / frame.w;
    let cursor = frame.x;
    for (const r of row) {
      const w = (r.weight * scale) / rowH;
      out.push({
        ticker: r.ticker,
        x: cursor,
        y: frame.y,
        w,
        h: rowH,
        changePct: r.changePct,
      });
      cursor += w;
    }
    frame.y += rowH;
    frame.h -= rowH;
  } else {
    const rowW = total / frame.h;
    let cursor = frame.y;
    for (const r of row) {
      const h = (r.weight * scale) / rowW;
      out.push({
        ticker: r.ticker,
        x: frame.x,
        y: cursor,
        w: rowW,
        h,
        changePct: r.changePct,
      });
      cursor += h;
    }
    frame.x += rowW;
    frame.w -= rowW;
  }
}

/**
 * Compute squarified-treemap rectangles for `items` within `bounds`.
 *
 * Items with non-positive weight are filtered out. Returns rectangles in
 * the same order as the input is processed (largest weight first).
 */
export function computeHeatmap(
  items: readonly HeatmapItem[],
  bounds: HeatmapBounds,
): readonly HeatmapRect[] {
  const positive = items.filter((i) => i.weight > 0);
  if (positive.length === 0) return [];
  const sorted = [...positive].sort((a, b) => b.weight - a.weight);
  const total = sorted.reduce((s, i) => s + i.weight, 0);
  if (total <= 0 || bounds.width <= 0 || bounds.height <= 0) return [];
  const area = bounds.width * bounds.height;
  const scale = area / total;

  const frame: Frame = {
    x: bounds.x,
    y: bounds.y,
    w: bounds.width,
    h: bounds.height,
  };
  const out: HeatmapRect[] = [];
  let row: HeatmapItem[] = [];
  let i = 0;
  while (i < sorted.length) {
    const item = sorted[i]!;
    const candidate = [...row, item];
    const side = Math.min(frame.w, frame.h);
    const wWith = worst(candidate, side, scale);
    const wWithout = worst(row, side, scale);
    if (row.length > 0 && wWith > wWithout) {
      placeRow(row, frame, scale, out);
      row = [];
    } else {
      row.push(item);
      i++;
    }
  }
  placeRow(row, frame, scale, out);
  return out;
}

/**
 * Color helper — green for gains, red for losses, intensity scaled by
 * absolute change percentage (clamped to ±5%).
 */
export function heatmapColor(changePct: number): string {
  const clamped = Math.max(-5, Math.min(5, changePct));
  const intensity = Math.round(40 + (Math.abs(clamped) / 5) * 60);
  if (clamped >= 0) return `hsl(140 60% ${100 - intensity}%)`;
  return `hsl(0 60% ${100 - intensity}%)`;
}
