/**
 * Canonical error boundary for card mount, update, and lazy-load failures.
 */
import type { CardContext, CardHandle, CardModule } from "./registry";

export interface ErrorBoundaryOptions {
  /** Maximum automatic retries before showing a manual retry button. */
  readonly maxRetries?: number;
  /** Optional callback when an error is captured. */
  readonly onError?: (error: unknown, ctx: CardContext) => void;
}

const DEFAULT_MAX_RETRIES = 1;

/** Wrap a card module with isolated fallback and retry behavior. */
export function withErrorBoundary(mod: CardModule, options: ErrorBoundaryOptions = {}): CardModule {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  function mount(container: HTMLElement, ctx: CardContext): CardHandle {
    let handle: CardHandle | void;
    let retries = 0;

    function renderFallback(error: unknown): void {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "An unexpected error occurred";
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
      btn.type = "button";
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
      } catch (error: unknown) {
        options.onError?.(error, ctx);
        if (retries < maxRetries) {
          retries++;
          tryMount();
        } else {
          renderFallback(error);
        }
      }
    }

    tryMount();

    return {
      update(newCtx: CardContext): void {
        try {
          handle?.update?.(newCtx);
        } catch (error: unknown) {
          options.onError?.(error, newCtx);
          renderFallback(error);
        }
      },
      dispose(): void {
        try {
          handle?.dispose?.();
        } catch {
          // Disposal must not take down sibling cards.
        }
      },
    };
  }

  return { mount };
}

/** Wrap a lazy card loader and mount it with the canonical card boundary. */
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
      return (
        withErrorBoundary(mod, options).mount(container, ctx) ?? {
          update(): void {},
          dispose(): void {},
        }
      );
    } catch (error: unknown) {
      options.onError?.(error, ctx);
      if (retries < maxRetries) {
        retries++;
        return attempt();
      }

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
      btn.type = "button";
      btn.textContent = "Retry";
      btn.addEventListener("click", () => {
        retries = 0;
        void attempt();
      });
      wrapper.appendChild(btn);
      container.appendChild(wrapper);

      return {
        update(): void {},
        dispose(): void {
          container.innerHTML = "";
        },
      };
    }
  }

  return attempt();
}
