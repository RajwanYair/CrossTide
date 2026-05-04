/**
 * History API SPA router.
 *
 * Path-based routing with optional :param segments. Backed by `history.pushState`
 * + `popstate`, with click interception on `<a data-route-link>` elements for
 * in-app navigation.
 *
 * Routes:
 *   /                  → watchlist (default)
 *   /watchlist
 *   /consensus
 *   /chart             /chart/:symbol
 *   /alerts
 *   /settings
 *
 * Backwards-compat: `navigateTo` / `getCurrentRoute` retain RouteName signatures.
 * New: `navigateToPath`, `getCurrentRouteInfo`.
 */

export type RouteName =
  | "watchlist"
  | "consensus"
  | "chart"
  | "alerts"
  | "heatmap"
  | "screener"
  | "settings"
  | "provider-health"
  | "portfolio"
  | "risk"
  | "backtest"
  | "consensus-timeline"
  | "signal-dsl"
  | "multi-chart"
  | "correlation"
  | "market-breadth"
  | "earnings-calendar"
  | "macro-dashboard"
  | "sector-rotation"
  | "relative-strength"
  | "seasonality"
  | "comparison"
  | "strategy-comparison"
  | "rebalance";

export interface RouteInfo {
  readonly name: RouteName;
  readonly params: Readonly<Record<string, string>>;
  readonly path: string;
}

export type RouteChangeHandler = (route: RouteName, info?: RouteInfo) => void;

const VALID_ROUTES = new Set<RouteName>([
  "watchlist",
  "consensus",
  "chart",
  "alerts",
  "heatmap",
  "screener",
  "settings",
  "provider-health",
  "portfolio",
  "risk",
  "backtest",
  "consensus-timeline",
  "signal-dsl",
  "multi-chart",
  "correlation",
  "market-breadth",
  "earnings-calendar",
  "macro-dashboard",
  "sector-rotation",
  "relative-strength",
  "seasonality",
  "comparison",
  "strategy-comparison",
  "rebalance",
]);

interface RoutePattern {
  readonly name: RouteName;
  readonly segments: readonly string[]; // ":symbol" denotes param
}

const PATTERNS: readonly RoutePattern[] = [
  { name: "watchlist", segments: [] },
  { name: "watchlist", segments: ["watchlist"] },
  { name: "consensus", segments: ["consensus"] },
  { name: "consensus", segments: ["consensus", ":symbol"] },
  { name: "chart", segments: ["chart"] },
  { name: "chart", segments: ["chart", ":symbol"] },
  { name: "alerts", segments: ["alerts"] },
  { name: "heatmap", segments: ["heatmap"] },
  { name: "screener", segments: ["screener"] },
  { name: "settings", segments: ["settings"] },
  { name: "provider-health", segments: ["provider-health"] },
  { name: "portfolio", segments: ["portfolio"] },
  { name: "risk", segments: ["risk"] },
  { name: "backtest", segments: ["backtest"] },
  { name: "backtest", segments: ["backtest", ":symbol"] },
  { name: "consensus-timeline", segments: ["consensus-timeline"] },
  { name: "consensus-timeline", segments: ["consensus-timeline", ":symbol"] },
  { name: "signal-dsl", segments: ["signal-dsl"] },
  { name: "multi-chart", segments: ["multi-chart"] },
  { name: "comparison", segments: ["comparison"] },
  { name: "comparison", segments: ["comparison", ":symbol"] },
  { name: "seasonality", segments: ["seasonality"] },
  { name: "seasonality", segments: ["seasonality", ":symbol"] },
];

const listeners: RouteChangeHandler[] = [];
let initialized = false;

/** Aborted whenever a new navigation begins. Cards thread this into their fetch calls. */
let _navController = new AbortController();

// ── P7: Route loaders ─────────────────────────────────────────────────────────

/** Context passed to a route loader. */
export interface RouteLoaderCtx {
  /** Parsed URL params (e.g. `{ symbol: "AAPL" }` for `/chart/AAPL`). */
  readonly params: Readonly<Record<string, string>>;
  /** Aborted when navigation changes — thread into any fetch calls. */
  readonly signal: AbortSignal;
}

/** Async function that pre-fetches data before the route renders. */
export type RouteLoaderFn<TData> = (ctx: RouteLoaderCtx) => Promise<TData>;

/** Route definition with an optional async data loader. */
export interface RouteDefinition<TData = unknown> {
  /** The route name this definition applies to. */
  readonly name: RouteName;
  /** Loader runs on every navigation to this route. */
  readonly loader: RouteLoaderFn<TData>;
}

/** Registry of route loaders, keyed by route name. */
const routeLoaders = new Map<RouteName, RouteLoaderFn<unknown>>();

/**
 * In-flight load promises, keyed by route name.
 * Cards can `await getRouteLoadResult<T>(name)` to wait for pre-fetched data.
 */
