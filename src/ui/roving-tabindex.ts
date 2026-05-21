/**
 * Roving Tabindex — arrow key navigation for grouped interactive elements.
 *
 * Implements the WAI-ARIA Authoring Practices "Roving Tabindex" pattern:
 * - Only one element in the group has tabindex="0" (focused).
 * - All others have tabindex="-1".
 * - Arrow keys move focus within the group.
 * - Home/End jump to first/last item.
 *
 * Works for both horizontal (Left/Right) and vertical (Up/Down) navigation.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex
 */

export type Orientation = "horizontal" | "vertical" | "both";

export interface RovingOptions {
  /** CSS selector for items within the container. */
  readonly selector: string;
  /** Navigation axis. Default: "both". */
  readonly orientation?: Orientation;
  /** Wrap at boundaries. Default: true. */
  readonly wrap?: boolean;
  /** Callback when active item changes. */
  readonly onActivate?: (item: HTMLElement, index: number) => void;
}

export interface RovingHandle {
  /** Move focus to the item at the given index. */
  focusItem(index: number): void;
  /** Get the currently active index. */
  activeIndex(): number;
  /** Refresh the item list (call after DOM changes). */
  refresh(): void;
  /** Remove all event listeners and reset tabindex. */
  destroy(): void;
}

/**
 * Enable roving tabindex navigation on a container.
 */
export function enableRovingTabindex(container: HTMLElement, options: RovingOptions): RovingHandle {
  const { selector, orientation = "both", wrap = true, onActivate } = options;
  let items: HTMLElement[] = [];
  let current = 0;

  function refresh(): void {
    items = Array.from(container.querySelectorAll<HTMLElement>(selector));
    // Set initial tabindex state
    items.forEach((el, i) => {
      el.setAttribute("tabindex", i === current ? "0" : "-1");
    });
  }

  function focusItem(index: number): void {
    if (items.length === 0) return;
    // Clamp or wrap
    if (wrap) {
      index = ((index % items.length) + items.length) % items.length;
    } else {
      index = Math.max(0, Math.min(items.length - 1, index));
    }
    // Update tabindex
    const prev = items[current];
    if (prev) prev.setAttribute("tabindex", "-1");
    current = index;
    const next = items[current];
    if (next) {
      next.setAttribute("tabindex", "0");
      next.focus();
      onActivate?.(next, current);
    }
  }

  function handleKeyDown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (!items.includes(target)) return;

    let handled = false;
    switch (e.key) {
      case "ArrowRight":
        if (orientation === "horizontal" || orientation === "both") {
          focusItem(current + 1);
          handled = true;
        }
        break;
      case "ArrowLeft":
        if (orientation === "horizontal" || orientation === "both") {
          focusItem(current - 1);
          handled = true;
        }
        break;
      case "ArrowDown":
        if (orientation === "vertical" || orientation === "both") {
          focusItem(current + 1);
          handled = true;
        }
        break;
      case "ArrowUp":
        if (orientation === "vertical" || orientation === "both") {
          focusItem(current - 1);
          handled = true;
        }
        break;
      case "Home":
        focusItem(0);
        handled = true;
        break;
      case "End":
        focusItem(items.length - 1);
        handled = true;
        break;
    }
    if (handled) e.preventDefault();
  }

  container.addEventListener("keydown", handleKeyDown);
  refresh();

  return {
    focusItem,
    activeIndex: () => current,
    refresh,
    destroy(): void {
      container.removeEventListener("keydown", handleKeyDown);
      items.forEach((el) => el.removeAttribute("tabindex"));
    },
  };
}
