/**
 * OPFS (Origin Private File System) storage tier for OHLCV archives (H8).
 *
 * Provides a persistent, high-performance storage layer for large candle
 * archives (>5 years of daily data) using the File System Access API's
 * Origin Private File System.  OPFS operates in a separate, non-user-visible
 * file system that does not require permission prompts and is not subject
 * to the same storage-pressure eviction policies as IndexedDB.
 *
 * Exports:
 *   - `opfsSupported()` — feature-detect OPFS availability
 *   - `writeCandles(ticker, candles)` — serialise and persist OHLCV data
 *   - `readCandles(ticker)` — read and deserialise persisted data
 *   - `deleteCandles(ticker)` — remove a ticker's archive file
 *   - `listTickers()` — enumerate all archived ticker files
 *   - `getArchiveSize(ticker)` — byte size of a ticker's archive
 *   - `clearAllArchives()` — wipe the archive directory
 *
 * File layout inside OPFS:
 *   root / crosstide-ohlcv / {TICKER}.bin
 *
 * Binary format (per candle, 48 bytes):
 *   Float64 timestamp | Float64 open | Float64 high | Float64 low |
 *   Float64 close | Float64 volume
 *
 * MDN: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
 */

// ── Constants ─────────────────────────────────────────────────────────────

const ARCHIVE_DIR = "crosstide-ohlcv";
const BYTES_PER_CANDLE = 48; // 6 × Float64 (8 bytes each)
const FILE_EXT = ".bin";

// ── Types ─────────────────────────────────────────────────────────────────

export interface OhlcvCandle {
  /** Unix-epoch milliseconds */
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ── Feature detection ─────────────────────────────────────────────────────

/** Returns `true` when the Origin Private File System API is available. */
export function opfsSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.storage != null &&
    typeof navigator.storage.getDirectory === "function"
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────

function tickerToFilename(ticker: string): string {
  // Sanitise to safe filename chars: A-Z0-9_-.
  return ticker.toUpperCase().replace(/[^A-Z0-9_\-.]/g, "_") + FILE_EXT;
}

function filenameToTicker(name: string): string {
  return name.replace(FILE_EXT, "");
}

async function getArchiveDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(ARCHIVE_DIR, { create: true });
}

/** Serialise an array of candles to a compact Float64Array buffer. */
export function serializeCandles(candles: readonly OhlcvCandle[]): ArrayBuffer {
  const buffer = new ArrayBuffer(candles.length * BYTES_PER_CANDLE);
  const view = new Float64Array(buffer);
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    const off = i * 6;
    view[off] = c.timestamp;
    view[off + 1] = c.open;
    view[off + 2] = c.high;
    view[off + 3] = c.low;
    view[off + 4] = c.close;
    view[off + 5] = c.volume;
  }
  return buffer;
}

/** Deserialise a buffer written by `serializeCandles` back to candle objects. */
export function deserializeCandles(buffer: ArrayBuffer): OhlcvCandle[] {
  const view = new Float64Array(buffer);
  const count = Math.floor(view.length / 6);
  const candles: OhlcvCandle[] = [];
  for (let i = 0; i < count; i++) {
    const off = i * 6;
    candles.push({
      timestamp: view[off]!,
      open: view[off + 1]!,
      high: view[off + 2]!,
      low: view[off + 3]!,
      close: view[off + 4]!,
      volume: view[off + 5]!,
    });
  }
  return candles;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Write OHLCV candles to the OPFS archive for `ticker`.
 * Overwrites any previous archive for the same ticker.
 */
export async function writeCandles(ticker: string, candles: readonly OhlcvCandle[]): Promise<void> {
  if (!opfsSupported()) throw new Error("OPFS is not supported in this environment");
  const dir = await getArchiveDir();
  const filename = tickerToFilename(ticker);
  const handle = await dir.getFileHandle(filename, { create: true });
  const writable = await handle.createWritable();
  try {
    const data = serializeCandles(candles);
    await writable.write(data);
  } finally {
    await writable.close();
  }
}

/**
 * Read OHLCV candles from the OPFS archive for `ticker`.
 * Returns an empty array if no archive exists.
 */
export async function readCandles(ticker: string): Promise<OhlcvCandle[]> {
  if (!opfsSupported()) return [];
  const dir = await getArchiveDir();
  const filename = tickerToFilename(ticker);
  try {
    const handle = await dir.getFileHandle(filename);
    const file = await handle.getFile();
    const buffer = await file.arrayBuffer();
    return deserializeCandles(buffer);
  } catch {
    // File not found
    return [];
  }
}

/**
 * Delete the OHLCV archive file for `ticker`.
 * No-op if the file does not exist.
 */
export async function deleteCandles(ticker: string): Promise<void> {
  if (!opfsSupported()) return;
  const dir = await getArchiveDir();
  const filename = tickerToFilename(ticker);
  try {
    await dir.removeEntry(filename);
  } catch {
    // Already absent — ignore
  }
}

/**
 * List all ticker symbols that have an OPFS archive.
 */
export async function listTickers(): Promise<string[]> {
  if (!opfsSupported()) return [];
  const dir = await getArchiveDir();
  const tickers: string[] = [];
  for await (const [name] of (
    dir as FileSystemDirectoryHandle & { entries(): AsyncIterable<[string, FileSystemHandle]> }
  ).entries()) {
    if (typeof name === "string" && name.endsWith(FILE_EXT)) {
      tickers.push(filenameToTicker(name));
    }
  }
  return tickers.sort();
}

/**
 * Get the byte size of a ticker's archive.  Returns 0 if not found.
 */
export async function getArchiveSize(ticker: string): Promise<number> {
  if (!opfsSupported()) return 0;
  const dir = await getArchiveDir();
  const filename = tickerToFilename(ticker);
  try {
    const handle = await dir.getFileHandle(filename);
    const file = await handle.getFile();
    return file.size;
  } catch {
    return 0;
  }
}

/**
 * Remove all archive files in the OPFS `crosstide-ohlcv` directory.
 */
export async function clearAllArchives(): Promise<void> {
  if (!opfsSupported()) return;
  const root = await navigator.storage.getDirectory();
  try {
    await root.removeEntry(ARCHIVE_DIR, { recursive: true });
  } catch {
    // Directory didn't exist — fine
  }
}
