/**
 * Unit tests for additional drawing tools (L5): rectangle, channel, ray, hline, text.
 */
import { describe, it, expect, vi } from "vitest";
import {
  drawRectangle,
  drawChannel,
  drawRay,
  drawHLine,
  drawText,
} from "../../../src/cards/drawing-tools";
import type {
  RectangleDrawing,
  ChannelDrawing,
  RayDrawing,
  HLineDrawing,
  TextDrawing,
} from "../../../src/cards/drawing-tools";

function makeCtx(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    arc: vi.fn(),
    clearRect: vi.fn(),
    setLineDash: vi.fn(),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    font: "",
    textBaseline: "alphabetic",
  } as unknown as CanvasRenderingContext2D;
}

describe("drawRectangle", () => {
  it("draws a filled and stroked rectangle", () => {
    const ctx = makeCtx();
    const d: RectangleDrawing = {
      kind: "rectangle",
      p1: { x: 10, y: 20 },
      p2: { x: 100, y: 80 },
      color: "#10b981",
    };

    drawRectangle(ctx, d);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 90, 60);
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 90, 60);
    expect(ctx.restore).toHaveBeenCalled();
  });

  it("handles reversed corners (p2 < p1)", () => {
    const ctx = makeCtx();
    const d: RectangleDrawing = {
      kind: "rectangle",
      p1: { x: 100, y: 80 },
      p2: { x: 10, y: 20 },
      color: "#fff",
    };

    drawRectangle(ctx, d);

    expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 90, 60);
  });
});

describe("drawChannel", () => {
  it("draws center line and two parallel lines", () => {
    const ctx = makeCtx();
    const d: ChannelDrawing = {
      kind: "channel",
      p1: { x: 0, y: 50 },
      p2: { x: 200, y: 50 },
      color: "#ec4899",
      width: 20,
    };

    drawChannel(ctx, d);

    expect(ctx.save).toHaveBeenCalled();
    // Center line: moveTo(0,50) lineTo(200,50)
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 50);
    expect(ctx.lineTo).toHaveBeenCalledWith(200, 50);
    // 3 lines total (center + 2 parallels) → 3 strokes
    expect(ctx.stroke).toHaveBeenCalledTimes(3);
    expect(ctx.restore).toHaveBeenCalled();
  });
});

describe("drawRay", () => {
  it("draws from origin extending in direction", () => {
    const ctx = makeCtx();
    const d: RayDrawing = {
      kind: "ray",
      origin: { x: 50, y: 50 },
      direction: { x: 100, y: 50 },
      color: "#f97316",
    };

    drawRay(ctx, d, 400, 300);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(50, 50);
    // Ray extends far beyond canvas
    expect(ctx.lineTo).toHaveBeenCalled();
    // Small circle at origin
    expect(ctx.arc).toHaveBeenCalledWith(50, 50, 3, 0, Math.PI * 2);
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it("does nothing for zero-length direction", () => {
    const ctx = makeCtx();
    const d: RayDrawing = {
      kind: "ray",
      origin: { x: 50, y: 50 },
      direction: { x: 50, y: 50 },
      color: "#f97316",
    };

    drawRay(ctx, d, 400, 300);

    expect(ctx.moveTo).not.toHaveBeenCalled();
  });
});

describe("drawHLine", () => {
  it("draws a dashed horizontal line across full width", () => {
    const ctx = makeCtx();
    const d: HLineDrawing = { kind: "hline", y: 120, color: "#8b5cf6" };

    drawHLine(ctx, d, 600);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.setLineDash).toHaveBeenCalledWith([6, 3]);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 120);
    expect(ctx.lineTo).toHaveBeenCalledWith(600, 120);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});

describe("drawText", () => {
  it("draws text at the specified position", () => {
    const ctx = makeCtx();
    const d: TextDrawing = {
      kind: "text",
      position: { x: 30, y: 60 },
      content: "Hello",
      color: "#e2e8f0",
    };

    drawText(ctx, d);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith("Hello", 30, 60);
    expect(ctx.restore).toHaveBeenCalled();
  });
});
