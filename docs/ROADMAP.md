# CrossTide — Strategic Roadmap v4 (Deep Rethink, May 2026)

> **Last updated:** May 3, 2026
> **Declared version:** v7.24.0
> **Codebase scale:** 264 source modules · 4,308 unit tests · 367 test files · 19 route cards
> **Test coverage:** 90 % statements · 80 % branches · 90 % functions
> **Bundle:** 129.1 KB gzip JS (budget 200 KB) · 44 SW precache entries
> **Previous roadmaps archived at:** `docs/ROADMAP.archive-2026-05-v3.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Honest Status Audit — v7.24.0](#2-honest-status-audit--v7240)
3. [Decision Rethink Matrix v4](#3-decision-rethink-matrix-v4)
4. [Best-in-Class Comparison Table](#4-best-in-class-comparison-table)
5. [Best Practices Harvested from Competitors](#5-best-practices-harvested-from-competitors)
6. [Architecture Vision](#6-architecture-vision)
7. [Frontend Strategy](#7-frontend-strategy)
8. [Backend, Data & Infrastructure Strategy](#8-backend-data--infrastructure-strategy)
9. [Storage, Sync & Offline Strategy](#9-storage-sync--offline-strategy)
10. [Quality, Security & Observability](#10-quality-security--observability)
11. [Performance Budget](#11-performance-budget)
12. [Documentation Strategy](#12-documentation-strategy)
13. [Developer Experience](#13-developer-experience)
14. [External Sources, APIs & Vendor Strategy](#14-external-sources-apis--vendor-strategy)
15. [Phased Roadmap (v8.0 → v10.0)](#15-phased-roadmap-v80--v100)
16. [Refactor & Rewrite Backlog](#16-refactor--rewrite-backlog)
17. [Decisions Reaffirmed / Reversed / New](#17-decisions-reaffirmed--reversed--new)
18. [Risks & Mitigations](#18-risks--mitigations)
19. [Scope Boundaries](#19-scope-boundaries)
20. [Glossary & Acronyms](#20-glossary--acronyms)

---

## 1. Executive Summary

### Where we stand

CrossTide v7.24.0 is a **production-grade, offline-first, privacy-first financial
dashboard** built entirely with vanilla TypeScript and Web Standards — zero framework
runtime, zero tracking cookies, zero server-side user data. It is one of the most
feature-complete open-source trading dashboards in existence:

- **50+ technical indicators** with a **unique 12-method consensus engine**
- **19 route cards** covering watchlist, charting (LWC v5), screening, backtesting,
  portfolio analytics, risk metrics, correlation, market breadth, sector rotation,
  macro dashboard, earnings calendar, alert history, signal DSL, and more
- **6 data providers** (Yahoo, Finnhub, Stooq, CoinGecko, Tiingo, Polygon) with
  circuit-breaker failover
- **Real-time WebSocket streaming** via Finnhub
- **Cloudflare Workers edge backend** with Hono, rate limiting, CSP, OpenAPI spec
- **Workbox Service Worker** with precache, NetworkFirst/SWR strategies, Background
  Fetch, and Web Push (VAPID)
- **Passkey-encrypted cloud sync** via Cloudflare D1
- **On-device AI** pattern recognition via ONNX Runtime Web
- **4,308 unit tests** + Playwright E2E + Lighthouse CI
- **129 KB gzip initial bundle** — 10–30× smaller than any commercial competitor

### What this v4 rethink changes

The v3 roadmap (May 2026) was a "build everything" sprint that successfully
delivered Phases F through I. Almost every planned task is now **✅ Done**. The
remaining gaps are not feature gaps — they are **quality, resilience, and
architecture gaps** that prevent CrossTide from claiming genuine best-in-class
status:

| Gap Category                       | What's Missing                                                        | Impact                                          |
| ---------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| **Rendering performance**          | Full `innerHTML` re-render on every data update; no virtual scrolling | 100+ row tables freeze the UI                   |
| **DOM efficiency**                 | No incremental DOM updates; entire card trees rebuilt                 | Unnecessary GC pressure; CLS risk               |
| **Workspace structure**            | `src/` monolith vs npm workspaces (`app/`/`worker/`/`docs-site/`)     | Harder to scale CI, harder to contribute        |
| **ARIA live announcements**        | Cards don't announce data updates to screen readers                   | WCAG 2.1 AA compliance gap                      |
| **Table keyboard navigation**      | No arrow-key nav in data tables                                       | Power users and assistive tech blocked          |
| **Event delegation**               | Each card binds events directly to rendered elements                  | Memory bloat with many interactive rows         |
| **Request deduplication**          | Same ticker can be fetched from multiple cards simultaneously         | Wasted bandwidth + rate-limit burn              |
| **Chart sync cleanup**             | Subscribers to chart-sync bus may not unsubscribe on dispose          | Memory leak risk                                |
| **Worker production verification** | Routes assumed live but not health-checked in CI                      | Silent backend failures                         |
| **Container queries**              | Cards use media queries; should use container queries for layout      | Cards break when embedded in different contexts |

**The v4 pivot:** Stop building new features. Focus entirely on making what we
have **bulletproof, accessible, and fast** — then prove it with numbers.

---

## 2. Honest Status Audit — v7.24.0

### 2.1 Completed work (confirmed from source code)

**Feature completeness: 100 % of planned Phases A–I delivered.**

| Area                                                     | Status | Evidence                                      |
| -------------------------------------------------------- | ------ | --------------------------------------------- |
| 50+ indicators, 12-method consensus engine               | ✅     | `src/domain/` (93+ files)                     |
| Hand-written reactive signals (zero-dep)                 | ✅     | `src/core/signals.ts` (298 lines)             |
| History API + Navigation API progressive enhancement     | ✅     | `src/ui/router.ts`                            |
| Lightweight Charts v5 + uPlot inline charts              | ✅     | `src/cards/lw-chart.ts`                       |
| 19 route cards via lazy registry                         | ✅     | `src/cards/registry.ts`                       |
| Signal DSL card + Worker execution                       | ✅     | `src/cards/signal-dsl-card.ts`                |
| Workbox SW + Background Fetch + NavPreload               | ✅     | `src/sw.ts`                                   |
| 6 providers + circuit-breaker + health monitor           | ✅     | `src/providers/` (11 files)                   |
| Finnhub WebSocket streaming                              | ✅     | `src/core/reconnecting-ws.ts`                 |
| Tiered cache (L1 Map → L2 LS → L3 IDB → L4 SW → L5 OPFS) | ✅     | `src/core/tiered-cache.ts`                    |
| Storage pressure monitor + LRU eviction                  | ✅     | `src/core/storage-pressure.ts`                |
| CSP + security headers via Worker                        | ✅     | `worker/security.ts`                          |
| Hono Worker + OpenAPI + Rate Limiting                    | ✅     | `worker/index.ts`                             |
| Passkey auth + encrypted D1 cloud sync                   | ✅     | `src/core/passkey.ts`, `src/core/webauthn.ts` |
| Web Push VAPID notifications                             | ✅     | `src/core/push-notifications.ts`              |
| ONNX Runtime Web pattern recognition                     | ✅     | Phase I                                       |
| Command palette (⌘K) + Vim keyboard nav                  | ✅     | `src/ui/command-palette.ts`                   |
| Watchlist (sparklines, 52W, sort, drag-reorder)          | ✅     | `src/cards/watchlist-card.ts`                 |
| Screener (preset + custom, DSL)                          | ✅     | `src/cards/screener-card.ts`                  |
| Portfolio (P/L, allocation, benchmark)                   | ✅     | `src/cards/portfolio-card.ts`                 |
| Risk (Sharpe, Sortino, max DD, Beta, CAGR, VaR)          | ✅     | `src/cards/risk-card.ts`                      |
| Backtest (equity curve, Web Worker, DSL)                 | ✅     | `src/cards/backtest-card.ts`                  |
| Heatmap (Canvas treemap, sector drill-down)              | ✅     | `src/cards/heatmap-card.ts`                   |
| Correlation Matrix                                       | ✅     | `src/cards/correlation-matrix-card.ts`        |
| Market Breadth                                           | ✅     | `src/cards/market-breadth-card.ts`            |
| Sector Rotation (11 GICS vs SPY)                         | ✅     | `src/cards/sector-rotation-card.ts`           |
| Earnings Calendar                                        | ✅     | `src/cards/earnings-calendar-card.ts`         |
| Macro Dashboard (VIX, 10Y, DXY, gold, crude)             | ✅     | `src/cards/macro-dashboard-card.ts`           |
| Relative Strength Comparison                             | ✅     | `src/cards/relative-strength-card.ts`         |
| Consensus Timeline                                       | ✅     | `src/cards/consensus-timeline-card.ts`        |
| Provider Health monitor                                  | ✅     | `src/cards/provider-health-card.ts`           |
| i18n (EN + HE RTL)                                       | ✅     | `src/core/i18n.ts`                            |
| Color-blind palettes (4 modes)                           | ✅     | `src/ui/palette-switcher.ts`                  |
| View Transitions API                                     | ✅     | CSS `@supports`                               |
| CSS `@scope`, `@starting-style`, Anchor Positioning      | ✅     | `src/styles/`                                 |
| Temporal API polyfill                                    | ✅     | `@js-temporal/polyfill`                       |
| `using` / `Symbol.dispose` deterministic cleanup         | ✅     | Sweep complete                                |
| Compression Streams for exports                          | ✅     | `src/core/compress.ts`                        |
| File System Access API                                   | ✅     | Strategy save/load                            |
| Speculation Rules prefetch                               | ✅     | Card chunk hints                              |
| Per-card settings with Valibot schemas                   | ✅     | `AppConfig.cardSettings`                      |
| Per-method consensus weights                             | ✅     | `AppConfig.methodWeights`                     |
| ETF constituent drill-down                               | ✅     | Watchlist + Screener + Heatmap                |
| CSV / JSON / XLSX export                                 | ✅     | `src/core/data-export.ts`                     |
| Tauri 2.0 desktop wrapper                                | ✅     | Phase H                                       |
| Playwright E2E (≥15 flows)                               | ✅     | `tests/e2e/`                                  |
| Lighthouse CI (perf≥90, a11y≥95)                         | ✅     | `config/lighthouserc.json`                    |
| Astro Starlight docs-site + 48 MDX indicator pages       | ✅     | `docs-site/`                                  |

### 2.2 What is genuinely incomplete (the v4 gap list)

| #   | Area                               | Gap Detail                                                              | Severity | Target |
| --- | ---------------------------------- | ----------------------------------------------------------------------- | -------- | ------ |
| Q1  | **Rendering performance**          | Full `innerHTML` re-render on every update — no diffing, no virtual DOM | High     | K1     |
| Q2  | **Virtual scrolling**              | Tables render all rows; 100+ rows cause frame drops                     | High     | K2     |
| Q3  | **Request deduplication**          | Same ticker fetched from multiple cards simultaneously                  | Medium   | K3     |
| Q4  | **Event delegation**               | Events bound per-element in cards; no delegation pattern                | Medium   | K4     |
| Q5  | **Chart sync memory leak**         | Subscribers may not clean up on card dispose                            | Medium   | K5     |
| Q6  | **ARIA live for data updates**     | Cards don't announce dynamic content to screen readers                  | High     | K6     |
| Q7  | **Table keyboard navigation**      | No arrow-key nav in data tables                                         | Medium   | K7     |
| Q8  | **Container queries**              | Cards use media queries instead of container queries                    | Medium   | K8     |
| Q9  | **npm workspaces**                 | `src/` monolith; `worker/` and `docs-site/` are siblings not workspaces | Low      | K9     |
| Q10 | **Worker production health check** | CI doesn't verify Worker routes respond in staging                      | Medium   | K10    |
| Q11 | **CSP report-uri**                 | No CSP violation reporting                                              | Low      | K11    |
| Q12 | **Request ID tracking**            | Can't correlate client errors to server logs                            | Low      | K12    |
| Q13 | **Sparkline memoization**          | SVG sparklines recalculated on every render                             | Medium   | K13    |
| Q14 | **Skip link**                      | No visible skip-to-content link                                         | Low      | K14    |
| Q15 | **WCAG 2.2 AAA contrast**          | Color contrast not formally validated to AAA                            | Low      | K15    |
| Q16 | **Socket.dev supply chain**        | PR supply-chain check not wired                                         | Low      | K16    |
| Q17 | **Uptime Kuma status page**        | Not deployed                                                            | Low      | K17    |

---

## 3. Decision Rethink Matrix v4

Every architectural decision re-evaluated with fresh eyes at v7.24.0.

### 3.1 Decisions confirmed correct

| #   | Decision                          | Why it's right                                                                                                                                                   | Evidence                                |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| D1  | **Vanilla TS + zero-dep signals** | 129 KB gzip total bundle. React would add 40 KB before any app code. Preact Signals adds a dependency for equivalent functionality we already have in 298 lines. | Bundle budget consistently under 200 KB |
| D2  | **No virtual DOM**                | Eliminates diffing overhead. Cards render via imperative DOM — faster for small updates.                                                                         | LCP ~1.2s, INP ~80ms                    |
| D3  | **Pure domain layer**             | 93+ modules, 100% pure functions, no DOM/fetch/Date.now(). Trivially testable, portable to Workers/Node/Tauri.                                                   | 4,308 tests, 90% coverage               |
| D4  | **Valibot over Zod**              | 3 KB vs 30 KB. Same runtime validation at API boundaries.                                                                                                        | zod removed in v7.8.0                   |
| D5  | **Multi-provider failover**       | Yahoo breaks silently. Circuit breaker + 5 fallbacks = near-100% uptime for quote data.                                                                          | Provider health card proves it          |
| D6  | **Cloudflare all-in**             | $0/mo for personal use. Pages + Workers + KV + R2 + D1 + Rate Limiting.                                                                                          | No infrastructure cost                  |
| D7  | **Workbox Service Worker**        | Offline-first is table-stakes for a PWA. Precache + NetworkFirst + SWR + Background Fetch covers all patterns.                                                   | 44 precache entries                     |
| D8  | **Hono for Worker**               | 14 KB. Typed routes, middleware, auto-OpenAPI. Portable to Deno/Bun.                                                                                             | `worker/index.ts`                       |
| D9  | **Lightweight Charts**            | 45 KB gzip. Professional-grade candlestick charting. MIT licensed. Same library TradingView offers as OSS.                                                       | Used by chart cards                     |
| D10 | **Temporal API polyfill**         | Financial dates need timezone-safe arithmetic. `Date` has DST traps that cause real bugs in EOD calculations.                                                    | `@js-temporal/polyfill` active          |
| D11 | **Passkey auth (no password)**    | Privacy-first. No email, no password hash, no server-side user table. Credential-derived key encrypts user data.                                                 | Phase H delivered                       |
| D12 | **On-device AI (ONNX)**           | Privacy-preserving pattern recognition. No data leaves the browser. No LLM API cost.                                                                             | Phase I delivered                       |

### 3.2 Decisions to refine

| #   | Decision                    | Current State                           | Problem                                                                             | Refinement                                                                                                                                     |
| --- | --------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **innerHTML rendering**     | String templates → `innerHTML`          | Full re-render on every update. 100+ rows = frame drops. No event delegation.       | Adopt **incremental DOM update** pattern: diff new HTML against current DOM, patch only changed nodes. Add virtual scrolling for large tables. |
| R2  | **No event delegation**     | `addEventListener` per element          | Memory grows linearly with row count. Leaked listeners on re-render.                | Event delegation at card root: single listener per event type, dispatch by `data-action` attribute.                                            |
| R3  | **Monolith `src/`**         | All source in `src/`                    | Worker and docs-site are separate packages but share `node_modules` awkwardly.      | npm workspaces: `packages/app/`, `packages/worker/`, `packages/docs-site/`.                                                                    |
| R4  | **Media queries for cards** | `@media (max-width: ...)` in components | Cards don't adapt when embedded in different-width containers (multi-chart layout). | Adopt CSS container queries: `@container (min-width: 400px)` on card host elements.                                                            |
| R5  | **No request dedup**        | Each card fetches independently         | Same ticker fetched 2-3× if visible in multiple cards.                              | Add `fetchOnce(key, fn)` deduplication in `core/fetch.ts`: in-flight promise cache.                                                            |

### 3.3 New decisions for v4

| #   | Decision                            | Rationale                                                                                                                                                                |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| N1  | **Adopt incremental DOM patching**  | `morphdom` (2.7 KB gzip) or hand-written `patchDOM()` utility. Diff current vs new HTML, apply minimal mutations. Preserves event listeners, scroll position, and focus. |
| N2  | **Virtual scrolling for tables**    | Hand-written virtual scroller (~200 lines). Renders only visible rows + buffer. Enables 10K+ row screener results without frame drops.                                   |
| N3  | **CSS container queries for cards** | Each card host gets `container-type: inline-size`. Card CSS uses `@container` instead of `@media`. Cards adapt to their container, not the viewport.                     |
| N4  | **Event delegation pattern**        | Single `click`/`change`/`input` listener at card root. Elements use `data-action="toggle-sort"` `data-col="price"`. Card dispatch maps action → handler.                 |
| N5  | **Request deduplication layer**     | `core/fetch-dedup.ts`: Map of `key → Promise`. If a key is in-flight, return existing promise. Clear on resolve/reject. Integrates with circuit breaker.                 |
| N6  | **ARIA live region per card**       | Each card mounts a `<div role="status" aria-live="polite">` child. Significant data updates (price change, signal flip) are announced.                                   |
| N7  | **Sparkline memoization**           | Cache SVG path string per ticker + data hash. Only recompute when underlying close array changes.                                                                        |
| N8  | **CSP report-uri**                  | Add `report-uri /api/csp-report` to CSP header. Worker logs violations. Enables detecting XSS attempts in production.                                                    |
| N9  | **Request ID propagation**          | Worker generates `X-Request-ID` (UUID) per request. Client sends in error reports. Correlates client errors to server logs.                                              |

---

## 4. Best-in-Class Comparison Table

Comprehensive comparison against every relevant competitor. Honest assessment of
CrossTide's current position and target state.

`★★★` = best-in-class · `★★` = strong · `★` = adequate · `△` = partial · `✗` = absent

| Capability                       | CrossTide v7.24 |   v8 target    |     TradingView      |        FinViz        |   StockAnalysis   |  Koyfin   |  thinkorswim   | TrendSpider | GhostFolio |  Simply Wall St   |
| -------------------------------- | :-------------: | :------------: | :------------------: | :------------------: | :---------------: | :-------: | :------------: | :---------: | :--------: | :---------------: |
| **Pricing**                      |    Free OSS     |    Free OSS    | Freemium ($15–60/mo) | Freemium ($25–50/mo) | Freemium ($10/mo) | $39–99/mo | Free (Schwab)  |  $39–97/mo  |  Free OSS  | Freemium ($10/mo) |
| **Open source**                  |     ★★★ MIT     |    ★★★ MIT     |          ✗           |          ✗           |         ✗         |     ✗     |       ✗        |      ✗      |   ★ AGPL   |         ✗         |
| **Self-hostable**                |       ★★★       |      ★★★       |          ✗           |          ✗           |         ✗         |     ✗     |       ✗        |      ✗      | ★★ Docker  |         ✗         |
| **No-account required**          |       ★★★       |      ★★★       |          △           |         ★★★          |        ★★★        |     ✗     |       ✗        |      ✗      |     ✗      |         ✗         |
| **Privacy (cookieless)**         |       ★★★       |      ★★★       |      ✗ trackers      |        ✗ ads         |       ✗ ads       |     ✗     |    ✗ broker    |      △      |    ★★★     |         ✗         |
| **Bundle size (gzip)**           |   ★★★ 129 KB    |  ★★★ <200 KB   |       ✗ ~5 MB        |         SSR          |       ~2 MB       |   ~3 MB   |    Desktop     |    ~2 MB    |  ~500 KB   |       ~2 MB       |
| **Lighthouse perf**              |     ★★★ ≥90     |    ★★★ ≥90     |         ~50          |         ~70          |        ~75        |    ~60    |      n/a       |     ~55     |    ~65     |        ~60        |
| **Real-time streaming**          |      ★★ WS      |   ★★★ WS+DO    |         ★★★          |         Paid         |        ★★         |    ★★     |      ★★★       |     ★★★     |    EOD     |        EOD        |
| **Charting (candle+indicators)** |    ★★ LWC v5    |      ★★★       |         ★★★          |        Static        |        ★★         |    ★★     |      ★★★       |   ★★★ AI    |     ✗      |         ✗         |
| **Drawing tools**                |  ★★ Trend+Fib   |      ★★★       |       ★★★ 110+       |          ✗           |         ✗         |     ★     |       ★★       |   ★★★ AI    |     ✗      |         ✗         |
| **Indicator library**            |     ★★★ 50+     |    ★★★ 55+     |       ★★★ 400+       |         50+          |        30+        |    80+    |    ★★★ 400+    |  ★★★ 100+   |     ✗      |         ✗         |
| **Consensus engine**             |   ★★★ unique    |   ★★★ unique   |          ✗           |          ✗           |   Analyst only    |     ✗     |       ✗        |      △      |     ✗      |     ★ grades      |
| **Screener**                     |  ★★ preset+DSL  |      ★★★       |          ★★          |       ★★★ best       |        ★★         |    ★★     |       ★★       |     ★★★     |     ✗      |        ★★         |
| **Heatmap**                      |    ★★ Canvas    |      ★★★       |          ★★          |      ★★★ iconic      |        ★★         |    ★★     |       ✗        |      ✗      |     ✗      |         ✗         |
| **AI pattern recognition**       |     ★★ ONNX     |      ★★★       |       ★ basic        |          ✗           |         ✗         |     ✗     |       ✗        | ★★★ server  |     ✗      |         ✗         |
| **Backtest engine**              |   ★★★ WW+DSL    |      ★★★       |     Pine Script      |          ✗           |         ✗         |     ★     |  thinkScript   |  ★★★ auto   |     ✗      |         ✗         |
| **Portfolio analytics**          |   ★★★ Sharpe+   |      ★★★       |          ✗           |          ✗           |        ★★         | ★★★ best  |     Broker     |      ✗      |  ★★★ best  |        ★★         |
| **Risk metrics**                 |       ★★★       |      ★★★       |          ✗           |          ✗           |         ✗         |    ★★     |       ★★       |      ✗      |     ★★     |         ✗         |
| **Offline / PWA**                |    ★★★ full     |      ★★★       |          ✗           |          ✗           |         ✗         |     ✗     |    Desktop     |      ✗      |     ★★     |         ✗         |
| **Keyboard-first (⌘K, j/k)**     |       ★★★       |      ★★★       |          ★★          |          ✗           |         ✗         |    ★★     |       ★★       |      ✗      |     ✗      |         ✗         |
| **Accessibility (WCAG)**         |  ★★ AA likely   |  ★★★ AA cert   |          △           |          ✗           |         △         |     △     |       ✗        |      ✗      |     ★★     |         △         |
| **Cloud sync (E2E encrypted)**   |   ★★★ Passkey   |      ★★★       |       Account        |       Account        |      Account      |  Account  |     Broker     |   Account   |  Account   |      Account      |
| **Crypto coverage**              |       ★★        |      ★★★       |         ★★★          |          ✗           |         △         |    ★★     |       ✗        |      △      |    ★★★     |         ✗         |
| **Signal scripting**             |     ★★ DSL      | ★★★ DSL+Worker |       ★★★ Pine       |          ✗           |         ✗         |     ✗     | ★★ thinkScript |      ✗      |     ✗      |         ✗         |
| **Macro dashboard**              |       ★★★       |      ★★★       |         ★★★          |          ✗           |         ✗         |    ★★★    |      ★★★       |      ✗      |     ✗      |         ✗         |
| **Earnings calendar**            |       ★★★       |      ★★★       |         ★★★          |          ★★          |        ★★★        |    ★★★    |      ★★★       |      ✗      |     ✗      |        ★★         |
| **Sector rotation**              |       ★★★       |      ★★★       |         ★★★          |          ★★          |         ✗         |    ★★★    |      ★★★       |      ✗      |     ✗      |        ★★         |
| **News integration**             |     ★★ RSS      |      ★★★       |    ★★★ real-time     |          ★★          |        ★★★        |    ★★★    |      ★★★       |     ★★      |     ✗      |        ★★         |
| **Fundamental data**             |        ✗        |       △        |       ★★★ 100+       |         ★★★          |     ★★★ best      |    ★★★    |      ★★★       |      ✗      |     ✗      |        ★★★        |
| **Options chain**                |        ✗        |       ✗        |         ★★★          |          ✗           |        ★★         |    ★★     |    ★★★ best    |     ★★      |     ✗      |         ✗         |
| **Social / community**           |        ✗        |       ✗        |       ★★★ best       |       △ forum        |         ✗         |     ✗     |       ✗        |      ✗      |     ✗      |        ★★         |
| **Broker integration**           |        ✗        |       ✗        |       ★★★ 100+       |          ✗           |         ✗         |     ✗     |   ★★★ native   |      ✗      |     ✗      |         ✗         |
| **Mobile app (native)**          |    PWA only     |  PWA + Tauri   |   ★★★ iOS+Android    |          ✗           |  ★★ iOS+Android   |    ★★     |      ★★★       |     ★★      |   △ PWA    |        ★★         |
| **Multi-device sync**            |     ★★★ D1      |      ★★★       |         ★★★          |       Account        |        ★★         |    ★★     |      ★★★       |     ★★      |     ★★     |        ★★         |
| **Test coverage**                |    ★★★ 4,308    |      ★★★       |       Unknown        |       Unknown        |      Unknown      |  Unknown  |    Unknown     |   Unknown   |     ★★     |      Unknown      |
| **Structured logging**           |     ★★ Hono     |      ★★★       |        Prop.         |        Prop.         |       Prop.       |   Prop.   |     Prop.      |    Prop.    |    ★★★     |       Prop.       |

### Where CrossTide wins outright

1. **Open source + self-hostable + privacy-first**: No competitor combines all three.
   GhostFolio is AGPL (restrictive), has no charting, and requires Docker.
2. **Consensus engine**: No competitor has a weighted multi-method signal aggregation
   engine. TrendSpider has server-side AI alerts (paid); we have client-side consensus
   (free).
3. **Bundle size + performance**: 10–30× smaller than every commercial competitor.
   Lighthouse 90+ while TradingView scores ~50.
4. **Offline-first PWA**: Only GhostFolio competes. Our SW coverage is deeper
   (Background Fetch, precache with hash versioning, SWR for API).
5. **In-browser backtest**: Zero competitors in the OSS space have a Web Worker
   backtester with DSL scripting.
6. **On-device AI**: Privacy-preserving ONNX inference. TrendSpider does server-side
   (paid, data leaves browser). We do it locally for free.
7. **Passkey-only auth**: No email, no password hash. Unique in the space.

### Where to close the gap

| Competitor strength                  | Competitor               | CrossTide gap                   | Action                                                         |
| ------------------------------------ | ------------------------ | ------------------------------- | -------------------------------------------------------------- |
| Fundamental data (P/E, EPS, revenue) | StockAnalysis, Koyfin    | No fundamental data at all      | Add fundamental overlay via Yahoo `quoteSummary` (Phase L)     |
| Options chain                        | thinkorswim, TradingView | Not applicable to current scope | **Out of scope** — targets technical/quant traders             |
| Social / community                   | TradingView              | No social features              | **Out of scope** — privacy-first incompatible                  |
| Broker integration                   | TradingView, thinkorswim | No trade execution              | **Out of scope** — analysis-only platform                      |
| Drawing tools depth                  | TradingView (110+ tools) | 3 drawing tools                 | Add 5 more: rectangle, channel, pitchfork, ray, text (Phase L) |
| DOM rendering performance            | All SPA competitors      | Full innerHTML re-render        | Incremental DOM patching + virtual scrolling (Phase K)         |
| Accessibility certification          | GhostFolio               | WCAG AA not formally validated  | Formal WCAG 2.2 AA audit + fix (Phase K)                       |

---

## 5. Best Practices Harvested from Competitors

Actionable techniques identified from competitor analysis and industry leaders.

| Practice                                                 | Source                             | CrossTide Application                                        | Phase |
| -------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------ | ----- |
| **Incremental DOM patching** (morphdom / lit-html)       | Lit, Preact, Stimulus              | Replace `innerHTML` with diff-and-patch for all cards        | K1    |
| **Virtual scrolling** for large data tables              | FinViz, TradingView screener       | Hand-written virtual scroller for screener/portfolio         | K2    |
| **Container queries** for component-level responsiveness | Modern CSS spec (2023+)            | Replace `@media` in cards with `@container`                  | K8    |
| **Event delegation** with `data-action` attributes       | Stimulus, Rails UJS, GitHub        | Single listener per event type at card root                  | K4    |
| **Request deduplication** (SWR pattern)                  | Vercel SWR, TanStack Query         | `fetchOnce()` dedup layer in core/fetch.ts                   | K3    |
| **ARIA live regions** for financial data                 | WCAG 2.1 / GhostFolio              | Announce price changes, signal flips to screen readers       | K6    |
| **Sparkline memoization** by data hash                   | FinViz, Koyfin                     | Cache SVG `d` attribute; skip recompute if data unchanged    | K13   |
| **CSP report-uri** for XSS detection                     | GitHub, Cloudflare blog            | Add `/api/csp-report` route; log violations                  | K11   |
| **Request ID propagation**                               | Linear, Vercel, every SaaS         | `X-Request-ID` in Worker; correlate errors client↔server     | K12   |
| **Fundamental data overlay**                             | StockAnalysis, Koyfin, TradingView | Yahoo `quoteSummary` for P/E, EPS, revenue, market cap       | L1    |
| **Seasonal charts**                                      | TradingView Seasonals              | Show monthly historical returns to detect recurring patterns | L2    |
| **Watchlist alerts on multiple conditions**              | TradingView                        | Combine price + indicator + DSL in single alert rule         | L3    |
| **Strategy comparison side-by-side**                     | TradingView, TrendSpider           | Backtest two strategies on same chart; compare P/L, drawdown | L4    |
| **Skip link + landmark navigation**                      | WCAG 2.2 / Every a11y audit        | Visible skip-to-content; proper `<main>`, `<nav>`, `<aside>` | K14   |

---

## 6. Architecture Vision

### 6.1 Current topology (v7.24.0)

```text
┌──────────────────────────────────────────────────────────────────────┐
│                           Browser (PWA)                              │
│                                                                      │
│  index.html → main.ts                                                │
│       │                                                              │
│       ├── Router (History API + Navigation API PE)                   │
│       ├── Signals store (signals.ts, 298 lines, zero-dep)            │
│       ├── Compute Worker (Transferable Float64Array)                  │
│       ├── Storage Worker (OPFS for >5y OHLC)                         │
│       ├── Service Worker (Workbox + Background Fetch + Web Push)      │
│       ├── ONNX Runtime (on-device pattern recognition)               │
│       └── 19 lazy-loaded card modules via registry                   │
└──────────┬───────────────────────────────────────────────────────────┘
           │ HTTPS / WSS (COOP + COEP + strict-CSP)