const routeLoadPromises = new Map<RouteName, Promise<unknown>>();

/**
 * Register a route definition with an optional async data loader.
 *
 * The loader runs concurrently with view activation on every navigation to
 * the route. The navigation `AbortSignal` is passed so loaders cancel
 * automatically when the user navigates away before data resolves.
 *
 * @example
 * ```ts
 * defineRoute({
 *   name: "chart",
 *   loader: async ({ params, signal }) => {
 *     const candles = await fetchCandles(params["symbol"] ?? "AAPL", { signal });
 *     return { candles };
 *   },
 * });
 * ```
 */
export function defineRoute<TData>(def: RouteDefinition<TData>): void {
  routeLoaders.set(def.name, def.loader);
}

/**
 * Returns the pending (or resolved) data promise for the most recent
 * navigation to `name`, or `undefined` if no loader was registered / the
 * route has never been visited.
 *
 * Cards should guard against stale promises by checking the navigation signal:
 * ```ts
 * const signal = getNavigationSignal();
 * const data = await getRouteLoadResult<MyData>("chart");
 * if (signal.aborted) return; // user navigated away
 * ```
 */
export function getRouteLoadResult<TData>(name: RouteName): Promise<TData> | undefined {
  return routeLoadPromises.get(name) as Promise<TData> | undefined;
}

/**
 * Returns a signal that will be aborted on the next navigation.
 * Create a new derived AbortController from this signal if you need a
 * longer-lived handle that you can cancel independently.
 */
export function getNavigationSignal(): AbortSignal {
  return _navController.signal;
}

/** Called at the start of every navigation to cancel the previous wave of fetches. */
function abortNavigation(): void {
  _navController.abort();
  _navController = new AbortController();
}

/**
 * Returns the configured base path (e.g. `/CrossTide`) so we can host on a
 * project-scoped GitHub Pages URL. Inferred from the document `<base>` element
 * if present; otherwise empty.
 */
function getBasePath(): string {
  if (typeof document === "undefined") return "";
  const base = document.querySelector<HTMLBaseElement>("base[href]");
  if (!base) return "";
  try {
    const url = new URL(base.href, window.location.origin);
    return url.pathname.replace(/\/$/, "");
  } catch {
    return "";
  }
}

function stripBase(pathname: string): string {
  const base = getBasePath();
  if (base && pathname.startsWith(base)) return pathname.slice(base.length) || "/";
  return pathname || "/";
}

function parsePath(pathname: string): RouteInfo {
  const path = stripBase(pathname);
  const segs = path.split("/").filter(Boolean);

  // Legacy hash takes precedence for the root path so old `#settings` links
  // still resolve during migration.
  if (segs.length === 0 && typeof window !== "undefined" && window.location.hash) {
    const hash = window.location.hash.slice(1);
    if (VALID_ROUTES.has(hash as RouteName)) {
      return { name: hash as RouteName, params: {}, path: `/${hash}` };
    }
  }

  for (const pat of PATTERNS) {
    if (pat.segments.length !== segs.length) continue;
    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < pat.segments.length; i++) {
      const ps = pat.segments[i]!;
      const us = segs[i]!;
      if (ps.startsWith(":")) {
        params[ps.slice(1)] = decodeURIComponent(us);
      } else if (ps !== us) {
        matched = false;
        break;
      }
    }
    if (matched) return { name: pat.name, params, path };
  }

  return { name: "watchlist", params: {}, path: "/" };
}

export function getCurrentRouteInfo(): RouteInfo {
  if (typeof window === "undefined") return { name: "watchlist", params: {}, path: "/" };
  return parsePath(window.location.pathname);
}

export function getCurrentRoute(): RouteName {
  return getCurrentRouteInfo().name;
}

/**
 * Build a URL path for a route + params. Throws if a required `:param` is missing.
 */
export function buildPath(route: RouteName, params: Readonly<Record<string, string>> = {}): string {
  const candidates = PATTERNS.filter((p) => p.name === route);
  // Pick the most specific pattern whose params are all provided.
  let chosen: RoutePattern | undefined;
  for (const p of candidates) {
    const required = p.segments.filter((s) => s.startsWith(":")).map((s) => s.slice(1));
    if (required.every((k) => k in params)) {
      if (!chosen || p.segments.length > chosen.segments.length) chosen = p;
    }
  }
  if (!chosen) chosen = candidates[0] ?? { name: route, segments: [route] };

  const segs = chosen.segments.map((s) =>
    s.startsWith(":") ? encodeURIComponent(params[s.slice(1)] ?? "") : s,
  );
  const base = getBasePath();
  const path = segs.length === 0 ? "/" : `/${segs.join("/")}`;
  return base + path;
}

