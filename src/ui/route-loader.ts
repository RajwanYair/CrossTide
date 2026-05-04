/**
 * Route Loaders — data-fetching lifecycle tied to route navigation.
 *
 * P7: Adds `defineRoute({ loader })` pattern with automatic AbortController
 * cancellation on navigation away. Loaders run before card activation, enabling
 * skeleton-free rendering when data arrives before mount.
 *
 * Usage:
 *   const chartRoute = defineRoute({
 *     name: "chart",
 *     loader: async ({ params, signal }) => {
 *       const res = await fetch(`/api/chart?ticker=${params.symbol}`, { signal });
 *       return res.json();
 *     },
 *   });
 *
 *   // In card:
 *   const data = chartRoute.data(); // reactive signal with loader result
 */

import { signal, computed, type ReadSignal } from "../core/signals";

export interface LoaderContext {
  /** Route parameters (e.g., { symbol: "AAPL" }). */
  params: Readonly<Record<string, string>>;
  /** AbortSignal — cancelled when navigating away from this route. */
  signal: AbortSignal;
}

export type RouteLoader<T> = (ctx: LoaderContext) => Promise<T>;

export interface RouteLoaderState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface DefinedRoute<T> {
  /** Reactive state of the loader result. */
  readonly state: ReadSignal<RouteLoaderState<T>>;
  /** Shortcut to read data (null if not loaded). */
  readonly data: ReadSignal<T | null>;
  /** Shortcut to check loading state. */
  readonly loading: ReadSignal<boolean>;
  /** Shortcut to read error. */
  readonly error: ReadSignal<Error | null>;
  /** Trigger the loader (called by router on navigation). */
  readonly load: (params: Record<string, string>) => Promise<void>;
  /** Cancel the current load. */
  readonly abort: () => void;
  /** The route name this loader is associated with. */
  readonly name: string;
}

export interface DefineRouteOptions<T> {
  name: string;
  loader: RouteLoader<T>;
  /** If true, don't re-run loader when params haven't changed. */
  dedupe?: boolean;
}

/**
 * Define a route with a data loader. Returns a reactive route handle with
 * `data`, `loading`, `error` signals that update when the route is navigated to.
 */
export function defineRoute<T>(options: DefineRouteOptions<T>): DefinedRoute<T> {
  const { name, loader, dedupe = true } = options;

  const $state = signal<RouteLoaderState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  let currentAbort: AbortController | null = null;
  let lastParamsKey = "";

  const load = async (params: Record<string, string>): Promise<void> => {
    // Dedupe: skip if same params
    const paramsKey = JSON.stringify(params);
    if (dedupe && paramsKey === lastParamsKey && $state.peek().data != null) {
      return;
    }
    lastParamsKey = paramsKey;

    // Abort previous load
    if (currentAbort) {
      currentAbort.abort();
    }
    currentAbort = new AbortController();

    $state.set({ data: $state.peek().data, loading: true, error: null });

    try {
      const result = await loader({ params, signal: currentAbort.signal });
      // Only update if not aborted
      if (!currentAbort.signal.aborted) {
        $state.set({ data: result, loading: false, error: null });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Navigation cancelled — ignore
        return;
      }
      if (!currentAbort.signal.aborted) {
        $state.set({
          data: $state.peek().data,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }
  };

  const abort = (): void => {
    if (currentAbort) {
      currentAbort.abort();
      currentAbort = null;
    }
  };

  const dataSignal: ReadSignal<T | null> = computed(() => $state().data);
  const loadingSignal: ReadSignal<boolean> = computed(() => $state().loading);
  const errorSignal: ReadSignal<Error | null> = computed(() => $state().error);

  return {
    state: $state,
    data: dataSignal,
    loading: loadingSignal,
    error: errorSignal,
    load,
    abort,
    name,
  };
}

// ── Route Loader Registry ───────────────────────────────────────────────────

const registry = new Map<string, DefinedRoute<unknown>>();

/** Register a route loader for automatic invocation on navigation. */
export function registerRouteLoader(route: DefinedRoute<unknown>): void {
  registry.set(route.name, route);
}

/** Get a registered route loader by name. */
export function getRouteLoader<T>(name: string): DefinedRoute<T> | undefined {
  return registry.get(name) as DefinedRoute<T> | undefined;
}

/**
 * Called by the router on each navigation. Aborts previous loaders and
 * triggers the loader for the new route (if registered).
 */
export function onRouteNavigated(name: string, params: Record<string, string>): void {
  // Abort all other active loaders
  for (const [routeName, loader] of registry) {
    if (routeName !== name) {
      loader.abort();
    }
  }

  // Trigger the new route's loader
  const loader = registry.get(name);
  if (loader) {
    void loader.load(params);
  }
}