┌──────────┴───────────────────────────────────────────────────────────┐
│  Cloudflare Pages (static SPA + _headers)                            │
│  + Pages Functions (Hono edge Worker)                                │
│      ├─ GET  /api/health              circuit state + uptime          │
│      ├─ GET  /api/quote/:symbol       spot (KV 60s)                  │
│      ├─ GET  /api/history/:symbol     OHLCV (KV 24h; R2 cold)       │
│      ├─ GET  /api/search?q=           autocomplete (KV 1h)           │
│      ├─ GET  /api/og/:symbol.png      Satori OG image (edge 1h)     │
│      ├─ WSS  /api/stream              Durable Object per symbol      │
│      ├─ POST /api/errors              sampled GlitchTip ingest       │
│      ├─ POST /api/signal-dsl/execute  DSL evaluation                 │
│      ├─ GET  /openapi.json            Hono auto-generated            │
│      └─ GET/PUT /api/sync             Passkey-encrypted D1 blob      │
└──────────┬───────────────────────────────────────────────────────────┘
           │
   ┌───────┼──────┬─────────┬──────────┬───────────┬────────────┐
   ▼       ▼      ▼         ▼          ▼           ▼            ▼
 Yahoo  Finnhub  Stooq  CoinGecko   Tiingo      Polygon      Alpha V.
 (free) (WS+REST)(EOD)   (crypto)   (alt paid)  (paid esc.)  (last resort)
