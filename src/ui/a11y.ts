/**
 * Accessibility utilities — focus management, screen reader announcements.
 */

const LIVE_REGION_ID = "sr-announcer";

function ensureLiveRegion(): HTMLElement {
  let el = document.getElementById(LIVE_REGION_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = LIVE_REGION_ID;
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.className = "sr-only";
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Announce a message to screen readers via a live region.
 */
export function announce(message: string, priority: "polite" | "assertive" = "polite"): void {
  const el = ensureLiveRegion();
  el.setAttribute("aria-live", priority);
  el.textContent = "";
  // Force reflow so screen readers pick up the change
  void el.offsetHeight;
  el.textContent = message;
}

/**
 * Trap focus within an element. Returns a cleanup function.
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handler(e: KeyboardEvent): void {
    if (e.key !== "Tab") return;
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  container.addEventListener("keydown", handler);
  first?.focus();

  return () => container.removeEventListener("keydown", handler);
}

/**
 * Check if the user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
