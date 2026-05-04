/**
 * Unit tests for the OPFS storage tier (H8).
 *
 * OPFS is not available in Node / happy-dom so we mock
 * `navigator.storage.getDirectory()` and the FileSystem handles.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  opfsSupported,
  serializeCandles,
  deserializeCandles,
  writeCandles,
  readCandles,
  deleteCandles,
  listTickers,
  getArchiveSize,
  clearAllArchives,
} from "../../../src/core/opfs-storage";
import type { OhlcvCandle } from "../../../src/core/opfs-storage";

// ── Test data ─────────────────────────────────────────────────────────────

const CANDLES: OhlcvCandle[] = [
  { timestamp: 1700000000000, open: 100, high: 105, low: 99, close: 103, volume: 5000 },
  { timestamp: 1700086400000, open: 103, high: 108, low: 101, close: 107, volume: 6000 },
  { timestamp: 1700172800000, open: 107, high: 110, low: 104, close: 106, volume: 4500 },
];

// ── Mock OPFS infrastructure ──────────────────────────────────────────────

class MockFileWritable {
  chunks: Uint8Array[] = [];
  async write(data: ArrayBuffer | Uint8Array): Promise<void> {
    this.chunks.push(new Uint8Array(data instanceof ArrayBuffer ? data : data.buffer));
  }
  async close(): Promise<void> {
    /* noop */
  }
}

function createMockFileHandle(data: ArrayBuffer = new ArrayBuffer(0)): {
  handle: any;
  writable: MockFileWritable;
} {
  const writable = new MockFileWritable();
  const handle = {
    getFile: vi.fn().mockResolvedValue({
      arrayBuffer: vi.fn().mockResolvedValue(data),
      size: data.byteLength,
    }),
    createWritable: vi.fn().mockResolvedValue(writable),
  };
  return { handle, writable };
}

function createMockDirectoryHandle(
  files: Map<string, { handle: any; writable: MockFileWritable }>,
): any {
  const dir: any = {
    getFileHandle: vi.fn(async (name: string, opts?: { create?: boolean }) => {
      if (files.has(name)) return files.get(name)!.handle;
      if (opts?.create) {
        const entry = createMockFileHandle();
        files.set(name, entry);
        return entry.handle;
      }
      throw new DOMException("NotFoundError");
    }),
    removeEntry: vi.fn(async (name: string) => {
      if (!files.has(name)) throw new DOMException("NotFoundError");
      files.delete(name);
    }),
    entries: vi.fn(() => {
      const entries = [...files.keys()].map((k) => [k, files.get(k)!.handle]);
      let idx = 0;
      return {
        [Symbol.asyncIterator]() {
          return this;
        },
        async next() {
          if (idx < entries.length) return { value: entries[idx++], done: false };
          return { value: undefined, done: true };
        },
      };
    }),
  };
  return dir;
}

function setupOpfsMock(files: Map<string, { handle: any; writable: MockFileWritable }>): {
  archiveDir: any;
  rootDir: any;
} {
  const archiveDir = createMockDirectoryHandle(files);
  const rootDir = {
    getDirectoryHandle: vi.fn().mockResolvedValue(archiveDir),
    removeEntry: vi.fn().mockResolvedValue(undefined),
  };
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: {
      getDirectory: vi.fn().mockResolvedValue(rootDir),
    },
  });
  return { archiveDir, rootDir };
}