```

### 6.2 Target internal changes (v8.0 — Phase K)

```text
Browser-side improvements:
  ├── patchDOM() utility (morphdom) for incremental updates
  ├── VirtualScroller class for large tables (>50 rows)
  ├── fetchOnce() request deduplication layer
  ├── Event delegation at card root (data-action dispatch)
  ├── Container queries on card host elements
  ├── ARIA live regions in every card
  └── Sparkline SVG path memoization

Worker-side improvements:
  ├── POST /api/csp-report endpoint
  ├── X-Request-ID propagation in all responses
  └── CI health-check job post-deploy
```

### 6.3 Dependency rules (enforced by eslint-plugin-import-x)

```text
types/      ← nothing
domain/     ← types/                        (pure; no DOM, no I/O)
core/       ← types/, domain/               (no UI-layer code)
providers/  ← types/, core/
cards/      ← types/, domain/, core/, providers/, ui/
ui/         ← types/, core/
worker/     ← independent (own tsconfig, Hono)
docs-site/  ← independent (Astro)
```

### 6.4 Npm workspaces layout (Phase K target)

```text
CrossTide/                       ← workspace root
├── package.json                 ← workspaces: ["packages/*"]
├── packages/
│   ├── app/                     ← was src/
│   │   ├── types/
│   │   ├── domain/              ← pure; no DOM, no I/O
│   │   ├── core/
│   │   ├── providers/
│   │   ├── cards/
│   │   ├── ui/
│   │   └── styles/
│   ├── worker/                  ← Hono CF Worker
│   └── docs-site/               ← Astro Starlight
├── tests/
│   ├── unit/
│   ├── e2e/
│   └── helpers/
└── config/
```

---

## 7. Frontend Strategy

### 7.1 Rendering model — the big evolution

**Current:** String templates → `innerHTML` → full re-render on every update.

**Problem:** This worked well for small datasets but becomes a bottleneck at scale:

- 100+ row watchlist/screener → frame drops
- Event listeners lost on re-render → must re-bind
- Focus and scroll position reset on re-render
- Sparkline SVGs recalculated unnecessarily

**Target:** Incremental DOM patching + virtual scrolling.

```ts
// Before (current pattern in every card):
container.innerHTML = `<table>${rows.map((r) => `<tr>...</tr>`).join("")}</table>`;

