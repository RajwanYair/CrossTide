/**
 * ONNX model pipeline helpers for fine-tuning workflows (I4).
 *
 * Provides model metadata management, tensor shape validation,
 * quantization configuration, and training/evaluation split utilities
 * for the ONNX Runtime Web inference pipeline.
 *
 * Usage:
 *   const meta = createModelMeta("candle-classifier", [1, 30, 6], [1, 3]);
 *   validateTensorShape(inputData, meta.inputShape);
 *   const { train, test } = trainTestSplit(candles, 0.8);
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface ModelMeta {
  readonly name: string;
  readonly version: string;
  readonly inputShape: readonly number[];
  readonly outputShape: readonly number[];
  readonly labels: readonly string[];
  readonly createdAt: string;
  readonly quantization: QuantizationConfig;
  readonly metrics?: ModelMetrics | undefined;
}

export interface QuantizationConfig {
  readonly enabled: boolean;
  readonly method: "dynamic" | "static" | "none";
  readonly bits: 8 | 16 | 32;
}

export interface ModelMetrics {
  readonly accuracy: number;
  readonly precision: number;
  readonly recall: number;
  readonly f1Score: number;
  readonly loss: number;
}

export interface TrainTestSplit<T> {
  readonly train: readonly T[];
  readonly test: readonly T[];
  readonly trainSize: number;
  readonly testSize: number;
  readonly ratio: number;
}

export interface ShapeValidation {
  readonly valid: boolean;
  readonly expected: readonly number[];
  readonly actual: readonly number[];
  readonly errors: readonly string[];
}

export interface FeatureNormalization {
  readonly mean: Float64Array;
  readonly std: Float64Array;
  readonly min: Float64Array;
  readonly max: Float64Array;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DEFAULT_LABELS = ["bearish", "neutral", "bullish"] as const;

export const DEFAULT_QUANTIZATION: QuantizationConfig = {
  enabled: false,
  method: "none",
  bits: 32,
};

// ── Model metadata ──────────────────────────────────────────────────────

/**
 * Create model metadata with defaults.
 */
export function createModelMeta(
  name: string,
  inputShape: readonly number[],
  outputShape: readonly number[],
  options?: {
    version?: string;
    labels?: readonly string[];
    quantization?: Partial<QuantizationConfig>;
    metrics?: ModelMetrics;
  },
): ModelMeta {
  return {
    name,
    version: options?.version ?? "1.0.0",
    inputShape,
    outputShape,
    labels: options?.labels ?? DEFAULT_LABELS,
    createdAt: new Date().toISOString(),
    quantization: {
      ...DEFAULT_QUANTIZATION,
      ...options?.quantization,
    },
    metrics: options?.metrics,
  };
}

/**
 * Update model metrics after training/evaluation.
 */
export function updateMetrics(meta: ModelMeta, metrics: ModelMetrics): ModelMeta {
  return { ...meta, metrics };
}

// ── Tensor validation ────────────────────────────────────────────────────

/**
 * Validate a tensor shape against an expected shape.
 * -1 in expected shape means any dimension is accepted.
 */
export function validateTensorShape(
  actual: readonly number[],
  expected: readonly number[],
): ShapeValidation {
  const errors: string[] = [];

  if (actual.length !== expected.length) {
    errors.push(`Rank mismatch: expected ${expected.length}D, got ${actual.length}D`);
    return { valid: false, expected, actual, errors };
  }

  for (let i = 0; i < expected.length; i++) {
    if (expected[i] === -1) continue; // wildcard
    if (actual[i] !== expected[i]) {
      errors.push(`Dim ${i}: expected ${expected[i]}, got ${actual[i]}`);
    }
  }

  return { valid: errors.length === 0, expected, actual, errors };
}

/**
 * Compute total number of elements from a shape.
 */
export function shapeSize(shape: readonly number[]): number {
  if (shape.length === 0) return 0;
  return shape.reduce((a, b) => a * b, 1);
}

