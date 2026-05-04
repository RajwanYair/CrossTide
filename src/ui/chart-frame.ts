/**
 * `<ct-chart-frame>` — Reusable chart container Web Component.
 *
 * Wraps a chart visualization with loading/error/empty state handling.
 * Provides a consistent frame with optional title bar and responsive sizing.
 *
 * Usage:
 *   <ct-chart-frame ticker="AAPL" height="400">
 *   </ct-chart-frame>
 *
 * Attributes:
 *   - ticker: symbol to display in header
 *   - height: chart container height in px (default 400)
 *   - state: "idle" | "loading" | "ready" | "error"
 *   - error-message: error text when state="error"
 */

export type ChartFrameState = "idle" | "loading" | "ready" | "error";

class CtChartFrame extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["ticker", "height", "state", "error-message"];
  }

  private _ticker = "";
  private _height = 400;
  private _state: ChartFrameState = "idle";
  private _errorMessage = "";
  private _connected = false;
  private _chartContainer: HTMLElement | null = null;

  set ticker(v: string) {
    this._ticker = v;
    this.setAttribute("ticker", v);
    if (this._connected) this.renderHeader();
  }

  get ticker(): string {
    return this._ticker;
  }

  set height(v: number) {
    this._height = v;
    this.setAttribute("height", String(v));
    if (this._chartContainer) {
      this._chartContainer.style.height = `${v}px`;
    }
  }

  get height(): number {
    return this._height;
  }

  set state(v: ChartFrameState) {
    this._state = v;
    this.setAttribute("state", v);
    if (this._connected) this.updateState();
  }

  get state(): ChartFrameState {
    return this._state;
  }

  set errorMessage(v: string) {
    this._errorMessage = v;
    this.setAttribute("error-message", v);
    if (this._connected) this.updateState();
  }

  get errorMessage(): string {
    return this._errorMessage;
  }

  /** Returns the inner container element for mounting chart content. */
  get chartContainer(): HTMLElement | null {
    return this._chartContainer;
  }

  connectedCallback(): void {
    this._connected = true;
    this.render();
  }

  disconnectedCallback(): void {
    this._connected = false;
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    switch (name) {
      case "ticker":
        this._ticker = value ?? "";
        if (this._connected) this.renderHeader();
        break;
      case "height":
        this._height = value ? Number(value) : 400;
        if (this._chartContainer) {
          this._chartContainer.style.height = `${this._height}px`;
        }
        break;
      case "state":
        this._state = (value as ChartFrameState) ?? "idle";
        if (this._connected) this.updateState();
        break;
      case "error-message":
        this._errorMessage = value ?? "";
        if (this._connected) this.updateState();
        break;
    }
  }

  private render(): void {
    this.innerHTML = `
      <div class="ct-cf-header">
        <span class="ct-cf-ticker">${escapeHtml(this._ticker)}</span>
        <slot name="toolbar"></slot>
      </div>
      <div class="ct-cf-body" style="height:${this._height}px;position:relative;">
        <div class="ct-cf-overlay" aria-live="polite"></div>
        <div class="ct-cf-chart"></div>
      </div>
    `;
    this._chartContainer = this.querySelector(".ct-cf-chart");
    this.updateState();
  }

  private renderHeader(): void {
    const tickerEl = this.querySelector(".ct-cf-ticker");
    if (tickerEl) tickerEl.textContent = this._ticker;
  }

  private updateState(): void {
    const overlay = this.querySelector<HTMLElement>(".ct-cf-overlay");
    const chartEl = this._chartContainer;
    if (!overlay || !chartEl) return;

    switch (this._state) {
      case "idle":
        overlay.innerHTML = `<span class="ct-cf-idle">Select a ticker to view chart</span>`;
        overlay.hidden = false;
        chartEl.style.visibility = "hidden";
        break;
      case "loading":
        overlay.innerHTML = `<div class="ct-cf-spinner" role="status" aria-label="Loading chart"><svg viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg></div>`;
        overlay.hidden = false;
        chartEl.style.visibility = "hidden";
        break;
      case "ready":
        overlay.innerHTML = "";
        overlay.hidden = true;
        chartEl.style.visibility = "visible";
        break;
      case "error":
        overlay.innerHTML = `<div class="ct-cf-error"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M12 2L1 21h22L12 2zm-1 9h2v4h-2v-4zm0 5h2v2h-2v-2z"/></svg><span>${escapeHtml(this._errorMessage || "Chart unavailable")}</span></div>`;
        overlay.hidden = false;
        chartEl.style.visibility = "hidden";
        break;
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

customElements.define("ct-chart-frame", CtChartFrame);

export { CtChartFrame };
