/**
 * Transferable Float64Array helpers for zero-copy Worker RPC (G4).
 *
 * Packs OHLCV candle arrays into a single Float64Array that can be
 * transferred (not copied) between main thread and Worker via
 * `postMessage(msg, [buffer])`.  Each candle occupies a fixed stride
 * of 6 doubles: [open, high, low, close, volume, timestamp].
 *
 * Usage (main → worker):
 *   const { buffer, length } = packOhlcv(candles);
 *   rpc.callWithTransfer("compute", [buffer.buffer], buffer, length);
 *
 * Usage (inside worker):
 *   const candles = unpackOhlcv(buffer, length);
 */

// ── Constants ────────────────────────────────────────────────────────────

/** Number of float64 fields per candle row. */
export const STRIDE = 6;

/** Field offsets within each stride. */
export const Field = {
  Open: 0,
  High: 1,
  Low: 2,
  Close: 3,
  Volume: 4,
  Timestamp: 5,
} as const;

// ── Types ────────────────────────────────────────────────────────────────

export interface OhlcvRow {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  /** Unix-epoch milliseconds. */
  readonly timestamp: number;
}

export interface PackedOhlcv {
  /** Flat Float64Array with STRIDE * length elements. */
  readonly buffer: Float64Array;
  /** Number of candle rows packed. */
  readonly length: number;
}

// ── Pack / Unpack ────────────────────────────────────────────────────────

/**
 * Pack an array of OHLCV objects into a flat Float64Array.
 * The returned `buffer.buffer` (ArrayBuffer) is transferable.
 */
export function packOhlcv(rows: readonly OhlcvRow[]): PackedOhlcv {
  const len = rows.length;
  const buf = new Float64Array(len * STRIDE);
  for (let i = 0; i < len; i++) {
    const off = i * STRIDE;
    const r = rows[i]!;
    buf[off + Field.Open] = r.open;
    buf[off + Field.High] = r.high;
    buf[off + Field.Low] = r.low;
    buf[off + Field.Close] = r.close;
    buf[off + Field.Volume] = r.volume;
    buf[off + Field.Timestamp] = r.timestamp;
  }
  return { buffer: buf, length: len };
}

/**
 * Unpack a flat Float64Array back into an array of OHLCV objects.
 */
export function unpackOhlcv(buffer: Float64Array, length: number): OhlcvRow[] {
  if (buffer.length < length * STRIDE) {
    throw new RangeError(
      `Buffer too small: need ${length * STRIDE} elements, got ${buffer.length}`,
    );
  }
  const result: OhlcvRow[] = new Array(length);
  for (let i = 0; i < length; i++) {
    const off = i * STRIDE;
    result[i] = {
      open: buffer[off + Field.Open]!,
      high: buffer[off + Field.High]!,
      low: buffer[off + Field.Low]!,
      close: buffer[off + Field.Close]!,
      volume: buffer[off + Field.Volume]!,
      timestamp: buffer[off + Field.Timestamp]!,
    };
  }
  return result;
}

// ── Columnar helpers ─────────────────────────────────────────────────────

/**
 * Extract a single column from a packed buffer without full unpack.
 * Returns a new Float64Array of `length` elements.
 */
export function extractColumn(
  buffer: Float64Array,
  length: number,
  field: (typeof Field)[keyof typeof Field],
): Float64Array {
  const col = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    col[i] = buffer[i * STRIDE + field]!;
  }
  return col;
}

/**
 * Create a PackedOhlcv from column arrays (each of equal length).
 * Useful when composing data from separate typed arrays.
 */
export function packFromColumns(
  open: Float64Array,
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  volume: Float64Array,
  timestamp: Float64Array,
): PackedOhlcv {
  const len = open.length;
  if (
    high.length !== len ||
    low.length !== len ||
    close.length !== len ||
    volume.length !== len ||
    timestamp.length !== len
  ) {
    throw new RangeError("All column arrays must have equal length");
  }
  const buf = new Float64Array(len * STRIDE);
  for (let i = 0; i < len; i++) {
    const off = i * STRIDE;
    buf[off + Field.Open] = open[i]!;
    buf[off + Field.High] = high[i]!;
    buf[off + Field.Low] = low[i]!;
    buf[off + Field.Close] = close[i]!;
    buf[off + Field.Volume] = volume[i]!;
    buf[off + Field.Timestamp] = timestamp[i]!;
  }
  return { buffer: buf, length: len };
}

/**
 * Slice a packed buffer to a subrange [start, end) without full unpack.
 */
export function slicePacked(packed: PackedOhlcv, start: number, end?: number): PackedOhlcv {
  const e = Math.min(end ?? packed.length, packed.length);
  const s = Math.max(0, start);
  if (s >= e) return { buffer: new Float64Array(0), length: 0 };
  const newLen = e - s;
  const buf = packed.buffer.slice(s * STRIDE, e * STRIDE);
  return { buffer: buf, length: newLen };
}

/**
 * Collect the list of Transferable ArrayBuffers from a PackedOhlcv.
 * Convenience for `postMessage(data, collectTransferables(packed))`.
 */
export function collectTransferables(packed: PackedOhlcv): Transferable[] {
  return [packed.buffer.buffer];
}
