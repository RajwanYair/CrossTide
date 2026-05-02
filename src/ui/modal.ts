/**
 * Modal component — accessible dialog with focus trap.
 *
 * G9: migrated from div+custom-keydown to <dialog> + showModal() so the
 * browser owns focus-trapping, Escape handling and the top-layer stacking.
 */

export interface ModalOptions {
  readonly title: string;
  readonly content: string | HTMLElement;
  readonly onClose?: () => void;
}

const MODAL_CLASS = "modal";
let activeModal: HTMLDialogElement | null = null;

export function openModal(options: ModalOptions): HTMLDialogElement {
  closeModal(); // Only one modal at a time

  const dialog = document.createElement("dialog");
  dialog.className = "modal-overlay"; // keep class for CSS + test compat
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", options.title);

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
  dialog.appendChild(modal);

  // G9: <dialog> fires "cancel" on Escape — no custom keydown listener needed.
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault(); // We handle the close ourselves for cleanup.
    closeModal();
  });

  // Light-dismiss on backdrop click.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeModal();
  });

  if (options.onClose) {
    (dialog as unknown as Record<string, unknown>).__onClose = options.onClose;
  }

  document.body.appendChild(dialog);
  dialog.showModal();
  activeModal = dialog;

  // Focus the close button (showModal() moves focus to dialog; override to close btn)
  closeBtn.focus();

  return dialog;
}

export function closeModal(): void {
  if (!activeModal) return;
  const cb = (activeModal as unknown as Record<string, unknown>).__onClose as
    | (() => void)
    | undefined;
  activeModal.close();
  activeModal.remove();
  activeModal = null;
  cb?.();
}

export function isModalOpen(): boolean {
  return activeModal !== null;
}
