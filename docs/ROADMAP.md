# CrossTide — Strategic Roadmap v5 (Full Rethink)

> **Date:** May 4, 2026
> **Current version:** v11.26.0
> **Codebase:** 424+ modules · 5,718+ tests · 506+ test files · 25 route cards
> **Bundle:** 158 KB gzip (budget 200 KB) · 49 SW precache entries
> **Stack:** TypeScript 6.0 · Vite 8 · Vitest 4 · Hono 4 · morphdom · LWC v5
> **Previous roadmaps:** `docs/ROADMAP.archive-2026-05-v4.md`

---

## Table of Contents

1. [Honest Assessment — Where We Actually Stand](#1-honest-assessment)
2. [Best-in-Class Comparison Table](#2-best-in-class-comparison-table)
3. [Best Practices Harvested from Competitors](#3-best-practices-harvested)
4. [Decision Rethink — Everything on the Table](#4-decision-rethink)
5. [Frontend Strategy](#5-frontend-strategy)
6. [Backend & Data Strategy](#6-backend--data-strategy)
7. [Infrastructure & Deployment](#7-infrastructure--deployment)
8. [External APIs & Vendor Strategy](#8-external-apis--vendor-strategy)
9. [Quality, Security & Observability](#9-quality-security--observability)
10. [Documentation Strategy](#10-documentation-strategy)
11. [Performance Budget](#11-performance-budget)
12. [Phased Roadmap — Next 3 Releases](#12-phased-roadmap)
13. [Refactor & Rewrite Backlog](#13-refactor--rewrite-backlog)
14. [Decision Log — Reaffirmed / Reversed / New](#14-decision-log)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Scope Boundaries](#16-scope-boundaries)
17. [Engineering Non-Negotiables](#17-engineering-non-negotiables)

---

## 1. Honest Assessment

### 1.1 What is genuinely excellent

| Area                  | Evidence                                                                   | Verdict       |
| --------------------- | -------------------------------------------------------------------------- | ------------- |
| **Pure domain layer** | 170+ modules, zero I/O, 100% deterministic                                 | World-class   |
| **Bundle size**       | 158 KB gzip — 10-30× smaller than commercial competitors                   | World-class   |
| **Type safety**       | TS 6 strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`      | World-class   |
| **Indicator library** | 50+ indicators, 12-method consensus engine (unique in OSS)                 | Best-in-class |
| **Offline-first**     | 5-tier cache (Map → LS → IDB → SW → OPFS), Background Fetch, Web Push      | Best-in-class |
| **Signal system**     | Zero-dep reactive primitives, auto-tracking, lazy evaluation               | Excellent     |
| **CSS architecture**  | Layers, `@scope`, container queries, semantic tokens, color-blind palettes | Excellent     |
| **Security posture**  | CSP strict, HSTS preload, Valibot validation, no inline JS, SRI            | Excellent     |
| **Test coverage**     | 90% stmt, 80% branch, 5,718 tests + Playwright E2E + Lighthouse CI         | Excellent     |
| **DevEx**             | Full CI pipeline, git hooks, commitlint, lint-staged, preview deploys      | Excellent     |

### 1.2 What is genuinely broken or incomplete

| #       | Area                                         | Reality                                                                  | Severity |
| ------- | -------------------------------------------- | ------------------------------------------------------------------------ | -------- |
| **B1**  | Worker returns demo data                     | Chart/screener routes use seeded PRNG, not real API calls                | Critical |
| **B2**  | No real Yahoo/provider integration in Worker | Frontend proxy works in dev; production Worker is a stub                 | Critical |
| **B3**  | D1 sync not wired                            | `passkey.ts` and `webauthn.ts` exist but no D1 bindings in wrangler.toml | High     |
| **B4**  | Backtest too simplistic                      | Majority-vote only; no fees, slippage, position sizing                   | High     |
| **B5**  | Many domain models untested at runtime       | ONNX, copula, Granger, jump-diffusion — exist but never exercised        | High     |
| **B6**  | Card data binding in main.ts                 | Cards are dumb adapters; real orchestration scattered                    | Medium   |
| **B7**  | No component composition                     | 24 cards reimplement table/chart/list patterns from scratch              | Medium   |
| **B8**  | Router lacks fundamentals                    | No query strings, no route guards, no data pre-loading                   | Medium   |
| **B9**  | Rate limiting per-isolate only               | CF Workers per-isolate memory; not globally consistent                   | Medium   |
| **B10** | Signal system lacks batching                 | Multiple signal updates trigger multiple re-renders                      | Medium   |
| **B11** | No structured logging in production          | Request IDs propagated but not logged anywhere                           | Low      |
| **B12** | npm workspaces not adopted                   | `src/` monolith, `worker/` sibling, `docs-site/` sibling                 | Low      |

### 1.3 The uncomfortable truth

CrossTide has **world-class architecture and theory** but the **backend is a demo**.
The Worker serves fake data from a PRNG. The frontend proxy makes dev work feel
real, but production deployment would show synthetic charts. This is the #1 gap
that separates CrossTide from being a genuine best-in-class application.

**Priority order:**

1. Make data real (connect providers in Worker)
2. Make UX bulletproof (component composition, state management)
3. Make infra production-ready (D1, rate limiting, monitoring)
4. Then add new features

---

## 2. Best-in-Class Comparison Table

Rating: `★★★` best-in-class · `★★` strong · `★` adequate · `△` partial · `✗` absent

| Capability               |   CrossTide    |   TradingView   |   FinViz   |  Koyfin   |  thinkorswim   | TrendSpider | GhostFolio | Simply Wall St |
| ------------------------ | :------------: | :-------------: | :--------: | :-------: | :------------: | :---------: | :--------: | :------------: |
| **Pricing**              |    Free OSS    |    $15-60/mo    | $25-50/mo  | $39-99/mo | Free (Schwab)  |  $39-97/mo  |  Free OSS  |     $10/mo     |
| **Open source**          |    ★★★ MIT     |        ✗        |     ✗      |     ✗     |       ✗        |      ✗      |   ★ AGPL   |       ✗        |
| **Self-hostable**        |      ★★★       |        ✗        |     ✗      |     ✗     |       ✗        |      ✗      | ★★ Docker  |       ✗        |
| **No account required**  |      ★★★       |        △        |    ★★★     |     ✗     |       ✗        |      ✗      |     ✗      |       ✗        |
| **Privacy (cookieless)** |      ★★★       |   ✗ trackers    |   ✗ ads    |     ✗     |       ✗        |      △      |    ★★★     |       ✗        |
| **Bundle size**          |   ★★★ 158 KB   |     ✗ ~5 MB     |    SSR     |   ~3 MB   |    Desktop     |    ~2 MB    |  ~500 KB   |     ~2 MB      |
| **Lighthouse perf**      |    ★★★ ≥90     |       ~50       |    ~70     |    ~60    |      n/a       |     ~55     |    ~65     |      ~60       |
| **Real-time streaming**  | ★★ Finnhub WS  |       ★★★       |    Paid    |    ★★     |      ★★★       |     ★★★     |    EOD     |      EOD       |
| **Charting depth**       |   ★★ LWC v5    |  ★★★ 20 types   |   Static   |    ★★     |      ★★★       |     ★★★     |     ✗      |       ✗        |
| **Drawing tools**        |  ★★ (8 tools)  |   ★★★ (110+)    |     ✗      |     ★     |       ★★       |     ★★★     |     ✗      |       ✗        |
| **Indicator library**    |    ★★★ 50+     |    ★★★ 400+     |    50+     |    80+    |    ★★★ 400+    |  ★★★ 100+   |     ✗      |       ✗        |
| **Consensus / signals**  |   ★★★ unique   |        ✗        |     ✗      |     ✗     |       ✗        |    △ AI     |     ✗      |    ★ grades    |
| **Screener**             |     ★★ DSL     |       ★★        | ★★★ iconic |    ★★     |       ★★       |     ★★★     |     ✗      |       ★★       |
| **Heatmap**              |   ★★ Canvas    |       ★★        | ★★★ iconic |    ★★     |       ✗        |      ✗      |     ✗      |       ✗        |
| **AI analysis**          | ★★ ONNX local  |     ★ basic     |     ✗      |     ✗     |       ✗        | ★★★ server  |     ✗      |       ✗        |
| **Backtest engine**      |   ★★ WW+DSL    |   Pine Script   |     ✗      |     ★     |  thinkScript   |  ★★★ auto   |     ✗      |       ✗        |
| **Portfolio analytics**  |      ★★★       |        ✗        |     ✗      | ★★★ best  |     Broker     |      ✗      |  ★★★ best  |       ★★       |
| **Risk metrics**         |      ★★★       |        ✗        |     ✗      |    ★★     |       ★★       |      ✗      |     ★★     |       ✗        |
| **Offline / PWA**        |    ★★★ full    |        ✗        |     ✗      |     ✗     |    Desktop     |      ✗      |     ★★     |       ✗        |
| **Keyboard-first**       |   ★★★ Cmd+K    |       ★★        |     ✗      |    ★★     |       ★★       |      ✗      |     ✗      |       ✗        |
| **Accessibility**        |     ★★ AA      |        △        |     ✗      |     △     |       ✗        |      ✗      |     ★★     |       △        |
| **Cloud sync (E2EE)**    |  ★★★ Passkey   |     Account     |  Account   |  Account  |     Broker     |   Account   |  Account   |    Account     |
| **Fundamental data**     |   △ overlay    |    ★★★ 100+     |    ★★★     |    ★★★    |      ★★★       |      ✗      |     ✗      |      ★★★       |
| **Options chain**        |       ✗        |       ★★★       |     ✗      |    ★★     |      ★★★       |     ★★      |     ✗      |       ✗        |
| **Social features**      |       ✗        |       ★★★       |     △      |     ✗     |       ✗        |      ✗      |     ✗      |       ★★       |
| **Broker integration**   |       ✗        |    ★★★ 100+     |     ✗      |     ✗     |   ★★★ native   |      ✗      |     ✗      |       ✗        |
| **News integration**     |     ★★ RSS     |  ★★★ real-time  |     ★★     |    ★★★    |      ★★★       |     ★★      |     ✗      |       ★★       |
| **Multi-device sync**    |     ★★★ D1     |       ★★★       |  Account   |    ★★     |      ★★★       |     ★★      |     ★★     |       ★★       |
| **Custom scripting**     |     ★★ DSL     |    ★★★ Pine     |     ✗      |     ✗     | ★★ thinkScript |      ✗      |     ✗      |       ✗        |
| **Economic calendar**    |    ★★★ FRED    |       ★★★       |     ★★     |    ★★★    |      ★★★       |      ✗      |     ✗      |       ★★       |
| **Mobile native**        |    PWA only    | ★★★ iOS+Android |     ✗      |    ★★     |      ★★★       |     ★★      |   △ PWA    |       ★★       |
| **Test coverage**        |   ★★★ 5,718    |     Unknown     |  Unknown   |  Unknown  |    Unknown     |   Unknown   |     ★★     |    Unknown     |
| **Documentation**        | ★★★ Astro site |       ★★★       |     ★      |     ★     |       ★★       |      ★      |     ★★     |       ★        |

### Where CrossTide uniquely wins

1. **Open-source + self-hostable + privacy-first + no-account**: No competitor combines all four
2. **12-method consensus engine**: Unique weighted signal aggregation — nothing equivalent in OSS or commercial
3. **Bundle size + Lighthouse**: 10-30× smaller, 2× better Lighthouse than any commercial competitor
4. **Offline-first depth**: 5-tier cache + Background Fetch + OPFS — beyond even GhostFolio
5. **In-browser backtest with DSL**: Zero OSS competitors have Web Worker backtester + scripting
6. **Passkey-only E2EE sync**: No email, no password — unique authentication model
7. **On-device AI**: Privacy-preserving inference; TrendSpider does server-side (paid, data leaves browser)

### Where CrossTide must close the gap

| Gap                              | Leader                                      | Action                                             |
| -------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Worker serves demo data          | All competitors serve real data             | Wire real provider calls in Worker (Phase P)       |
| Fundamental data depth           | StockAnalysis, Koyfin (100+ metrics)        | Expand `quoteSummary` integration (Phase Q)        |
| Chart types (only candle/line)   | TradingView (20 types: Renko, Kagi, P&F...) | Add Heikin-Ashi, Renko, Range bars (Phase Q)       |
| Drawing tools (8 vs 110)         | TradingView                                 | Add 10 more high-value tools (Phase Q)             |
| Bar replay / historical playback | TradingView                                 | Time-travel mode for strategy validation (Phase R) |
| Pine Script depth                | TradingView                                 | Expand DSL: loops, arrays, plotting (Phase R)      |
| Screener filter count            | FinViz (400+ fields)                        | Add fundamental + volume profile filters (Phase Q) |
| News integration quality         | TradingView (real-time, multi-source)       | Structured news API with sentiment (Phase R)       |
| Mobile experience                | TradingView native apps                     | PWA optimizations + Capacitor wrapper (Phase R)    |

---

## 3. Best Practices Harvested

Actionable techniques extracted from competitor analysis and industry leaders:

| Practice                                     | Source                            | How to Apply                                                                  | Priority |
| -------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------- | -------- |
| **Real data with edge caching**              | All commercial apps               | Worker fetches from Yahoo/Finnhub with KV caching (60s quotes, 24h candles)   | P0       |
| **Component composition via Web Components** | Lit, Shoelace, GitHub Catalyst    | Extract `<ct-data-table>`, `<ct-chart-frame>`, `<ct-stat-card>` base elements | P1       |
| **Store-per-domain signal pattern**          | SolidJS, Svelte stores            | Replace scattered main.ts binding with `createStore('watchlist')`             | P1       |
| **Signal batching**                          | React 18, SolidJS, Preact Signals | `batch(() => { ... })` to coalesce multiple updates into one render           | P1       |
| **Route-level data loading**                 | Remix, SvelteKit, TanStack Router | Router calls `loader()` before render; no waterfall                           | P1       |
| **Volume Profile / Footprint charts**        | TradingView                       | LWC custom series for TPO / volume-at-price                                   | P2       |
| **Bar Replay**                               | TradingView                       | Replay historical data tick-by-tick; apply indicators in real-time            | P2       |
| **Heikin-Ashi / Renko / Range bars**         | TradingView, thinkorswim          | LWC custom series adapters for alternative chart types                        | P2       |
| **Watchlist-wide alerts**                    | TradingView                       | Single alert rule scans all symbols; triggers on any match                    | P2       |
| **Fundamental graphs overlay**               | TradingView, Koyfin               | Revenue/EPS/PE as a time series on the same chart axis                        | P2       |
| **Keyboard-driven table operations**         | Bloomberg Terminal, Excel         | Ctrl+C copies cells, Tab moves between columns, Enter drills down             | P2       |
| **Error boundaries per card**                | React, Lit                        | Wrap `mount()`/`update()` in try-catch; render error fallback UI              | P1       |
| **Structured logging (OTEL)**                | Vercel, Linear                    | OpenTelemetry-compatible traces in Worker; correlate to client                | P2       |
| **Property-based testing for finance**       | fast-check, Hypothesis            | Fuzz indicator calculations with random candle data                           | P2       |
| **Monorepo with npm workspaces**             | Turborepo, Nx                     | `packages/app`, `packages/worker`, `packages/shared`                          | P2       |
| **Preview deployments with seeded data**     | Vercel, Cloudflare                | Deterministic fixtures for PR previews; real data in production               | P1       |

---

## 4. Decision Rethink

Every major architectural decision re-evaluated from scratch.

### 4.1 Decisions REAFFIRMED (correct, keep them)

| #   | Decision                                    | Why it's right                                                                                                                         |
| --- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Vanilla TS (no React/Vue/Svelte)**        | 158 KB bundle proves it. React adds 40 KB before app code. We have fine-grained signals that outperform virtual DOM for this use case. |
| D2  | **Pure domain layer**                       | 170+ modules, zero side effects. Portable to Workers, Tauri, tests. This is the project's crown jewel.                                 |
| D3  | **Valibot over Zod**                        | 3 KB vs 30 KB. Same safety at API boundaries.                                                                                          |
| D4  | **Multi-provider failover**                 | Yahoo breaks monthly. Circuit breaker + 5 fallbacks = resilience.                                                                      |
| D5  | **Cloudflare all-in**                       | $0/mo. Pages + Workers + KV + D1 + R2. Can't beat free. Hono makes it portable if needed.                                              |
| D6  | **Lightweight Charts v5**                   | 45 KB gzip. Professional candlestick charting. Same TradingView OSS library. MIT.                                                      |
| D7  | **Workbox Service Worker**                  | Offline-first is non-negotiable for a PWA. Mature, well-tested.                                                                        |
| D8  | **Hono for Worker**                         | 14 KB. Typed routes, middleware, OpenAPI. Portable to Deno/Bun/Lambda.                                                                 |
| D9  | **morphdom for DOM updates**                | 2.7 KB. Preserves focus, scroll, listeners. Minimal API change from innerHTML.                                                         |
| D10 | **Temporal API polyfill**                   | Financial dates need timezone-safe arithmetic. `Date` has DST traps.                                                                   |
| D11 | **Passkey auth**                            | Privacy-first. No email, no password hash, no server-side user table.                                                                  |
| D12 | **CSS Layers + @scope + container queries** | Modern CSS that eliminates class collisions without a framework.                                                                       |
| D13 | **TypeScript 6 strict**                     | `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` catches real bugs.                                                           |

### 4.2 Decisions to REVERSE or REFINE

| #   | Current Decision                      | Problem                                                    | New Decision                                                                                                             | Rationale                                                                          |
| --- | ------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| R1  | **Cards as string templates**         | Error-prone, no XSS safety by construction, no composition | **Lit-html tagged templates** (5 KB) for cards that need complex rendering                                               | Type-safe templates with auto-escaping. morphdom stays for simple cards.           |
| R2  | **Data binding scattered in main.ts** | 24 cards wired manually; impossible to trace data flow     | **Signal stores per domain** (`createWatchlistStore()`, `createPortfolioStore()`)                                        | Cards subscribe to stores; stores fetch from providers. Clean unidirectional flow. |
| R3  | **No signal batching**                | N signal updates = N re-renders                            | **Add `batch()` primitive** to signal system                                                                             | Coalesce updates from WebSocket ticks or bulk operations.                          |
| R4  | **Worker serves demo data**           | Production shows fake charts                               | **Wire real provider calls in Worker** with KV caching                                                                   | This is the existential gap. Must fix first.                                       |
| R5  | **Flat card architecture**            | 24 cards reimplementing tables, stat grids, chart frames   | **Extract 5 base Web Components** (`ct-data-table`, `ct-stat-grid`, `ct-chart-frame`, `ct-filter-bar`, `ct-empty-state`) | 60% code reduction in cards; consistent UX.                                        |
| R6  | **Router lacks features**             | No query strings, no guards, no loaders                    | **Add loader pattern + query string support**                                                                            | Route declares `loader()` that runs before mount. Eliminates waterfall.            |
| R7  | **Backtest: majority-vote only**      | Unrealistic results; no fees/slippage                      | **Add position sizing, commission model, slippage estimation**                                                           | Professional backtesting requires realistic simulation.                            |
| R8  | **All indicators hardcoded defaults** | Period=14 everywhere; not user-configurable                | **Indicator config schema** (JSON) per method                                                                            | User can tune RSI period, BB multiplier, etc. via Settings card.                   |
| R9  | **No error boundaries**               | One card crash = entire app crash                          | **try-catch wrapper in card mount/update** with error fallback UI                                                        | Resilience in production.                                                          |
| R10 | **Per-isolate rate limiting**         | Not globally consistent across edge nodes                  | **KV-backed sliding window** or CF native Rate Limiting binding                                                          | Production-grade rate limiting.                                                    |

### 4.3 NEW decisions for v5

| #   | Decision                                          | Rationale                                                                                   |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| N1  | **Adopt Web Components for shared UI primitives** | `<ct-data-table>`, `<ct-chart-frame>` etc. Encapsulated, composable, framework-agnostic.    |
| N2  | **Implement `batch()` in signal system**          | Critical for WebSocket streams that fire 10+ updates per second.                            |
| N3  | **Add `fast-check` property-based testing**       | Financial calculations must be correct for ANY input, not just happy-path fixtures.         |
| N4  | **Route loaders with AbortController**            | Each route declares a `loader()` returning data promise. Navigation aborts pending loaders. |
| N5  | **Structured error reporting with source maps**   | GlitchTip integration with proper source-map upload on deploy.                              |
| N6  | **Preview = fixtures, Production = real data**    | PR previews use deterministic fixtures; production Worker calls real APIs.                  |
| N7  | **OpenTelemetry traces in Worker**                | Correlate client errors → Worker request → upstream API call.                               |
| N8  | **Indicator registry (pluggable)**                | Indicators register via config; user can enable/disable/configure each.                     |
| N9  | **npm workspaces monorepo**                       | `packages/app`, `packages/worker`, `packages/domain` (shared).                              |
| N10 | **Capacitor for mobile distribution**             | PWA stays primary; Capacitor wraps for App Store presence.                                  |

---

## 5. Frontend Strategy

### 5.1 Rendering model evolution

```text
v1-v7:   String templates → innerHTML (full re-render)
v8-v11:  String templates → morphdom (incremental patching) ← CURRENT
v12+:    Web Components (base) + lit-html (complex) + morphdom (simple)
```

**Phase P (next):** Extract 5 Web Components for shared UI patterns:

```ts
// <ct-data-table> — handles virtual scrolling, sort, keyboard nav, ARIA
class CtDataTable extends HTMLElement {
  set columns(cols: Column[]) { ... }
  set rows(data: Row[]) { ... }  // triggers efficient re-render
  set loading(v: boolean) { ... }
}

// <ct-stat-grid> — responsive grid of key metrics
// <ct-chart-frame> — LWC wrapper with loading/error states
// <ct-filter-bar> — preset buttons + custom filter inputs
// <ct-empty-state> — consistent empty/error/loading states
```

**Why Web Components over a framework:**

- Zero runtime cost (native browser API)
- Encapsulated Shadow DOM (no style leaks)
- Composable (`<ct-chart-frame><ct-data-table>`)
- Compatible with existing morphdom + signals architecture
- No build step required (standard ES modules)

### 5.2 State management — signal stores

Replace scattered `main.ts` wiring with domain-specific stores:

```ts
// src/stores/watchlist.store.ts
export const watchlistStore = createStore({
  tickers: signal<string[]>([]),
  quotes: computed(() => /* derive from tickers + cache */),
  loading: signal(false),
  error: signal<string | null>(null),

  async addTicker(symbol: string) { ... },
  async refresh() { ... },
});
```

Cards subscribe to stores. Stores manage fetching, caching, error handling.
`main.ts` becomes a thin bootstrap that mounts the router and registers stores.

### 5.3 Signal batching

```ts
// New primitive in src/core/signals.ts
export function batch(fn: () => void): void {
  startBatch();
  try {
    fn();
  } finally {
    endBatch();
  } // flush all pending subscribers once
}

// Usage: WebSocket handler
ws.on("message", (ticks) => {
  batch(() => {
    for (const tick of ticks) {
      quoteSignal(tick.symbol).set(tick.price);
    }
  }); // single re-render for all ticks
});
```

### 5.4 Router upgrade

```ts
// Route definition with loader
defineRoute({
  path: "/chart/:symbol",
  loader: async ({ params, signal }) => {
    const candles = await fetchCandles(params.symbol, { signal });
    return { candles };
  },
  component: () => import("./cards/chart-card"),
});
```

### 5.5 Charts — expand chart types

| Chart Type             | Priority | Implementation                                        |
| ---------------------- | -------- | ----------------------------------------------------- |
| Candlestick (existing) | ✅ Done  | LWC native                                            |
| Line/Area (existing)   | ✅ Done  | LWC native                                            |
| Heikin-Ashi            | P1       | Transform candles → HA candles, render as candlestick |
| Renko                  | P2       | Custom series plugin for LWC                          |
| Range bars             | P2       | Custom series plugin                                  |
| Volume Profile         | P2       | Custom series: horizontal histogram overlay           |
| Point & Figure         | P3       | Custom renderer (SVG/Canvas)                          |

### 5.6 Accessibility (WCAG 2.2 AA certified)

| Requirement                      | Status    | Action                                     |
| -------------------------------- | --------- | ------------------------------------------ |
| Skip link                        | ✅ Done   | —                                          |
| ARIA live regions                | ✅ Done   | —                                          |
| Table keyboard nav               | ✅ Done   | —                                          |
| Focus management on route change | △ Partial | Announce route, move focus to `<h1>`       |
| Color contrast AAA               | △ Partial | Automated CI check via axe-core            |
| Reduced motion                   | ✅ Done   | `prefers-reduced-motion` respected         |
| Screen reader announcements      | ✅ Done   | Price changes, signal flips                |
| Error identification             | △ Missing | Form errors must be announced (WCAG 3.3.1) |

---

## 6. Backend & Data Strategy

### 6.1 The critical fix: real data in Worker

**Current state:** Worker routes (`/api/chart`, `/api/screener`) return deterministic
PRNG data. This makes production deployment show fake numbers.

**Target state:** Worker routes call real upstream APIs with intelligent caching:

```text
Client → Worker /api/chart?ticker=AAPL&range=1y
  → Check KV cache (key: "chart:AAPL:1y", TTL: market-hours ? 60s : 24h)
  → Cache miss → Fetch Yahoo Finance v8 chart API
  → Validate response with Valibot schema
  → Store in KV with TTL
  → Return to client
```

**Implementation plan:**

| Route                           | Upstream                    | Cache TTL                              | Fallback          |
| ------------------------------- | --------------------------- | -------------------------------------- | ----------------- |
| `GET /api/quote/:symbol`        | Yahoo → Finnhub → Tiingo    | 60s (market hours), 5min (after hours) | Last cached value |
| `GET /api/chart/:symbol`        | Yahoo → Stooq → Finnhub     | 5min (intraday), 24h (daily)           | Stale cache       |
| `GET /api/search?q=`            | Yahoo → Finnhub             | 1h                                     | Static catalog    |
| `POST /api/screener`            | Computed from cached quotes | Per-request                            | Stale quotes      |
| `GET /api/fundamentals/:symbol` | Yahoo quoteSummary          | 24h                                    | N/A               |
| `GET /api/earnings/:symbol`     | Yahoo earnings API          | 24h                                    | FRED fallback     |

### 6.2 Database strategy (Cloudflare D1)

**Current state:** D1 mentioned in docs but not wired in `wrangler.toml` bindings.

**Target schema:**

```sql
-- User sync (passkey-encrypted blobs)
CREATE TABLE user_sync (
  credential_id TEXT PRIMARY KEY,
  encrypted_blob BLOB NOT NULL,
  updated_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

-- Alert rules (server-side evaluation for Web Push)
CREATE TABLE alert_rules (
  id TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL,
  expression TEXT NOT NULL,  -- Signal DSL expression
  symbols TEXT NOT NULL,     -- JSON array
  active INTEGER NOT NULL DEFAULT 1,
  last_triggered INTEGER,
  FOREIGN KEY (credential_id) REFERENCES user_sync(credential_id)
);

-- CSP violation log (aggregated, no PII)
CREATE TABLE csp_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  violated_directive TEXT NOT NULL,
  blocked_uri TEXT,
  source_file TEXT,
  line_number INTEGER,
  count INTEGER NOT NULL DEFAULT 1,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);
```

### 6.3 WebSocket strategy

**Current:** Finnhub WSS direct from client (dev proxy).

**Target:** Durable Object fan-out for production:

```text
Client WSS → Worker DO (per-symbol) → Finnhub WSS upstream
                ↓
           Fan out to N connected clients
           Buffer last tick for late joiners
           Reconnect with exponential backoff
```

**Benefits:** Single upstream connection per symbol regardless of client count.
Cloudflare DO free tier handles this for moderate traffic.

### 6.4 Worker middleware stack (production)

```text
1. CORS (allow origins)
2. Request ID (X-Request-ID: uuid)
3. Rate limiting (KV-backed sliding window, 100 req/min/IP)
4. Auth (optional: verify passkey assertion for /api/sync)
5. Router (Hono)
6. Response transform (security headers)
7. Logging (structured JSON → Logpush → R2)
```

---

## 7. Infrastructure & Deployment

### 7.1 Production stack ($0/mo)

| Layer             | Technology                 | Purpose                              | Cost                |
| ----------------- | -------------------------- | ------------------------------------ | ------------------- |
| Static hosting    | Cloudflare Pages           | SPA + `_headers` + `_redirects`      | Free                |
| Edge compute      | Cloudflare Workers (Hono)  | API proxy, cache, rate limit         | Free (100K/day)     |
| KV store          | Cloudflare KV              | Hot cache (quotes, search)           | Free (100K ops/day) |
| Database          | Cloudflare D1              | User sync, alert rules               | Free (5 GB)         |
| Object storage    | Cloudflare R2              | Cold OHLCV archives, logs            | Free (10 GB)        |
| WebSocket         | Cloudflare Durable Objects | Real-time fan-out per symbol         | Free tier           |
| Error tracking    | GlitchTip on Fly.io        | Source-mapped error reports          | Free                |
| Uptime monitoring | Uptime Kuma on Fly.io      | Status page + alerts                 | Free                |
| CI/CD             | GitHub Actions             | Test → Build → Deploy → Health check | Free (public repo)  |
| Docs site         | Cloudflare Pages           | Astro Starlight documentation        | Free                |

### 7.2 Deployment pipeline

```text
Push to main
  → GitHub Actions CI
    → typecheck (tsc --noEmit)
    → lint:all (eslint + stylelint + htmlhint + markdownlint + prettier)
    → test:coverage (vitest, ≥90% stmt)
    → build (vite build + workbox inject)
    → check:bundle (<200 KB gzip)
    → deploy:pages (wrangler pages deploy)
    → deploy:worker (wrangler deploy)
    → health-check (curl /api/health, verify 200 + version match)
    → lighthouse (lhci autorun, perf≥90 a11y≥95)
    → notify (Discord webhook on failure)
```

### 7.3 Environment strategy

| Environment  | Data source                      | Auth             | URL                         |
| ------------ | -------------------------------- | ---------------- | --------------------------- |
| `dev`        | Vite proxy → real Yahoo/Finnhub  | None             | localhost:5173              |
| `preview`    | Deterministic fixtures (seeded)  | None             | PR-xxx.crosstide.pages.dev  |
| `staging`    | Real APIs via Worker (KV cached) | Optional passkey | staging.crosstide.pages.dev |
| `production` | Real APIs via Worker (KV cached) | Optional passkey | crosstide.pages.dev         |

---

## 8. External APIs & Vendor Strategy

### 8.1 Data providers (tiered)

| Provider         | Tier        | Free Limit   | Data Types                                   | Risk                  | Mitigation                               |
| ---------------- | ----------- | ------------ | -------------------------------------------- | --------------------- | ---------------------------------------- |
| Yahoo Finance v8 | Primary     | Unlimited\*  | Quote, OHLCV, search, fundamentals, earnings | Breaks unannounced    | Circuit breaker → Stooq                  |
| Finnhub          | Secondary   | 60/min + WSS | Quote, OHLCV, search, news, WSS streaming    | Rate limits           | Market-hours guard, client-side throttle |
| Stooq            | Tertiary    | Unlimited    | Daily OHLCV CSV (bulk history)               | EOD only, no intraday | Historical only                          |
| CoinGecko        | Crypto      | 50/min       | Crypto quotes, market data                   | Schema changes        | Valibot validation, aggressive cache     |
| FRED             | Macro       | Unlimited    | Economic indicators (VIX, rates, employment) | Gov API, stable       | Direct fetch, 24h cache                  |
| Tiingo           | Paid alt    | 500/hour     | Full OHLCV, news, fundamentals               | Cost ($10/mo)         | User-provided API key only               |
| Polygon          | Premium     | 5/min free   | Real-time, historical, options, forex        | Cost ($29/mo+)        | User-provided key, paid fallback         |
| Alpha Vantage    | Last resort | 25/day       | OHLCV, indicators                            | Extremely slow        | Last position in chain                   |

\*Yahoo has no published rate limit but throttles aggressively above ~2000 req/hour.

### 8.2 Provider selection logic

```text
Quote (real-time):
  1. Yahoo (free, fast, comprehensive)
  2. Finnhub (rate-limited but reliable)
  3. Tiingo (if user has key)
  4. Alpha Vantage (last resort)

History (OHLCV):
  1. Yahoo (up to 30y daily)
  2. Stooq (bulk CSV, reliable for daily)
  3. Finnhub (limited history on free tier)
  4. Polygon (if user has key)

Streaming (real-time WebSocket):
  1. Finnhub WSS (free, US market hours)
  2. Polygon WSS (paid, extended hours)

Crypto:
  1. CoinGecko (primary, comprehensive)
  2. Finnhub (limited crypto coverage)

Fundamentals:
  1. Yahoo quoteSummary (P/E, EPS, revenue, margins)
  2. Tiingo (if user has key)

Search/Autocomplete:
  1. Yahoo (fast, comprehensive)
  2. Finnhub (fallback)
```

### 8.3 Vendor lock-in assessment

| Vendor              | Lock-in Risk       | Exit Strategy                                                          |
| ------------------- | ------------------ | ---------------------------------------------------------------------- |
| Cloudflare          | Medium             | Hono portable to Deno Deploy / Vercel Edge / AWS Lambda@Edge in <1 day |
| GitHub              | Low                | Git is decentralized; Actions YAML is transferable to GitLab CI        |
| Yahoo Finance       | High (no contract) | 5 fallback providers; data normalization layer abstracts provider      |
| Finnhub             | Low                | Standard REST/WSS; replaceable with Polygon/Tiingo                     |
| Lightweight Charts  | Low                | MIT license; replaceable with D3/uPlot/Apache ECharts                  |
| Fly.io (monitoring) | Low                | Docker containers; portable to any PaaS in hours                       |

---

## 9. Quality, Security & Observability

### 9.1 CI gates (required for merge)

```text
Pass gate              Tool                           Threshold
─────────────         ─────────────────              ──────────
typecheck              tsc --noEmit (strict)          0 errors
typecheck:sw           tsc -p tsconfig.sw.json       0 errors
lint                   eslint --max-warnings 0       0 warnings
lint:css               stylelint --max-warnings 0    0 warnings
lint:html              htmlhint                      0 errors
lint:md                markdownlint-cli2             0 violations
format                 prettier --check              0 diffs
test:coverage          vitest run --coverage         ≥90% stmt, ≥80% branch
test:e2e               playwright                   0 failures
a11y                   axe-core in E2E              0 serious/critical
build                  vite build                   0 errors
bundle-size            check-bundle-size.mjs        <200 KB gz initial
lighthouse             lhci autorun                 perf≥90 a11y≥95 bp≥95 seo≥90
audit                  npm audit --omit=dev         0 high/critical
secrets                gitleaks                     0 leaks
worker-health          curl /api/health             200 + version match
```

### 9.2 Security controls

| Control                             | Status | Notes                                               |
| ----------------------------------- | ------ | --------------------------------------------------- |
| Content Security Policy (strict)    | ✅     | No `unsafe-inline`, no `unsafe-eval`                |
| HSTS (preload, 1yr)                 | ✅     | Prevents downgrade attacks                          |
| X-Frame-Options: DENY               | ✅     | Prevents clickjacking                               |
| Permissions-Policy (restrictive)    | ✅     | Camera, mic, geolocation all denied                 |
| Valibot validation at boundaries    | ✅     | All external data validated before use              |
| `escapeHtml()` for user data in DOM | ✅     | XSS prevention                                      |
| SRI hashes for preloads             | ✅     | Integrity verification                              |
| Rate limiting (token bucket)        | ✅     | 100 req/min/IP                                      |
| gitleaks secret scanning            | ✅     | Pre-commit + CI                                     |
| npm audit (high/critical)           | ✅     | Weekly via Dependabot                               |
| CSP report-uri                      | ✅     | Violations logged                                   |
| Signal DSL sandboxing               | ✅     | No strings, no member access, no control flow       |
| Passkey (WebAuthn)                  | ✅     | No password hashes stored                           |
| Encrypted cloud sync (AES-GCM)      | ✅     | Credential-derived key; server never sees plaintext |

### 9.3 Observability stack

| Layer           | Tool                                      | Data                                           |
| --------------- | ----------------------------------------- | ---------------------------------------------- |
| Worker logs     | Hono middleware → Logpush → R2            | Request ID, status, latency, upstream provider |
| Client errors   | GlitchTip SDK (25% sampled, PII scrubbed) | Stack traces with source maps                  |
| RUM             | web-vitals → custom endpoint              | LCP, INP, CLS per route per device class       |
| Uptime          | Uptime Kuma                               | /api/health every 60s, alerting via email      |
| Analytics       | Plausible (self-hosted)                   | Page views, custom events (no cookies)         |
| CSP violations  | Worker → D1                               | Aggregated by directive + blocked URI          |
| Provider health | In-app health card                        | Circuit breaker states, response times         |

---

## 10. Documentation Strategy

| Document                            | Purpose                                | Audience                  | Status           |
| ----------------------------------- | -------------------------------------- | ------------------------- | ---------------- |
| `README.md`                         | Quick start, features, badges          | New visitors              | ✅ Current       |
| `CHANGELOG.md`                      | Per-release changes (Keep-a-Changelog) | Users, contributors       | ✅ Current       |
| `docs/ARCHITECTURE.md`              | System design, layers, data flow       | Contributors              | ✅ Current       |
| `docs/ROADMAP.md`                   | Strategic direction, decisions         | Stakeholders              | ✅ This document |
| `CONTRIBUTING.md`                   | PR process, code standards             | Contributors              | ✅ Current       |
| `SECURITY.md`                       | Responsible disclosure                 | Security researchers      | ✅ Current       |
| `docs/COPILOT_GUIDE.md`             | AI assistant instructions              | AI tools                  | ✅ Current       |
| `docs-site/` (Astro)                | User guides, indicator docs (48 MDX)   | End users                 | ✅ Published     |
| Worker OpenAPI spec                 | API reference (auto-generated)         | API consumers             | ✅ /openapi.json |
| JSDoc on public exports             | Inline API documentation               | Contributors              | ✅ Maintained    |
| ADR (Architecture Decision Records) | Decision rationale                     | Future self, contributors | ⬜ Phase P       |

**Documentation principles:**

1. **Code is the source of truth** — docs describe intent and decisions, not implementation details
2. **One canonical location** — no duplicated information across docs
3. **Version-annotated** — diagrams and feature tables include version stamps
4. **Executable docs** — code examples in docs are tested (via vitest doc tests or scripts)

---

## 11. Performance Budget

| Metric                    | Budget       | Current      | Status            |
| ------------------------- | ------------ | ------------ | ----------------- |
| JS initial (gzip)         | < 200 KB     | 158 KB       | ✅ 42 KB headroom |
| CSS (gzip)                | < 30 KB      | ~8 KB        | ✅                |
| HTML                      | < 8 KB       | ~4 KB        | ✅                |
| Lazy card chunk           | < 50 KB each | ~25 KB avg   | ✅                |
| LWC chunk                 | < 50 KB      | ~45 KB       | ✅                |
| Fonts (Inter Variable)    | < 25 KB      | woff2 subset | ✅                |
| **Total initial**         | **< 200 KB** | **158 KB**   | ✅                |
| LCP (4G, mid Android)     | < 1.8s       | ~1.2s        | ✅                |
| INP (p75)                 | < 200ms      | ~80ms        | ✅                |
| CLS                       | < 0.05       | ~0.02        | ✅                |
| Lighthouse Performance    | ≥ 90         | ≥ 90         | ✅                |
| Lighthouse Accessibility  | ≥ 95         | ≥ 95         | ✅                |
| Lighthouse Best Practices | ≥ 95         | ≥ 95         | ✅                |
| Lighthouse SEO            | ≥ 90         | ≥ 90         | ✅                |
| TTI (Time to Interactive) | < 2.5s       | ~1.5s        | ✅                |
| SW precache entries       | < 60         | 49           | ✅                |

**Budget enforcement:** `scripts/check-bundle-size.mjs` runs in CI. Fails build if any
threshold exceeded. No exceptions without ROADMAP justification.

---

## 12. Phased Roadmap

All previous phases (A through N) are **complete**. The v5 roadmap defines Phases
P through R. Phase O is intentionally skipped (reserved for hotfixes to v11.x).

### Phase P — v12.0.0 "Real Data & Architecture Foundation"

**Theme:** Make the backend real. Fix architectural gaps. No new features.

**Duration:** 4-6 weeks

| #   | Task                                                                         | Priority | Effort | Status |
| --- | ---------------------------------------------------------------------------- | -------- | ------ | ------ |
| P1  | Wire real Yahoo/Finnhub calls in Worker `/api/quote` and `/api/chart`        | P0       | 3d     | ✅     |
| P2  | KV caching layer with market-hours-aware TTL                                 | P0       | 2d     | ✅     |
| P3  | D1 database: create schema, wire `wrangler.toml` bindings                    | P0       | 1d     | ✅     |
| P4  | KV-backed rate limiting (global, not per-isolate)                            | P1       | 1d     | ✅     |
| P5  | Signal batching: add `batch()` to signals.ts                                 | P1       | 4h     | ✅     |
| P6  | Signal stores: `createStore()` pattern for watchlist, portfolio, settings    | P1       | 3d     | ✅     |
| P7  | Route loaders: `defineRoute({ loader })` with AbortController                | P1       | 2d     | ✅     |
| P8  | Error boundaries: try-catch in card mount/update with fallback UI            | P1       | 4h     | ✅     |
| P9  | Extract `<ct-data-table>` Web Component (virtual scroll, sort, keyboard nav) | P1       | 3d     | ✅     |
| P10 | Extract `<ct-stat-grid>` Web Component (responsive metric cards)             | P1       | 1d     | ✅     |
| P11 | Extract `<ct-empty-state>` Web Component (loading/error/empty)               | P1       | 4h     | ✅     |
| P12 | Preview deployments serve fixtures; production serves real data              | P1       | 1d     | ✅     |
| P13 | Structured logging in Worker (JSON, request ID, latency, provider)           | P2       | 1d     | ✅     |
| P14 | GlitchTip source-map upload on deploy                                        | P2       | 4h     | ✅     |
| P15 | ADR directory: document P1-P14 decisions                                     | P2       | 4h     | ✅     |

**Exit criteria:**

- `/api/quote/AAPL` returns real Yahoo data with KV caching
- `/api/chart/AAPL?range=1y` returns real OHLCV with 24h cache
- D1 migrations applied; `/api/sync` works with passkey auth
- Rate limiting persists across isolates (KV-backed)
- `batch()` primitive works; WebSocket handler uses it
- At least 3 cards migrated to signal stores
- `<ct-data-table>` used in Watchlist + Screener
- Error boundary catches card crash without killing app
- CI health-check verifies real data in staging

---

### Phase Q — v13.0.0 "Data Depth & Charting"

**Theme:** Close the biggest feature gaps vs commercial competitors.

**Duration:** 4-6 weeks

| #   | Task                                                                               | Priority | Effort | Status |
| --- | ---------------------------------------------------------------------------------- | -------- | ------ | ------ |
| Q1  | Fundamental data card: P/E, EPS, revenue, margins, market cap (Yahoo quoteSummary) | P0       | 3d     | ✅     |
| Q2  | Heikin-Ashi chart type (transform candles, render as candlestick)                  | P1       | 1d     | ✅     |
| Q3  | Volume Profile overlay (LWC custom series: horizontal volume histogram)            | P1       | 3d     | ✅     |
| Q4  | Screener: add fundamental filters (P/E, market cap, dividend yield, sector)        | P1       | 2d     | ✅     |
| Q5  | Indicator configuration UI: per-indicator period/threshold settings                | P1       | 2d     | ✅     |
| Q6  | Extract `<ct-chart-frame>` Web Component (LWC wrapper + loading/error)             | P1       | 2d     | ✅     |
| Q7  | Extract `<ct-filter-bar>` Web Component (preset buttons + inputs)                  | P1       | 1d     | ✅     |
| Q8  | Backtest: add commission model (fixed + percentage), slippage estimation           | P1       | 2d     | ✅     |
| Q9  | Backtest: position sizing modes (fixed, percentage, Kelly criterion)               | P2       | 2d     | ✅     |
| Q10 | Additional drawing tools: horizontal ray, price range, date range, XABCD           | P2       | 3d     | ✅     |
| Q11 | Renko chart type (LWC custom series)                                               | P2       | 2d     | ✅     |
| Q12 | Range bar chart type                                                               | P2       | 2d     | ✅     |
| Q13 | News feed card with sentiment indicators (Finnhub news API)                        | P2       | 2d     | ✅     |
| Q14 | fast-check property-based tests for all indicator calculators                      | P2       | 2d     | ✅     |
| Q15 | npm workspaces: `packages/app`, `packages/worker`, `packages/domain`               | P2       | 2d     | ✅     |

**Exit criteria:**

- Fundamental card shows real P/E, EPS, revenue for any ticker
- Heikin-Ashi toggle works on chart card
- Volume Profile renders correctly
- Screener can filter by P/E < 15, market cap > $1B
- Backtest shows realistic results with fees
- All 5 base Web Components extracted and used across cards
- Property-based tests cover RSI, MACD, Bollinger, SMA, EMA

---

### Phase R — v14.0.0 "Polish, Scale & Distribution"

**Theme:** Production hardening for public launch.

**Duration:** 4-6 weeks

| #   | Task                                                                        | Priority | Effort | Status |
| --- | --------------------------------------------------------------------------- | -------- | ------ | ------ |
| R1  | Bar Replay: historical playback with step/speed controls                    | P1       | 3d     | ✅     |
| R2  | DSL expansion: `for` loops, arrays, `plot()` function for custom indicators | P1       | 3d     | ✅     |
| R3  | Durable Object WebSocket fan-out for production streaming                   | P1       | 3d     | ✅     |
| R4  | Capacitor wrapper for iOS/Android App Store distribution                    | P2       | 2d     | ✅     |
| R5  | Structured news with sentiment scoring (NLP in Worker)                      | P2       | 3d     | ✅     |
| R6  | Multi-timeframe analysis: sync 2-4 charts at different intervals            | P2       | 2d     | ✅     |
| R7  | Alert server-side evaluation via D1 + Durable Object cron                   | P2       | 3d     | ✅     |
| R8  | Point & Figure chart type                                                   | P3       | 2d     | ✅     |
| R9  | OpenTelemetry traces in Worker (distributed tracing)                        | P2       | 2d     | ✅     |
| R10 | README showcase: GIF demos, feature comparison, badges                      | P1       | 1d     | ✅     |
| R11 | Public launch: GitHub Release + Product Hunt + Hacker News                  | P0       | 1d     | ⬜     |
| R12 | Performance regression tracking: store metrics per commit                   | P2       | 1d     | ✅     |
| R13 | i18n: add ES, DE, ZH, JA locales                                            | P2       | 3d     | ✅     |
| R14 | WCAG 2.2 AA formal audit with manual testing report                         | P1       | 2d     | ✅     |
| R15 | Load testing: 10K tickers in screener, verify virtual scroll holds          | P1       | 1d     | ✅     |

**Exit criteria:**

- Bar Replay plays back 1 year of daily data at 10x speed
- DSL supports `for i = 1 to 10 { ... }` and `plot(series, color)`
- WebSocket streaming works in production (not just dev proxy)
- Capacitor builds generate iOS + Android binaries
- Product Hunt launch post published
- Lighthouse scores maintained (≥90 perf, ≥95 a11y)
- Load test: 10K rows in screener, INP < 200ms

---

## 13. Refactor & Rewrite Backlog

| #    | Refactor                                        | Why                                     | Target  | Status |
| ---- | ----------------------------------------------- | --------------------------------------- | ------- | ------ |
| RF1  | `src/` → `packages/app/` (npm workspaces)       | Scale CI, clear boundaries              | Q15     | ✅     |
| RF2  | `main.ts` → thin bootstrap (stores handle data) | Data flow traceability                  | P6      | ✅     |
| RF3  | Card data-binding → signal stores               | Eliminate scattered wiring              | P6      | ✅     |
| RF4  | Tables → `<ct-data-table>` Web Component        | Code dedup, consistency                 | P9      | ✅     |
| RF5  | Stat sections → `<ct-stat-grid>`                | 60% less card boilerplate               | P10     | ✅     |
| RF6  | Router: add loaders + query strings             | Eliminate data waterfalls               | P7      | ✅     |
| RF7  | Signals: add `batch()` primitive                | WebSocket performance                   | P5      | ✅     |
| RF8  | Worker: real data + KV cache                    | Existential gap                         | P1-P2   | ✅     |
| RF9  | Rate limiting: KV-backed                        | Production-grade                        | P4      | ✅     |
| RF10 | Backtest: add fees + position sizing            | Realistic results                       | Q8-Q9   | ✅     |
| RF11 | Indicator config: JSON schema                   | User-tunable parameters                 | Q5      | ✅     |
| RF12 | Remove untested domain models                   | Dead code risk (ONNX, copula if unused) | P-audit | ✅     |
| RF13 | Unify card error handling                       | Error boundaries                        | P8      | ✅     |

---

## 14. Decision Log

### Reaffirmed (v5)

| Decision                      | First Introduced | Reaffirmed Count |
| ----------------------------- | ---------------- | ---------------- |
| Vanilla TS + zero-dep signals | v1.0             | 5th time         |
| Pure domain layer             | v1.0             | 5th time         |
| Valibot (not Zod)             | v7.8             | 3rd time         |
| Multi-provider failover       | v3.0             | 4th time         |
| Cloudflare all-in ($0/mo)     | v4.0             | 4th time         |
| Lightweight Charts v5         | v2.0             | 4th time         |
| Workbox Service Worker        | v3.0             | 4th time         |
| Hono for Worker               | v5.0             | 3rd time         |
| morphdom for DOM updates      | v8.0             | 2nd time         |
| Passkey-only auth             | v9.0             | 2nd time         |
| CSS Layers + @scope           | v7.0             | 3rd time         |
| TypeScript 6 strict mode      | v11.0            | 1st time         |

### Reversed (v5)

| Old Decision                    | New Decision                       | Why                                | Phase |
| ------------------------------- | ---------------------------------- | ---------------------------------- | ----- |
| Cards as string concatenation   | Web Components for shared patterns | Composition, encapsulation, safety | P     |
| Data binding in main.ts         | Signal stores per domain           | Traceability, testability          | P     |
| No signal batching              | `batch()` primitive                | WebSocket performance              | P     |
| Worker serves demo data         | Real API calls + KV caching        | Production readiness               | P     |
| Router: paths only              | Paths + query strings + loaders    | Standard expectations              | P     |
| Flat indicator defaults         | Configurable via JSON schema       | User personalization               | Q     |
| Simple backtest (majority-vote) | Fees + slippage + position sizing  | Realistic results                  | Q     |

### New (v5)

| Decision                            | Rationale                                             | Phase |
| ----------------------------------- | ----------------------------------------------------- | ----- |
| Web Components for UI primitives    | Native API, zero runtime, composable, encapsulated    | P     |
| Signal stores pattern               | Clean unidirectional data flow, testable, traceable   | P     |
| fast-check property testing         | Financial math must be correct for ALL inputs         | Q     |
| Route loaders with AbortController  | Eliminate data loading waterfalls                     | P     |
| Capacitor for mobile stores         | PWA + native wrapper covers all distribution channels | R     |
| ADR (Architecture Decision Records) | Persist decision rationale for future contributors    | P     |
| Preview = fixtures, Prod = real     | Reproducible PR reviews + real production data        | P     |
| OpenTelemetry in Worker             | Distributed tracing for debugging production issues   | R     |
| Durable Object WebSocket fan-out    | Single upstream connection per symbol at scale        | R     |
| Error boundaries per card           | Resilience; one card crash doesn't kill the app       | P     |

---

## 15. Risks & Mitigations

| Risk                              | Likelihood | Impact   | Mitigation                                                                            |
| --------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------- |
| Yahoo Finance API breaks/changes  | High       | High     | 5 fallback providers; Valibot validates; circuit breaker auto-switches                |
| Cloudflare free tier limits hit   | Low        | High     | Monitor usage; Hono portable to Deno Deploy / Vercel Edge in <1 day                   |
| ONNX model produces wrong signals | Medium     | Medium   | Signals are advisory only; backtesting validates; consensus engine requires agreement |
| KV cache stale data served        | Medium     | Medium   | TTL-based expiry; manual purge endpoint; cache version in keys                        |
| D1 data loss                      | Low        | High     | Encrypted blobs are user-owned; re-sync from client is canonical                      |
| npm supply chain attack           | Low        | Critical | socket.dev PR checks; gitleaks; npm audit weekly; lockfile-only installs              |
| Contributor breaks architecture   | Medium     | Medium   | ESLint import-x layer rules; CI enforced; ARCHITECTURE.md reference                   |
| Rate limit abuse                  | Medium     | Medium   | KV-backed per-IP limits; Cloudflare WAF as escalation                                 |
| WebSocket thundering herd         | Low        | Medium   | Durable Object absorbs; exponential backoff with jitter in client                     |
| Bundle size regression            | Low        | Medium   | CI gate: `check-bundle-size.mjs` fails build if >200 KB                               |

---

## 16. Scope Boundaries

### CrossTide IS

- A **technical/quantitative analysis** dashboard
- A **signal generation and consensus** engine
- A **portfolio analytics and risk management** tool
- A **privacy-first, offline-capable** PWA
- **Open source and self-hostable**
- A **learning tool** for financial markets

### CrossTide IS NOT (and will never be)

| Out of Scope                             | Why                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------- |
| Trading platform (order execution)       | Regulatory burden; conflicts with analysis-only positioning         |
| Options chain / Greeks                   | Niche audience; massive data requirement; out of core competency    |
| Social network (user profiles, chat)     | Privacy-first architecture is incompatible with social features     |
| Robo-advisor (automated recommendations) | Regulatory liability; signals are educational, not financial advice |
| News aggregator (primary function)       | RSS/sentiment is supplementary; not our core value proposition      |
| Mobile-first native app                  | PWA covers mobile; Capacitor wrapper for store presence only        |

### Considered but rejected (with reasons)

| Feature                     | Rejection Reason                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| React/Vue/Svelte migration  | Bundle would 2-3× for equivalent functionality we already have                                       |
| PostgreSQL/Supabase backend | Unnecessary complexity; D1 handles our simple schema at $0/mo                                        |
| Server-side rendering (SSR) | SPA is correct for dashboard; no SEO need for authenticated content                                  |
| GraphQL API                 | Over-engineering for 6 REST endpoints; Hono REST + OpenAPI suffices                                  |
| Redis/Valkey caching        | Cloudflare KV is equivalent for our access patterns and free                                         |
| Kubernetes deployment       | Cloudflare Pages + Workers handles everything; no container orchestration needed                     |
| Tailwind CSS                | CSS Layers + custom properties + @scope already achieves the same goals without 50KB utility classes |
| Storybook                   | `docs/components-preview.html` + Astro docs-site covers component documentation                      |

---

## Appendix: Consolidated from Previous Roadmaps

All tasks from Phases A-N (v1.0 through v11.20.0) are **complete**. Key milestones:

| Phase | Version | Theme       | Key Deliverables                                              |
| ----- | ------- | ----------- | ------------------------------------------------------------- |
| A-C   | v1-v4   | Foundation  | Signals, router, watchlist, chart, 20 indicators              |
| D-E   | v5-v6   | Data & PWA  | Multi-provider, SW, IDB, OPFS, 50 indicators                  |
| F-G   | v7      | Quality     | Strict TS, 90% coverage, WCAG AA, Lighthouse 90+              |
| H     | v8-v9   | Advanced    | Passkey sync, ONNX AI, Tauri, D1                              |
| I     | v10     | Features    | Signal DSL, backtest, screener, heatmap, earnings             |
| J-K   | v11     | Performance | morphdom, virtual scroll, container queries, event delegation |
| L     | v11.x   | Data depth  | Fundamental overlay, seasonal charts, multi-condition alerts  |
| M-N   | v11.x   | Polish      | i18n expansion, mobile audit, load testing, UX polish         |

**What's new in v5 roadmap (Phases P-R):**

- P: Make backend real, fix architectural foundations
- Q: Close feature gaps vs commercial competitors
- R: Public launch preparation

---

## 17. Engineering Non-Negotiables

> Extracted governance rules that apply to every change in this repository.
> No exceptions. No waivers. Fix root causes.

### 17.1 Code Integrity

1. **No suppressions** — no `eslint-disable`, no `@ts-ignore`, no `--force` flags
2. **No dead artifacts** — every file, export, dep, and config entry must be referenced
3. **No `TODO` in code** — open a GitHub Issue for every deferred item
4. **No secrets in source** — `.env` for local keys; Cloudflare Secrets for production
5. **Validation at boundaries** — sanitize all external input before processing

### 17.2 Architecture Integrity

1. **Layer imports are one-way** — domain never imports from core/cards/ui
2. **Domain stays pure** — no DOM, no `fetch`, no `Date.now()`, no `Math.random()`
3. **Worker imports use `.js`** — CF Workers ESM requires explicit extensions
4. **patchDOM, not innerHTML** — raw innerHTML breaks morphdom diffing
5. **Cards use `void asyncFn()`** — floating promises are a lint error

### 17.3 Quality Gates (all required for merge)

| Gate       | Command                 | Requirement             |
| ---------- | ----------------------- | ----------------------- |
| Type check | `npm run typecheck`     | Zero errors             |
| ESLint     | `npm run lint`          | Zero warnings           |
| Stylelint  | `npm run lint:css`      | Zero CSS warnings       |
| HTMLHint   | `npm run lint:html`     | Zero issues             |
| Prettier   | `npm run format:check`  | Exit 0                  |
| Tests      | `npm run test:coverage` | All pass, ≥90% coverage |
| Build      | `npm run build`         | Successful              |
| Bundle     | `npm run check:bundle`  | Under 200 KB gzip       |

Run all: `npm run ci`

### 17.4 Roadmap Governance

- **Roadmap as single source of truth** — all work maps to an existing item or a new item is added first
- **Phased execution only** — work one phase at a time; no big-bang scope changes
- **Each change records:** what was done, what was deferred, validation performed
- **New discoveries go to backlog** — don't implement if it breaks phase scope

### 17.5 Copilot Chat Control Prompt

Paste at the start of each Copilot session to enforce governance:

```text
Control Rules (Copilot Chat):
- Treat ROADMAP.md as the single source of truth for scope, priorities, and sequencing.
- Follow the layer rules in ARCHITECTURE.md and copilot-instructions.md at all times.
- Domain layer must be pure: no DOM, no fetch, no Date.now(), no Math.random().
- Worker tests must mock globalThis.fetch — no real network calls in tests.
- Use patchDOM() not innerHTML. Use void asyncFn() not bare floating promises.
- No eslint-disable, no @ts-ignore, no TODO in code.
- Every response must state: 1) what is done, 2) what is deferred, 3) validation performed.
- Git commit after each sprint with conventional commit format.
```

---

## Appendix A: Daily Workflow & Templates

### How to Use This Roadmap (Daily Workflow)

1. Pick the highest priority open item in the current phase.
2. Implement it in a small, reviewable change set.
3. Run validation (`npm run ci`).
4. Update the item's status and notes in this file.
5. If new work is discovered:
   - Add it to the relevant phase as a new item
   - Assign a priority
   - Do not implement immediately if it breaks phase scope

### Reporting Standard (per completed step)

Each executed change must record:

- **Roadmap item(s) addressed** — ID and title
- **What was done** — concrete deliverables
- **What was deferred** — anything out of scope
- **Validation performed** — commands run, results
- **Follow-up items created/updated** — new backlog entries

### Roadmap Item Template

```markdown
### RDM-XXX (Priority) — Title

- **Status:** Not Started | In Progress | Blocked | Done | Deferred
- **Scope:** What is included
- **Deliverables:** Files/outputs produced
- **Acceptance Criteria:**
  - [ ] No new warnings/errors introduced
  - [ ] Local validation passes (`npm run ci`)
  - [ ] Docs updated (if behavior/paths changed)
  - [ ] No dead code/config/docs introduced
- **Dependencies:** Prerequisite items
- **Notes / Risks:** Context for implementer
```

---

_This roadmap is a living document. Updated on every phase completion._
_Previous versions: `docs/ROADMAP.archive-2026-05-v4.md`, `docs/ROADMAP.archive-2026-05-v3.md`_
_Consolidated from: `docs/ROADMAP.new.md` (generic governance template — fully subsumed by this document)_
