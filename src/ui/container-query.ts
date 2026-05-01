/**
 * Container-query helper. Observes element width and emits a discrete
 * size class ("xs"|"sm"|"md"|"lg"|"xl") so cards can adapt layout.
 *
 * Wraps ResizeObserver. In environments without ResizeObserver (e.g.
 * old test harnesses) the observer is a no-op that returns the initial
 * size and a disposer.
 */

export type ContainerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ContainerSizeBreakpoints {
  /** Element width strictly less than `sm` => "xs". Default 320. */
  readonly sm: number;
  /** Width >= sm and < md => "sm". Default 480. */
  readonly md: number;
  /** Width >= md and < lg => "md". Default 768. */
  readonly lg: number;
  /** Width >= lg and < xl => "lg". Default 1024. Width >= xl => "xl". */
  readonly xl: number;
}

const DEFAULT_BREAKPOINTS: ContainerSizeBreakpoints = {
  sm: 320,
  md: 480,
  lg: 768,
  xl: 1024,
};

export function classifyWidth(
  width: number,
  bp: ContainerSizeBreakpoints = DEFAULT_BREAKPOINTS,
): ContainerSize {
  if (width < bp.sm) return "xs";
  if (width < bp.md) return "sm";
  if (width < bp.lg) return "md";
  if (width < bp.xl) return "lg";
  return "xl";
}

export interface ContainerQueryHandle {
  readonly current: ContainerSize;
  dispose(): void;
}

export interface ContainerQueryOptions {
  readonly breakpoints?: ContainerSizeBreakpoints;
  readonly onChange?: (size: ContainerSize, width: number) => void;
}

/**
 * Watch an element's width and fire `onChange` when the discrete
 * size class changes.
 */
export function observeContainer(
  el: Element,
  options: ContainerQueryOptions = {},
): ContainerQueryHandle {
  const bp = options.breakpoints ?? DEFAULT_BREAKPOINTS;
  let current: ContainerSize = classifyWidth(
    el.getBoundingClientRect().width,
    bp,
  );

  const RO = (globalThis as { ResizeObserver?: typeof ResizeObserver })
    .ResizeObserver;
  if (typeof RO !== "function") {
    return {
      get current(): ContainerSize {
        return current;
      },
      dispose(): void {
        // no-op
      },
    };
  }

  const ro = new RO((entries) => {
    for (const e of entries) {
      const width = e.contentRect.width;
      const next = classifyWidth(width, bp);
      if (next !== current) {
        current = next;
        options.onChange?.(next, width);
      }
    }
  });
  ro.observe(el);

  return {
    get current(): ContainerSize {
      return current;
    },
    dispose(): void {
      ro.disconnect();
    },
  };
}
