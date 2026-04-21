/**
 * Modal component — accessible dialog with focus trap.
 */

export interface ModalOptions {
  readonly title: string;
  readonly content: string | HTMLElement;
  readonly onClose?: () => void;
}

const MODAL_OVERLAY_CLASS = "modal-overlay";
const MODAL_CLASS = "modal";
let activeModal: HTMLElement | null = null;

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === "Escape") closeModal();
}

export function openModal(options: ModalOptions): HTMLElement {
  closeModal(); // Only one modal at a time

  const overlay = document.createElement("div");
  overlay.className = MODAL_OVERLAY_CLASS;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", options.title);

  const modal = document.createElement("div");
  modal.className = MODAL_CLASS;

  const header = document.createElement("div");
  header.className = "modal-header";

  const titleEl = document.createElement("h2");
  titleEl.className = "modal-title";
  titleEl.textContent = options.title;
  header.appendChild(titleEl);

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.textContent = "\u00d7";
  closeBtn.addEventListener("click", () => closeModal());
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "modal-body";
  if (typeof options.content === "string") {
    body.innerHTML = options.content;
  } else {
    body.appendChild(options.content);
  }

  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", handleKeyDown);
  document.body.appendChild(overlay);
  activeModal = overlay;

  // Store onClose callback
  if (options.onClose) {
    (overlay as unknown as Record<string, unknown>).__onClose = options.onClose;
  }

  // Focus the close button
  closeBtn.focus();

  return overlay;
}

export function closeModal(): void {
  if (!activeModal) return;
  const cb = (activeModal as unknown as Record<string, unknown>).__onClose as (() => void) | undefined;
  document.removeEventListener("keydown", handleKeyDown);
  activeModal.remove();
  activeModal = null;
  cb?.();
}

export function isModalOpen(): boolean {
  return activeModal !== null;
}
