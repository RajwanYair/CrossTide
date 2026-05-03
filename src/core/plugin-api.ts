/**
 * Plugin API for custom indicators (J14).
 *
 * Allows external ESM modules to register custom indicators at runtime
 * that integrate with the chart overlay system.
 *
 * Each plugin provides:
 *   - `id`       — unique identifier (e.g. "my-sma-cross")
 *   - `name`     — display name for the indicator selector UI
 *   - `compute`  — pure function `(candles) → IndicatorResult`
 *   - optional `defaultParams`, `overlay`, `version`
 *
 * Usage:
 *   import { registerIndicator, getIndicator, listIndicators } from "./plugin-api";
 *
 *   registerIndicator({
 *     id: "custom-rsi",
 *     name: "Custom RSI",
 *     version: "1.0.0",
 *     defaultParams: { period: 14 },
 *     compute: (candles, params) => ({
 *       values: computeRsi(candles, params.period),
 *       overlay: false,
 *     }),
 *   });
 *
 * Dynamic loading:
 *   await loadIndicatorModule("https://cdn.example.com/my-indicator.mjs");
 *   // The module's default export should call registerIndicator() or return
 *   // an IndicatorPlugin object that will be auto-registered.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface IndicatorCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number;
}

export interface IndicatorResult {
  /** Computed series values (same length as input candles, NaN for blanks). */
  values: number[];
  /** If true, render as chart overlay; if false, render in a sub-panel. */
  overlay: boolean;
  /** Optional additional series (e.g. upper/lower bands). */
  extras?: Record<string, number[]>;
  /** Optional rendering hints. */
  style?: {
    color?: string;
    lineWidth?: number;
    type?: "line" | "histogram" | "area";
  };
}

export type ComputeFn = (
  candles: readonly IndicatorCandle[],
  params: Record<string, number>,
) => IndicatorResult;

export interface IndicatorPlugin {
  /** Unique identifier — must be kebab-case. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Semver string. */
  version?: string;
  /** Default numeric parameters for the indicator. */
  defaultParams?: Record<string, number>;
  /** Whether the indicator overlays on the price chart (default false). */
  overlay?: boolean;
  /** Pure computation function. */
  compute: ComputeFn;
}

// ── Registry ──────────────────────────────────────────────────────────────

const _plugins = new Map<string, IndicatorPlugin>();

/** Listeners notified when a plugin is registered or unregistered. */
type PluginChangeCallback = (event: "add" | "remove", plugin: IndicatorPlugin) => void;
const _listeners = new Set<PluginChangeCallback>();

/**
 * Register a custom indicator plugin.
 * Throws if `id` is invalid or a plugin with the same ID is already registered.
 */
export function registerIndicator(plugin: IndicatorPlugin): void {
  if (!plugin.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plugin.id)) {
    throw new Error(
      `Invalid indicator id "${plugin.id}". Must be non-empty kebab-case (e.g. "my-indicator").`,
    );
  }
  if (typeof plugin.compute !== "function") {
    throw new Error(`Indicator "${plugin.id}" must provide a compute function.`);
  }
  if (_plugins.has(plugin.id)) {
    throw new Error(`Indicator "${plugin.id}" is already registered.`);
  }
  _plugins.set(plugin.id, plugin);
  for (const cb of _listeners) cb("add", plugin);
}

/**
 * Unregister a previously registered indicator by ID.
 * Returns true if the plugin was found and removed, false otherwise.
 */
export function unregisterIndicator(id: string): boolean {
  const plugin = _plugins.get(id);
  if (!plugin) return false;
  _plugins.delete(id);
  for (const cb of _listeners) cb("remove", plugin);
  return true;
}

/**
 * Get a registered indicator plugin by ID.
 * Returns undefined if not found.
 */
export function getIndicator(id: string): IndicatorPlugin | undefined {
  return _plugins.get(id);
}

/**
 * List all registered indicator plugins.
 */
export function listIndicators(): IndicatorPlugin[] {
  return [..._plugins.values()];
}

/**
 * Subscribe to plugin registry changes.
 * Returns an unsubscribe function.
 */
export function onPluginChange(cb: PluginChangeCallback): () => void {
  _listeners.add(cb);
  return (): void => {
    _listeners.delete(cb);
  };
}

/**
 * Run a registered indicator's compute function.
 * Throws if the indicator is not found.
 */
export function computeIndicator(
  id: string,
  candles: readonly IndicatorCandle[],
  params?: Record<string, number>,
): IndicatorResult {
  const plugin = _plugins.get(id);
  if (!plugin) throw new Error(`Indicator "${id}" is not registered.`);
  const mergedParams = { ...(plugin.defaultParams ?? {}), ...(params ?? {}) };
  return plugin.compute(candles, mergedParams);
}

/**
 * Dynamically load an ESM indicator module from a URL.
 *
 * The module should either:
 *   (a) call `registerIndicator()` as a side-effect, or
 *   (b) export default an `IndicatorPlugin` object (auto-registered).
 *
 * Only modules from allowed origins are loaded when `allowedOrigins` is set.
 */
export async function loadIndicatorModule(
  url: string,
  allowedOrigins?: string[],
): Promise<IndicatorPlugin | null> {
  if (allowedOrigins && allowedOrigins.length > 0) {
    const parsed = new URL(url);
    if (!allowedOrigins.includes(parsed.origin)) {
      throw new Error(`Origin "${parsed.origin}" is not in the allowed origins list.`);
    }
  }

  const module = (await import(/* @vite-ignore */ url)) as {
    default?: IndicatorPlugin | ((...args: unknown[]) => void);
  };

  // If default export is an IndicatorPlugin object, auto-register it
  if (
    module.default &&
    typeof module.default === "object" &&
    "id" in module.default &&
    "compute" in module.default
  ) {
    const plugin = module.default;
    if (!_plugins.has(plugin.id)) {
      registerIndicator(plugin);
    }
    return plugin;
  }

  return null;
}

/**
 * Clear all registered plugins and listeners. For testing only.
 * @internal
 */
export function _resetPluginsForTests(): void {
  _plugins.clear();
  _listeners.clear();
}
