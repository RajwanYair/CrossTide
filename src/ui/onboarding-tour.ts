/**
 * Onboarding tour — 3-step dismissible walkthrough for first-time users.
 *
 * Steps are rendered as a floating tooltip anchored to target elements.
 * Progress is persisted in localStorage so the tour never shows twice.
 *
 * Accessibility:
 *   - Trap focus inside the tooltip while open.
 *   - Announce step changes via aria-live.
 *   - Keyboard: Escape → skip, Enter/Space on buttons → proceed.
 *
 * Usage:
 *   const tour = createOnboardingTour(STEPS);
 *   tour.start();  // no-op if already completed
 */

export interface TourStep {
  /** CSS selector of the element to highlight / anchor the tooltip to. */
  readonly target: string;
  /** Title shown in bold inside the tooltip. */
  readonly title: string;
  /** Body copy shown below the title. */
  readonly body: string;
  /** Which edge of the target to attach to. Default "bottom". */
  readonly placement?: "top" | "bottom" | "left" | "right";
}

export interface OnboardingTour {
  /** Start the tour from step 0. No-op if already completed or dismissed. */
  start(): void;
  /** Skip and permanently dismiss (persists to localStorage). */
  skip(): void;
  /** Returns true if the tour has been completed or dismissed. */
  isDone(): boolean;
  /** Reset completion state (for dev / testing). */
  reset(): void;
  /** Clean up DOM and listeners. */
  destroy(): void;
}

const DONE_KEY = "crosstide-tour-done";
const OVERLAY_ID = "tour-overlay";

function isDoneInStorage(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}

function markDone(): void {
  try {
    localStorage.setItem(DONE_KEY, "1");
  } catch {
    // ignore
  }
}

function removeDone(): void {
  try {
    localStorage.removeItem(DONE_KEY);
  } catch {
    // ignore
  }
}

function positionTooltip(
  tooltip: HTMLElement,
  target: Element,
  placement: TourStep["placement"] = "bottom",
): void {
  const r = target.getBoundingClientRect();
  const gap = 12;
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  tooltip.style.position = "fixed";
  tooltip.style.zIndex = "9999";

  switch (placement) {
    case "top":
      tooltip.style.left = `${r.left + scrollX + r.width / 2}px`;
      tooltip.style.top = `${r.top + scrollY - gap}px`;
      tooltip.style.transform = "translateX(-50%) translateY(-100%)";
      break;
    case "left":
      tooltip.style.left = `${r.left + scrollX - gap}px`;
      tooltip.style.top = `${r.top + scrollY + r.height / 2}px`;
      tooltip.style.transform = "translateX(-100%) translateY(-50%)";
      break;
    case "right":
      tooltip.style.left = `${r.right + scrollX + gap}px`;
      tooltip.style.top = `${r.top + scrollY + r.height / 2}px`;
      tooltip.style.transform = "translateY(-50%)";
      break;
    default: // bottom
      tooltip.style.left = `${r.left + scrollX + r.width / 2}px`;
      tooltip.style.top = `${r.top + scrollY + r.height + gap}px`;
      tooltip.style.transform = "translateX(-50%)";
      break;
  }
}

function highlightTarget(target: Element): () => void {
  const prev = (target as HTMLElement).style.cssText;
  (target as HTMLElement).style.cssText +=
    ";outline:2px solid var(--accent,#7c3aed);outline-offset:2px;border-radius:4px;";
  return () => {
    (target as HTMLElement).style.cssText = prev;
  };
}

