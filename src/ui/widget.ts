/**
 * Embeddable `<crosstide-chart>` Web Component (T9).
 *
 * A self-contained custom element that blogs, websites, and third-party
 * apps can embed to show a CrossTide mini-chart.
 *
 * Usage:
 *   <script type="module" src="https://cdn.crosstide.dev/widget.mjs"></script>
 *   <crosstide-chart ticker="AAPL" interval="1d" theme="dark"></crosstide-chart>
 *
 * Attributes:
 *   - ticker     — Stock symbol (required, e.g. "AAPL")
 *   - interval   — Candle interval: "1d" | "1w" | "1mo" (default "1d")
 *   - theme      — "dark" | "light" | "auto" (default "auto")
 *   - height     — Height in px or CSS value (default "300")
 *   - show-volume— Show volume bars (default "true")
 *   - api-base   — Override API base URL (default "https://api.crosstide.dev")
 *
 * The widget renders inside a closed Shadow DOM for style isolation.
 */

// ── Types ─────────────────────────────────────────────────────────────────

interface CandleData {
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

interface WidgetConfig {
  readonly ticker: string;
  readonly interval: string;
  readonly theme: "dark" | "light" | "auto";
  readonly height: number;
  readonly showVolume: boolean;
  readonly apiBase: string;
}

// ── Rendering ─────────────────────────────────────────────────────────────

function resolveTheme(pref: "dark" | "light" | "auto"): "dark" | "light" {
  if (pref !== "auto") return pref;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const COLORS = {
  dark: {
    bg: "#1a1a2e",
    grid: "#2a2a4a",
    up: "#26a69a",
    down: "#ef5350",
    text: "#ccc",
    volume: "rgba(100,100,200,0.3)",
  },
  light: {
    bg: "#ffffff",
    grid: "#e0e0e0",
    up: "#26a69a",
    down: "#ef5350",
    text: "#333",
    volume: "rgba(100,100,200,0.2)",
  },
} as const;

function renderChart(
  canvas: HTMLCanvasElement,
  candles: readonly CandleData[],
  config: WidgetConfig,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx || candles.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const theme = resolveTheme(config.theme);
  const colors = COLORS[theme];
  const volumeH = config.showVolume ? h * 0.2 : 0;
  const chartH = h - volumeH - 20; // 20px for ticker label

  // Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, w, h);

  // Price range
  const prices = candles.flatMap((c) => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const candleW = Math.max(1, (w - 20) / candles.length);
  const gap = Math.max(0.5, candleW * 0.15);

  const priceToY = (p: number): number => 15 + chartH - ((p - minPrice) / priceRange) * chartH;

  // Grid lines
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = 15 + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Candles
  const maxVol = Math.max(...candles.map((c) => c.volume), 1);

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    const x = 10 + i * candleW;
    const isUp = c.close >= c.open;

    // Wick
    ctx.strokeStyle = isUp ? colors.up : colors.down;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + candleW / 2, priceToY(c.high));
    ctx.lineTo(x + candleW / 2, priceToY(c.low));
    ctx.stroke();

    // Body
    ctx.fillStyle = isUp ? colors.up : colors.down;
    const bodyTop = priceToY(Math.max(c.open, c.close));
    const bodyBot = priceToY(Math.min(c.open, c.close));
    const bodyH = Math.max(1, bodyBot - bodyTop);
    ctx.fillRect(x + gap, bodyTop, candleW - gap * 2, bodyH);

    // Volume
    if (config.showVolume) {
      ctx.fillStyle = colors.volume;
      const volH = (c.volume / maxVol) * volumeH;
      ctx.fillRect(x + gap, h - volH, candleW - gap * 2, volH);
    }
  }

  // Ticker label
  ctx.fillStyle = colors.text;
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(config.ticker.toUpperCase(), 8, 12);

  // Price label
  const lastClose = candles.at(-1)?.close;
  if (lastClose !== undefined) {
    const prev = candles.at(-2)?.close ?? lastClose;
    const pct = ((lastClose - prev) / prev) * 100;
    const sign = pct >= 0 ? "+" : "";
    ctx.fillStyle = pct >= 0 ? colors.up : colors.down;
    ctx.textAlign = "right";
    ctx.fillText(`${lastClose.toFixed(2)} (${sign}${pct.toFixed(2)}%)`, w - 8, 12);
  }

  // Watermark
  ctx.fillStyle = colors.grid;
  ctx.font = "9px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("CrossTide", w - 4, h - 2);
}

// ── Custom Element ────────────────────────────────────────────────────────

const TEMPLATE = `
<style>
  :host {
    display: block;
    contain: content;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(128,128,128,0.2);
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .ct-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #888;
    font: 12px system-ui, sans-serif;
  }
  .ct-error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #ef5350;
    font: 12px system-ui, sans-serif;
    padding: 16px;
    text-align: center;
  }
</style>
<div class="ct-loading">Loading chart…</div>
`;

export class CrosstideChartElement extends HTMLElement {
  static readonly observedAttributes = [
    "ticker",
    "interval",
    "theme",
    "height",
    "show-volume",
    "api-base",
  ];