// After (Phase K pattern):
const newHTML = `<table>${rows.map((r) => `<tr>...</tr>`).join("")}</table>`;
patchDOM(container, newHTML); // diff and apply minimal mutations
```

Options evaluated:

| Library          | Size (gz) | Approach                 | Verdict                                 |
| ---------------- | --------- | ------------------------ | --------------------------------------- |
| **morphdom**     | 2.7 KB    | DOM → DOM diff           | ★★★ Best fit — same innerHTML API       |
| **lit-html**     | 5 KB      | Tagged template literals | Too different from current API          |
| **Preact**       | 4 KB      | Virtual DOM              | Framework adoption — rejected (D1)      |
| **Hand-written** | ~1 KB     | Walk + patch             | Maintenance burden vs battle-tested lib |

**Decision:** Adopt `morphdom` for incremental DOM patching. Minimal API change,
preserves focus, scroll, and event listeners.

### 7.2 Virtual scrolling

Hand-written virtual scroller (~200 lines). Renders only visible rows + overscan
buffer. Applied to Watchlist, Screener, Portfolio, Alerts when row count > 50.

### 7.3 Event delegation

```ts
container.addEventListener("click", (e) => {
  const target = (e.target as HTMLElement).closest("[data-action]");
  if (!target) return;
  handlers.get(target.dataset.action)?.(target.dataset, e);
});
```

### 7.4 Container queries

```css
.card-host {
  container-type: inline-size;
}

