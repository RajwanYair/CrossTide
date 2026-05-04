/**
 * Unit tests for ONNX Runtime Web helpers (I1).
 *
 * Tests cover the pure utility functions (preprocessing, softmax, argmax,
 * topK, buildInputTensor) and the model-loader orchestration logic.
 * The actual `onnxruntime-web` module is mocked since it requires WASM.
 */
import { describe, it, expect, vi } from "vitest";
import {
  onnxSupported,
  preprocessCandles,
  softmax,
  argmax,
  topK,
  buildInputTensor,
  createModelLoader,
} from "../../../src/domain/onnx-patterns";
import type { OnnxCandle } from "../../../src/domain/onnx-patterns";

// ── Test data ─────────────────────────────────────────────────────────────

const CANDLES: OnnxCandle[] = [
  { open: 100, high: 105, low: 98, close: 103, volume: 1000 },
  { open: 103, high: 110, low: 100, close: 108, volume: 1500 },
  { open: 108, high: 112, low: 105, close: 107, volume: 1200 },
  { open: 107, high: 109, low: 102, close: 104, volume: 800 },
];

// ── onnxSupported ─────────────────────────────────────────────────────────

describe("onnxSupported", () => {
  it("returns true when WebAssembly is available (happy-dom)", () => {
    // happy-dom provides WebAssembly and self
    expect(typeof WebAssembly).toBe("object");
    expect(onnxSupported()).toBe(true);
  });
});

// ── preprocessCandles ─────────────────────────────────────────────────────

describe("preprocessCandles", () => {
  it("returns correct dims [1, windowSize, 5]", () => {
    const { dims } = preprocessCandles(CANDLES, 4);
    expect(dims).toEqual([1, 4, 5]);
  });

  it("output length matches windowSize * 5", () => {
    const { data } = preprocessCandles(CANDLES, 4);
    expect(data.length).toBe(4 * 5);
  });

  it("normalises prices to [0, 1] range", () => {
    const { data } = preprocessCandles(CANDLES, 4);
    for (let i = 0; i < 4; i++) {
      const base = i * 5;
      // OHLC values (indices 0-3) should be in [0, 1]
      for (let f = 0; f < 4; f++) {
        expect(data[base + f]).toBeGreaterThanOrEqual(0);
        expect(data[base + f]).toBeLessThanOrEqual(1);
      }
    }
  });

  it("normalises volume relative to max volume", () => {
    const { data } = preprocessCandles(CANDLES, 4);
    // Find max volume = 1500 (candle index 1)
    const volIdx = 1 * 5 + 4; // candle 1, feature 4
    expect(data[volIdx]).toBeCloseTo(1.0);
    // Candle 3 has volume 800 / 1500
    const vol3 = 3 * 5 + 4;
    expect(data[vol3]).toBeCloseTo(800 / 1500);
  });

  it("left-pads with zeros when candles < windowSize", () => {
    const { data } = preprocessCandles(CANDLES.slice(0, 2), 4);
    // First 2 candles (pad) should be zeros
    for (let i = 0; i < 2 * 5; i++) {
      expect(data[i]).toBe(0);
    }
    // Last 2 candles should have non-zero values
    expect(data[2 * 5]).toBeGreaterThan(0);
  });

  it("uses last windowSize candles when candles > windowSize", () => {
    const { data } = preprocessCandles(CANDLES, 2);
    // Should use last 2 candles (index 2, 3)
    expect(data.length).toBe(2 * 5);
    // First candle in output is CANDLES[2], which has close=107
    // Price range from candles[2..3]: low=102, high=112, range=10
    // close of candles[2] = 107 → (107 - 102) / 10 = 0.5
    expect(data[3]).toBeCloseTo(0.5); // close of first candle in output
  });

  it("handles single candle", () => {
    const { data, dims } = preprocessCandles([CANDLES[0]], 1);
    expect(dims).toEqual([1, 1, 5]);
    expect(data.length).toBe(5);
    // Single candle: low=98, high=105, range=7
    // close = 103 → (103-98)/7 ≈ 0.714
    expect(data[3]).toBeCloseTo((103 - 98) / 7);
  });

  it("handles empty candle array", () => {
    const { data, dims } = preprocessCandles([], 3);
    expect(dims).toEqual([1, 3, 5]);
    expect(data.length).toBe(15);
    // All zeros
    for (let i = 0; i < 15; i++) {
      expect(data[i]).toBe(0);
    }
  });
});

