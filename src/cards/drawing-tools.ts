/**
 * Drawing tools — canvas overlay for trendline and Fibonacci retracement.
 *
 * Design:
 *  - Renders a transparent <canvas> positioned absolutely over the chart container
 *  - Two tool modes: "trendline" (2-click) and "fib" (2-click for high/low)
 *  - All drawing state persisted in memory (cleared on dispose)
 *  - Coordinates are stored in data-space (index, price) via pixel→data transform
 *    supplied by the caller. The canvas only stores pixel coords for simplicity
 *    (no attached price feed required for a standalone drawing layer).
 *  - Public API: mount, setTool, clearDrawings, dispose
 */

export type DrawingToolMode =
  | "none"
  | "trendline"
  | "fib"
  | "rectangle"
  | "channel"
  | "ray"
  | "hline"
  | "text";

export interface Point {
  x: number;
  y: number;
}

export interface TrendlineDrawing {
  kind: "trendline";
  p1: Point;
  p2: Point;
  color: string;
}

export interface FibDrawing {
  kind: "fib";
  high: Point;
  low: Point;
  color: string;
}

export interface RectangleDrawing {
  kind: "rectangle";
  p1: Point;
  p2: Point;
  color: string;
}

export interface ChannelDrawing {
  kind: "channel";
  p1: Point;
  p2: Point;
  color: string;
  width: number; // channel half-width in pixels
}

export interface RayDrawing {
  kind: "ray";
  origin: Point;
  direction: Point;
  color: string;
}

export interface HLineDrawing {
  kind: "hline";
  y: number;
  color: string;
}

export interface TextDrawing {
  kind: "text";
  position: Point;
  content: string;
  color: string;
}

export type Drawing =
  | TrendlineDrawing
  | FibDrawing
  | RectangleDrawing
  | ChannelDrawing
  | RayDrawing
  | HLineDrawing
  | TextDrawing;

// Fibonacci retracement levels (standard)
export const FIB_LEVELS: readonly { level: number; label: string }[] = [
  { level: 0, label: "0%" },
  { level: 0.236, label: "23.6%" },
  { level: 0.382, label: "38.2%" },
  { level: 0.5, label: "50%" },
  { level: 0.618, label: "61.8%" },
  { level: 0.786, label: "78.6%" },
  { level: 1, label: "100%" },
];

const TRENDLINE_COLOR = "#f59e0b";
const FIB_COLOR = "#6366f1";
const RECT_COLOR = "#10b981";
const CHANNEL_COLOR = "#ec4899";
const RAY_COLOR = "#f97316";
const HLINE_COLOR = "#8b5cf6";
const TEXT_COLOR = "#e2e8f0";
const CHANNEL_WIDTH = 30;
const FIB_LINE_ALPHA = 0.7;
const FONT_SIZE = 11;
const FONT = `${FONT_SIZE}px Inter, sans-serif`;

// ──────────────────────────────────────────────────────────────
// Drawing functions (pure — no side effects, exposed for tests)
// ──────────────────────────────────────────────────────────────

/** Draw a trendline on a 2D canvas context. */
export function drawTrendline(ctx: CanvasRenderingContext2D, d: TrendlineDrawing): void {
  ctx.save();
  ctx.strokeStyle = d.color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(d.p1.x, d.p1.y);
  ctx.lineTo(d.p2.x, d.p2.y);
  ctx.stroke();
  ctx.restore();
}

/** Draw Fibonacci retracement levels on a 2D canvas context. */
export function drawFib(ctx: CanvasRenderingContext2D, d: FibDrawing, width: number): void {
  const { high, low, color } = d;
  const range = low.y - high.y; // positive when high is above low in pixel space

  ctx.save();
  ctx.font = FONT;
  ctx.textBaseline = "bottom";

  for (const { level, label } of FIB_LEVELS) {
    const y = high.y + range * level;
    ctx.globalAlpha = FIB_LINE_ALPHA;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillText(`${label}  ${formatPrice(y, high.y, low.y)}`, 4, y - 2);
  }

  ctx.restore();
}

