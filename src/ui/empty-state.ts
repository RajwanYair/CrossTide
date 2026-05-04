/**
 * `<ct-empty-state>` — Reusable empty/loading/error state Web Component.
 *
 * Renders a centered state message with optional icon, title,
 * description, and action button. Supports three visual variants.
 *
 * Usage:
 *   <ct-empty-state variant="empty" title="No data" description="Add tickers to get started">
 *     <button slot="action">Add Ticker</button>
 *   </ct-empty-state>
 *
 * Programmatic:
 *   const el = document.createElement("ct-empty-state");
 *   el.variant = "loading";
 *   el.title = "Loading…";
 */

export type EmptyStateVariant = "empty" | "loading" | "error";

const ICONS: Record<EmptyStateVariant, string> = {
  empty: `<svg class="ct-es-icon" viewBox="0 0 24 24" width="48" height="48" aria-hidden="true"><path fill="currentColor" d="M20 6H4l2 14h12l2-14zM3 4h18l-2.5 17H5.5L3 4zm9 8a2 2 0 100-4 2 2 0 000 4z"/></svg>`,
  loading: `<div class="ct-es-icon ct-es-spinner" role="status" aria-label="Loading"><svg viewBox="0 0 24 24" width="48" height="48"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg></div>`,
  error: `<svg class="ct-es-icon ct-es-icon--error" viewBox="0 0 24 24" width="48" height="48" aria-hidden="true"><path fill="currentColor" d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6zm-1 5v4h2v-4h-2zm0 5v2h2v-2h-2z"/></svg>`,
};

class CtEmptyState extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["variant", "title", "description"];
  }

  private _variant: EmptyStateVariant = "empty";
  private _title = "";
  private _description = "";
  private _connected = false;

  set variant(v: EmptyStateVariant) {
    this._variant = v;
    this.setAttribute("variant", v);
    if (this._connected) this.render();
  }

  get variant(): EmptyStateVariant {
    return this._variant;
  }

  set title(t: string) {
    this._title = t;
    this.setAttribute("title", t);
    if (this._connected) this.render();
  }

  get title(): string {
    return this._title;
  }

  set description(d: string) {
    this._description = d;
    this.setAttribute("description", d);
    if (this._connected) this.render();
  }

  get description(): string {
    return this._description;
  }

  connectedCallback(): void {
    this._connected = true;
    this.syncFromAttributes();
    this.render();
  }

  disconnectedCallback(): void {
    this._connected = false;
  }

  attributeChangedCallback(): void {
    if (!this._connected) return;
    this.syncFromAttributes();
    this.render();
  }

  private syncFromAttributes(): void {
    const v = this.getAttribute("variant");
    if (v === "empty" || v === "loading" || v === "error") {
      this._variant = v;
    }
    this._title = this.getAttribute("title") ?? this._title;
    this._description = this.getAttribute("description") ?? this._description;
  }

  private render(): void {
    const icon = ICONS[this._variant];
    const titleHtml = this._title ? `<h3 class="ct-es-title">${escapeHtml(this._title)}</h3>` : "";
    const descHtml = this._description
      ? `<p class="ct-es-desc">${escapeHtml(this._description)}</p>`
      : "";

    this.innerHTML = [
      `<div class="ct-es ct-es--${this._variant}" role="status" aria-live="polite">`,
      icon,
      titleHtml,
      descHtml,
      `<slot name="action"></slot>`,
      `</div>`,
    ].join("");
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

customElements.define("ct-empty-state", CtEmptyState);

export { CtEmptyState };
