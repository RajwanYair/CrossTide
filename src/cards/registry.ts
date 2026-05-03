/**
 * Card registry — declarative metadata + dynamic loader for each route's card.
 *
 * Each entry maps a {@link RouteName} to a lazy `import()` factory. Cards
 * loaded on demand land in their own Vite chunk, keeping the initial JS
 * payload small.
 *
 * Use {@link loadCard} to lazily resolve a card by route name; the result
 * is cached so subsequent navigations are instant.
 *
 * Cards expose a small uniform contract:
 *   `mount(container: HTMLElement, ctx: CardContext): CardHandle`
 * where the returned handle exposes optional `update` and `dispose` hooks.
 */
import type { RouteName } from "../ui/router";

export interface CardContext {
  readonly route: RouteName;
  readonly params: Readonly<Record<string, string>>;
}

export interface CardHandle {
  readonly update?: (ctx: CardContext) => void;
  readonly dispose?: () => void;
}

export type CardModule = {
  readonly mount: (container: HTMLElement, ctx: CardContext) => CardHandle | void;
};

export interface CardEntry {
  readonly route: RouteName;
  readonly title: string;
  readonly viewId: string; // matches `<div id="view-...">`
  readonly load: () => Promise<CardModule>;
}

const REGISTRY: readonly CardEntry[] = [
  {
    route: "watchlist",
    title: "Watchlist",
    viewId: "view-watchlist",
    load: () => import("./watchlist-card").then((m) => m.default),
  },
  {
    route: "consensus",
    title: "Consensus",
    viewId: "view-consensus",
    load: () => import("./consensus-card").then((m) => m.default),
  },
  {
    route: "chart",
    title: "Chart",
    viewId: "view-chart",
    load: () => import("./chart-card").then((m) => m.default),
  },
  {
    route: "alerts",
    title: "Alerts",
    viewId: "view-alerts",
    load: () => import("./alerts-card").then((m) => m.default),
  },
  {
    route: "heatmap",
    title: "Heatmap",
    viewId: "view-heatmap",
    load: () => import("./heatmap-card").then((m) => m.default),
  },
  {
    route: "screener",
    title: "Screener",
    viewId: "view-screener",
    load: () => import("./screener-card").then((m) => m.default),
  },
  {
    route: "settings",
    title: "Settings",
    viewId: "view-settings",
    load: () => import("./settings-card").then((m) => m.default),
  },
  {
    route: "provider-health",
    title: "Provider Health",
    viewId: "view-provider-health",
    load: () => import("./provider-health-card").then((m) => m.default),
  },
  {
    route: "portfolio",
    title: "Portfolio",
    viewId: "view-portfolio",
    load: () => import("./portfolio-card").then((m) => m.default),
  },
  {
    route: "risk",
    title: "Risk Metrics",
    viewId: "view-risk",
    load: () => import("./risk-card").then((m) => m.default),
  },
  {
    route: "backtest",
    title: "Backtest",
    viewId: "view-backtest",
    load: () => import("./backtest-card").then((m) => m.default),
  },
  {
    route: "consensus-timeline",
    title: "Consensus Timeline",
    viewId: "view-consensus-timeline",
    load: () => import("./consensus-timeline-card").then((m) => m.default),
  },
  {
    route: "signal-dsl",
    title: "Signal DSL",
    viewId: "view-signal-dsl",
    load: () => import("./signal-dsl-card").then((m) => m.default),
  },
  {
    route: "multi-chart",
    title: "Multi-chart",
    viewId: "view-multi-chart",
    load: () => import("./multi-chart-layout").then((m) => m.default),
  },
  {
    route: "correlation",
    title: "Correlation",
    viewId: "view-correlation",
    load: () => import("./correlation-matrix-card").then((m) => m.default),
  },
  {
    route: "market-breadth",
    title: "Market Breadth",
    viewId: "view-market-breadth",
    load: () => import("./market-breadth-card").then((m) => m.default),
  },
  {
    route: "earnings-calendar",
    title: "Earnings Calendar",
    viewId: "view-earnings-calendar",
    load: () => import("./earnings-calendar-card").then((m) => m.default),
  },
  {
    route: "macro-dashboard",
    title: "Macro Dashboard",
    viewId: "view-macro-dashboard",
    load: () => import("./macro-dashboard-card").then((m) => m.default),
  },
  {
    route: "sector-rotation",
    title: "Sector Rotation",
    viewId: "view-sector-rotation",
    load: () => import("./sector-rotation-card").then((m) => m.default),
  },
  {
    route: "relative-strength",
    title: "Relative Strength",
    viewId: "view-relative-strength",
    load: () => import("./relative-strength-card").then((m) => m.default),
  },
  {
    route: "seasonality",
    title: "Seasonality",
    viewId: "view-seasonality",
    load: () => import("./seasonality-card").then((m) => m.default),
  },
  {
    route: "comparison",
    title: "Comparison",
    viewId: "view-comparison",
    load: () => import("./comparison-card").then((m) => m.default),
  },
];

const cache = new Map<RouteName, Promise<CardModule>>();

export function getCardEntry(route: RouteName): CardEntry | undefined {
  return REGISTRY.find((e) => e.route === route);
}

export function listCards(): readonly CardEntry[] {
  return REGISTRY;
}

export function loadCard(route: RouteName): Promise<CardModule> {
  const entry = getCardEntry(route);
  if (!entry) return Promise.reject(new Error(`Unknown route: ${route}`));
  let p = cache.get(route);
  if (!p) {
    p = entry.load().catch((err) => {
      cache.delete(route); // don't cache failed loads — allow retry
      throw err;
    });
    cache.set(route, p);
  }
  return p;
}

/** Test-only: clear the load cache. */
export function _resetRegistryCacheForTests(): void {
  cache.clear();
}
