/**
 * Plugin SDK contracts for CrossTide (T1).
 *
 * Defines three plugin types:
 *   1. **Indicator** — custom technical indicators (extends existing plugin-api.ts)
 *   2. **ChartType** — custom chart renderers (Kagi, P&F, footprint, etc.)
 *   3. **DataSource** — custom data providers (brokers, exchanges, CSV)
 *
 * Each plugin type follows a common lifecycle:
 *   register → validate → activate → (compute|render|fetch) → deactivate
 *
 * Plugins are isolated via the plugin sandbox (T2) and verified via
 * SHA-256 integrity manifests (T4).
 */

// ── Common ────────────────────────────────────────────────────────────────

export interface PluginMeta {
  /** Unique kebab-case identifier (e.g. "my-kagi-chart"). */
  readonly id: string;
  /** Human-readable display name. */
  readonly name: string;
  /** Semver version string. */
  readonly version: string;
  /** Plugin author or organisation. */
  readonly author?: string;
  /** Short description (max 200 chars). */
  readonly description?: string;
  /** SPDX license identifier. */
  readonly license?: string;
  /** Minimum CrossTide version required (semver range). */
  readonly minAppVersion?: string;
}

export type PluginKind = "indicator" | "chart-type" | "data-source";

/** Lifecycle hooks available to all plugin types. */
export interface PluginLifecycle {
  /** Called once when the plugin is activated. Use for async init. */
  onActivate?(): Promise<void> | void;
  /** Called when the plugin is deactivated / unregistered. Cleanup resources. */
  onDeactivate?(): Promise<void> | void;
}

// ── Indicator Plugin ──────────────────────────────────────────────────────

export interface IndicatorCandle {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly time: number;
}

export interface IndicatorOutput {
  /** Primary computed series (same length as input candles, NaN for blanks). */
  readonly values: readonly number[];
  /** Whether to render as chart overlay (true) or sub-panel (false). */
  readonly overlay: boolean;
  /** Additional named series (e.g. upper/lower bands). */
  readonly extras?: Readonly<Record<string, readonly number[]>>;
  /** Rendering hints. */
  readonly style?: IndicatorStyle;
}

export interface IndicatorStyle {
  readonly color?: string;
  readonly lineWidth?: number;
  readonly type?: "line" | "histogram" | "area" | "dots";
}

export interface IndicatorParam {
  readonly name: string;
  readonly label: string;
  readonly type: "number" | "boolean" | "select";
  readonly default: number | boolean | string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly options?: readonly string[];
}

export interface IndicatorPluginContract extends PluginMeta, PluginLifecycle {
  readonly kind: "indicator";
  /** Parameter definitions for the settings UI. */
  readonly params: readonly IndicatorParam[];
  /** Whether the indicator overlays on the price chart (default false). */
  readonly overlay?: boolean;
  /** Pure computation function. */
  compute(
    candles: readonly IndicatorCandle[],
    params: Readonly<Record<string, number | boolean | string>>,
  ): IndicatorOutput;
}

// ── Chart Type Plugin ─────────────────────────────────────────────────────

export interface ChartRenderContext {
  /** Canvas 2D rendering context. */
  readonly ctx: CanvasRenderingContext2D;
  /** Chart area width in CSS pixels. */
  readonly width: number;
  /** Chart area height in CSS pixels. */
  readonly height: number;
  /** Device pixel ratio for HiDPI. */
  readonly dpr: number;
  /** Visible price range. */
  readonly priceRange: { readonly min: number; readonly max: number };
  /** Visible time range (unix timestamps). */
  readonly timeRange: { readonly start: number; readonly end: number };
  /** Current theme (dark/light). */
  readonly theme: "dark" | "light";
  /** Map price → Y pixel coordinate. */
  priceToY(price: number): number;
  /** Map time → X pixel coordinate. */
  timeToX(time: number): number;
}