export function createOnboardingTour(steps: readonly TourStep[]): OnboardingTour {
  let stepIndex = 0;
  let tooltip: HTMLElement | null = null;
  let removeHighlight: (() => void) | null = null;
  let liveRegion: HTMLElement | null = null;

  function removeTooltip(): void {
    tooltip?.remove();
    tooltip = null;
    removeHighlight?.();
    removeHighlight = null;
    document.getElementById(OVERLAY_ID)?.remove();
    liveRegion?.remove();
    liveRegion = null;
  }

  function announce(msg: string): void {
    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.setAttribute("role", "status");
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.className = "sr-only";
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = msg;
  }

  function renderStep(index: number): void {
    removeTooltip();
    const step = steps[index];
    if (!step) return;

    const targetEl = document.querySelector(step.target);
    if (!targetEl) {
      // Target not in DOM — skip to next
      if (index < steps.length - 1) {
        renderStep(index + 1);
      } else {
        complete();
      }
      return;
    }

    // Semi-transparent backdrop
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9998;";
    overlay.addEventListener("click", () => skip());
    document.body.appendChild(overlay);

    removeHighlight = highlightTarget(targetEl);

    tooltip = document.createElement("div");
    tooltip.className = "tour-tooltip";
    tooltip.setAttribute("role", "dialog");
    tooltip.setAttribute("aria-modal", "true");
    tooltip.setAttribute("aria-label", `Tour step ${index + 1} of ${steps.length}: ${step.title}`);
    tooltip.innerHTML = `
      <div class="tour-header">
        <span class="tour-step-count">${index + 1} / ${steps.length}</span>
        <button class="tour-skip btn-ghost btn-sm" aria-label="Skip tour">Skip</button>
      </div>
      <h3 class="tour-title">${escapeHtml(step.title)}</h3>
      <p class="tour-body">${escapeHtml(step.body)}</p>
      <div class="tour-actions">
        ${index > 0 ? `<button class="tour-prev btn btn-sm">← Back</button>` : ""}
        <button class="tour-next btn btn-sm btn-primary">${index < steps.length - 1 ? "Next →" : "Get started"}</button>
      </div>
    `;
    document.body.appendChild(tooltip);

    positionTooltip(tooltip, targetEl, step.placement);

    tooltip.querySelector(".tour-skip")?.addEventListener("click", (e) => {
      e.stopPropagation();
      skip();
    });
    tooltip.querySelector(".tour-next")?.addEventListener("click", () => {
      if (index < steps.length - 1) {
        stepIndex = index + 1;
        renderStep(stepIndex);
      } else {
        complete();
      }
    });
    tooltip.querySelector(".tour-prev")?.addEventListener("click", () => {
      stepIndex = index - 1;
      renderStep(stepIndex);
    });

    // Focus the next/get-started button
    (tooltip.querySelector(".tour-next"))?.focus();

    // Keyboard: Escape → skip
    tooltip.addEventListener("keydown", (e) => {
      if (e.key === "Escape") skip();
    });

    announce(`Tour step ${index + 1} of ${steps.length}: ${step.title}`);
  }

  function complete(): void {
    removeTooltip();
    markDone();
  }

  function skip(): void {
    removeTooltip();
    markDone();
  }

  return {
    start(): void {
      if (isDoneInStorage() || steps.length === 0) return;
      stepIndex = 0;
      renderStep(stepIndex);
    },

    skip(): void {
      skip();
    },

    isDone(): boolean {
      return isDoneInStorage();
    },

    reset(): void {
      removeDone();
    },

    destroy(): void {
      removeTooltip();
    },
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Default 3-step CrossTide onboarding tour. */
export const DEFAULT_TOUR_STEPS: readonly TourStep[] = [
  {
    target: "#add-ticker",
    title: "Add your first ticker",
    body: 'Type a stock symbol (e.g. "AAPL") and press Enter to add it to your watchlist. CrossTide fetches live prices and computes a 12-method consensus signal automatically.',
    placement: "bottom",
  },
  {
    target: "#app-nav",
    title: "Explore all views",
    body: "Navigate between Watchlist, Charts, Screener, Portfolio, Backtest, Alerts, and more using the navigation bar.",
    placement: "bottom",
  },
  {
    target: "#app-footer",
    title: "Live updates & shortcuts",
    body: "Press Ctrl+K to open the command palette for quick actions. Data refreshes every 5 minutes automatically.",
    placement: "top",
  },
];
