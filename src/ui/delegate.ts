/**
 * Event delegation utility (K4) — `data-action` dispatch pattern.
 *
 * Instead of attaching individual event listeners to every interactive element
 * after each render, a single listener on the container delegates events to
 * handlers registered by action name.
 *
 * Usage:
 *   const delegate = createDelegate(container, {
 *     "add-ticker": (el, e) => { ... },
 *     "remove-ticker": (el, e) => { ... },
 *   });
 *
 *   // In HTML:  <button data-action="add-ticker" data-ticker="AAPL">Add</button>
 *
 *   // Call dispose when the card unmounts:
 *   delegate.dispose();
 */

export type ActionHandler = (target: HTMLElement, event: Event) => void;

export interface DelegateHandle {
  /** Stop listening. Safe to call multiple times. */
  dispose(): void;
}

/**
 * Attach a single delegated event listener on `container` for all `click`
 * events that bubble up from elements (or their ancestors) with a
 * `data-action` attribute matching a key in the `handlers` map.
 *
 * Additional event types can be delegated by passing `eventTypes` option.
 */
export function createDelegate(
  container: HTMLElement,
  handlers: Readonly<Record<string, ActionHandler>>,
  options: { eventTypes?: readonly string[] } = {},
): DelegateHandle {
  const types = options.eventTypes ?? ["click"];

  const listener = (event: Event): void => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-action]");
    if (!target || !container.contains(target)) return;

    const action = target.dataset["action"];
    if (!action) return;

    const handler = handlers[action];
    if (handler) {
      handler(target, event);
    }
  };

  for (const type of types) {
    container.addEventListener(type, listener, { passive: type !== "submit" });
  }

  let disposed = false;

  return {
    dispose(): void {
      if (disposed) return;
      disposed = true;
      for (const type of types) {
        container.removeEventListener(type, listener);
      }
    },
  };
}
