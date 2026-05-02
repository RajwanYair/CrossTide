/**
 * Toast notification system — auto-dismiss notifications.
 *
 * Creates a container once, appends toast elements that self-remove.
 * No external dependencies.
 *
 * G9: The container uses `popover="manual"` when supported so it renders
 * in the browser's top layer (bypassing z-index). Falls back to the
 * previous fixed-position approach on older browsers.
 */

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastOptions {
  readonly message: string;
  readonly type?: ToastType;
  /** Auto-dismiss delay in ms. 0 = manual dismiss only. Default 4000. */
  readonly durationMs?: number;
}

interface ActiveToast {
  readonly el: HTMLElement;
  readonly timer: ReturnType<typeof setTimeout> | null;
}

const CONTAINER_ID = "toast-container";
const DEFAULT_DURATION = 4000;

let container: HTMLElement | null = null;
const activeToasts: ActiveToast[] = [];

function supportsPopover(el: HTMLElement): el is HTMLElement & {
  showPopover(): void;
  hidePopover(): void;
} {
  return typeof (el as unknown as { showPopover?: unknown }).showPopover === "function";
}

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container;
  container = document.createElement("div");
  container.id = CONTAINER_ID;
  container.setAttribute("aria-live", "polite");
  container.setAttribute("role", "status");
  // G9: Popover API — top-layer rendering when supported (Chrome 114+, Safari 17+, Firefox 125+).
  container.setAttribute("popover", "manual");
  document.body.appendChild(container);
  return container;
}

function dismiss(toast: ActiveToast): void {
  if (toast.timer !== null) clearTimeout(toast.timer);
  toast.el.classList.add("toast-exit");

  const idx = activeToasts.indexOf(toast);
  if (idx !== -1) activeToasts.splice(idx, 1);

  const onEnd = (): void => {
    toast.el.remove();
    // G9: hide the popover container once all toasts are gone.
    if (activeToasts.length === 0 && container && supportsPopover(container)) {
      try {
        container.hidePopover();
      } catch {
        // hidePopover throws if the element is not currently shown — ignore.
      }
    }
  };
  if (typeof toast.el.getAnimations === "function" && toast.el.getAnimations().length > 0) {
    toast.el.addEventListener("animationend", onEnd, { once: true });
  } else {
    onEnd();
  }
}

export function showToast(options: ToastOptions): () => void {
  const parent = ensureContainer();
  const type = options.type ?? "info";
  const duration = options.durationMs ?? DEFAULT_DURATION;

  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.setAttribute("role", "alert");
  el.textContent = options.message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.setAttribute("aria-label", "Dismiss");
  closeBtn.textContent = "\u00d7";
  el.appendChild(closeBtn);

  parent.appendChild(el);

  // G9: show the container popover when the first toast arrives.
  if (activeToasts.length === 0 && supportsPopover(parent)) {
    try {
      parent.showPopover();
    } catch {
      // showPopover throws if already shown — safe to ignore.
    }
  }

  const timer = duration > 0 ? setTimeout(() => dismiss(toast), duration) : null;
  const toast: ActiveToast = { el, timer };
  activeToasts.push(toast);

  closeBtn.addEventListener("click", () => dismiss(toast));

  return () => dismiss(toast);
}

export function clearAllToasts(): void {
  for (const t of [...activeToasts]) dismiss(t);
}

/** Returns the number of currently visible toasts. */
export function toastCount(): number {
  return activeToasts.length;
}
