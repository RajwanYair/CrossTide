/**
 * Error boundary for card mount and update (P8).
 *
 * Wraps CardModule mount/update/dispose calls so a single card crash cannot
 * take down the entire application. On failure the card's container shows an
 * inline error message with a retry action that re-mounts the card without a
 * full page reload.
 */
import type { CardModule, CardContext, CardHandle } from "./registry";

const MAX_RETRIES = 3;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderErrorFallback(
  container: HTMLElement,
  err: unknown,
  attempt: number,
  onRetry: () => void,
): void {
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  const canRetry = attempt < MAX_RETRIES;
  const retryHtml = canRetry
    ? `<button class="btn btn--sm btn--secondary" data-action="retry" type="button">
         Retry${attempt > 0 ? ` (${String(attempt)}/${String(MAX_RETRIES)})` : ""}
       </button>`
    : `<p class="error-hint">Maximum retries reached. <a href="" onclick="event.preventDefault();window.location.reload()">Reload page</a></p>`;

  container.innerHTML = `
    <div class="card card--error" role="alert">
      <div class="card-header">
        <h2 class="card-title">Something went wrong</h2>
      </div>
      <div class="card-body">
        <p class="error-message">${escapeHtml(msg)}</p>
        ${retryHtml}
      </div>
    </div>`;

  if (canRetry) {
    container.querySelector<HTMLButtonElement>("[data-action='retry']")?.addEventListener(
      "click",
      () => {
        onRetry();
      },
      { once: true },
    );
  }
}

/**
 * Wraps a CardModule so that `mount` and `update` are guarded by try-catch.
 * Thrown errors render an error fallback in the card's container. The fallback
 * includes a Retry button that re-calls `mount` — no full page reload needed.
 */
export function withErrorBoundary(card: CardModule): CardModule {
  return {
    mount(container: HTMLElement, ctx: CardContext): CardHandle | void {
      let attempt = 0;

      function tryMount(): CardHandle | void {
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
                  attempt++;
                  renderErrorFallback(container, err, attempt, () => {
                    attempt++;
                    tryMount();
                  });
                }
              },
            }),
            ...(handle.dispose != null && { dispose: handle.dispose }),
          };
          return wrapped;
        } catch (err) {
          console.error("[error-boundary] card mount failed:", err);
          renderErrorFallback(container, err, attempt, () => {
            attempt++;
            tryMount();
          });
        }
      }

      return tryMount();
    },
  };
}
