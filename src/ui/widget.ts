/**
 * Embeddable `<crosstide-chart>` Web Component (T9).
 *
 * A self-contained custom element that blogs, websites, and third-party
 * apps can embed to show a CrossTide mini-chart.
 *
 * Usage:
 *   <script type="module" src="https://<host>/widget.mjs"></script>
 *   <crosstide-chart ticker="AAPL" interval="1d" range="3mo" theme="dark"></crosstide-chart>
 *
 * Attributes:
 *   - ticker     — Stock symbol (required, e.g. "AAPL")
 *   - interval   — Candle interval: "1d" | "1w" | "1mo" (default "1d")
 *   - range      — Candle range: "1mo" | "3mo" | "6mo" | "1y" | "5y" (default "3mo")
 *   - theme      — "dark" | "light" | "auto" (default "auto")
 *   - height     — Height in px or CSS value (default "300")
 *   - show-volume— Show volume bars (default "true")
 *   - api-base   — Override Worker API base URL (default "https://worker.crosstide.pages.dev")
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
  readonly range: string;
  readonly theme: "dark" | "light" | "auto";
  readonly height: number;
  readonly showVolume: boolean;
  readonly apiBase: string;
}

interface QuoteWidgetConfig {
  readonly ticker: string;
  readonly theme: "dark" | "light" | "auto";
  readonly apiBase: string;
  readonly showChange: boolean;
}

interface ConsensusWidgetConfig {
  readonly ticker: string;
  readonly theme: "dark" | "light" | "auto";
  readonly apiBase: string;
}

interface QuoteResponse {
  readonly ticker: string;
  readonly price: number;
  readonly change: number;
  readonly changePercent: number;
  readonly currency?: string;
}

interface ScreenerRow {
  readonly ticker: string;
  readonly consensus: string;
  readonly score: number;
}

interface ScreenerResponse {
  readonly rows?: readonly ScreenerRow[];
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

const BASE_HOST_STYLE = `
  :host {
    display: block;
    contain: content;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(128,128,128,0.2);
  }
`;

function makeStyle(cssText: string): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
}

function makeLoading(message: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "ct-loading";
  el.textContent = message;
  return el;
}

function makeError(message: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "ct-error";
  el.setAttribute("role", "alert");
  el.textContent = message;
  return el;
}

function normalizeApiBase(value: string): string {
  return value.replace(/\/+$/u, "");
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

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

const CHART_BOOTSTRAP_CSS = `
  ${BASE_HOST_STYLE}
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
`;

export class CrosstideChartElement extends HTMLElement {
  static readonly observedAttributes = [
    "ticker",
    "interval",
    "range",
    "theme",
    "height",
    "show-volume",
    "api-base",
  ];

  #shadow: ShadowRoot;
  #candles: CandleData[] = [];
  #abortCtrl: AbortController | null = null;
  #resizeObserver: ResizeObserver | null = null;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "closed" });
    this.#shadow.replaceChildren(makeStyle(CHART_BOOTSTRAP_CSS), makeLoading("Loading chart..."));
  }

  connectedCallback(): void {
    this.style.height = `${this.#getConfig().height}px`;
    void this.#fetchAndRender();
  }

  disconnectedCallback(): void {
    this.#abortCtrl?.abort();
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
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
      range: this.getAttribute("range") ?? "3mo",
      theme: (this.getAttribute("theme") as "dark" | "light" | "auto") ?? "auto",
      height: parseInt(this.getAttribute("height") ?? "300", 10) || 300,
      showVolume: this.getAttribute("show-volume") !== "false",
      apiBase: normalizeApiBase(
        this.getAttribute("api-base") ?? "https://worker.crosstide.pages.dev",
      ),
    };
  }

  async #fetchAndRender(): Promise<void> {
    this.#abortCtrl?.abort();
    this.#abortCtrl = new AbortController();

    const config = this.#getConfig();

    try {
      const url = `${config.apiBase}/api/chart?ticker=${encodeURIComponent(config.ticker)}&range=${encodeURIComponent(config.range)}&interval=${encodeURIComponent(config.interval)}`;
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
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;

    const style = makeStyle(`
      ${BASE_HOST_STYLE}
      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    `);
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `Price chart for ${config.ticker}`);
    this.#shadow.replaceChildren(style, canvas);

    renderChart(canvas, this.#candles, config);

    // Re-render on resize
    this.#resizeObserver = new ResizeObserver(() => {
      if (this.#candles.length > 0) {
        renderChart(canvas, this.#candles, config);
      }
    });
    this.#resizeObserver.observe(canvas);
  }

  #showError(msg: string): void {
    this.#shadow.replaceChildren(
      makeStyle(`
        ${BASE_HOST_STYLE}
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
      `),
      makeError(msg),
    );
  }
}

export class CrosstideQuoteElement extends HTMLElement {
  static readonly observedAttributes = ["ticker", "theme", "api-base", "show-change"];

  #shadow: ShadowRoot;
  #abortCtrl: AbortController | null = null;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "closed" });
    this.#showLoading();
  }

  connectedCallback(): void {
    void this.#fetchAndRender();
  }

  disconnectedCallback(): void {
    this.#abortCtrl?.abort();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      void this.#fetchAndRender();
    }
  }

  #getConfig(): QuoteWidgetConfig {
    return {
      ticker: (this.getAttribute("ticker") ?? "AAPL").toUpperCase(),
      theme: (this.getAttribute("theme") as "dark" | "light" | "auto") ?? "auto",
      apiBase: normalizeApiBase(
        this.getAttribute("api-base") ?? "https://worker.crosstide.pages.dev",
      ),
      showChange: this.getAttribute("show-change") !== "false",
    };
  }

  async #fetchAndRender(): Promise<void> {
    this.#abortCtrl?.abort();
    this.#abortCtrl = new AbortController();
    this.#showLoading();

    const config = this.#getConfig();
    try {
      const resp = await fetch(`${config.apiBase}/api/quote/${encodeURIComponent(config.ticker)}`, {
        signal: this.#abortCtrl.signal,
      });
      if (!resp.ok) {
        this.#showError(`Failed to load quote (${resp.status})`);
        return;
      }

      const quote = (await resp.json()) as QuoteResponse;
      this.#renderQuote(quote, config);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        this.#showError("Network error");
      }
    }
  }

  #renderQuote(quote: QuoteResponse, config: QuoteWidgetConfig): void {
    const theme = resolveTheme(config.theme);
    const isUp = quote.change >= 0;
    const currency = quote.currency ?? "USD";

    const style = makeStyle(`
      ${BASE_HOST_STYLE}
      .ct-wrap {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        font: 600 13px system-ui, sans-serif;
        background: ${COLORS[theme].bg};
        color: ${COLORS[theme].text};
      }
      .ct-symbol {
        letter-spacing: 0.06em;
        color: ${COLORS[theme].text};
      }
      .ct-price {
        font-size: 14px;
      }
      .ct-change {
        color: ${isUp ? COLORS[theme].up : COLORS[theme].down};
        font-variant-numeric: tabular-nums;
      }
    `);

    const wrap = document.createElement("div");
    wrap.className = "ct-wrap";

    const symbol = document.createElement("span");
    symbol.className = "ct-symbol";
    symbol.textContent = quote.ticker;

    const price = document.createElement("span");
    price.className = "ct-price";
    price.textContent = `${quote.price.toFixed(2)} ${currency}`;

    wrap.append(symbol, price);

    if (config.showChange) {
      const change = document.createElement("span");
      change.className = "ct-change";
      change.textContent = `${formatSigned(quote.change)} (${formatSigned(quote.changePercent)}%)`;
      wrap.append(change);
    }

    this.#shadow.replaceChildren(style, wrap);
  }

  #showLoading(): void {
    this.#shadow.replaceChildren(
      makeStyle(`
        ${BASE_HOST_STYLE}
        .ct-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          color: #888;
          font: 12px system-ui, sans-serif;
        }
      `),
      makeLoading("Loading quote..."),
    );
  }

  #showError(message: string): void {
    this.#shadow.replaceChildren(
      makeStyle(`
        ${BASE_HOST_STYLE}
        .ct-error {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          color: #ef5350;
          font: 12px system-ui, sans-serif;
          padding: 8px 10px;
          text-align: center;
        }
      `),
      makeError(message),
    );
  }
}

export class CrosstideConsensusElement extends HTMLElement {
  static readonly observedAttributes = ["ticker", "theme", "api-base"];

  #shadow: ShadowRoot;
  #abortCtrl: AbortController | null = null;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "closed" });
    this.#showLoading();
  }

  connectedCallback(): void {
    void this.#fetchAndRender();
  }

  disconnectedCallback(): void {
    this.#abortCtrl?.abort();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      void this.#fetchAndRender();
    }
  }

  #getConfig(): ConsensusWidgetConfig {
    return {
      ticker: (this.getAttribute("ticker") ?? "AAPL").toUpperCase(),
      theme: (this.getAttribute("theme") as "dark" | "light" | "auto") ?? "auto",
      apiBase: normalizeApiBase(
        this.getAttribute("api-base") ?? "https://worker.crosstide.pages.dev",
      ),
    };
  }

  async #fetchAndRender(): Promise<void> {
    this.#abortCtrl?.abort();
    this.#abortCtrl = new AbortController();
    this.#showLoading();

    const config = this.#getConfig();
    try {
      const resp = await fetch(`${config.apiBase}/api/screener`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: [config.ticker] }),
        signal: this.#abortCtrl.signal,
      });

      if (!resp.ok) {
        this.#showError(`Failed to load consensus (${resp.status})`);
        return;
      }

      const data = (await resp.json()) as ScreenerResponse;
      const row = data.rows?.[0];
      if (!row) {
        this.#showError("No consensus data");
        return;
      }

      this.#renderConsensus(row, config);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        this.#showError("Network error");
      }
    }
  }

  #renderConsensus(row: ScreenerRow, config: ConsensusWidgetConfig): void {
    const theme = resolveTheme(config.theme);
    const direction = row.consensus.toUpperCase();
    const color =
      direction === "BUY"
        ? COLORS[theme].up
        : direction === "SELL"
          ? COLORS[theme].down
          : COLORS[theme].text;

    const style = makeStyle(`
      ${BASE_HOST_STYLE}
      .ct-wrap {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        font: 600 13px system-ui, sans-serif;
        background: ${COLORS[theme].bg};
        color: ${COLORS[theme].text};
      }
      .ct-label {
        letter-spacing: 0.03em;
      }
      .ct-pill {
        border-radius: 999px;
        border: 1px solid color-mix(in oklab, ${color}, transparent 45%);
        background: color-mix(in oklab, ${color}, transparent 86%);
        color: ${color};
        padding: 2px 10px;
        font-size: 12px;
      }
      .ct-score {
        font-variant-numeric: tabular-nums;
        color: ${COLORS[theme].text};
        opacity: 0.85;
      }
    `);

    const wrap = document.createElement("div");
    wrap.className = "ct-wrap";

    const label = document.createElement("span");
    label.className = "ct-label";
    label.textContent = row.ticker;

    const pill = document.createElement("span");
    pill.className = "ct-pill";
    pill.textContent = direction;

    const score = document.createElement("span");
    score.className = "ct-score";
    score.textContent = `Score ${Number(row.score).toFixed(0)}`;

    wrap.append(label, pill, score);
    this.#shadow.replaceChildren(style, wrap);
  }

  #showLoading(): void {
    this.#shadow.replaceChildren(
      makeStyle(`
        ${BASE_HOST_STYLE}
        .ct-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          color: #888;
          font: 12px system-ui, sans-serif;
        }
      `),
      makeLoading("Loading consensus..."),
    );
  }

  #showError(message: string): void {
    this.#shadow.replaceChildren(
      makeStyle(`
        ${BASE_HOST_STYLE}
        .ct-error {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          color: #ef5350;
          font: 12px system-ui, sans-serif;
          padding: 8px 10px;
          text-align: center;
        }
      `),
      makeError(message),
    );
  }
}

// Auto-register when loaded as a module
if (typeof customElements !== "undefined" && !customElements.get("crosstide-chart")) {
  customElements.define("crosstide-chart", CrosstideChartElement);
}
if (typeof customElements !== "undefined" && !customElements.get("crosstide-quote")) {
  customElements.define("crosstide-quote", CrosstideQuoteElement);
}
if (typeof customElements !== "undefined" && !customElements.get("crosstide-consensus")) {
  customElements.define("crosstide-consensus", CrosstideConsensusElement);
}
