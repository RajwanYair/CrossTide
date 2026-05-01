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

export type DrawingToolMode = "none" | "trendline" | "fib";

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

export type Drawing = TrendlineDrawing | FibDrawing;

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
const FIB_LINE_ALPHA = 0.7;
const FONT_SIZE = 11;
const FONT = `${FONT_SIZE}px Inter, sans-serif`;

// ──────────────────────────────────────────────────────────────
// Drawing functions (pure — no side effects, exposed for tests)
// ──────────────────────────────────────────────────────────────

/** Draw a trendline on a 2D canvas context. */
export function drawTrendline(
  ctx: CanvasRenderingContext2D,
  d: TrendlineDrawing,
): void {
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
      if (d.kind === "trendline") drawTrendline(ctx, d);
      else drawFib(ctx, d, canvas.width);
    }
  }

  function handleMouseDown(e: MouseEvent): void {
    if (state.mode === "none") return;

    const rect = canvas.getBoundingClientRect();
    const pt: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (!state.pendingPoint) {
      // First click — store the anchor point
      state.pendingPoint = pt;
      canvas.style.cursor = "crosshair";
    } else {
      // Second click — complete the drawing
      const p1 = state.pendingPoint;
      state.pendingPoint = null;
      canvas.style.cursor = "default";

      if (state.mode === "trendline") {
        state.drawings.push({ kind: "trendline", p1, p2: pt, color: TRENDLINE_COLOR });
      } else if (state.mode === "fib") {
        // Treat first click as high (lower y = higher on screen) and second as low
        const [high, low] = p1.y <= pt.y ? [p1, pt] : [pt, p1];
        state.drawings.push({ kind: "fib", high, low, color: FIB_COLOR });
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
