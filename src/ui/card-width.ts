/**
 * Card width preference — per-card half-width vs full-width toggle.
 *
 * Stores width preferences in localStorage. Cards default to full-width.
 * When set to half, the card receives a "card-half" CSS class.
 */

const STORAGE_KEY = "crosstide-card-widths";

export type CardWidth = "full" | "half";

let cache: Map<string, CardWidth> | null = null;

function load(): Map<string, CardWidth> {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, CardWidth>;
      cache = new Map(Object.entries(parsed));
    } else {
      cache = new Map();
    }
  } catch {
    cache = new Map();
  }
  return cache;
}

function persist(): void {
  const map = load();
  const obj: Record<string, CardWidth> = {};
  for (const [k, v] of map) {
    obj[k] = v;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function getCardWidth(cardId: string): CardWidth {
  return load().get(cardId) ?? "full";
}

export function setCardWidth(cardId: string, width: CardWidth): void {
  load().set(cardId, width);
  persist();
  applyWidthToDOM(cardId, width);
}

export function toggleCardWidth(cardId: string): CardWidth {
  const current = getCardWidth(cardId);
  const next: CardWidth = current === "full" ? "half" : "full";
  setCardWidth(cardId, next);
  return next;
}

function applyWidthToDOM(cardId: string, width: CardWidth): void {
  const el = document.querySelector(`[data-card-id="${cardId}"]`);
  if (!el) return;
  if (width === "half") {
    el.classList.add("card-half");
  } else {
    el.classList.remove("card-half");
  }
}

/**
 * Apply all persisted card widths to the DOM.
 * Call after cards are mounted.
 */
export function applyAllCardWidths(): void {
  const map = load();
  for (const [cardId, width] of map) {
    applyWidthToDOM(cardId, width);
  }
}
