/**
 * Error boundary for cards — wraps mount/update in try-catch,
 * renders a fallback UI with retry on failure.
 */
import type { CardContext, CardHandle, CardModule } from "../cards/registry";

export interface ErrorBoundaryOptions {
  /** Maximum automatic retries before showing manual retry button. */
  readonly maxRetries?: number;
  /** Optional callback when an error is captured. */
  readonly onError?: (error: unknown, ctx: CardContext) => void;
}

const DEFAULT_MAX_RETRIES = 1;

/**
 * Wrap a card module's mount in an error boundary.
 * Returns a new `mount` function that:
 * - catches sync errors thrown inside `mount()` or `update()`
 * - renders a fallback with a "Retry" button
 * - auto-retries up to `maxRetries` before showing the button
 */
export function withErrorBoundary(mod: CardModule, options: ErrorBoundaryOptions = {}): CardModule {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  function mount(container: HTMLElement, ctx: CardContext): CardHandle {
    let handle: CardHandle | void;
    let retries = 0;

    function renderFallback(error: unknown): void {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      container.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "error-boundary";
      wrapper.setAttribute("role", "alert");

      const msg = document.createElement("p");
      msg.className = "error-boundary__message";
      msg.textContent = `Something went wrong: ${message}`;
      wrapper.appendChild(msg);

      const btn = document.createElement("button");
      btn.className = "error-boundary__retry";
      btn.textContent = "Retry";
      btn.addEventListener("click", () => {
        retries = 0;
        tryMount();
      });
      wrapper.appendChild(btn);
      container.appendChild(wrapper);
    }

    function tryMount(): void {
      try {
        container.innerHTML = "";
        handle = mod.mount(container, ctx);
      } catch (err) {
        options.onError?.(err, ctx);
        if (retries < maxRetries) {
          retries++;
          tryMount();
        } else {
          renderFallback(err);
        }
      }
    }

    tryMount();

    return {
      update(newCtx: CardContext): void {
        try {
          if (handle?.update) {
            handle.update(newCtx);
          }
        } catch (err) {
          options.onError?.(err, newCtx);
          renderFallback(err);
        }
      },
      dispose(): void {
        try {
          handle?.dispose?.();
        } catch {
          // swallow dispose errors
        }
      },
    };
  }

  return { mount };
}

/**
 * Async error boundary — wraps the dynamic import + mount flow.
 * Use this to replace the inline try/catch in activateCard.
 */
export async function mountWithBoundary(
  container: HTMLElement,
  ctx: CardContext,
  loader: () => Promise<CardModule>,
  options: ErrorBoundaryOptions = {},
): Promise<CardHandle> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  let retries = 0;

  async function attempt(): Promise<CardHandle> {
    try {
      const mod = await loader();
      const wrapped = withErrorBoundary(mod, options);
      // withErrorBoundary.mount always returns a CardHandle (never void)
      return wrapped.mount(container, ctx) ?? { update(): void {}, dispose(): void {} };
    } catch (err) {
      options.onError?.(err, ctx);
      if (retries < maxRetries) {
        retries++;
        return attempt();
      }
      // Render load-failure fallback
      container.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "error-boundary";
      wrapper.setAttribute("role", "alert");

      const msg = document.createElement("p");
      msg.className = "error-boundary__message";
      msg.textContent = `Failed to load card: ${ctx.route}`;
      wrapper.appendChild(msg);

      const btn = document.createElement("button");
      btn.className = "error-boundary__retry";
      btn.textContent = "Retry";
      btn.addEventListener("click", () => {
        retries = 0;
        void attempt();
      });
      wrapper.appendChild(btn);
      container.appendChild(wrapper);

      return {
        update(): void {
          /* no-op while in error state */
        },
        dispose(): void {
          container.innerHTML = "";
        },
      };
    }
  }

  return attempt();
}
