import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(_i: number) {
      return null;
    },
    getItem(k: string) {
      return store.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
  };
}

describe("ticker-notes", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function loadModule(): Promise<typeof import("../../../src/core/ticker-notes")> {
    return import("../../../src/core/ticker-notes");
  }

  it("returns undefined for tickers without notes", async () => {
    const { getTickerNote } = await loadModule();
    expect(getTickerNote("AAPL")).toBeUndefined();
  });

  it("sets and retrieves a note", async () => {
    const { setTickerNote, getTickerNote } = await loadModule();
    setTickerNote("AAPL", "Strong support at $150");
    expect(getTickerNote("AAPL")).toBe("Strong support at $150");
  });

  it("normalizes ticker to uppercase", async () => {
    const { setTickerNote, getTickerNote } = await loadModule();
    setTickerNote("aapl", "Note here");
    expect(getTickerNote("AAPL")).toBe("Note here");
  });

  it("deletes note with empty string", async () => {
    const { setTickerNote, getTickerNote } = await loadModule();
    setTickerNote("AAPL", "Note");
    setTickerNote("AAPL", "");
    expect(getTickerNote("AAPL")).toBeUndefined();
  });

  it("deleteTickerNote removes the note", async () => {
    const { setTickerNote, deleteTickerNote, getTickerNote } = await loadModule();
    setTickerNote("MSFT", "Bearish");
    deleteTickerNote("MSFT");
    expect(getTickerNote("MSFT")).toBeUndefined();
  });

  it("truncates notes exceeding MAX_NOTE_LENGTH", async () => {
    const { setTickerNote, getTickerNote, NOTE_MAX_LENGTH } = await loadModule();
    const longNote = "A".repeat(NOTE_MAX_LENGTH + 100);
    setTickerNote("GOOG", longNote);
    expect(getTickerNote("GOOG")!.length).toBe(NOTE_MAX_LENGTH);
  });

  it("hasTickerNote returns correct boolean", async () => {
    const { setTickerNote, hasTickerNote } = await loadModule();
    expect(hasTickerNote("AAPL")).toBe(false);
    setTickerNote("AAPL", "Note");
    expect(hasTickerNote("AAPL")).toBe(true);
  });

  it("getAllTickerNotes returns all notes", async () => {
    const { setTickerNote, getAllTickerNotes } = await loadModule();
    setTickerNote("AAPL", "Apple note");
    setTickerNote("MSFT", "Microsoft note");
    const all = getAllTickerNotes();
    expect(all.size).toBe(2);
    expect(all.get("AAPL")).toBe("Apple note");
    expect(all.get("MSFT")).toBe("Microsoft note");
  });

  it("persists to localStorage", async () => {
    const { setTickerNote } = await loadModule();
    setTickerNote("TSLA", "Volatile");
    const stored = JSON.parse(localStorage.getItem("crosstide-ticker-notes") ?? "{}");
    expect(stored["TSLA"]).toBe("Volatile");
  });
});