export function navigateToPath(
  route: RouteName,
  params: Readonly<Record<string, string>> = {},
  opts: { replace?: boolean } = {},
): void {
  const url = buildPath(route, params);
  if (typeof window === "undefined") return;
  // G8: use Navigation API when available so `navigate` event fires
  if ("navigation" in window) {
    void window.navigation.navigate(url, { history: opts.replace ? "replace" : "push" });
  } else {
    if (opts.replace) window.history.replaceState({ route, params }, "", url);
    else window.history.pushState({ route, params }, "", url);
    handleRoute();
  }
}

export function navigateTo(route: RouteName): void {
  navigateToPath(route);
}

export function onRouteChange(handler: RouteChangeHandler): () => void {
  listeners.push(handler);
  return () => {
    const idx = listeners.indexOf(handler);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function fireLoaders(info: RouteInfo, signal: AbortSignal): void {
  const loader = routeLoaders.get(info.name);
  if (!loader) return;
  routeLoadPromises.set(
    info.name,
    loader({ params: info.params, signal }).catch((err: unknown) => {
      // Suppress abort errors — they are expected when user navigates away.
      if (signal.aborted) return undefined;
      throw err;
    }),
  );
}

function handleRoute(): void {
  abortNavigation();
  const info = getCurrentRouteInfo();
  fireLoaders(info, _navController.signal);
  activateViewWithTransition(info.name);
  for (const fn of listeners) fn(info.name, info);
}

function activateView(route: RouteName): void {
  document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((link) => {
    const isActive = link.dataset["route"] === route;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  document.querySelectorAll<HTMLElement>(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `view-${route}`);
  });
}

/**
 * Activate a view, wrapped in View Transitions API if available.
 * Falls back to synchronous activation in browsers without the API.
 */
function activateViewWithTransition(route: RouteName): void {
  // View Transitions API (C5) — Chrome 111+, Firefox 129+, Safari 18+
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    (
      document as unknown as { startViewTransition: (cb: () => void) => unknown }
    ).startViewTransition(() => activateView(route));
  } else {
    activateView(route);
  }
}

function onLinkClick(e: MouseEvent): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return;
  const target = e.target as HTMLElement | null;
  const anchor = target?.closest<HTMLAnchorElement>("a[data-route]");
  if (!anchor) return;
  const route = anchor.dataset["route"] as RouteName | undefined;
  if (!route || !VALID_ROUTES.has(route)) return;
  e.preventDefault();
  const params: Record<string, string> = {};
  for (const k of Object.keys(anchor.dataset)) {
    if (k.startsWith("param")) {
      const paramKey = k.slice("param".length).replace(/^[A-Z]/, (c) => c.toLowerCase());
      const val = anchor.dataset[k];
      if (val !== undefined) params[paramKey] = val;
    }
  }
  navigateToPath(route, params);
}

/**
 * G8: Navigation API intercept handler.
 * Handles all same-origin same-document navigations via the modern API.
 * Registered only when `window.navigation` is available (Chrome 102+, Edge 102+).
 */
function onNavigateEvent(e: NavigateEvent): void {
  // Let the browser handle: cross-origin, download, hash-only, file-scheme
  if (!e.canIntercept || e.hashChange || e.downloadRequest !== null) return;
  const url = new URL(e.destination.url);
  if (url.origin !== window.location.origin) return;
  const info = parsePath(url.pathname);
  e.intercept({
    handler(): Promise<void> {
      abortNavigation();
      fireLoaders(info, _navController.signal);
      activateViewWithTransition(info.name);
      for (const fn of listeners) fn(info.name, info);
      return Promise.resolve();
    },
  });
}

export function initRouter(): void {
  if (initialized) {
    handleRoute();
    return;
  }
  initialized = true;
  // Restore SPA-fallback redirect (see public/404.html) before wiring listeners.
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("spa-redirect");
    if (redirect) {
      window.history.replaceState({}, "", redirect);
    }
  }

  // G8: Navigation API progressive enhancement (Chrome 102+, Edge 102+).
  // When available, a single "navigate" event replaces popstate + click intercept.
  if (typeof window !== "undefined" && "navigation" in window) {
    window.navigation.addEventListener("navigate", onNavigateEvent as EventListener);
  } else {
    window.addEventListener("popstate", handleRoute);
    window.addEventListener("hashchange", handleRoute); // legacy support
    document.addEventListener("click", onLinkClick);
  }
  handleRoute();
}

/** Test-only: reset internal state. */
export function _resetRouterForTests(): void {
  initialized = false;
  listeners.length = 0;
  if (typeof window !== "undefined") {
    if ("navigation" in window) {
      window.navigation.removeEventListener("navigate", onNavigateEvent as EventListener);
    } else {
      window.removeEventListener("popstate", handleRoute);
      window.removeEventListener("hashchange", handleRoute);
    }
  }
  if (typeof document !== "undefined") {
    document.removeEventListener("click", onLinkClick);
  }
}