function teardownOpfsMock(): void {
  // Restore original navigator.storage
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: undefined,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("opfsSupported", () => {
  afterEach(() => teardownOpfsMock());

  it("returns false when navigator.storage is absent", () => {
    teardownOpfsMock();
    expect(opfsSupported()).toBe(false);
  });

  it("returns true when navigator.storage.getDirectory exists", () => {
    setupOpfsMock(new Map());
    expect(opfsSupported()).toBe(true);
  });
});

describe("serializeCandles / deserializeCandles", () => {
  it("round-trips candle data faithfully", () => {
    const buf = serializeCandles(CANDLES);
    expect(buf.byteLength).toBe(CANDLES.length * 48);
    const result = deserializeCandles(buf);
    expect(result).toEqual(CANDLES);
  });

  it("handles empty array", () => {
    const buf = serializeCandles([]);
    expect(buf.byteLength).toBe(0);
    expect(deserializeCandles(buf)).toEqual([]);
  });

  it("single candle round-trip", () => {
    const single: OhlcvCandle[] = [{ timestamp: 1, open: 2, high: 3, low: 4, close: 5, volume: 6 }];
    expect(deserializeCandles(serializeCandles(single))).toEqual(single);
  });

  it("preserves decimal precision", () => {
    const precise: OhlcvCandle[] = [
      {
        timestamp: 1700000000001,
        open: 123.456789,
        high: 234.567891,
        low: 12.345678,
        close: 99.999999,
        volume: 1234567.89,
      },
    ];
    expect(deserializeCandles(serializeCandles(precise))).toEqual(precise);
  });

  it("buffer has correct byte layout (6 Float64 per candle)", () => {
    const buf = serializeCandles(CANDLES);
    const view = new Float64Array(buf);
    // First candle fields
    expect(view[0]).toBe(1700000000000); // timestamp
    expect(view[1]).toBe(100); // open
    expect(view[2]).toBe(105); // high
    expect(view[3]).toBe(99); // low
    expect(view[4]).toBe(103); // close
    expect(view[5]).toBe(5000); // volume
    // Second candle starts at index 6
    expect(view[6]).toBe(1700086400000);
  });

  it("ignores trailing bytes that don't complete a candle", () => {
    const buf = new ArrayBuffer(48 + 16); // 1 candle + partial
    const view = new Float64Array(buf);
    view[0] = 100;
    view[1] = 1;
    view[2] = 2;
    view[3] = 0.5;
    view[4] = 1.5;
    view[5] = 999;
    // extra 16 bytes (2 Float64s) are ignored
    view[6] = 42;
    view[7] = 43;
    const result = deserializeCandles(buf);
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(100);
  });
});

describe("writeCandles", () => {
  afterEach(() => teardownOpfsMock());

  it("writes serialised data through a writable stream", async () => {
    const files = new Map();
    setupOpfsMock(files);
    await writeCandles("AAPL", CANDLES);
    // File should have been created
    expect(files.has("AAPL.bin")).toBe(true);
  });

  it("throws when OPFS is not supported", async () => {
    teardownOpfsMock();
    await expect(writeCandles("AAPL", CANDLES)).rejects.toThrow("OPFS is not supported");
  });

  it("sanitises ticker to uppercase safe filename", async () => {
    const files = new Map();
    setupOpfsMock(files);
    await writeCandles("btc/usd", CANDLES);
    expect(files.has("BTC_USD.bin")).toBe(true);
  });
});

describe("readCandles", () => {
  afterEach(() => teardownOpfsMock());

  it("returns empty array when OPFS not supported", async () => {
    teardownOpfsMock();
    expect(await readCandles("AAPL")).toEqual([]);
  });

  it("returns empty array when file does not exist", async () => {
    setupOpfsMock(new Map());
    expect(await readCandles("MISSING")).toEqual([]);
  });

  it("reads and deserialises existing candle data", async () => {
    const buf = serializeCandles(CANDLES);
    const entry = createMockFileHandle(buf);
    const files = new Map([["AAPL.bin", entry]]);
    setupOpfsMock(files);
    const result = await readCandles("AAPL");
    expect(result).toEqual(CANDLES);
  });
});

describe("deleteCandles", () => {
  afterEach(() => teardownOpfsMock());

  it("removes the archive file", async () => {
    const files = new Map([["TSLA.bin", createMockFileHandle()]]);
    const { archiveDir } = setupOpfsMock(files);
    await deleteCandles("TSLA");
    expect(archiveDir.removeEntry).toHaveBeenCalledWith("TSLA.bin");
  });

  it("no-op when OPFS not supported", async () => {
    teardownOpfsMock();
    await expect(deleteCandles("AAPL")).resolves.toBeUndefined();
  });

  it("no-op when file does not exist", async () => {
    setupOpfsMock(new Map());
    await expect(deleteCandles("MISSING")).resolves.toBeUndefined();
  });
});

describe("listTickers", () => {
  afterEach(() => teardownOpfsMock());

  it("returns sorted ticker list", async () => {
    const files = new Map([
      ["TSLA.bin", createMockFileHandle()],
      ["AAPL.bin", createMockFileHandle()],
      ["MSFT.bin", createMockFileHandle()],
    ]);
    setupOpfsMock(files);
    const result = await listTickers();
    expect(result).toEqual(["AAPL", "MSFT", "TSLA"]);
  });

  it("returns empty array when OPFS not supported", async () => {
    teardownOpfsMock();
    expect(await listTickers()).toEqual([]);
  });

  it("returns empty array when no files exist", async () => {
    setupOpfsMock(new Map());
    expect(await listTickers()).toEqual([]);
  });
});

describe("getArchiveSize", () => {
  afterEach(() => teardownOpfsMock());

  it("returns byte size of archive file", async () => {
    const buf = serializeCandles(CANDLES);
    const entry = createMockFileHandle(buf);
    const files = new Map([["AAPL.bin", entry]]);
    setupOpfsMock(files);
    const size = await getArchiveSize("AAPL");
    expect(size).toBe(CANDLES.length * 48);
  });

  it("returns 0 when OPFS not supported", async () => {
    teardownOpfsMock();
    expect(await getArchiveSize("AAPL")).toBe(0);
  });

  it("returns 0 when file does not exist", async () => {
    setupOpfsMock(new Map());
    expect(await getArchiveSize("MISSING")).toBe(0);
  });
});

describe("clearAllArchives", () => {
  afterEach(() => teardownOpfsMock());

  it("removes the archive directory recursively", async () => {
    const { rootDir } = setupOpfsMock(new Map());
    await clearAllArchives();
    expect(rootDir.removeEntry).toHaveBeenCalledWith("crosstide-ohlcv", { recursive: true });
  });

  it("no-op when OPFS not supported", async () => {
    teardownOpfsMock();
    await expect(clearAllArchives()).resolves.toBeUndefined();
  });
});
