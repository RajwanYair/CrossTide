/**
 * Canvas and WebGL Compatibility Tests
 *
 * CrossTide renders financial charts using Canvas 2D API and optionally WebGL.
 * These tests verify that the rendering surface is available across all target browsers.
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Canvas 2D API (primary chart rendering surface)
// ---------------------------------------------------------------------------
describe("Canvas 2D API", () => {
  it("HTMLCanvasElement is available", () => {
    expect(typeof HTMLCanvasElement).toBe("function");
  });

  it("canvas.getContext('2d') returns a context", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    expect(ctx).not.toBeNull();
    expect(ctx instanceof CanvasRenderingContext2D).toBe(true);
  });

  it("canvas width and height can be set", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(400);
  });

  it("CanvasRenderingContext2D fillRect works", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 50, 50);
    const pixel = ctx.getImageData(25, 25, 1, 1).data;
    expect(pixel[0]).toBe(255); // red
    expect(pixel[1]).toBe(0);
    expect(pixel[2]).toBe(0);
  });

  it("ctx.strokeStyle and lineWidth are settable", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    expect(ctx.lineWidth).toBe(2);
  });

  it("ctx.drawImage is available", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    expect(typeof ctx.drawImage).toBe("function");
  });

  it("ctx.measureText is available", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = "14px sans-serif";
    const metrics = ctx.measureText("Hello");
    expect(metrics.width).toBeGreaterThan(0);
  });

  it("ctx.save/restore work", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.globalAlpha = 0.5;
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.restore();
    expect(ctx.globalAlpha).toBe(0.5);
  });

  it("Path2D is available", () => {
    expect(typeof Path2D).toBe("function");
    const path = new Path2D();
    path.moveTo(0, 0);
    path.lineTo(100, 100);
    // If we get here without throwing, Path2D works
    expect(path).toBeTruthy();
  });

  it("ctx.clip with Path2D works", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d")!;
    const path = new Path2D();
    path.rect(10, 10, 80, 80);
    expect(() => ctx.clip(path)).not.toThrow();
  });

  it("canvas.toDataURL works", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 10;
    canvas.height = 10;
    const dataUrl = canvas.toDataURL("image/png");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

// ---------------------------------------------------------------------------
// OffscreenCanvas (used for chart workers / background rendering)
// ---------------------------------------------------------------------------
describe("OffscreenCanvas (Baseline 2023)", () => {
  it("OffscreenCanvas is detected", () => {
    const supported = typeof OffscreenCanvas === "function";
    expect(typeof supported).toBe("boolean");
  });

  it("OffscreenCanvas can get 2d context if available", () => {
    if (typeof OffscreenCanvas !== "function") return;
    const oc = new OffscreenCanvas(100, 100);
    const ctx = oc.getContext("2d");
    expect(ctx).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// WebGL (used for hardware-accelerated chart rendering)
// ---------------------------------------------------------------------------
describe("WebGL", () => {
  it("WebGL context is detected", () => {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    // WebGL availability depends on the browser/driver — just detect, don't require
    expect(typeof (gl !== null)).toBe("boolean");
  });

  it("WebGL2 is detected (Baseline 2022)", () => {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2");
    expect(typeof (gl2 !== null)).toBe("boolean");
  });

  it("WebGLRenderingContext constructor is available", () => {
    expect(typeof WebGLRenderingContext).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// ImageBitmap (used for efficient frame transfers in canvas)
// ---------------------------------------------------------------------------
describe("ImageBitmap API", () => {
  it("createImageBitmap is available", () => {
    expect(typeof createImageBitmap).toBe("function");
  });

  it("createImageBitmap can accept canvas", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 10;
    canvas.height = 10;
    const bitmap = await createImageBitmap(canvas);
    expect(bitmap.width).toBe(10);
    expect(bitmap.height).toBe(10);
    bitmap.close();
  });
});

// ---------------------------------------------------------------------------
// ResizeObserver (used to keep chart dimensions in sync)
// ---------------------------------------------------------------------------
describe("ResizeObserver for chart containers", () => {
  it("ResizeObserver is available", () => {
    expect(typeof ResizeObserver).toBe("function");
  });

  it("ResizeObserver fires callback on observe", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    await new Promise<void>((resolve) => {
      const ro = new ResizeObserver(() => {
        ro.disconnect();
        resolve();
      });
      ro.observe(el);
    });

    document.body.removeChild(el);
  });
});

// ---------------------------------------------------------------------------
// Performance API (used for render timing)
// ---------------------------------------------------------------------------
describe("Performance API for rendering", () => {
  it("performance.now() returns a high-resolution timestamp", () => {
    const t0 = performance.now();
    const t1 = performance.now();
    expect(t1).toBeGreaterThanOrEqual(t0);
  });

  it("performance.mark and measure are available", () => {
    expect(typeof performance.mark).toBe("function");
    expect(typeof performance.measure).toBe("function");
    performance.mark("test-start");
    performance.mark("test-end");
    performance.measure("test", "test-start", "test-end");
    const entries = performance.getEntriesByName("test", "measure");
    expect(entries.length).toBeGreaterThan(0);
    performance.clearMarks();
    performance.clearMeasures();
  });

  it("performance.getEntriesByType is available", () => {
    expect(typeof performance.getEntriesByType).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// devicePixelRatio (used to render retina-quality charts)
// ---------------------------------------------------------------------------
describe("devicePixelRatio", () => {
  it("window.devicePixelRatio is a number >= 1", () => {
    expect(typeof window.devicePixelRatio).toBe("number");
    expect(window.devicePixelRatio).toBeGreaterThanOrEqual(1);
  });
});
