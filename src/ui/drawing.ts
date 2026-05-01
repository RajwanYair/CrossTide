/**
 * Pure state container for chart drawing tools (trendlines, horizontal
 * rays, fibonacci retracements). The actual rendering and pointer
 * events live in the chart card; this module is just the data model
 * plus hit-testing math so it can be unit-tested in node.
 */

export type DrawingKind = "trendline" | "hline" | "fib";

export interface Point {
  readonly x: number; // timestamp or index
  readonly y: number; // price
}

interface BaseShape {
  readonly id: string;
  readonly kind: DrawingKind;
  readonly color?: string;
}

export interface Trendline extends BaseShape {
  readonly kind: "trendline";
  readonly a: Point;
  readonly b: Point;
}

export interface HLine extends BaseShape {
  readonly kind: "hline";
  readonly y: number;
}

export interface FibRetracement extends BaseShape {
  readonly kind: "fib";
  readonly start: Point;
  readonly end: Point;
  readonly levels: readonly number[];
}

export type Shape = Trendline | HLine | FibRetracement;

export const DEFAULT_FIB_LEVELS: readonly number[] = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export interface DrawingState {
  readonly shapes: readonly Shape[];
}

export const emptyDrawingState = (): DrawingState => ({ shapes: [] });

export function addShape(state: DrawingState, shape: Shape): DrawingState {
  return { shapes: [...state.shapes, shape] };
}

export function removeShape(state: DrawingState, id: string): DrawingState {
  return { shapes: state.shapes.filter((s) => s.id !== id) };
}

export interface ShapePatch {
  readonly color?: string;
}

export function updateShape(state: DrawingState, id: string, patch: ShapePatch): DrawingState {
  return {
    shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  };
}

/** Squared distance from point (px,py) to segment a-b. */
function distSqToSegment(px: number, py: number, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    const ex = px - a.x;
    const ey = py - a.y;
    return ex * ex + ey * ey;
  }
  let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  const ex = px - cx;
  const ey = py - cy;
  return ex * ex + ey * ey;
}

export interface HitTestOptions {
  /** Tolerance in chart units (mix of x/y); default 5. */
  readonly tolerance?: number;
}

/**
 * Find the topmost shape (last drawn) within tolerance of (x,y).
 * Returns the shape id or null.
 */
export function hitTest(
  state: DrawingState,
  x: number,
  y: number,
  options: HitTestOptions = {},
): string | null {
  const tol = options.tolerance ?? 5;
  const tol2 = tol * tol;
  for (let i = state.shapes.length - 1; i >= 0; i--) {
    const s = state.shapes[i]!;
    if (s.kind === "hline") {
      if (Math.abs(y - s.y) <= tol) return s.id;
      continue;
    }
    if (s.kind === "trendline") {
      if (distSqToSegment(x, y, s.a, s.b) <= tol2) return s.id;
      continue;
    }
    if (s.kind === "fib") {
      // Hit if near any retracement level line between start.x and end.x.
      const lo = Math.min(s.start.x, s.end.x);
      const hi = Math.max(s.start.x, s.end.x);
      if (x < lo || x > hi) continue;
      const range = s.end.y - s.start.y;
      for (const lvl of s.levels) {
        const ly = s.start.y + range * lvl;
        if (Math.abs(y - ly) <= tol) return s.id;
      }
    }
  }
  return null;
}

export function fibLevelPrice(shape: FibRetracement, level: number): number {
  return shape.start.y + (shape.end.y - shape.start.y) * level;
}
