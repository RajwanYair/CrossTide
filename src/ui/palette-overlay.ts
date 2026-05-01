/**
 * Command Palette Overlay — renders the palette UI + dispatches commands.
 *
 * Opens via Ctrl+K / Cmd+K. Renders a floating dialog with fuzzy search.
 * Integrates `command-palette.ts` (logic) with DOM rendering.
 */

import { createPaletteState, type PaletteCommand, type PaletteRanked } from "./command-palette";

let overlay: HTMLDialogElement | null = null;
let paletteState: ReturnType<typeof createPaletteState> | null = null;

function ensureOverlay(): HTMLDialogElement {
  if (overlay) return overlay;

  overlay = document.createElement("dialog");
  overlay.id = "command-palette-dialog";
  overlay.className = "palette-overlay";
  overlay.innerHTML = `
    <div class="palette-content">
      <input type="text" class="palette-input" placeholder="Type a command…" autocomplete="off" spellcheck="false" />
      <ul class="palette-results" role="listbox"></ul>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener("close", () => {
    const input = overlay!.querySelector<HTMLInputElement>(".palette-input");
    if (input) input.value = "";
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay!.close();
  });

  return overlay;
}

function renderResults(results: readonly PaletteRanked[], selectedIndex: number): void {
  const ul = overlay?.querySelector<HTMLUListElement>(".palette-results");
  if (!ul) return;

  if (results.length === 0) {
    ul.innerHTML = `<li class="palette-empty">No matching commands</li>`;
    return;
  }

  ul.innerHTML = results
    .map(
      (r, i) =>
        `<li class="palette-item${i === selectedIndex ? " selected" : ""}" data-index="${i}" role="option" aria-selected="${i === selectedIndex}">
          <span class="palette-label">${escapeHtml(r.label)}</span>
          ${r.hint ? `<span class="palette-hint">${escapeHtml(r.hint)}</span>` : ""}
        </li>`,
    )
    .join("");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function executeSelected(): void {
  if (!paletteState) return;
  const cmd = paletteState.selectedCommand();
  if (cmd) {
    overlay?.close();
    void cmd.run();
  }
}

export function openPalette(commands: readonly PaletteCommand[]): void {
  const dialog = ensureOverlay();
  paletteState = createPaletteState(commands);

  const input = dialog.querySelector<HTMLInputElement>(".palette-input")!;
  input.value = "";

  renderResults(paletteState.state().results, paletteState.state().selectedIndex);

  input.oninput = (): void => {
    paletteState!.setQuery(input.value);
    const s = paletteState!.state();
    renderResults(s.results, s.selectedIndex);
  };

  input.onkeydown = (e: KeyboardEvent): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      paletteState!.moveSelection(1);
      const s = paletteState!.state();
      renderResults(s.results, s.selectedIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      paletteState!.moveSelection(-1);
      const s = paletteState!.state();
      renderResults(s.results, s.selectedIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeSelected();
    } else if (e.key === "Escape") {
      e.preventDefault();
      dialog.close();
    }
  };

  const ul = dialog.querySelector<HTMLUListElement>(".palette-results")!;
  ul.onclick = (e: MouseEvent): void => {
    const li = (e.target as HTMLElement).closest<HTMLElement>(".palette-item");
    if (!li) return;
    const idx = Number(li.dataset["index"]);
    paletteState!.selectIndex(idx);
    executeSelected();
  };

  dialog.showModal();
  input.focus();
}

export function closePalette(): void {
  overlay?.close();
}

export function isPaletteOpen(): boolean {
  return overlay?.open ?? false;
}
