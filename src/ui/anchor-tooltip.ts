/**
 * CSS Anchor Positioning helper for chart crosshair tooltips.  (H1)
 *
 * CSS Anchor Positioning (Baseline 2025 — Chrome 125+, Firefox 130+) lets
 * a "positioned" element (e.g. a tooltip) declare `position-anchor` and use
 * the `anchor()` function in inset properties, so the browser computes the
 * tooltip position entirely in CSS without JavaScript's `getBoundingClientRect`.
 *
 * This module provides a thin adapter layer that:
 *   1. Detects whether CSS Anchor Positioning is supported.
 *   2. When supported: sets `anchor-name` on the crosshair marker element
 *      and `position-anchor` on the tooltip.  The tooltip position then
 *      tracks the crosshair using pure CSS.
 *   3. When unsupported: falls back to `style.left / style.top` (the old
 *      `getBoundingClientRect` approach).
 *
 * Usage:
 *   const ap = createAnchorTooltip(markerEl, tooltipEl);
 *   // On crosshair move:
 *   ap.update(x, y);       // no-op in CSS-native path; sets style.* in fallback
 *   // To clean up:
 *   ap.destroy();
 *
 * MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/anchor-name
 */

export interface AnchorTooltip {
  /** Update the crosshair position.  No-op in the CSS-native path. */
  update(x: number, y: number): void;
  /** Remove anchor-name / inline styles added by this helper. */
  destroy(): void;
  /** True if the CSS Anchor Positioning API is available. */
  readonly native: boolean;
}

/** Counter for unique anchor names (prevents collisions on multi-chart pages). */
let _uid = 0;

/**
 * Returns true if the browser supports CSS Anchor Positioning
 * (i.e. `anchor-name` is a valid CSS property).
 */
export function cssAnchorPositioningSupported(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
  return CSS.supports("anchor-name", "--test-anchor");
}

/**
 * Wire up CSS Anchor Positioning between `anchorEl` (the crosshair marker)
 * and `tooltipEl` (the floating label).
 *
 * @param anchorEl   - The element used as the CSS anchor (crosshair line / dot).
 * @param tooltipEl  - The tooltip element that should follow the anchor.
 * @param anchorId   - Optional explicit anchor name (e.g. `"--chart-crosshair"`).
 *                     Auto-generated if omitted.
 */
export function createAnchorTooltip(
  anchorEl: HTMLElement,
  tooltipEl: HTMLElement,
  anchorId?: string,
): AnchorTooltip {
  const native = cssAnchorPositioningSupported();
  const name = anchorId ?? `--ct-anchor-${++_uid}`;

  if (native) {
    // Set anchor-name on the marker and position-anchor on the tooltip.
    // The CSS rules in components.css handle the actual inset positioning.
    anchorEl.style.setProperty("anchor-name", name);
    tooltipEl.style.setProperty("position-anchor", name);
    tooltipEl.style.setProperty("position", "absolute");
  }

  return {
    native,
    update(x: number, y: number): void {
      if (native) {
        // In the CSS-native path the browser moves the tooltip via CSS.
        // We still expose x/y as custom properties for the CSS `anchor()`
        // expression in case the anchor marker uses them (e.g. translate).
        anchorEl.style.setProperty("--ct-x", `${x}px`);
        anchorEl.style.setProperty("--ct-y", `${y}px`);
      } else {
        // Fallback: manual positioning via style.left / style.top.
        tooltipEl.style.left = `${x}px`;
        tooltipEl.style.top = `${y}px`;
      }
    },
    destroy(): void {
      anchorEl.style.removeProperty("anchor-name");
      anchorEl.style.removeProperty("--ct-x");
      anchorEl.style.removeProperty("--ct-y");
      tooltipEl.style.removeProperty("position-anchor");
      tooltipEl.style.removeProperty("position");
      tooltipEl.style.removeProperty("left");
      tooltipEl.style.removeProperty("top");
    },
  };
}
