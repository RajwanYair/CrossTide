/**
 * Squarified treemap layout (Bruls, Huijing, van Wijk 2000).
 * Pure layout: takes weighted items + bounds, returns rects. No DOM.
 */

export interface TreemapItem {
  readonly id: string;
  readonly value: number;
}

export interface TreemapRect {
  readonly id: string;
  readonly value: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const aspectRatio = (row: TreemapItem[], shortSide: number, scale: number): number => {
  let sum = 0;
  let min = Infinity;
  let max = 0;
  for (const item of row) {
    const v = item.value * scale;
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const sumSq = sum * sum;
  const sideSq = shortSide * shortSide;
  return Math.max((sideSq * max) / sumSq, sumSq / (sideSq * min));
};

const layoutRow = (
  row: TreemapItem[],
  bounds: Bounds,
  scale: number,
  horizontal: boolean,
): { rects: TreemapRect[]; remaining: Bounds } => {
  const rects: TreemapRect[] = [];
  const rowSum = row.reduce((s, it) => s + it.value, 0) * scale;
  if (horizontal) {
    const rowHeight = rowSum / bounds.width;
    let xCursor = bounds.x;
    for (const item of row) {
      const w = (item.value * scale) / rowHeight;
      rects.push({
        id: item.id,
        value: item.value,
        x: xCursor,
        y: bounds.y,
        width: w,
        height: rowHeight,
      });
      xCursor += w;
    }
    return {
      rects,
      remaining: {
        x: bounds.x,
        y: bounds.y + rowHeight,
        width: bounds.width,
        height: bounds.height - rowHeight,
      },
    };
  }
  const rowWidth = rowSum / bounds.height;
  let yCursor = bounds.y;
  for (const item of row) {
    const h = (item.value * scale) / rowWidth;
    rects.push({
      id: item.id,
      value: item.value,
      x: bounds.x,
      y: yCursor,
      width: rowWidth,
      height: h,
    });
    yCursor += h;
  }
  return {
    rects,
    remaining: {
      x: bounds.x + rowWidth,
      y: bounds.y,
      width: bounds.width - rowWidth,
      height: bounds.height,
    },
  };
};

export function squarifyTreemap(items: readonly TreemapItem[], bounds: Bounds): TreemapRect[] {
  const positive = items.filter((i) => i.value > 0);
  if (positive.length === 0) return [];
  const sorted = [...positive].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, it) => s + it.value, 0);
  const area = bounds.width * bounds.height;
  const scale = area / total;

  const rects: TreemapRect[] = [];
  let remaining: Bounds = bounds;
  let row: TreemapItem[] = [];
  let i = 0;

  while (i < sorted.length) {
    const horizontal = remaining.width >= remaining.height;
    const shortSide = horizontal ? remaining.width : remaining.height;
    const candidate = sorted[i]!;
    const next = [...row, candidate];
    const currentRatio = row.length > 0 ? aspectRatio(row, shortSide, scale) : Infinity;
    const nextRatio = aspectRatio(next, shortSide, scale);
    if (nextRatio <= currentRatio) {
      row = next;
      i++;
    } else {
      const out = layoutRow(row, remaining, scale, horizontal);
      rects.push(...out.rects);
      remaining = out.remaining;
      row = [];
    }
  }
  if (row.length > 0) {
    const horizontal = remaining.width >= remaining.height;
    const out = layoutRow(row, remaining, scale, horizontal);
    rects.push(...out.rects);
  }
  return rects;
}