/** Placeholder price label — in a real chart this would invert the pixel→price transform. */
function formatPrice(y: number, highY: number, lowY: number): string {
  // Without a real price axis, just show the normalised position (0–1)
  const range = lowY - highY;
  if (range === 0) return "";
  const pct = ((y - highY) / range).toFixed(3);
  return `(${pct})`;
}

/** Draw a rectangle between two corners. */
export function drawRectangle(ctx: CanvasRenderingContext2D, d: RectangleDrawing): void {
  ctx.save();
  ctx.strokeStyle = d.color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = d.color;
  const x = Math.min(d.p1.x, d.p2.x);
  const y = Math.min(d.p1.y, d.p2.y);
  const w = Math.abs(d.p2.x - d.p1.x);
  const h = Math.abs(d.p2.y - d.p1.y);
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/** Draw a parallel channel (trendline + offset parallel line). */
export function drawChannel(ctx: CanvasRenderingContext2D, d: ChannelDrawing): void {
  const { p1, p2, color, width: halfW } = d;
  // Normal vector perpendicular to p1→p2
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = (-dy / len) * halfW;
  const ny = (dx / len) * halfW;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // Center line
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Upper parallel
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(p1.x + nx, p1.y + ny);
  ctx.lineTo(p2.x + nx, p2.y + ny);
  ctx.stroke();

  // Lower parallel
  ctx.beginPath();
  ctx.moveTo(p1.x - nx, p1.y - ny);
  ctx.lineTo(p2.x - nx, p2.y - ny);
  ctx.stroke();

  ctx.restore();
}

/** Draw a ray from origin extending infinitely in the direction of the second point. */
export function drawRay(
  ctx: CanvasRenderingContext2D,
  d: RayDrawing,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const { origin, direction, color } = d;
  const dx = direction.x - origin.x;
  const dy = direction.y - origin.y;

  if (dx === 0 && dy === 0) return;

  // Extend ray to canvas boundary
  const scale = Math.max(canvasWidth, canvasHeight) * 2;
  const len = Math.sqrt(dx * dx + dy * dy);
  const endX = origin.x + (dx / len) * scale;
  const endY = origin.y + (dy / len) * scale;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Small circle at origin
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Draw a horizontal price line across full width. */
export function drawHLine(
  ctx: CanvasRenderingContext2D,
  d: HLineDrawing,
  canvasWidth: number,
): void {
  ctx.save();
  ctx.strokeStyle = d.color;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  ctx.moveTo(0, d.y);
  ctx.lineTo(canvasWidth, d.y);
  ctx.stroke();
  ctx.restore();
}

/** Draw a text annotation at a point. */
export function drawText(ctx: CanvasRenderingContext2D, d: TextDrawing): void {
  ctx.save();
  ctx.font = `12px Inter, sans-serif`;
  ctx.fillStyle = d.color;
  ctx.textBaseline = "bottom";
  ctx.fillText(d.content, d.position.x, d.position.y);
  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// Canvas overlay manager
// ──────────────────────────────────────────────────────────────

export interface DrawingToolHandle {
  setTool(mode: DrawingToolMode): void;
  clearDrawings(): void;
  getDrawings(): readonly Drawing[];
  dispose(): void;
}

interface MountState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  drawings: Drawing[];
  mode: DrawingToolMode;
  pendingPoint: Point | null;
  onMouseDown: (e: MouseEvent) => void;
  onResize: () => void;
}

/** Mount a drawing-tool canvas overlay inside `container`. */
export function mountDrawingTools(container: HTMLElement): DrawingToolHandle {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;z-index:10;";
  container.style.position ||= "relative";
  container.appendChild(canvas);

  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) {
    // Canvas 2D context unavailable (e.g. test environment) — return a no-op handle
    canvas.remove();
    return {
      setTool: () => undefined,
      clearDrawings: () => undefined,
      getDrawings: () => [],
      dispose: () => undefined,
    };
  }
  // Narrowed to non-null; captured in closure as a stable CanvasRenderingContext2D
  const ctx: CanvasRenderingContext2D = ctxOrNull;

  const state: MountState = {
    canvas,
    ctx,
    drawings: [],
    mode: "none",
    pendingPoint: null,
    onMouseDown: () => undefined,
    onResize: () => undefined,
  };

  function resize(): void {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width || container.offsetWidth;
    canvas.height = rect.height || container.offsetHeight;
    render();
  }

  function render(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of state.drawings) {
      switch (d.kind) {
        case "trendline":
          drawTrendline(ctx, d);
          break;
        case "fib":
          drawFib(ctx, d, canvas.width);
          break;
        case "rectangle":
          drawRectangle(ctx, d);
          break;
        case "channel":
          drawChannel(ctx, d);
          break;
        case "ray":
          drawRay(ctx, d, canvas.width, canvas.height);
          break;
        case "hline":
          drawHLine(ctx, d, canvas.width);
          break;
        case "text":
          drawText(ctx, d);
          break;
      }
    }
  }

  function handleMouseDown(e: MouseEvent): void {
    if (state.mode === "none") return;

    const rect = canvas.getBoundingClientRect();
    const pt: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Single-click tools (no second point needed)
    if (state.mode === "hline") {
      state.drawings.push({ kind: "hline", y: pt.y, color: HLINE_COLOR });
      render();
      return;
    }
    if (state.mode === "text") {
      const content = prompt("Enter annotation text:");
      if (content) {
        state.drawings.push({ kind: "text", position: pt, content, color: TEXT_COLOR });
        render();
      }
      return;
    }

    // Two-click tools
    if (!state.pendingPoint) {
      // First click — store the anchor point
      state.pendingPoint = pt;
      canvas.style.cursor = "crosshair";
    } else {
      // Second click — complete the drawing
      const p1 = state.pendingPoint;
      state.pendingPoint = null;
      canvas.style.cursor = "default";

      switch (state.mode) {
        case "trendline":
          state.drawings.push({ kind: "trendline", p1, p2: pt, color: TRENDLINE_COLOR });
          break;
        case "fib": {
          const [high, low] = p1.y <= pt.y ? [p1, pt] : [pt, p1];
          state.drawings.push({ kind: "fib", high, low, color: FIB_COLOR });
          break;
        }
        case "rectangle":
          state.drawings.push({ kind: "rectangle", p1, p2: pt, color: RECT_COLOR });
          break;
        case "channel":
          state.drawings.push({
            kind: "channel",
            p1,
            p2: pt,
            color: CHANNEL_COLOR,
            width: CHANNEL_WIDTH,
          });
          break;
        case "ray":
          state.drawings.push({ kind: "ray", origin: p1, direction: pt, color: RAY_COLOR });
          break;
      }

      render();
    }
  }

  state.onMouseDown = handleMouseDown;
  state.onResize = resize;

  // Enable pointer events only when a tool is active
  canvas.addEventListener("mousedown", state.onMouseDown);

  const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(container);
  resize();

  return {
    setTool(mode: DrawingToolMode): void {
      state.mode = mode;
      state.pendingPoint = null;
      canvas.style.pointerEvents = mode === "none" ? "none" : "auto";
      canvas.style.cursor = mode !== "none" ? "crosshair" : "default";
    },
    clearDrawings(): void {
      state.drawings = [];
      state.pendingPoint = null;
      render();
    },
    getDrawings(): readonly Drawing[] {
      return state.drawings;
    },
    dispose(): void {
      canvas.removeEventListener("mousedown", state.onMouseDown);
      resizeObserver?.disconnect();
      canvas.remove();
    },
  };
}
