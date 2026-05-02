/**
 * Popover API utility (G9).
 *
 * The Popover API (Baseline 2024, all major browsers) replaces custom
 * focus-trap patterns for non-modal overlays: tooltips, toasts, context menus,
 * and dropdown panels. It provides:
 *
 *   - Native top-layer promotion (above stacking contexts).
 *   - Built-in light-dismiss (`popover="auto"` closes on outside click / Escape).
 *   - No JS focus-trap needed — the browser handles it.
 *   - CSS `:popover-open` pseudo-class for styling.
 *   - `@starting-style` integration for entry animations (H2).
 *
 * This module provides:
 *   - `supportsPopover()` — feature-detect without throwing.
 *   - `openPopover(el)` / `closePopover(el)` / `togglePopover(el)` — wrappers
 *     that fall back to `display` toggling on unsupported browsers.
 *   - `createManagedPopover(host, content)` — inject a `<div popover>` child
 *     and return a handle with `show()` / `hide()` / `destroy()`.
 *   - `attachAnchorTrigger(trigger, popover)` — wire a button as the invoker
 *     via `popovertarget`; cleans up on destroy.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
 */

// ─── feature detection ────────────────────────────────────────────────────────

/**
 * Returns `true` when the Popover API (`showPopover` / `hidePopover`)
 * is available in this environment.
 */
export function supportsPopover(): boolean {
  return typeof HTMLElement.prototype.showPopover === "function";
}

// ─── low-level wrappers ───────────────────────────────────────────────────────

/**
 * Open a popover element.
 * Falls back to `el.style.display = "block"` on browsers without the API.
 */
export function openPopover(el: HTMLElement): void {
  if (supportsPopover()) {
    el.showPopover();
  } else {
    el.style.display = "block";
  }
}

/**
 * Close a popover element.
 * Falls back to `el.style.display = "none"`.
 */
export function closePopover(el: HTMLElement): void {
  if (supportsPopover()) {
    el.hidePopover();
  } else {
    el.style.display = "none";
  }
}

/**
 * Toggle a popover element open/closed.
 * Falls back to display toggling.
 */
export function togglePopover(el: HTMLElement): void {
  if (supportsPopover()) {
    el.togglePopover();
  } else {
    el.style.display = el.style.display === "none" || el.style.display === "" ? "block" : "none";
  }
}

/**
 * Returns `true` when the element is currently open.
 * Uses the `:popover-open` pseudo-class check on supporting browsers,
 * falls back to `display` inspection.
 */
export function isPopoverOpen(el: HTMLElement): boolean {
  if (supportsPopover()) {
    return el.matches(":popover-open");
  }
  return el.style.display !== "" && el.style.display !== "none";
}

// ─── managed popover ─────────────────────────────────────────────────────────

/** Handle returned by `createManagedPopover`. */
export interface ManagedPopover {
  /** The underlying `<div popover>` element. */
  readonly element: HTMLElement;
  show(): void;
  hide(): void;
  toggle(): void;
  /** Removes the popover from the DOM and cleans up listeners. */
  destroy(): void;
}

/**
 * Inject a `<div popover="auto">` child into `host` containing `content`.
 *
 * @param host     Parent element that receives the popover as a child.
 * @param content  HTML string or `DocumentFragment` for popover body.
 * @param manual   When `true`, uses `popover="manual"` (no light-dismiss).
 */
export function createManagedPopover(
  host: HTMLElement,
  content: string | DocumentFragment,
  manual = false,
): ManagedPopover {
  const el = document.createElement("div");
  el.setAttribute("popover", manual ? "manual" : "auto");
  el.classList.add("managed-popover");

  if (typeof content === "string") {
    el.innerHTML = content;
  } else {
    el.appendChild(content);
  }

  host.appendChild(el);

  return {
    element: el,
    show: () => openPopover(el),
    hide: () => closePopover(el),
    toggle: () => togglePopover(el),
    destroy: (): void => {
      try {
        closePopover(el);
      } catch {
        /* already closed */
      }
      el.remove();
    },
  };
}

// ─── anchor trigger ───────────────────────────────────────────────────────────

/**
 * Wire a trigger button as the invoking control for a popover via
 * the `popovertarget` attribute (native browser wiring — no JS listener).
 *
 * Falls back to a click listener on unsupported browsers.
 *
 * @returns Cleanup function.
 */
export function attachAnchorTrigger(trigger: HTMLElement, popover: HTMLElement): () => void {
  if (supportsPopover() && popover.id) {
    trigger.setAttribute("popovertarget", popover.id);
    return () => trigger.removeAttribute("popovertarget");
  }

  // Fallback: manual click listener
  const handler = (): void => togglePopover(popover);
  trigger.addEventListener("click", handler);
  return () => trigger.removeEventListener("click", handler);
}