// ── softmax ───────────────────────────────────────────────────────────────

describe("softmax", () => {
  it("returns probabilities that sum to 1", () => {
    const probs = softmax([2.0, 1.0, 0.1]);
    const sum = probs.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it("highest logit gets highest probability", () => {
    const probs = softmax([2.0, 1.0, 0.1]);
    expect(probs[0]).toBeGreaterThan(probs[1]);
    expect(probs[1]).toBeGreaterThan(probs[2]);
  });

  it("handles single value", () => {
    expect(softmax([5.0])).toEqual([1.0]);
  });

  it("handles empty array", () => {
    expect(softmax([])).toEqual([]);
  });

  it("handles large negative values without NaN", () => {
    const probs = softmax([-1000, -999, -998]);
    expect(probs.every((p) => !isNaN(p))).toBe(true);
    expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0);
  });

  it("equal logits produce uniform distribution", () => {
    const probs = softmax([1, 1, 1, 1]);
    for (const p of probs) {
      expect(p).toBeCloseTo(0.25);
    }
  });
});

// ── argmax ────────────────────────────────────────────────────────────────

describe("argmax", () => {
  it("returns index of maximum value", () => {
    expect(argmax([1, 3, 2])).toBe(1);
  });

  it("returns first index on tie", () => {
    expect(argmax([5, 5, 5])).toBe(0);
  });

  it("returns 0 for single element", () => {
    expect(argmax([42])).toBe(0);
  });

  it("returns -1 for empty array", () => {
    expect(argmax([])).toBe(-1);
  });

  it("handles negative values", () => {
    expect(argmax([-5, -1, -3])).toBe(1);
  });
});

// ── topK ──────────────────────────────────────────────────────────────────

describe("topK", () => {
  it("returns top-k sorted by descending score", () => {
    const result = topK([0.1, 0.5, 0.3, 0.8, 0.2], 3);
    expect(result).toEqual([
      { index: 3, score: 0.8 },
      { index: 1, score: 0.5 },
      { index: 2, score: 0.3 },
    ]);
  });

  it("returns all elements when k > array length", () => {
    const result = topK([1, 2], 5);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ index: 1, score: 2 });
  });

  it("returns empty array for empty input", () => {
    expect(topK([], 3)).toEqual([]);
  });

  it("k=1 returns single best", () => {
    const result = topK([0.2, 0.9, 0.1], 1);
    expect(result).toEqual([{ index: 1, score: 0.9 }]);
  });
});

// ── buildInputTensor ──────────────────────────────────────────────────────

describe("buildInputTensor", () => {
  it("wraps data with matching dims", () => {
    const data = new Float32Array([1, 2, 3, 4, 5, 6]);
    const spec = buildInputTensor(data, [2, 3]);
    expect(spec.data).toBe(data);
    expect(spec.dims).toEqual([2, 3]);
  });

  it("throws on shape mismatch", () => {
    const data = new Float32Array([1, 2, 3]);
    expect(() => buildInputTensor(data, [2, 3])).toThrow("Tensor shape mismatch");
  });

  it("accepts [1, n, 5] batch shape", () => {
    const data = new Float32Array(20);
    const spec = buildInputTensor(data, [1, 4, 5]);
    expect(spec.dims).toEqual([1, 4, 5]);
  });
});

// ── createModelLoader ─────────────────────────────────────────────────────

describe("createModelLoader", () => {
  it("returns a function", () => {
    const loader = createModelLoader("https://example.com/model.onnx");
    expect(typeof loader).toBe("function");
  });

  it("memoises the session promise", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new ArrayBuffer(8), { status: 200 }),
    );
    const loader = createModelLoader("https://example.com/model.onnx", {
      loadRuntime: () =>
        Promise.resolve({
          InferenceSession: {
            create: () =>
              Promise.resolve({
                inputNames: ["input"],
                outputNames: ["output"],
                run: () => Promise.resolve({ output: { data: new Float32Array() } }),
                release: () => Promise.resolve(),
              }),
          },
          Tensor: class {
            constructor(
              public type: string,
              public data: Float32Array,
              public dims: number[],
            ) {}
          },
        } as any),
    });
    const p1 = loader();
    const p2 = loader();
    expect(p1).toBe(p2);
    await p1; // Ensure promise resolves cleanly — avoids unhandled rejection
    vi.restoreAllMocks();
  });
});
