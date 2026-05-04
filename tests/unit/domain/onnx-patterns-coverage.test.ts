/**
 * Coverage boost for onnx-patterns.ts — targets uncovered lines:
 *   232-249  loadFromIdb IDB get path
 *   252-275  storeToIdb IDB put path + oversize skip + catch
 *   280-307  load() → fetch → session → run/dispose
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { createModelLoader, type OrtLike } from "../../../src/domain/onnx-patterns";

// ── Helpers ───────────────────────────────────────────────────────────────

function fakeOrt(): OrtLike {
  return {
    InferenceSession: {
      create: vi.fn().mockResolvedValue({
        inputNames: ["input"],
        outputNames: ["output"],
        run: vi.fn().mockResolvedValue({
          output: { data: new Float32Array([0.1, 0.2, 0.7]) },
        }),
        release: vi.fn().mockResolvedValue(undefined),
      }),
    },
    Tensor: vi.fn(),
  };
}

/** Minimal fake IDB that stores nothing but triggers all callbacks. */
function stubIdb(stored: ArrayBuffer | null = null): void {
  const fakeStore = {
    get: vi.fn().mockReturnValue({
      set onsuccess(fn: () => void) {
        Object.defineProperty(this, "result", { value: stored, configurable: true });
        fn();
      },
      set onerror(_fn: () => void) {
        /* noop */
      },
      result: stored,
    }),
    put: vi.fn().mockReturnValue(undefined),
  };

  const fakeTx = {
    objectStore: vi.fn().mockReturnValue(fakeStore),
    set oncomplete(fn: () => void) {
      fn();
    },
    set onerror(_fn: () => void) {
      /* noop */
    },
  };

  const fakeDb = {
    objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
    createObjectStore: vi.fn(),
    transaction: vi.fn().mockReturnValue(fakeTx),
  };

  vi.stubGlobal("indexedDB", {
    open: vi.fn().mockReturnValue({
      set onupgradeneeded(fn: () => void) {
        fn();
      },
      set onsuccess(fn: () => void) {
        Object.defineProperty(this, "result", { value: fakeDb, configurable: true });
        fn();
      },
      set onerror(_fn: () => void) {
        /* noop */
      },
      result: fakeDb,
    }),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("createModelLoader — full load path", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fetches model, creates session, and runs inference", async () => {
    const modelBytes = new ArrayBuffer(64);
    stubIdb(null); // no cached buffer → must fetch

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(modelBytes),
      }),
    );

    const ort = fakeOrt();
    const loader = createModelLoader("https://cdn.example.com/m.onnx", {
      loadRuntime: () => Promise.resolve(ort),
    });

    const session = await loader();
    expect(session.url).toBe("https://cdn.example.com/m.onnx");

    const result = await session.run(new Float32Array([1, 2, 3]), [1, 3]);
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(3);

    await session.dispose();
    const innerSession = await (ort.InferenceSession.create as ReturnType<typeof vi.fn>).mock
      .results[0].value;
    expect(innerSession.release).toHaveBeenCalled();
  });

  it("uses IDB cached buffer when available (skip fetch)", async () => {
    const cachedBuf = new ArrayBuffer(32);
    stubIdb(cachedBuf);

    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const loader = createModelLoader("https://cdn.example.com/cached.onnx", {
      loadRuntime: () => Promise.resolve(fakeOrt()),
    });

    const session = await loader();
    expect(session.url).toBe("https://cdn.example.com/cached.onnx");
    // fetch should NOT have been called
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws when loadRuntime is not provided", async () => {
    stubIdb(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      }),
    );

    const loader = createModelLoader("https://cdn.example.com/m.onnx");
    await expect(loader()).rejects.toThrow("No ONNX runtime loader");
  });

  it("throws on fetch failure (non-ok response)", async () => {
    stubIdb(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );

    const loader = createModelLoader("https://cdn.example.com/missing.onnx", {
      loadRuntime: () => Promise.resolve(fakeOrt()),
    });

    await expect(loader()).rejects.toThrow("Failed to fetch model: 404 Not Found");
  });

  it("skips IDB store when buffer exceeds maxCacheBytes", async () => {
    const bigBuffer = new ArrayBuffer(200);
    stubIdb(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(bigBuffer),
      }),
    );

    const loader = createModelLoader("https://cdn.example.com/big.onnx", {
      maxCacheBytes: 100, // smaller than buffer → skip store
      loadRuntime: () => Promise.resolve(fakeOrt()),
    });

    // Should succeed without errors even though store is skipped
    const session = await loader();
    expect(session.url).toBe("https://cdn.example.com/big.onnx");
  });

  it("gracefully handles IDB open failure in loadFromIdb", async () => {
    // Simulate indexedDB.open throwing
    vi.stubGlobal("indexedDB", {
      open: vi.fn().mockImplementation(() => {
        throw new Error("IDB blocked");
      }),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
      }),
    );

    const loader = createModelLoader("https://cdn.example.com/idb-fail.onnx", {
      loadRuntime: () => Promise.resolve(fakeOrt()),
    });

    // loadFromIdb catches → returns null → falls through to fetch
    const session = await loader();
    expect(session.url).toBe("https://cdn.example.com/idb-fail.onnx");
  });
});
