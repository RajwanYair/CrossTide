/**
 * ONNX Runtime Web helpers for on-device pattern recognition (I1).
 *
 * Provides a lightweight abstraction over `onnxruntime-web` for loading,
 * caching, and running inference with quantised ONNX models in the browser.
 * The actual `ort` dependency is lazy-loaded at runtime — this module contains
 * only the orchestration logic, making it fully testable without the ONNX
 * runtime present.
 *
 * Exports:
 *   - `onnxSupported()` — feature-detect WebAssembly + ONNX prerequisites
 *   - `createModelLoader(url, opts)` — lazy model fetcher with IDB caching
 *   - `preprocessCandles(candles, windowSize)` — normalise OHLCV → Float32 tensor
 *   - `softmax(logits)` — convert raw logits to probabilities
 *   - `argmax(values)` — index of the highest value
 *   - `topK(values, k)` — top-k indices sorted by confidence
 *   - `buildInputTensor(data, dims)` — shape-checked Float32 wrapper
 *
 * Model files (~2 MB quantised INT8) are fetched once and persisted to IDB
 * for offline re-use.  The `createModelLoader` function returns a disposable
 * session handle so the caller can release WASM memory when done.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface OnnxCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ModelLoaderOptions {
  /** IDB database name for model cache (default: "crosstide-onnx"). */
  dbName?: string;
  /** IDB object-store name (default: "models"). */
  storeName?: string;
  /** Maximum model size in bytes to cache (default: 10 MB). */
  maxCacheBytes?: number;
  /**
   * Custom ONNX runtime loader.  Return the `ort` module namespace.
   * Default: `() => import("onnxruntime-web")`.
   * Inject this in tests to avoid requiring the real WASM module.
   */
  loadRuntime?: () => Promise<OrtLike>;
}

export interface ModelSession {
  /** Run inference on the model. */
  run: (input: Float32Array, dims: number[]) => Promise<Float32Array>;
  /** Release WASM memory associated with the session. */
  dispose: () => Promise<void>;
  /** The URL from which the model was loaded. */
  url: string;
}

export interface TopKResult {
  index: number;
  score: number;
}

export interface TensorSpec {
  data: Float32Array;
  dims: number[];
}

/** Minimal shape of the onnxruntime-web module for dependency injection. */
export interface OrtLike {
  InferenceSession: {
    create(buffer: ArrayBuffer): Promise<{
      inputNames: string[];
      outputNames: string[];
      run(feeds: Record<string, unknown>): Promise<Record<string, { data: Float32Array }>>;
      release(): Promise<void>;
    }>;
  };
  Tensor: new (type: string, data: Float32Array, dims: number[]) => unknown;
}

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_DB_NAME = "crosstide-onnx";
const DEFAULT_STORE_NAME = "models";
const DEFAULT_MAX_CACHE = 10 * 1024 * 1024; // 10 MB

// ── Feature detection ─────────────────────────────────────────────────────

/**
 * Returns `true` when the environment supports ONNX Runtime Web.
 * Requires WebAssembly and a window context (not Node by default).
 */
export function onnxSupported(): boolean {
  return (
    typeof WebAssembly !== "undefined" &&
    typeof WebAssembly.instantiate === "function" &&
    typeof self !== "undefined"
  );
}

// ── Preprocessing ─────────────────────────────────────────────────────────

/**
 * Normalise a window of OHLCV candles into a flat Float32Array tensor.
 *
 * Each candle is normalised relative to the window's price range so values
 * fall in [0, 1].  Volume is normalised by the window's max volume.
 *
 * Output shape: [1, windowSize, 5] (batch=1, seq, features=OHLCV).
 *
 * If `candles.length < windowSize`, the array is left-padded with zeros.
 * If `candles.length > windowSize`, only the last `windowSize` candles are used.
 *
 * @returns `{ data, dims }` ready to feed to `ModelSession.run()`.
 */
export function preprocessCandles(candles: readonly OnnxCandle[], windowSize: number): TensorSpec {
  const effective = candles.length > windowSize ? candles.slice(-windowSize) : candles;
  const pad = windowSize - effective.length;

  // Find price range and max volume for normalisation
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let maxVolume = 0;
  for (const c of effective) {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
    if (c.volume > maxVolume) maxVolume = c.volume;
  }
  const priceRange = maxPrice - minPrice || 1;
  const volDivisor = maxVolume || 1;

  const data = new Float32Array(windowSize * 5);

  // Left-pad with zeros (already zero-initialised)
  for (let i = 0; i < effective.length; i++) {
    const c = effective[i]!;
    const base = (pad + i) * 5;
    data[base] = (c.open - minPrice) / priceRange;
    data[base + 1] = (c.high - minPrice) / priceRange;
    data[base + 2] = (c.low - minPrice) / priceRange;
    data[base + 3] = (c.close - minPrice) / priceRange;
    data[base + 4] = c.volume / volDivisor;
  }

  return { data, dims: [1, windowSize, 5] };
}

