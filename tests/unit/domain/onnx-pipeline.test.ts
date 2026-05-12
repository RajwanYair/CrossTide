/**
 * Unit tests for ONNX model pipeline helpers (I4).
 */
import { describe, it, expect } from "vitest";
import {
  DEFAULT_LABELS,
  DEFAULT_QUANTIZATION,
  createModelMeta,
  updateMetrics,
  validateTensorShape,
  shapeSize,
  trainTestSplit,
  computeNormalization,
  normalizeZScore,
  normalizeMinMax,
  computeF1,
  computeAccuracy,
} from "../../../src/domain/_experimental/onnx-pipeline";

// ── createModelMeta ──────────────────────────────────────────────────────

describe("createModelMeta", () => {
  it("creates meta with defaults", () => {
    const meta = createModelMeta("clf", [1, 30, 6], [1, 3]);
    expect(meta.name).toBe("clf");
    expect(meta.inputShape).toEqual([1, 30, 6]);
    expect(meta.outputShape).toEqual([1, 3]);
    expect(meta.labels).toEqual(DEFAULT_LABELS);
    expect(meta.quantization).toEqual(DEFAULT_QUANTIZATION);
    expect(meta.version).toBe("1.0.0");
  });

  it("accepts custom labels and quantization", () => {
    const meta = createModelMeta("m", [1, 10], [1, 2], {
      labels: ["up", "down"],
      quantization: { enabled: true, method: "dynamic", bits: 8 },
    });
    expect(meta.labels).toEqual(["up", "down"]);
    expect(meta.quantization.enabled).toBe(true);
    expect(meta.quantization.bits).toBe(8);
  });

  it("includes metrics when provided", () => {
    const metrics = { accuracy: 0.95, precision: 0.93, recall: 0.92, f1Score: 0.925, loss: 0.12 };
    const meta = createModelMeta("m", [1], [1], { metrics });
    expect(meta.metrics).toEqual(metrics);
  });
});

// ── updateMetrics ────────────────────────────────────────────────────────

describe("updateMetrics", () => {
  it("updates metrics immutably", () => {
    const meta = createModelMeta("m", [1], [1]);
    const metrics = { accuracy: 0.9, precision: 0.88, recall: 0.85, f1Score: 0.865, loss: 0.15 };
    const updated = updateMetrics(meta, metrics);
    expect(updated.metrics).toEqual(metrics);
    expect(meta.metrics).toBeUndefined();
  });
});

// ── validateTensorShape ──────────────────────────────────────────────────

