/**
 * Pure focus-trap helpers (no DOM mutation, no event handlers). Provides
 * focusable-element discovery and ring navigation. Designed for use by a
 * thin DOM adapter (modal, dialog, command palette) that owns the
 * keydown listener.
 */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[tabindex]",
  "[contenteditable='true']",
  "audio[controls]",
  "video[controls]",
  "summary",
].join(",");

export interface FocusableElement {
  readonly tabIndex: number;
  readonly hasAttribute: (name: string) => boolean;
  readonly getAttribute: (name: string) => string | null;
}

export interface FocusableHost {
  querySelectorAll(selector: string): ArrayLike<FocusableElement>;
}

/**
 * Returns elements that are focusable and not explicitly removed from the
 * tab order via tabindex="-1". Preserves DOM order.
 */
export function getFocusableElements<T extends FocusableElement>(root: FocusableHost): T[] {
  const all = root.querySelectorAll(FOCUSABLE_SELECTOR);
  const out: T[] = [];
  for (let i = 0; i < all.length; i++) {
    const el = all[i] as T;
    if (el === undefined) continue;
    if (el.tabIndex < 0) continue;
    if (el.hasAttribute("disabled")) continue;
    if (el.getAttribute("aria-hidden") === "true") continue;
    out.push(el);
  }
  return out;
}

/**
 * Returns the next focusable element from a list, wrapping at boundaries.
 * direction: 1 forward, -1 backward.
 */
export function nextFocusable<T extends FocusableElement>(
  elements: readonly T[],
  current: T | null,
  direction: 1 | -1 = 1,
): T | null {
  if (elements.length === 0) return null;
  const idx = current === null ? -1 : elements.indexOf(current);
  if (idx === -1) {
    return direction === 1 ? elements[0]! : elements[elements.length - 1]!;
  }
  const len = elements.length;
  const nextIdx = (((idx + direction) % len) + len) % len;
  return elements[nextIdx]!;
}

export const FOCUS_TRAP_SELECTOR = FOCUSABLE_SELECTOR;