// ── Math utilities ────────────────────────────────────────────────────────

/**
 * Apply softmax to raw logits, producing a probability distribution.
 */
export function softmax(logits: readonly number[]): number[] {
  if (logits.length === 0) return [];
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/**
 * Return the index of the maximum value in an array.
 * Returns -1 for empty arrays.
 */
export function argmax(values: readonly number[]): number {
  if (values.length === 0) return -1;
  let maxIdx = 0;
  let maxVal = values[0]!;
  for (let i = 1; i < values.length; i++) {
    if (values[i]! > maxVal) {
      maxVal = values[i]!;
      maxIdx = i;
    }
  }
  return maxIdx;
}

/**
 * Return the top-k indices sorted by descending value.
 */
export function topK(values: readonly number[], k: number): TopKResult[] {
  const indexed = values.map((score, index) => ({ index, score }));
  indexed.sort((a, b) => b.score - a.score);
  return indexed.slice(0, Math.min(k, indexed.length));
}

/**
 * Validate and wrap raw Float32 data with its dimensions.
 * Throws if the total element count doesn't match the dims product.
 */
export function buildInputTensor(data: Float32Array, dims: number[]): TensorSpec {
  const expected = dims.reduce((a, b) => a * b, 1);
  if (data.length !== expected) {
    throw new Error(
      `Tensor shape mismatch: data has ${data.length} elements but dims ${JSON.stringify(dims)} require ${expected}`,
    );
  }
  return { data, dims };
}

// ── Model loader ──────────────────────────────────────────────────────────

/**
 * Create a lazy model loader that fetches, caches, and creates an ONNX
 * inference session.
 *
 * The returned function, when called, will:
 *   1. Check IDB for a cached model ArrayBuffer.
 *   2. If not cached, fetch from `url` and store in IDB.
 *   3. Create an `ort.InferenceSession` from the buffer.
 *
 * The session is memoised — calling load() again returns the same session.
 *
 * This function does NOT import `onnxruntime-web` at module load time.
 * The import happens lazily inside the returned async function.
 */
export function createModelLoader(
  url: string,
  opts: ModelLoaderOptions = {},
): () => Promise<ModelSession> {
  const dbName = opts.dbName ?? DEFAULT_DB_NAME;
  const storeName = opts.storeName ?? DEFAULT_STORE_NAME;
  const maxCache = opts.maxCacheBytes ?? DEFAULT_MAX_CACHE;
  let sessionPromise: Promise<ModelSession> | null = null;

  async function loadFromIdb(): Promise<ArrayBuffer | null> {
    try {
      return await new Promise<ArrayBuffer | null>((resolve, reject) => {
        const req = indexedDB.open(dbName, 1);
        req.onupgradeneeded = (): void => {
          const db = req.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        };
        req.onsuccess = (): void => {
          const db = req.result;
          const tx = db.transaction(storeName, "readonly");
          const store = tx.objectStore(storeName);
          const get = store.get(url);
          get.onsuccess = (): void => resolve(get.result ?? null);
          get.onerror = (): void => reject(get.error);
        };
        req.onerror = (): void => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async function storeToIdb(buffer: ArrayBuffer): Promise<void> {
    if (buffer.byteLength > maxCache) return;
    try {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName, 1);
        req.onupgradeneeded = (): void => {
          const db = req.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        };
        req.onsuccess = (): void => {
          const db = req.result;
          const tx = db.transaction(storeName, "readwrite");
          const store = tx.objectStore(storeName);
          store.put(buffer, url);
          tx.oncomplete = (): void => resolve();
          tx.onerror = (): void => reject(tx.error);
        };
        req.onerror = (): void => reject(req.error);
      });
    } catch {
      // Cache failure is non-fatal
    }
  }

  async function load(): Promise<ModelSession> {
    // Try IDB cache first
    let buffer = await loadFromIdb();
    if (!buffer) {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to fetch model: ${resp.status} ${resp.statusText}`);
      buffer = await resp.arrayBuffer();
      await storeToIdb(buffer);
    }

    // Lazy-load ONNX runtime (must be injected via loadRuntime option)
    if (!opts.loadRuntime) {
      throw new Error(
        "No ONNX runtime loader provided. Pass `loadRuntime: () => import('onnxruntime-web')` in options.",
      );
    }
    const ort = await opts.loadRuntime();
    const session = await ort.InferenceSession.create(buffer);

    const inputName = session.inputNames[0]!;
    const outputName = session.outputNames[0]!;

    return {
      url,
      async run(input: Float32Array, dims: number[]): Promise<Float32Array> {
        const tensor = new ort.Tensor("float32", input, dims);
        const results = await session.run({ [inputName]: tensor });
        const output = results[outputName];
        if (!output) throw new Error(`ONNX output "${outputName}" missing`);
        return output.data;
      },
      async dispose(): Promise<void> {
        await session.release();
      },
    };
  }

  return (): Promise<ModelSession> => {
    if (!sessionPromise) sessionPromise = load();
    return sessionPromise;
  };
}
