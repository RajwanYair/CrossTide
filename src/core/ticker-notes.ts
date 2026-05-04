/**
 * Per-ticker notes — short text annotations stored per ticker in localStorage.
 *
 * Users can attach brief analysis notes to individual tickers in their watchlist.
 * Notes are persisted independently from the main config to avoid bloating it.
 */

const STORAGE_KEY = "crosstide-ticker-notes";
const MAX_NOTE_LENGTH = 500;

/** Load all ticker notes from storage. */
function loadNotes(): Map<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const obj: unknown = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return new Map();
    const map = new Map<string, string>();
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) {
        map.set(k.toUpperCase(), v.slice(0, MAX_NOTE_LENGTH));
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function saveNotes(notes: Map<string, string>): void {
  const obj: Record<string, string> = {};
  for (const [k, v] of notes) obj[k] = v;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

let notesCache: Map<string, string> | null = null;

function getNotes(): Map<string, string> {
  if (!notesCache) notesCache = loadNotes();
  return notesCache;
}

/** Get the note for a specific ticker. Returns undefined if no note exists. */
export function getTickerNote(ticker: string): string | undefined {
  return getNotes().get(ticker.toUpperCase()) || undefined;
}

/** Set or update the note for a ticker. Empty string removes the note. */
export function setTickerNote(ticker: string, note: string): void {
  const notes = getNotes();
  const normalized = ticker.toUpperCase();
  const trimmed = note.trim().slice(0, MAX_NOTE_LENGTH);

  if (trimmed) {
    notes.set(normalized, trimmed);
  } else {
    notes.delete(normalized);
  }
  saveNotes(notes);
}

/** Delete the note for a ticker. */
export function deleteTickerNote(ticker: string): void {
  const notes = getNotes();
  notes.delete(ticker.toUpperCase());
  saveNotes(notes);
}

/** Get all tickers that have notes. */
export function getAllTickerNotes(): ReadonlyMap<string, string> {
  return getNotes();
}

/** Check if a ticker has a note. */
export function hasTickerNote(ticker: string): boolean {
  return getNotes().has(ticker.toUpperCase());
}

/** Maximum allowed note length. */
export const NOTE_MAX_LENGTH = MAX_NOTE_LENGTH;
