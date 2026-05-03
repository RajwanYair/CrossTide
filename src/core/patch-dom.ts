/**
 * patchDOM — Incremental DOM patching via morphdom.
 *
 * Wraps morphdom to provide a minimal API for card re-renders.
 * Instead of `container.innerHTML = html`, cards call:
 *   patchDOM(container, html)
 *
 * Benefits:
 * - Preserves focus, scroll position, and CSS transitions
 * - Minimizes DOM mutations (fewer reflows/repaints)
 * - Preserves event listeners on elements that don't change
 */
import morphdom from "morphdom";

/**
 * Patch the children of `container` to match `newHtml`.
 * Uses a wrapper div to morph children without replacing the container itself.
 */
export function patchDOM(container: HTMLElement, newHtml: string): void {
  // Create a temporary wrapper with the new content
  const wrapper = document.createElement("div");
  wrapper.innerHTML = newHtml;

  // If container is empty or has no element children, just set innerHTML (first render)
  if (!container.firstElementChild) {
    container.innerHTML = newHtml;
    return;
  }

  // Morph from current container children to new content
  morphdom(container, wrapper, {
    childrenOnly: true,
    onBeforeElUpdated(fromEl, toEl) {
      // Skip elements that are identical
      if (fromEl.isEqualNode(toEl)) return false;
      // Preserve focused element's value during morph
      if (fromEl === document.activeElement && fromEl instanceof HTMLInputElement) {
        (toEl as HTMLInputElement).value = fromEl.value;
      }
      return true;
    },
  });
}