export interface ChartTypePluginContract extends PluginMeta, PluginLifecycle {
  readonly kind: "chart-type";
  /** Icon for the chart type selector (SVG string or emoji). */
  readonly icon?: string;
  /** Supported timeframes (empty = all). */
  readonly supportedTimeframes?: readonly string[];
  /**
   * Transform OHLCV candles into the chart type's internal representation.
   * E.g., Kagi → yang/yin lines, Renko → bricks, P&F → columns.
   */
  transform(candles: readonly IndicatorCandle[]): unknown;
  /**
   * Render the transformed data onto a canvas.
   */
  render(data: unknown, context: ChartRenderContext): void;
  /**
   * Optional: return tooltip text for a given x,y position.
   */
  getTooltip?(data: unknown, x: number, y: number, context: ChartRenderContext): string | null;
}

// ── Data Source Plugin ────────────────────────────────────────────────────

export interface QuoteData {
  readonly ticker: string;
  readonly price: number;
  readonly change: number;
  readonly changePercent: number;
  readonly volume: number;
  readonly timestamp: number;
}

export interface OhlcvBar {
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export type DataSourceCapability =
  | "quote"
  | "ohlcv"
  | "search"
  | "streaming"
  | "fundamentals"
  | "news";

export interface DataSourcePluginContract extends PluginMeta, PluginLifecycle {
  readonly kind: "data-source";
  /** Supported capabilities. */
  readonly capabilities: readonly DataSourceCapability[];
  /** Rate limit (requests per minute). 0 = unlimited. */
  readonly rateLimit?: number;
  /** Whether this source requires an API key. */
  readonly requiresApiKey?: boolean;
  /** Fetch a real-time quote. */
  fetchQuote?(ticker: string): Promise<QuoteData>;
  /** Fetch historical OHLCV bars. */
  fetchOhlcv?(
    ticker: string,
    interval: string,
    from: number,
    to: number,
  ): Promise<readonly OhlcvBar[]>;
  /** Search for tickers by query string. */
  search?(query: string): Promise<readonly { ticker: string; name: string }[]>;
  /**
   * Subscribe to real-time price updates.
   * Returns an unsubscribe function.
   */
  subscribe?(tickers: readonly string[], onUpdate: (quote: QuoteData) => void): () => void;
}

// ── Union & Registry ──────────────────────────────────────────────────────

export type PluginContract =
  | IndicatorPluginContract
  | ChartTypePluginContract
  | DataSourcePluginContract;

/** Validate that a plugin object has the required shape. */
export function validatePlugin(plugin: PluginContract): readonly string[] {
  const errors: string[] = [];

  if (!plugin.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plugin.id)) {
    errors.push(`Invalid plugin id "${plugin.id}". Must be kebab-case.`);
  }
  if (!plugin.name || plugin.name.length === 0) {
    errors.push("Plugin name is required.");
  }
  if (!plugin.version || !/^\d+\.\d+\.\d+/.test(plugin.version)) {
    errors.push(`Invalid version "${plugin.version}". Must be semver.`);
  }
  if (plugin.description && plugin.description.length > 200) {
    errors.push(`Description too long (${plugin.description.length} > 200 chars).`);
  }

  switch (plugin.kind) {
    case "indicator":
      if (typeof plugin.compute !== "function") {
        errors.push("Indicator plugin must provide a compute() function.");
      }
      break;
    case "chart-type":
      if (typeof plugin.transform !== "function") {
        errors.push("Chart-type plugin must provide a transform() function.");
      }
      if (typeof plugin.render !== "function") {
        errors.push("Chart-type plugin must provide a render() function.");
      }
      break;
    case "data-source":
      if (!plugin.capabilities || plugin.capabilities.length === 0) {
        errors.push("Data-source plugin must declare at least one capability.");
      }
      break;
    default:
      errors.push(`Unknown plugin kind: "${(plugin as PluginContract).kind}".`);
  }

  return errors;
}