  #shadow: ShadowRoot;
  #candles: CandleData[] = [];
  #abortCtrl: AbortController | null = null;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "closed" });
    this.#shadow.innerHTML = TEMPLATE;
  }

  connectedCallback(): void {
    this.style.height = `${this.#getConfig().height}px`;
    void this.#fetchAndRender();
  }

  disconnectedCallback(): void {
    this.#abortCtrl?.abort();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.style.height = `${this.#getConfig().height}px`;
      void this.#fetchAndRender();
    }
  }

  #getConfig(): WidgetConfig {
    return {
      ticker: this.getAttribute("ticker") ?? "AAPL",
      interval: this.getAttribute("interval") ?? "1d",
      theme: (this.getAttribute("theme") as "dark" | "light" | "auto") ?? "auto",
      height: parseInt(this.getAttribute("height") ?? "300", 10) || 300,
      showVolume: this.getAttribute("show-volume") !== "false",
      apiBase: this.getAttribute("api-base") ?? "https://api.crosstide.dev",
    };
  }

  async #fetchAndRender(): Promise<void> {
    this.#abortCtrl?.abort();
    this.#abortCtrl = new AbortController();

    const config = this.#getConfig();

    try {
      const url = `${config.apiBase}/api/yahoo/chart?ticker=${encodeURIComponent(config.ticker)}&interval=${encodeURIComponent(config.interval)}`;
      const resp = await fetch(url, { signal: this.#abortCtrl.signal });

      if (!resp.ok) {
        this.#showError(`Failed to load data (${resp.status})`);
        return;
      }

      const data = (await resp.json()) as { candles?: CandleData[] };
      this.#candles = data.candles ?? [];

      if (this.#candles.length === 0) {
        this.#showError("No data available");
        return;
      }

      this.#renderCanvas(config);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        this.#showError("Network error");
      }
    }
  }

  #renderCanvas(config: WidgetConfig): void {
    this.#shadow.innerHTML = `
      <style>
        :host { display: block; contain: content; border-radius: 8px; overflow: hidden; border: 1px solid rgba(128,128,128,0.2); }
        canvas { display: block; width: 100%; height: 100%; }
      </style>
      <canvas aria-label="Price chart for ${config.ticker}" role="img"></canvas>
    `;
    const canvas = this.#shadow.querySelector("canvas")!;
    renderChart(canvas, this.#candles, config);

    // Re-render on resize
    const observer = new ResizeObserver(() => {
      if (this.#candles.length > 0) {
        renderChart(canvas, this.#candles, config);
      }
    });
    observer.observe(canvas);
  }

  #showError(msg: string): void {
    this.#shadow.innerHTML = `
      <style>
        :host { display: block; contain: content; border-radius: 8px; overflow: hidden; border: 1px solid rgba(128,128,128,0.2); }
        .ct-error { display: flex; align-items: center; justify-content: center; height: 100%; color: #ef5350; font: 12px system-ui, sans-serif; padding: 16px; text-align: center; }
      </style>
      <div class="ct-error" role="alert">${msg}</div>
    `;
  }
}

// Auto-register when loaded as a module
if (typeof customElements !== "undefined" && !customElements.get("crosstide-chart")) {
  customElements.define("crosstide-chart", CrosstideChartElement);
}