describe("validateTensorShape", () => {
  it("validates matching shapes", () => {
    const result = validateTensorShape([1, 30, 6], [1, 30, 6]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects rank mismatch", () => {
    const result = validateTensorShape([1, 30], [1, 30, 6]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Rank");
  });

  it("detects dimension mismatch", () => {
    const result = validateTensorShape([1, 20, 6], [1, 30, 6]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Dim 1");
  });

  it("allows wildcards (-1)", () => {
    const result = validateTensorShape([1, 50, 6], [-1, -1, 6]);
    expect(result.valid).toBe(true);
  });

  it("handles empty shapes", () => {
    const result = validateTensorShape([], []);
    expect(result.valid).toBe(true);
  });
});

// ── shapeSize ────────────────────────────────────────────────────────────

describe("shapeSize", () => {
  it("computes product of dimensions", () => {
    expect(shapeSize([2, 3, 4])).toBe(24);
  });

  it("returns 0 for empty shape", () => {
    expect(shapeSize([])).toBe(0);
  });

  it("handles single dimension", () => {
    expect(shapeSize([5])).toBe(5);
  });
});

// ── trainTestSplit ───────────────────────────────────────────────────────

describe("trainTestSplit", () => {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("splits with default ratio", () => {
    const { train, test, trainSize, testSize } = trainTestSplit(data);
    expect(trainSize).toBe(8);
    expect(testSize).toBe(2);
    expect(train).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(test).toEqual([9, 10]);
  });

  it("splits with custom ratio", () => {
    const { train, test } = trainTestSplit(data, 0.5);
    expect(train).toHaveLength(5);
    expect(test).toHaveLength(5);
  });

  it("shuffles with seed", () => {
    const s1 = trainTestSplit(data, 0.8, true, 42);
    const s2 = trainTestSplit(data, 0.8, true, 42);
    expect(s1.train).toEqual(s2.train);
  });

  it("different seeds produce different shuffles", () => {
    const s1 = trainTestSplit(data, 0.8, true, 1);
    const s2 = trainTestSplit(data, 0.8, true, 999);
    // Very unlikely to be identical
    const same = s1.train.every((v, i) => v === s2.train[i]);
    expect(same).toBe(false);
  });

  it("throws on invalid ratio", () => {
    expect(() => trainTestSplit(data, 0)).toThrow(RangeError);
    expect(() => trainTestSplit(data, 1)).toThrow(RangeError);
  });

  it("handles empty data", () => {
    const { train, test } = trainTestSplit([], 0.5);
    expect(train).toEqual([]);
    expect(test).toEqual([]);
  });
});

// ── computeNormalization ─────────────────────────────────────────────────

describe("computeNormalization", () => {
  it("computes mean, std, min, max per feature", () => {
    // 3 rows × 2 features: [1,10, 2,20, 3,30]
    const data = new Float64Array([1, 10, 2, 20, 3, 30]);
    const norm = computeNormalization(data, 2);
    expect(norm.mean[0]).toBeCloseTo(2);
    expect(norm.mean[1]).toBeCloseTo(20);
    expect(norm.min[0]).toBe(1);
    expect(norm.max[0]).toBe(3);
    expect(norm.min[1]).toBe(10);
    expect(norm.max[1]).toBe(30);
    expect(norm.std[0]).toBeGreaterThan(0);
  });

  it("throws on non-divisible length", () => {
    expect(() => computeNormalization(new Float64Array(5), 3)).toThrow(RangeError);
  });
});

// ── normalizeZScore ──────────────────────────────────────────────────────

describe("normalizeZScore", () => {
  it("normalizes data to ~zero mean", () => {
    const data = new Float64Array([1, 2, 3, 4, 5, 6]);
    const norm = computeNormalization(data, 2);
    normalizeZScore(data, 2, norm);
    // Check mean is approximately 0
    const col0 = [data[0], data[2], data[4]];
    const mean0 = col0.reduce((a, b) => a + b) / col0.length;
    expect(mean0).toBeCloseTo(0, 10);
  });

  it("handles zero std (constant feature)", () => {
    const data = new Float64Array([5, 5, 5]);
    const norm = computeNormalization(data, 1);
    normalizeZScore(data, 1, norm);
    // Should not produce NaN
    expect(data[0]).toBe(0);
  });
});

// ── normalizeMinMax ──────────────────────────────────────────────────────

describe("normalizeMinMax", () => {
  it("scales to [0, 1] range", () => {
    const data = new Float64Array([10, 20, 30]);
    const norm = computeNormalization(data, 1);
    normalizeMinMax(data, 1, norm);
    expect(data[0]).toBeCloseTo(0);
    expect(data[2]).toBeCloseTo(1);
  });

  it("handles constant feature (zero range)", () => {
    const data = new Float64Array([5, 5, 5]);
    const norm = computeNormalization(data, 1);
    normalizeMinMax(data, 1, norm);
    expect(data[0]).toBe(0);
  });
});

// ── computeF1 / computeAccuracy ──────────────────────────────────────────

describe("computeF1", () => {
  it("computes harmonic mean", () => {
    expect(computeF1(0.9, 0.8)).toBeCloseTo(0.8471, 3);
  });

  it("returns 0 when both zero", () => {
    expect(computeF1(0, 0)).toBe(0);
  });
});

describe("computeAccuracy", () => {
  it("computes correct ratio", () => {
    expect(computeAccuracy(80, 10, 5, 5)).toBeCloseTo(0.9);
  });

  it("returns 0 for empty", () => {
    expect(computeAccuracy(0, 0, 0, 0)).toBe(0);
  });
});