@container (max-width: 500px) {
  .watchlist-sparkline {
    display: none;
  }
}
```

### 7.5 Charts (unchanged)

- Lightweight Charts v5: interactive candlestick + sub-panes + drawing tools
- uPlot: static inline charts in screener rows and consensus timeline
- CSS Anchor Positioning: crosshair tooltip
- Scroll-driven animations: time-axis scroll indicator

### 7.6 Accessibility upgrades

| Improvement             | Implementation                                    | WCAG  |
| ----------------------- | ------------------------------------------------- | ----- |
| **ARIA live in cards**  | `<div role="status" aria-live="polite">` per card | 4.1.3 |
| **Table keyboard nav**  | Arrow keys, Enter, Escape                         | 2.1.1 |
| **Skip link**           | Visible `<a href="#main" class="skip-link">`      | 2.4.1 |
| **Contrast validation** | Automated in CI via axe-core                      | 1.4.3 |

---

## 8. Backend, Data & Infrastructure Strategy

### 8.1 Worker improvements (Phase K)

| Improvement             | Implementation                                      |
| ----------------------- | --------------------------------------------------- |
| **CSP report endpoint** | `POST /api/csp-report` — logs violations to R2      |
| **Request ID**          | UUID in `X-Request-ID`; included in structured logs |
| **Health check in CI**  | GitHub Actions curls `/api/health` post-deploy      |

### 8.2 Provider chain (unchanged)

```text
quote:    Yahoo → Finnhub → Tiingo → Alpha Vantage
history:  Yahoo → Stooq → Finnhub → Tiingo → Polygon
search:   Yahoo → Finnhub
crypto:   CoinGecko (primary)
stream:   Finnhub WSS → Polygon WSS (paid fallback)
```

### 8.3 Infrastructure ($0/mo target)

| Layer             | Tech                           | Cost                |
| ----------------- | ------------------------------ | ------------------- |
| Static hosting    | Cloudflare Pages               | Free                |
| Edge runtime      | Cloudflare Workers (Hono)      | Free (100K req/day) |
| KV cache          | Cloudflare KV                  | Free (100K ops/day) |
| Cold storage      | Cloudflare R2                  | Free (10 GB)        |
| Rate limiting     | Cloudflare Rate Limiting API   | Free                |
| WebSocket fan-out | Cloudflare Durable Objects     | Free tier           |
| Cloud sync DB     | Cloudflare D1                  | Free (5 GB)         |
| Error tracking    | Self-hosted GlitchTip (Fly.io) | Free                |
| Analytics         | Self-hosted Plausible (Fly.io) | Free                |
| CI                | GitHub Actions                 | Free (public repo)  |

---

## 9. Storage, Sync & Offline Strategy

Five-tier storage model operational:

| Tier  | Tech                     | Use                         | TTL/Cap               |
| ----- | ------------------------ | --------------------------- | --------------------- |
| L1    | `Map` in-memory          | Hot quotes, computed series | Session               |
| L2    | `localStorage`           | Config, theme, sort prefs   | Persistent ~5 MB      |
| L3    | IndexedDB                | Candles, alerts, portfolio  | LRU 50 MB             |
| L4    | Service Worker Cache API | App shell + SWR             | Per-strategy          |
| L5    | OPFS                     | OHLC archives >5y           | Persistent, unbounded |
| Edge  | Cloudflare KV / R2       | Hot quotes / cold OHLCV     | TTL / cold            |
| Cloud | Worker + D1              | Passkey-encrypted blobs     | Per-user              |

---

## 10. Quality, Security & Observability

### 10.1 CI gates

```text
typecheck         tsc --noEmit (strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes)
typecheck:sw      tsc -p tsconfig.sw.json --noEmit
lint              eslint . --max-warnings 0
lint:css          stylelint
lint:html         htmlhint
lint:md           markdownlint-cli2
format:check      prettier --check
test              vitest run --coverage (≥90 stmt, ≥80 branch, ≥90 fn)
test:e2e          playwright (≥15 flows)
a11y              axe in every E2E flow (0 serious/critical)
build             vite build
bundle            check-bundle-size.mjs (<200 KB gz initial)
lighthouse        lhci autorun (perf≥90 a11y≥95 best≥95 SEO≥90)
audit             npm audit --omit=dev (no high/critical)
secret-scan       gitleaks (pre-commit + CI)
worker-health     curl /api/health on staging post-deploy       ← Phase K
```

### 10.2 Security posture

| Control                                      | Status     |
| -------------------------------------------- | ---------- |
| CSP via Worker (strict)                      | ✅         |
| HSTS (31536000s, includeSubDomains, preload) | ✅         |
| X-Frame-Options: DENY                        | ✅         |
| Permissions-Policy (restrictive)             | ✅         |
| Valibot at all external boundaries           | ✅         |
| escapeHtml for all innerHTML with user data  | ✅         |
| SRI hashes for preloads                      | ✅         |
| Token-bucket + CF native rate limiting       | ✅         |
| gitleaks secret scanning                     | ✅         |
| CSP report-uri                               | ⬜ Phase K |
| Request ID correlation                       | ⬜ Phase K |

### 10.3 Observability

| Layer       | Tool                                             |
| ----------- | ------------------------------------------------ |
| Worker logs | Hono middleware → structured JSON → Logpush → R2 |
| Errors      | GlitchTip SDK (25% sampled, PII scrubbed)        |
| Analytics   | Plausible custom events                          |
| RUM         | web-vitals → Plausible (LCP, INP, CLS)           |
| Status page | Uptime Kuma (Phase K)                            |

---

## 11. Performance Budget

| Asset                  | Budget          | Current           | Status |
| ---------------------- | --------------- | ----------------- | ------ |
| HTML                   | < 8 KB          | ~4 KB             | ✅     |
| CSS                    | < 30 KB gz      | ~8 KB             | ✅     |
| JS initial             | < 200 KB gz     | 129.1 KB          | ✅     |
| Lazy card chunk        | < 50 KB gz each | ~25 KB avg        | ✅     |
| LWC chunk              | ~40 KB gz       | dynamic import    | ✅     |
| Fonts (Inter Variable) | < 25 KB gz      | self-hosted woff2 | ✅     |
| **Initial total**      | **< 200 KB gz** | **129.1 KB**      | ✅     |
| LCP (4G, mid Android)  | < 1.8 s         | ~1.2 s            | ✅     |
| INP (p75)              | < 200 ms        | ~80 ms            | ✅     |
| CLS                    | < 0.05          | ~0.02             | ✅     |
| Lighthouse perf        | ≥ 90            | ≥ 90              | ✅     |
| Lighthouse a11y        | ≥ 95            | ≥ 95              | ✅     |

---

## 12. Documentation Strategy

| Doc                      | Status            | Action                  |
| ------------------------ | ----------------- | ----------------------- |
| `README.md`              | ✅                | Maintain                |
| `CHANGELOG.md`           | ✅ Per-release    | Changesets automated    |
| `ARCHITECTURE.md`        | ✅ v7.24.0        | Update per phase        |
| `CONTRIBUTING.md`        | ✅                | No change               |
| `COPILOT_GUIDE.md`       | ✅                | Refresh quarterly       |
| `ROADMAP.md`             | ✅ This document  | Refresh per phase       |
| Astro docs-site (48 MDX) | ✅                | Extend with user guides |
| OpenAPI spec             | ✅ Auto-generated | No change               |
| JSDoc on public exports  | ✅                | Maintain                |

---

## 13. Developer Experience

| Area              | Current                                   | Target                   |
| ----------------- | ----------------------------------------- | ------------------------ |
| Package manager   | npm (shared MyScripts/)                   | npm workspaces (Phase K) |
| TypeScript        | 6.0.3                                     | Keep current             |
| Git hooks         | simple-git-hooks + lint-staged + gitleaks | No change                |
| Commit style      | Conventional Commits                      | No change                |
| Releases          | Changesets                                | No change                |
| Worker local dev  | wrangler dev + Vite proxy                 | No change                |
| E2E local         | vite preview                              | No change                |
| Component preview | dev/components.html                       | Extend                   |
| PR previews       | Cloudflare Pages auto-preview             | No change                |

---

## 14. External Sources, APIs & Vendor Strategy

### 14.1 Data providers

| Provider         | Free Tier             | Use                   | Risk                  | Mitigation                |
| ---------------- | --------------------- | --------------------- | --------------------- | ------------------------- |
| Yahoo Finance v8 | Unlimited best-effort | Primary quote/history | Can break unannounced | Circuit breaker → Stooq   |
| Finnhub          | 60/min + WSS          | Secondary; streaming  | Free tier limits      | Market-hours guard        |
| Stooq            | Unlimited EOD CSV     | Bulk >1y history      | EOD only              | Historical only           |
| CoinGecko        | 50/min free           | Crypto only           | Schema changes        | Valibot; aggressive cache |
| Tiingo           | 500/hour; $10/mo+     | Affordable paid tier  | Cost                  | User-provided key only    |
| Polygon          | $29/mo basic          | Premium paid tier     | Cost                  | User-provided key only    |
| Alpha Vantage    | 25/day                | Last-resort fallback  | Very slow             | Last position only        |
| FRED             | Unlimited, no auth    | Economic calendar     | Gov API               | Stable                    |

### 14.2 Vendor lock-in assessment

| Vendor             | Risk   | Mitigation                         |
| ------------------ | ------ | ---------------------------------- |
| Cloudflare         | Medium | Hono portable to Deno/Bun/Lambda   |
| GitHub             | Low    | Mirror to GitLab; YAML is standard |
| Lightweight Charts | Low    | MIT; replaceable with uPlot/D3     |
| Fly.io             | Low    | Docker; portable in 1 day          |
| ONNX Runtime Web   | Low    | MIT; browser-native inference      |

---

## 15. Phased Roadmap (v8.0 → v10.0)

Phases A–I are **complete**. The v4 roadmap defines Phases K–M.

### Phase K — v8.0.0 "Performance, Accessibility & Architecture"

**Theme:** Make what we have bulletproof. No new features — only quality.

| #   | Task                                                                                            | Priority | Effort |
| --- | ----------------------------------------------------------------------------------------------- | -------- | ------ |
| K1  | **Incremental DOM patching**: Add `morphdom`; create `patchDOM()` wrapper; migrate all 19 cards | P0       | 3d     |
| K2  | **Virtual scrolling**: `VirtualScroller` class for tables > 50 rows                             | P0       | 2d     |
| K3  | **Request deduplication**: In-flight promise cache in `core/fetch-dedup.ts`                     | P0       | 4h     |
| K4  | **Event delegation**: Single listener per event type at card root; `data-action` dispatch       | P1       | 2d     |
| K5  | **Chart sync cleanup**: Ensure all subscribers unsubscribe on dispose                           | P1       | 2h     |
| K6  | **ARIA live regions**: Add to each card; announce price changes, signal flips                   | ✅ Done  | 1d     |
| K7  | **Table keyboard navigation**: Arrow keys, Enter, Escape                                        | ✅ Done  | 1d     |
| K8  | **Container queries**: Replace `@media` in card CSS with `@container`                           | ✅ Done  | 1d     |
| K9  | **npm workspaces**: `src/` → `packages/app/`, `worker/` → `packages/worker/`                    | P2       | 2d     |
| K10 | **Worker health check in CI**: curl `/api/health` post-deploy                                   | ✅ Done  | 2h     |
| K11 | **CSP report-uri**: `POST /api/csp-report` route                                                | ✅ Done  | 4h     |
| K12 | **Request ID propagation**: `X-Request-ID` in Worker responses                                  | ✅ Done  | 2h     |
| K13 | **Sparkline memoization**: Cache SVG path by data hash                                          | ✅ Done  | 4h     |
| K14 | **Skip link**: Visible skip-to-content in index.html                                            | ✅ Done  | 1h     |
| K15 | **WCAG 2.2 AA formal audit**: axe-core + WAVE + manual keyboard test all 23 routes              | ✅ Done  | 2d     |
| K16 | **socket.dev supply chain**: Add as GitHub App                                                  | ✅ Done  | 1h     |
| K17 | **Uptime Kuma**: Deploy on Fly.io; README badge                                                 | ✅ Done  | 2h     |

**Exit criteria:**

- morphdom patching in all 19 cards
- Virtual scrolling for tables > 50 rows
- Request dedup active
- ARIA live in every card
- axe-core: 0 serious/critical across all 19 routes
- Worker health check in CI

---

### Phase L — v9.0.0 "Fundamental Data & Advanced Analysis"

**Theme:** Close the biggest remaining feature gap — fundamental data.

| #   | Task                                                                                                                                                                                | Priority | Effort |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| L1  | **Fundamental data overlay**: P/E, EPS, revenue, market cap, dividend yield                                                                                                         | P0       | 3d     |
| L2  | **Seasonal charts**: Monthly historical return bars (Jan–Dec)                                                                                                                       | P1       | 2d     |
| L3  | **Multi-condition alerts**: Combine price + indicator + DSL in one rule                                                                                                             | ✅ Done  | 2d     |
| L4  | **Strategy comparison**: Backtest two strategies side-by-side                                                                                                                       | ✅ Done  | 2d     |
| L5  | **Additional drawing tools**: Rectangle, channel, pitchfork, ray, text                                                                                                              | ✅ Done  | 3d     |
| L6  | **Screener column customization**: User-selected visible columns                                                                                                                    | ✅ Done  | 1d     |
| L7  | **Watchlist groups**: Named collapsible sections                                                                                                                                    | ✅ Done  | 1d     |
| L8  | **Chart comparison mode**: 2–4 tickers on normalized % scale                                                                                                                        | P1       | 1d     |
| L9  | **Export to image**: Screenshot card to PNG/SVG                                                                                                                                     | ✅ Done  | 1d     |
| L10 | **Plugin API for custom indicators**: External ESM at runtime                                                                                                                       | ✅ Done  | 3d     |
| L11 | **Watchlist hover zoom**: Hovering a stock row shows a popup with mini-chart, key stats (price, change, volume, consensus), and sparkline — instant preview without navigating away | ✅ Done  | 2d     |

---

### Phase M — v10.0.0 "Polish, Scale & Community"

**Theme:** Final polish for public launch.

| #   | Task                                                                        | Priority | Effort |
| --- | --------------------------------------------------------------------------- | -------- | ------ |
| M1  | **Load testing**: 10K tickers; verify virtual scrolling holds               | ✅ Done  | 1d     |
| M2  | **Mobile responsive audit**: All 23 cards on mobile viewports               | ✅ Done  | 2d     |
| M3  | **WebSocket reconnect stress tests**: Network flap simulation               | P1       | 1d     |
| M4  | **Complete user guide suite**: Guide for every card                         | ✅ Done  | 3d     |
| M5  | **Contributing guide update**: PR template, issue templates                 | ✅ Done  | 1d     |
| M6  | **i18n expansion**: Add ES, DE, ZH locales                                  | ✅ Done  | 3d     |
| M7  | **Performance regression CI**: Track metrics over time; alert on regression | ✅ Done  | 1d     |
| M8  | **Dependency audit automation**: Weekly npm audit + Dependabot              | ✅ Done  | 2h     |
| M9  | **README showcase**: Screenshots, GIF demos, feature comparison             | P1       | 1d     |
| M10 | **v10 launch**: GitHub release + Product Hunt + Hacker News                 | P0       | 1d     |

---

## 16. Refactor & Rewrite Backlog

| #   | Refactor                                            | Status                                                                                        | Target |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| R1  | Delete `core/state.ts`                              | ✅ Done                                                                                       | —      |
| R2  | Standardize cards mount() to CardHandle             | ✅ Done                                                                                       | —      |
| R3  | **`src/` → `packages/app/` + npm workspaces**       | Pending                                                                                       | K9     |
| R4  | Replace `core/index.ts` barrel with subpath exports | ✅ Done                                                                                       | —      |
| R5  | Remove remaining `as` casts                         | ✅ Done                                                                                       | —      |
| R6  | JSDoc sweep on all public exports                   | ✅ Done                                                                                       | —      |
| R7  | Replace cards/index.ts static → registry lazy       | ✅ Done                                                                                       | —      |
| R8  | Unify date-format under core/                       | ✅ Done                                                                                       | —      |
| R9  | Replace EventTarget → signals                       | ✅ Done                                                                                       | —      |
| R10 | Migrate to eslint-plugin-import-x                   | ✅ Done                                                                                       | —      |
| R11 | Worker rewrite to Hono                              | ✅ Done                                                                                       | —      |
| R12 | Extract makeCandles() to fixtures                   | ✅ Done                                                                                       | —      |
| R13 | tsd type tests for public API                       | ✅ Done                                                                                       | —      |
| R14 | **innerHTML → patchDOM migration**                  | ✅ Done — 0 violations remain in src/cards/                                                   | K1     |
| R15 | **Event delegation migration**                      | ✅ Near-complete (5 legitimate direct listeners remain: canvas/SVG mouse, keyboard shortcuts) | K4     |
| R16 | **Media queries → container queries**               | ✅ Done — portfolio-columns + watchlist-table migrated to @container                          | K8     |

---

## 17. Decisions Reaffirmed / Reversed / New

### Reaffirmed

| #   | Decision                                     |
| --- | -------------------------------------------- |
| D1  | Vanilla TS + zero-dep signals (no framework) |
| D2  | Pure domain layer (no DOM, no I/O)           |
| D3  | Valibot as sole runtime validator            |
| D4  | Multi-provider failover with circuit breaker |
| D5  | Cloudflare all-in ($0/mo)                    |
| D6  | Workbox Service Worker                       |
| D7  | Hono for Worker                              |
| D8  | Lightweight Charts v5                        |
| D9  | Passkey-only auth                            |
| D10 | On-device ONNX AI                            |
| D11 | Temporal API polyfill                        |
| D12 | MIT license                                  |

### Reversed

| Old Decision              | New Decision                    | Why                       |
| ------------------------- | ------------------------------- | ------------------------- |
| `innerHTML` for rendering | `morphdom` incremental patching | Performance at scale      |
| Per-element event binding | Event delegation at card root   | Memory efficiency         |
| `@media` queries in cards | Container queries               | Context-independent cards |

### New

| #   | Decision                         | Rationale                               |
| --- | -------------------------------- | --------------------------------------- |
| N1  | morphdom for DOM patching        | 2.7 KB gz; minimal API change           |
| N2  | Hand-written virtual scroller    | No dependency; tailored to our tables   |
| N3  | Container queries                | Baseline 2023; cards adapt to container |
| N4  | Event delegation via data-action | Survives re-render; standard pattern    |
| N5  | Request deduplication            | Eliminates N+1 fetches                  |
| N6  | ARIA live per card               | WCAG 2.1 §4.1.3                         |
| N7  | CSP report-uri                   | Detect XSS in production                |
| N8  | Fundamental data (Phase L)       | Biggest feature gap                     |

---

## 18. Risks & Mitigations

| Risk                       | Likelihood | Impact   | Mitigation                               |
| -------------------------- | ---------- | -------- | ---------------------------------------- |
| Yahoo Finance API breaks   | Medium     | High     | 5 fallback providers; circuit breaker    |
| Cloudflare pricing changes | Low        | High     | Hono portable to Deno/Bun                |
| morphdom bundle size creep | Low        | Low      | 2.7 KB; replaceable with hand-written    |
| ONNX model accuracy drift  | Medium     | Low      | Backtesting validates; advisory only     |
| Corporate proxy blocks     | Medium     | Medium   | https-proxy-agent in dev; Worker in prod |
| npm supply chain attack    | Low        | Critical | socket.dev + gitleaks + npm audit        |
| Contributor scalability    | Medium     | Medium   | Clear docs (ARCHITECTURE + CONTRIBUTING) |

---

## 19. Scope Boundaries

**CrossTide IS:**

- A technical/quantitative analysis dashboard
- A signal generation and consensus engine
- A portfolio analytics and risk management tool
- A privacy-first, offline-capable PWA
- Open source and self-hostable

**CrossTide IS NOT:**

- A trading platform (no order execution)
- An options trading tool (no options chain)
- A social network (no user profiles)
- A news aggregator (RSS digest is supplementary)
- A fundamental analysis platform (fundamental overlay is supplementary)
- A robo-advisor (no automated recommendations)

These boundaries are deliberate. Expanding into trading or social features would
compromise the privacy-first, zero-account architecture that defines CrossTide.

---

## 20. Glossary & Acronyms

| Acronym  | Meaning                                     |
| -------- | ------------------------------------------- |
| ATR      | Average True Range                          |
| CLS      | Cumulative Layout Shift                     |
| COOP     | Cross-Origin Opener Policy                  |
| COEP     | Cross-Origin Embedder Policy                |
| CSP      | Content Security Policy                     |
| D1       | Cloudflare D1 (SQLite-on-edge database)     |
| DO       | Cloudflare Durable Objects                  |
| DSL      | Domain-Specific Language                    |
| EOD      | End of Day (daily closing prices)           |
| EPS      | Earnings Per Share                          |
| GICS     | Global Industry Classification Standard     |
| HKDF     | HMAC-based Key Derivation Function          |
| HSTS     | HTTP Strict Transport Security              |
| IDB      | IndexedDB                                   |
| INP      | Interaction to Next Paint                   |
| KV       | Cloudflare Key-Value store                  |
| LCP      | Largest Contentful Paint                    |
| LRU      | Least Recently Used                         |
| LWC      | Lightweight Charts                          |
| OHLCV    | Open, High, Low, Close, Volume              |
| ONNX     | Open Neural Network Exchange                |
| OPFS     | Origin Private File System                  |
| PE       | Progressive Enhancement                     |
| PWA      | Progressive Web App                         |
| R2       | Cloudflare R2 (S3-compatible storage)       |
| RUM      | Real User Monitoring                        |
| SAB      | SharedArrayBuffer                           |
| SRI      | Subresource Integrity                       |
| SWR      | Stale-While-Revalidate                      |
| VAPID    | Voluntary Application Server Identification |
| VaR      | Value at Risk                               |
| WCAG     | Web Content Accessibility Guidelines        |
| WS / WSS | WebSocket / WebSocket Secure                |
