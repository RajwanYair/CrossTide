/**
 * ARIA live-region announcer. Creates a single shared visually-hidden
 * `<div role="status" aria-live="polite">` element on first use and
 * announces messages to screen readers without changing focus.
 *
 *   announce("Loaded 12 results")            // polite (default)
 *   announce("Connection lost", "assertive") // assertive
 *
 * Empty/blank messages are ignored. Calls in non-DOM environments are
 * no-ops, so this is safe to import in workers and SSR.
 */

export type AriaLivePoliteness = "polite" | "assertive";

const REGION_ID = "ct-aria-live-region";
const ASSERT_ID = "ct-aria-live-assertive";

function ensureRegion(politeness: AriaLivePoliteness): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const id = politeness === "assertive" ? ASSERT_ID : REGION_ID;
  let el = document.getElementById(id);
  if (el) return el;
  el = document.createElement("div");
  el.id = id;
  el.setAttribute("role", politeness === "assertive" ? "alert" : "status");
  el.setAttribute("aria-live", politeness);
  el.setAttribute("aria-atomic", "true");
  Object.assign(el.style, {
    position: "absolute", width: "1px", height: "1px",
    margin: "-1px", padding: "0", overflow: "hidden",
    clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: "0",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(el);
  return el;
}

export function announce(message: string, politeness: AriaLivePoliteness = "polite"): boolean {
  const trimmed = message.trim();
  if (trimmed === "") return false;
  const el = ensureRegion(politeness);
  if (!el) return false;
  // Re-trigger announcement even when text repeats by clearing first.
  el.textContent = "";
  void el.offsetHeight;
  el.textContent = trimmed;
  return true;
}

export function clearAnnouncements(): void {
  if (typeof document === "undefined") return;
  for (const id of [REGION_ID, ASSERT_ID]) {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  }
}