// ── Train/Test split ─────────────────────────────────────────────────────

/**
 * Split data into train and test sets.
 * @param ratio – fraction for training (0..1). Default 0.8.
 * @param shuffle – whether to shuffle before splitting. Default false.
 * @param seed – optional seed for reproducible shuffles.
 */
export function trainTestSplit<T>(
  data: readonly T[],
  ratio = 0.8,
  shuffle = false,
  seed?: number,
): TrainTestSplit<T> {
  if (ratio <= 0 || ratio >= 1) throw new RangeError("ratio must be in (0, 1)");
  const arr = shuffle ? seededShuffle([...data], seed) : [...data];
  const splitIdx = Math.round(arr.length * ratio);
  return {
    train: arr.slice(0, splitIdx),
    test: arr.slice(splitIdx),
    trainSize: splitIdx,
    testSize: arr.length - splitIdx,
    ratio,
  };
}

function seededShuffle<T>(arr: T[], seed?: number): T[] {
  let s = seed ?? 42;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) | 0;
    const j = (s >>> 0) % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

// ── Feature normalization ────────────────────────────────────────────────

/**
 * Compute normalization stats (mean, std, min, max) per feature column.
 * Data is a flat Float64Array with `features` columns.
 */
export function computeNormalization(data: Float64Array, features: number): FeatureNormalization {
  const rows = data.length / features;
  if (!Number.isInteger(rows)) throw new RangeError("data length must be divisible by features");

  const mean = new Float64Array(features);
  const min = new Float64Array(features).fill(Infinity);
  const max = new Float64Array(features).fill(-Infinity);

  for (let r = 0; r < rows; r++) {
    for (let f = 0; f < features; f++) {
      const v = data[r * features + f]!;
      mean[f] = (mean[f] ?? 0) + v;
      if (v < min[f]!) min[f] = v;
      if (v > max[f]!) max[f] = v;
    }
  }

  for (let f = 0; f < features; f++) mean[f] = mean[f]! / rows;

  const std = new Float64Array(features);
  for (let r = 0; r < rows; r++) {
    for (let f = 0; f < features; f++) {
      const diff = data[r * features + f]! - mean[f]!;
      std[f] = (std[f] ?? 0) + diff * diff;
    }
  }
  for (let f = 0; f < features; f++) std[f] = Math.sqrt(std[f]! / rows);

  return { mean, std, min, max };
}

/**
 * Apply z-score normalization to data in-place.
 */
export function normalizeZScore(
  data: Float64Array,
  features: number,
  norm: FeatureNormalization,
): void {
  const rows = data.length / features;
  for (let r = 0; r < rows; r++) {
    for (let f = 0; f < features; f++) {
      const idx = r * features + f;
      const s = norm.std[f]! === 0 ? 1 : norm.std[f]!;
      data[idx] = (data[idx]! - norm.mean[f]!) / s;
    }
  }
}

/**
 * Apply min-max normalization to data in-place (scales to [0, 1]).
 */
export function normalizeMinMax(
  data: Float64Array,
  features: number,
  norm: FeatureNormalization,
): void {
  const rows = data.length / features;
  for (let r = 0; r < rows; r++) {
    for (let f = 0; f < features; f++) {
      const idx = r * features + f;
      const range = norm.max[f]! - norm.min[f]!;
      data[idx] = range === 0 ? 0 : (data[idx]! - norm.min[f]!) / range;
    }
  }
}

/**
 * Compute F1 score from precision and recall.
 */
export function computeF1(precision: number, recall: number): number {
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

/**
 * Compute accuracy from confusion matrix counts.
 */
export function computeAccuracy(
  truePositives: number,
  trueNegatives: number,
  falsePositives: number,
  falseNegatives: number,
): number {
  const total = truePositives + trueNegatives + falsePositives + falseNegatives;
  if (total === 0) return 0;
  return (truePositives + trueNegatives) / total;
}
