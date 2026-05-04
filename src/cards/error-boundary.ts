/**
 * Error boundary for card mount and update (P8).
 *
 * Wraps CardModule mount/update/dispose calls so a single card crash cannot
 * take down the entire application. On failure the card's container shows an
 * inline error message rather than propagating the exception up to main.ts.
 */
import type { CardModule, CardContext, CardHandle } from "./registry";

function renderErrorFallback(container: HTMLElement, err: unknown): void {
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  container.innerHTML = `
    <div class="card card--error">
      <div class="card-header">
        <h2 class="card-title">Something went wrong</h2>
      </div>
      <div class="card-body">
        <p class="error-message">${msg.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        <button class="btn btn--sm btn--secondary" onclick="window.location.reload()">
          Reload page
        </button>
      </div>
    </div>`;
}

/**
 * Wraps a CardModule so that `mount` and `update` are guarded by try-catch.
 * Thrown errors render an error fallback in the card's container instead of
 * crashing the entire app.
 */
export function withErrorBoundary(card: CardModule): CardModule {
  return {
    mount(container: HTMLElement, ctx: CardContext): CardHandle | void {
      try {
        const handle = card.mount(container, ctx);
        if (!handle) return handle;

        const wrapped: CardHandle = {
          ...(handle.update != null && {
            update: (nextCtx: CardContext): void => {
              try {
                handle.update!(nextCtx);
              } catch (err) {
                console.error("[error-boundary] card update failed:", err);
                renderErrorFallback(container, err);
              }
            },
          }),
          ...(handle.dispose != null && { dispose: handle.dispose }),
        };
        return wrapped;
      } catch (err) {
        console.error("[error-boundary] card mount failed:", err);
        renderErrorFallback(container, err);
      }
    },
  };
}
