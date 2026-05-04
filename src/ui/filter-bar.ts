/**
 * `<ct-filter-bar>` — Reusable filter/preset bar Web Component.
 *
 * Renders a horizontal bar of preset buttons and emits a custom event
 * when a preset is selected. Supports active state highlighting.
 *
 * Usage:
 *   const bar = document.createElement("ct-filter-bar");
 *   bar.presets = [{ id: "value", label: "Value", description: "P/E < 15" }];
 *   bar.addEventListener("preset-select", (e) => console.log(e.detail.id));
 *
 * Attributes:
 *   - active: currently active preset id
 */

export interface FilterBarPreset {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export interface PresetSelectDetail {
  readonly id: string;
  readonly index: number;
}

class CtFilterBar extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["active"];
  }

  private _presets: readonly FilterBarPreset[] = [];
  private _active = "";
  private _connected = false;

  set presets(v: readonly FilterBarPreset[]) {
    this._presets = v;
    if (this._connected) this.render();
  }

  get presets(): readonly FilterBarPreset[] {
    return this._presets;
  }

  set active(v: string) {
    this._active = v;
    this.setAttribute("active", v);
    if (this._connected) this.updateActive();
  }

  get active(): string {
    return this._active;
  }

  connectedCallback(): void {
    this._connected = true;
    this.render();
    this.addEventListener("click", this.handleClick);
  }

  disconnectedCallback(): void {
    this._connected = false;
    this.removeEventListener("click", this.handleClick);
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === "active") {
      this._active = value ?? "";
      if (this._connected) this.updateActive();
    }
  }

  private render(): void {
    const buttons = this._presets
      .map(
        (p, i) =>
          `<button type="button" class="ct-fb-btn${p.id === this._active ? " active" : ""}" data-preset-id="${escapeAttr(p.id)}" data-index="${i}" title="${escapeAttr(p.description ?? p.label)}">${escapeHtml(p.label)}</button>`,
      )
      .join("");
    this.innerHTML = `<div class="ct-fb-bar" role="group" aria-label="Filter presets">${buttons}<slot name="extra"></slot></div>`;
  }

  private updateActive(): void {
    const buttons = this.querySelectorAll<HTMLButtonElement>(".ct-fb-btn");
    for (const btn of buttons) {
      btn.classList.toggle("active", btn.dataset["presetId"] === this._active);
    }
  }

  private handleClick = (e: Event): void => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-preset-id]");
    if (!target) return;
    const id = target.dataset["presetId"] ?? "";
    const index = Number(target.dataset["index"] ?? 0);
    this._active = id;
    this.updateActive();
    this.dispatchEvent(
      new CustomEvent<PresetSelectDetail>("preset-select", {
        detail: { id, index },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

customElements.define("ct-filter-bar", CtFilterBar);

export { CtFilterBar };
