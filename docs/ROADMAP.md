# CrossTide — Strategic Roadmap v3 (Deep Rethink, May 2026)

> **Last updated:** May 3, 2026
> **Declared version:** v7.24.0
> **Codebase scale:** 264 source modules, 4308 unit tests, 2 E2E spec files
> **Sprint cadence:** 5 sprints per minor release
> **Previous roadmap archived at:** `docs/ROADMAP.archive-2026-05.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Honest Status Audit — v7.7.0](#2-honest-status-audit--v770)
3. [Decision Rethink Matrix v3](#3-decision-rethink-matrix-v3)
4. [Best-in-Class Comparison Table](#4-best-in-class-comparison-table)
5. [Best Practices Harvested](#5-best-practices-harvested)
6. [Architecture Vision](#6-architecture-vision)
7. [Frontend Strategy](#7-frontend-strategy)
8. [Backend, Data & Infrastructure Strategy](#8-backend-data--infrastructure-strategy)
9. [Storage, Sync & Offline Strategy](#9-storage-sync--offline-strategy)
10. [Quality, Security & Observability](#10-quality-security--observability)
11. [Performance Budget](#11-performance-budget)
12. [Documentation Strategy](#12-documentation-strategy)
13. [Developer Experience](#13-developer-experience)
14. [External Sources, APIs & Vendor Strategy](#14-external-sources-apis--vendor-strategy)
15. [Phased Roadmap (v7.8 → v9.0)](#15-phased-roadmap)
16. [Outstanding Work Consolidated](#16-outstanding-work-consolidated)
17. [Refactor & Rewrite Backlog](#17-refactor--rewrite-backlog)
18. [Decisions Reaffirmed / Reversed / New](#18-decisions-reaffirmed--reversed--new)
19. [Risks & Mitigations](#19-risks--mitigations)
20. [Scope Boundaries](#20-scope-boundaries)
21. [Glossary & Acronyms](#21-glossary--acronyms)

---

## 1. Executive Summary

**Where we stand after the v3 rethink.**
CrossTide has completed the "library to product" pivot. The gap identified in May
2026's previous rethink — that we had built the engine but not the car — is largely
closed. At v7.7.0 the application is a **full-featured, offline-first financial
dashboard** with: 93-file domain layer (50+ indicators), 12-method consensus engine,
real charting (Lightweight Charts v5, sub-panes, drawing tools), History API routing,
hand-written reactive signals (zero-dep), Workbox SW, real-time Finnhub WS, six
data providers with circuit-breaker failover, Playwright E2E, Lighthouse CI, CSP via
Cloudflare Worker, and a complete design token system. `state.ts` is gone; cards all
mount via the registry; the Worker is deployed on Cloudflare Pages.

**Where we genuinely lag — the v3 gaps.**

1. **Platform modernization**: TypeScript 6.0 is live in `MyScripts/` yet CrossTide
   runs 5.9. The JavaScript platform has advanced: `Temporal` API (now Stage 4),
   Navigation API, Popover API, CSS Anchor Positioning, Speculation Rules, and
   Compression Streams all land improvements that matter here.
2. **Runtime redundancy**: Both `valibot` and `zod` are production dependencies.
   Only one can stay.
3. **Observability gap**: GlitchTip + Plausible are designed but not deployed. The
   Worker logs are `console.log` strings, not structured.
4. **E2E coverage**: 2 spec files for 14 routes is not a real safety net.
5. **docs-site**: The Astro Starlight site exists locally, npm-installed, but never
   deployed or linked from the README.
6. **SharedArrayBuffer zero-copy**: The Worker sets `COOP` + `COEP` headers (enabling
   SAB) but no worker transfer path uses `SharedArrayBuffer` for OHLC series.
7. **Worker is bare `addEventListener`**: No framework; routing logic is ad-hoc
   `if`/`switch`. Should be Hono.
8. **The `src/` layout vs `app/` workspaces**: Refactor R3 (npm workspaces,
   `app/`/`worker/`/`docs-site/`) is pending.

**The v3 pivot:** Finish what's started, modernize the platform layer, then build
the two genuinely missing product capabilities — **Passkey-encrypted cloud sync** (D1)
and **local-AI pattern recognition** (I1) — that would make CrossTide best-in-class
beyond the open-source comparison set.

---

## 2. Honest Status Audit — v7.7.0

### 2.1 What is done (confirmed from source code)

| Area                                                      | Status  | Evidence                                                |
| --------------------------------------------------------- | ------- | ------------------------------------------------------- |
| 50+ technical indicators, consensus engine                | ✅ Done | `src/domain/` (93 files)                                |
| Hand-written reactive signals (zero-dep)                  | ✅ Done | `src/core/signals.ts` (298 lines); `state.ts` deleted   |
| History API router                                        | ✅ Done | `src/ui/router.ts`                                      |
| Lightweight Charts v5 (multi-pane, drawing tools)         | ✅ Done | `src/cards/lw-chart.ts`, `drawing-tools.ts`             |
| Multi-chart layout (2×2 / 1+3 synced crosshair)           | ✅ Done | `src/cards/multi-chart-layout.ts`                       |
| All 14 route cards wired via registry                     | ✅ Done | `src/cards/registry.ts` + `src/main.ts`                 |
| Signal DSL card                                           | ✅ Done | `src/cards/signal-dsl-card.ts` + `domain/signal-dsl.ts` |
| Workbox SW (precache + NetworkFirst + SWR + NavPreload)   | ✅ Done | `src/sw.ts` + `scripts/workbox-inject.mjs`              |
| Finnhub + Polygon + CoinGecko + Twelve Data + Yahoo       | ✅ Done | `src/providers/` (11 files)                             |
| Circuit-breaker per provider                              | ✅ Done | `src/providers/circuit-breaker.ts`                      |
| Real-time WS via Finnhub (`reconnecting-ws.ts`)           | ✅ Done | `src/core/reconnecting-ws.ts` + architecture doc        |
| Tiered cache (L1 Map → L2 LS → L3 IDB)                    | ✅ Done | `src/core/tiered-cache.ts`, `lru-cache.ts`              |
| Storage pressure monitor + LRU eviction                   | ✅ Done | `src/core/storage-pressure.ts` (wired in main.ts)       |
| CSP + security headers via Worker                         | ✅ Done | `worker/security.ts`                                    |
| Command palette (⌘K) + keyboard nav                       | ✅ Done | `src/ui/command-palette.ts`, `src/core/keyboard.ts`     |
| Watchlist (sparklines, 52W range, sort, drag-reorder)     | ✅ Done | `src/cards/watchlist-card.ts`, `src/ui/sortable.ts`     |
| Sector grouping + instrument-type views                   | ✅ Done | `src/ui/watchlist.ts`                                   |
| Heatmap (Canvas treemap)                                  | ✅ Done | `src/cards/heatmap-card.ts`                             |
| Screener (preset + custom)                                | ✅ Done | `src/cards/screener-card.ts`                            |
| Alerts card + browser Notifications                       | ✅ Done | `src/cards/alerts-card.ts`                              |
| Portfolio (P/L, sector allocation, benchmark vs SPY)      | ✅ Done | `src/cards/portfolio-card.ts`                           |
| Risk metrics (Sharpe, Sortino, max DD, Beta, CAGR)        | ✅ Done | `src/cards/risk-card.ts`                                |
| Backtest UI (equity curve + perf table, Web Worker)       | ✅ Done | `src/cards/backtest-card.ts`                            |
| Consensus timeline + Provider Health card                 | ✅ Done | respective card files                                   |
| Valibot validation at all provider boundaries             | ✅ Done | `src/providers/types.ts` + schemas                      |
| i18n (EN + HE RTL)                                        | ✅ Done | `src/core/i18n.ts`, `src/core/messages.ts`              |
| Color-blind palettes (4 modes)                            | ✅ Done | `src/ui/palette-switcher.ts`                            |
| View Transitions API (route animations)                   | ✅ Done | `src/styles/layout.css` (`@supports`)                   |
| URL state sharing (base64-encoded watchlist)              | ✅ Done | `src/core/share-state.ts`                               |
| BroadcastChannel cross-tab sync                           | ✅ Done | `src/core/broadcast-channel.ts`                         |
| CSV/JSON export with schema versioning                    | ✅ Done | `src/core/data-export.ts`                               |
| Onboarding tour (3-step, dismissible)                     | ✅ Done | `src/ui/onboarding-tour.ts`                             |
| PWA install prompt (iOS + Android)                        | ✅ Done | `src/ui/pwa-install.ts`                                 |
| OG image endpoint                                         | ✅ Done | `worker/og.ts`                                          |
| Worker API (5 routes: quote, history, search, health, OG) | ✅ Done | `worker/index.ts`, `chart.ts`, `health.ts`, etc.        |
| Playwright E2E (app + components flows)                   | ✅ Done | `tests/e2e/app.spec.ts`, `components.spec.ts`           |
| Lighthouse CI (all assertions → error)                    | ✅ Done | `config/lighthouserc.json`                              |
| Changesets + commitlint + lint-staged                     | ✅ Done | `.changeset/`, `config/commitlint.config.mjs`           |
| Component preview (`dev/components.html`)                 | ✅ Done | `vite.config.ts` dev/components entry                   |
| Config `config/` subdirectory (5 linter configs)          | ✅ Done | v7.7.0 production-readiness sprint                      |
| CSS webkit prefixes + `@supports` compat guards           | ✅ Done | v7.7.0 production-readiness sprint                      |

### 2.2 What is genuinely incomplete

| Area                                            | Gap Detail                                        | Target |
| ----------------------------------------------- | ------------------------------------------------- | ------ |
| **TypeScript version mismatch**                 | `CrossTide: 5.9`, `MyScripts: 6.0.3` — diverged   | G3     |
| **`zod` + `valibot` both in prod deps**         | Redundant validators; 2× runtime cost             | F1     |
| **E2E test coverage: 2 files for 14 routes**    | No protection on chart, screener, backtest routes | F3     |
| **Structured Worker logs**                      | `console.log` strings; no Logpush integration     | F4     |
| ~~**GlitchTip + Plausible not deployed**~~      | ✅ Done — `.env.example` + telemetry wired        | F5     |
| ~~**Astro Starlight docs-site not deployed**~~  | ✅ Done — `docs.yml` workflow + README badge      | F2     |
| **Worker Hono refactor**                        | Bare `addEventListener`; ad-hoc route matching    | G1     |
| **`src/` → `app/` + npm workspaces**            | R3 pending; `worker/`, `docs-site/` are siblings  | G2     |
| **Stooq bulk-EOD provider**                     | Listed since v6.x roadmap, still absent           | F12    |
| **SharedArrayBuffer OHLC transfer**             | COOP/COEP set but SAB path not used               | G4     |
| **Passkey auth + cloud sync**                   | D1 deferred; no multi-device story                | H12    |
| **Web Push (VAPID)**                            | D6 deferred; only in-tab notifications exist      | H11    |
| ~~**Per-indicator MDX reference (docs-site)**~~ | ✅ Done — 48 MDX pages                            | F6     |
| **`tsd` public-API type tests**                 | R13 pending; no type-level regression net         | G5     |
| **`eslint-plugin-import-x`**                    | R10 pending; import lint is weaker than needed    | G6     |
| **Tauri 2.0 desktop wrapper**                   | E1 stretch; PWA is the primary mobile path        | I-E1   |

### 2.3 New gaps identified in the v3 rethink (not in prior roadmaps)

| Area                                         | Why it matters                                                                                                                                                                                                                                                                                                                                                | Target      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Company name display under ticker**        | Ticker-only rows require users to remember names; one secondary line eliminates that friction across all views                                                                                                                                                                                                                                                | G19         |
| **Per-method consensus weights**             | All 12 methods carry equal weight today; users who trust certain methods more have no way to express that preference; a simple weight map makes the consensus engine genuinely personalizable                                                                                                                                                                 | G20         |
| **Heatmap sector drill-down**                | Current heatmap shows all tickers flat; clicking a sector cell should zoom into that sector and reveal which individual stock drove the move, with index-attribution bars                                                                                                                                                                                     | G21         |
| **Correlation Matrix card**                  | `domain/correlation-matrix.ts` is complete but has no UI; a dedicated card shows pairwise correlation heatmap for watchlist tickers, highlights dangerous over-concentration                                                                                                                                                                                  | G22         |
| **Market Breadth card**                      | No single view shows watchlist-wide signal distribution, % above 50/200 MA, or advance/decline ratio; easy to build on existing quote + SMA data                                                                                                                                                                                                              | G23         |
| **Earnings Calendar card**                   | Upcoming earnings dates, consensus EPS estimate, and historical surprise % for watchlist tickers; turns the dashboard into a forward-looking event tracker                                                                                                                                                                                                    | H18         |
| **Macro Dashboard card**                     | Missing market-context layer: VIX, 10Y yield, DXY, gold, crude oil — the five numbers every equity trader checks first every morning                                                                                                                                                                                                                          | H19         |
| **Sector Rotation card**                     | No view shows 11-sector relative performance over rolling 1M/3M/6M windows; important for regime-aware trading decisions                                                                                                                                                                                                                                      | H20         |
| **Relative Strength Comparison card**        | No multi-ticker % return overlay vs a benchmark (SPY/QQQ); fundamental tool for deciding which ticker in a sector to own                                                                                                                                                                                                                                      | H21         |
| **Economic Calendar card**                   | Fed decisions, CPI, NFP, GDP releases create predictable volatility; a calendar card with FRED/public macro feed would close this gap                                                                                                                                                                                                                         | I10         |
| **News Digest card**                         | Earnings, analyst upgrades, and macro news move prices; a curated RSS/Atom feed per ticker with no auth required adds context the indicators cannot                                                                                                                                                                                                           | I11         |
| **Per-card settings**                        | The Settings card today holds only global options (theme, export, clear); every card has tunable parameters (indicator periods, column visibility, refresh rates, display density) but no way to persist user preferences per card; a card-scoped settings system would make the dashboard genuinely configurable without cluttering the global settings page | G24         |
| **Temporal API** (Stage 4, JS 2025)          | `Date` has DST and timezone traps in financial dates                                                                                                                                                                                                                                                                                                          | G7          |
| **Navigation API**                           | Cleaner SPA nav than History pushState + popstate                                                                                                                                                                                                                                                                                                             | G8          |
| **Popover API** (Baseline 2024)              | Replace custom modal/dropdown with native behaviour                                                                                                                                                                                                                                                                                                           | G9          |
| **Speculation Rules API**                    | Prefetch/prerender card chunks on hover                                                                                                                                                                                                                                                                                                                       | H3          |
| **Compression Streams API**                  | gzip data exports in-browser before download                                                                                                                                                                                                                                                                                                                  | G11         |
| **File System Access API**                   | Save/load strategy configs to local files                                                                                                                                                                                                                                                                                                                     | H6          |
| **`using` / `Symbol.dispose`** (TS 5.2+)     | Deterministic cleanup for effects, listeners, workers                                                                                                                                                                                                                                                                                                         | G12         |
| **Local-AI pattern recognition (ONNX Web)**  | On-device candlestick pattern classifier, no LLM                                                                                                                                                                                                                                                                                                              | I1          |
| **OpenAPI spec for Worker routes**           | Machine-readable contract; enables SDK + tests                                                                                                                                                                                                                                                                                                                | G10         |
| **CSS `@scope`** (Baseline 2024)             | Component-scoped styles; replaces BEM-style prefixes                                                                                                                                                                                                                                                                                                          | H5          |
| **Transferable OHLC arrays to Worker**       | Zero-copy `Float64Array` for backtest perf                                                                                                                                                                                                                                                                                                                    | G4          |
| **Scroll-driven animations** (CSS)           | Chart time-axis scroll indicators without JS                                                                                                                                                                                                                                                                                                                  | H4          |
| **`@starting-style`** (CSS entry animations) | Card mount transitions without JS                                                                                                                                                                                                                                                                                                                             | H2          |
| **AbortController on route change**          | All in-flight fetches cancelled cleanly on navigate                                                                                                                                                                                                                                                                                                           | F7          |
| **Tiingo provider**                          | Cheaper paid alternative to Polygon ($10/mo)                                                                                                                                                                                                                                                                                                                  | G — ongoing |

---

## 3. Decision Rethink Matrix v3

Every prior and new decision evaluated as of May 2026.
Verdict: `Keep` / `Refine` / `Replace` / `Defer` / `NEW`.

| #       | Topic                            | Prior decision                                 | v3 verdict                        | Action                                                                                                          |
| ------- | -------------------------------- | ---------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| D1      | UI framework                     | Vanilla TS + hand-written signals              | **Keep — confirmed right**        | Signals (298 lines, zero-dep) outperform Preact Signals ergonomically. Reject all frameworks.                   |
| D2      | Routing                          | History API (done)                             | **Refine**                        | Add Navigation API shim as progressive enhancement: `navigateEvent.intercept()` + scroll restoration.           |
| D3      | State store                      | Signals-only (done; `state.ts` deleted)        | **Keep**                          | Add `batch()` for atomic multi-signal updates.                                                                  |
| D4      | Styling                          | Tokens + `@layer`                              | **Extend**                        | Add CSS `@scope` (Baseline 2024) for card-level containment; `@starting-style` for entry animations.            |
| D5      | Charts                           | Lightweight Charts v5 (done)                   | **Keep + extend**                 | Add `uPlot` (~10 KB gz) as a lightweight fallback for static/inline chart views. Keep LWC for interactive.      |
| D6      | Edge runtime                     | Cloudflare Workers                             | **Refine → Hono**                 | Migrate Worker from bare `addEventListener` to **Hono**. Typed routes; middleware; auto-OpenAPI.                |
| D7      | Data providers                   | Yahoo / Finnhub / Twelve / CoinGecko / Polygon | **Refine**                        | **Add Stooq** (free bulk EOD). **Add Tiingo** (affordable paid tier). **Remove Twelve Data** (25/day unusable). |
| D8      | Auth                             | None / Passkey (v8)                            | **Defer to v8.0**                 | Passkey WebAuthn + AES-GCM encrypted D1 blob. No email/password ever.                                           |
| D9      | Hosting                          | Cloudflare Pages primary (done)                | **Keep**                          | CF Pages + Workers in production. GitHub Pages mirror. No change.                                               |
| D10     | Service Worker                   | Workbox (done)                                 | **Extend**                        | Add Background Fetch API for large OHLC dataset downloads (Phase H).                                            |
| D11     | Live data                        | Finnhub WS (done)                              | **Extend**                        | Add market-hours detection (avoid WS outside 9:30–16:00 ET). Polygon WSS as paid fallback.                      |
| D12     | Compute offload                  | Web Worker (done)                              | **Extend**                        | Pass OHLC series as `Transferable` `Float64Array` to eliminate JSON serialization for >1y datasets.             |
| D13     | Persistent cache                 | Tiered cache + LRU (done)                      | **Extend**                        | Add ETag/Last-Modified support; add OPFS tier for large OHLC archives (Phase H).                                |
| D14     | Runtime validation               | Valibot (done) + zod (redundant)               | **Fix (P0)**                      | **Remove `zod` from prod deps** (F1). Valibot is the sole validator.                                            |
| D15     | Error tracking                   | GlitchTip (designed, not deployed)             | **Deploy now (F5)**               | Self-host on Fly.io free tier. Configure `VITE_GLITCHTIP_DSN`.                                                  |
| D16     | Analytics                        | Plausible (designed, not deployed)             | **Deploy now (F5)**               | Self-host on Fly.io. Configure `VITE_PLAUSIBLE_URL` + `VITE_PLAUSIBLE_SITE`.                                    |
| D17     | Lighthouse CI                    | Done (all assertions `"error"`)                | **Keep**                          | Budgets confirmed in v7.7.0. No change.                                                                         |
| D18     | E2E tests                        | 2 Playwright spec files                        | **Expand to ≥15 (P0)**            | 2 files for 14 routes is dangerously thin. Phase F target.                                                      |
| D19     | A11y tests                       | `@axe-core/playwright` wired                   | **Extend**                        | Add `vitest-axe` for unit-level a11y assertions on card render output.                                          |
| D20     | Versioning                       | Changesets (done)                              | **Keep**                          | No change.                                                                                                      |
| D21     | Toolchain location               | `MyScripts/tooling/`                           | **Keep**                          | Confirmed DX win.                                                                                               |
| D22     | Component catalog                | `dev/components.html` (done)                   | **Keep**                          | No Storybook needed.                                                                                            |
| D23     | Supply chain                     | Dependabot + `npm audit signatures`            | **Extend**                        | Add `socket.dev` PR check (F9) and `gitleaks` pre-commit + CI (F10).                                            |
| D24     | i18n                             | EN + HE RTL (done)                             | **Keep**                          | ICU-lite sufficient for current message catalog (~80 keys).                                                     |
| D25     | Docs site                        | Astro Starlight (local, not deployed)          | **Deploy now (F2)**               | Link from README; deploy to CF Pages.                                                                           |
| D26     | Multi-tenancy                    | None                                           | **Keep**                          | Single-user device-local.                                                                                       |
| D27     | TS strictness                    | Strict + extras                                | **Migrate to TS 6.0 (G3)**        | MyScripts runs 6.0.3; CrossTide lags at 5.9. Align.                                                             |
| D28     | Test runner                      | Vitest 4.1                                     | **Keep + add browser mode (G17)** | Add `@vitest/browser` for 3–5 DOM-heavy tests.                                                                  |
| D29     | Provider health                  | Circuit-breaker + Provider Health card (done)  | **Keep**                          | Extend with structured Worker logs (F4).                                                                        |
| D30     | Indicator docs                   | 13 MDX pages done                              | **Complete (P1)**                 | 50+ indicators, 13 documented. Add remaining ~37 (Phase F).                                                     |
| **D31** | **Code language**                | TypeScript                                     | **Keep**                          | TS 6.0 migration. Revisit WASM only if a compute path exceeds 16 ms p95 on real hardware.                       |
| **D32** | **Bundler**                      | Vite 8 + oxc minifier                          | **Keep**                          | Watch Rolldown; migrate when Vite ships it as default.                                                          |
| **D33** | **Test runner**                  | Vitest 4.1                                     | **Keep**                          | No change.                                                                                                      |
| **D34** | **Linter**                       | ESLint 10 + typescript-eslint v8               | **Extend**                        | Add `eslint-plugin-import-x` (G6); `no-innerhtml-without-escape` custom rule.                                   |
| **D35** | **Formatter**                    | Prettier                                       | **Keep**                          | Biome still doesn't match our markdown table formatting.                                                        |
| **D36** | **Database (client)**            | IndexedDB                                      | **Keep + OPFS for large**         | IDB for structured data; OPFS for large sequential byte arrays (OHLC archives).                                 |
| **D37** | **Database (server)**            | CF KV + R2                                     | **Add D1 for v8**                 | Cloudflare D1 (SQLite-on-edge) for cloud-sync user data in v8.0.                                                |
| **D38** | **CSS architecture**             | Tokens + `@layer`                              | **Add `@scope` + `@property`**    | `@scope` for card containment; `@property` for typed animated custom properties.                                |
| **D39** | **Animation**                    | View Transitions (done)                        | **Extend**                        | Add scroll-driven animations for chart axis; `@starting-style` for card mount.                                  |
| **D40** | **Icons**                        | Inline SVG sprite                              | **Keep**                          | No change.                                                                                                      |
| **D41** | **Fonts**                        | System stack                                   | **Add Inter Variable (G16)**      | Self-hosted `woff2` subset, `font-display: optional`, ~18 KB gz.                                                |
| **D42** | **Docs rendering**               | Astro Starlight                                | **Deploy now (F2)**               | See D25.                                                                                                        |
| **D43** | **Push notifications**           | In-tab Notification API (done)                 | **VAPID in v8 (H11)**             | Real Web Push deferred to v8.0.                                                                                 |
| **D44** | **Mobile**                       | PWA only                                       | **Keep + polish**                 | `@starting-style` for splash screen transitions.                                                                |
| **D45** | **Theming**                      | dark/light/auto + palettes (done)              | **Keep**                          | Add Inter Variable font (G16).                                                                                  |
| **D46** | **Compute hot paths**            | TypeScript                                     | **Add Transferable path (G4)**    | `Float64Array` + `Transferable` for backtest/screener. No WASM at current scale.                                |
| **D47** | **Data export**                  | CSV + JSON (done)                              | **Extend**                        | Compression Streams for gzip (G11); optional XLSX via `exceljs` lazy-loaded (H13).                              |
| **D48** | **License**                      | MIT                                            | **Keep**                          | No change.                                                                                                      |
| **D49** | **Distribution**                 | Web + Tauri 2.0 stretch                        | **Keep defer**                    | Tauri 2.0 is a v9.0 stretch goal.                                                                               |
| **D50** | **Repo structure**               | Single repo, `src/` layout                     | **Refine → workspaces (G2)**      | npm workspaces: `app/`, `worker/`, `docs-site/`. Same repo, same `npm ci`.                                      |
| **NEW** | **Temporal API**                 | `Date` everywhere                              | **Adopt (G7)**                    | Temporal polyfill for financial-date math in `core/timezone.ts` and domain.                                     |
| **NEW** | **Navigation API**               | History API + popstate                         | **PE adoption (G8)**              | Progressive enhancement: `if ('navigation' in window)` guard.                                                   |
| **NEW** | **Popover API**                  | Custom modal/toast/dropdown                    | **Adopt (G9)**                    | Baseline 2024. Replace custom focus-trap in most overlay patterns.                                              |
| **NEW** | **CSS Anchor Positioning**       | JS-measured tooltips                           | **Adopt (H1)**                    | Chrome 125+/Baseline 2025. Chart crosshair tooltip without `getBoundingClientRect`.                             |
| **NEW** | **Speculation Rules API**        | `<link rel=preload>` only                      | **Adopt (H3)**                    | Declare `"prefetch"` rules for adjacent card chunks on hover/focus.                                             |
| **NEW** | **Compression Streams**          | Raw JSON/CSV download                          | **Adopt (G11)**                   | `CompressionStream('gzip')` before download. 3–10× smaller exports.                                             |
| **NEW** | **File System Access API**       | None                                           | **Adopt (H6)**                    | "Save strategy to desktop" with graceful degradation.                                                           |
| **NEW** | **`using` / Symbol.dispose**     | Manual cleanup                                 | **Adopt now (G12)**               | TS 5.2+ native. Effect / WS / Worker handles.                                                                   |
| **NEW** | **Local-AI (ONNX Runtime Web)**  | None                                           | **Add (Phase I, I1)**             | On-device candlestick pattern classifier. No cloud LLM. Privacy-preserving.                                     |
| **NEW** | **OpenAPI spec**                 | None                                           | **Auto-generate (G10)**           | Hono `@hono/zod-openapi`. Enables typed SDK + Playwright API tests.                                             |
| **NEW** | **CSS `@scope`**                 | BEM-style card prefixes                        | **Adopt (H5)**                    | Baseline 2024. Scope card styles to card root.                                                                  |
| **NEW** | **Transferable Float64Array**    | JSON serialization in Worker RPC               | **Adopt (G4)**                    | Zero-copy OHLC array for backtest/screener compute.                                                             |
| **NEW** | **OPFS tier**                    | IDB for all storage                            | **Add (H8)**                      | Origin Private File System for large OHLC archives (>5y); avoids IDB fragmentation.                             |
| **NEW** | **ETag/Last-Modified cache**     | No HTTP cache validators                       | **Adopt (G14)**                   | 304 Not Modified handling; reduces data transfer.                                                               |
| **NEW** | **Background Fetch API**         | Regular fetch for large datasets               | **Adopt (H7)**                    | Large OHLC downloads with progress UI; survives browser closure.                                                |
| **NEW** | **Cloudflare Rate Limiting API** | In-memory token bucket only                    | **Adopt (G13)**                   | Distributed; survives Worker restarts; free tier available.                                                     |

---

## 4. Best-in-Class Comparison Table

Expanded comparison including newer competitors and honest v7.7.0 assessment.

`★★★` = best-in-class · `★★` = strong · `★` = adequate · `△` = partial · `✗` = absent

| Capability                               |  CrossTide v7.7   |  v8.0 target  | TradingView |   FinViz   | StockAnalysis | Koyfin  |  thinkorswim   | TrendSpider | GhostFolio | Simply Wall St |
| ---------------------------------------- | :---------------: | :-----------: | :---------: | :--------: | :-----------: | :-----: | :------------: | :---------: | :--------: | :------------: |
| **Cost**                                 |    Free / OSS     |  Free / OSS   |  Freemium   |  Freemium  |   Freemium    |  Paid   |   Free (TD)    |    Paid     |  OSS/SaaS  |    Freemium    |
| **Open source**                          |      ★★★ MIT      |    ★★★ MIT    |      ✗      |     ✗      |       ✗       |    ✗    |       ✗        |      ✗      |   ★ AGPL   |       ✗        |
| **Self-hostable**                        |        ★★★        |      ★★★      |      ✗      |     ✗      |       ✗       |    ✗    |       ✗        |      ✗      | ★★ Docker  |       ✗        |
| **No-account default**                   |        ★★★        |      ★★★      |      △      |    ★★★     |      ★★★      |    ✗    |       ✗        |      ✗      |     ✗      |       ✗        |
| **Privacy (cookieless, no tracking)**    |        ★★★        |      ★★★      |      ✗      |    Ads     |      Ads      |    ✗    |     Broker     |   Partial   |    ★★★     |       ✗        |
| **Bundle size (initial JS, gz)**         |    ★★★ ~120 KB    |  ★★★ <180 KB  |   ✗ ~5 MB   |    SSR     |     ~2 MB     |  ~3 MB  |    Desktop     |    ~2 MB    |  ~500 KB   |     ~2 MB      |
| **Lighthouse perf score**                |      ★★★ ≥90      |    ★★★ ≥90    |     ~50     |    ~70     |      ~75      |   ~60   |      n/a       |     ~55     |    ~65     |      ~60       |
| **Real-time streaming**                  |    ★★ WS live     |   ★★★ WS+DO   |     ★★★     |    Paid    |      ★★       |   ★★    |      ★★★       |     ★★★     |    EOD     |      EOD       |
| **Candlestick + multi-pane indicators**  |     ★★ LWC v5     | ★★★ LWC+uPlot |     ★★★     |   Static   |      ★★       |   ★★    |      ★★★       |   ★★★ AI    |     ✗      |       ✗        |
| **Drawing tools**                        |   ★★ Trend+Fib    |   ★★★ full    |     ★★★     |     ✗      |       ✗       |    ★    |       ★★       |   ★★★ AI    |     ✗      |       ✗        |
| **Indicator count**                      |      ★★★ 50+      |    ★★★ 55+    |  ★★★ 100+   |    50+     |      30+      |   80+   |    ★★★ 400+    |  ★★★ 100+   |     ✗      |       ✗        |
| **Multi-method consensus engine**        |    ★★★ unique     |  ★★★ unique   |      ✗      |     ✗      | Analyst only  |    ✗    |       ✗        |      △      |     ✗      |    ★ grades    |
| **Screener (filters, presets)**          |  ★★ preset+cust   |      ★★★      |     ★★      |  ★★★ best  |      ★★       |   ★★    |       ★★       |  ★★★ scan   |     ✗      |   ★★ filter    |
| **Sector heatmap**                       |     ★★ Canvas     |      ★★★      |     ★★      | ★★★ iconic |      ★★       |   ★★    |       ✗        |      ✗      |     ✗      |       ✗        |
| **AI-powered pattern recognition**       |         ✗         | ★★ on-device  |   ★ basic   |     ✗      |       ✗       |    ✗    |       ✗        | ★★★ server  |     ✗      |       ✗        |
| **Backtest engine**                      | ★★★ WW in-browser |  ★★★ DSL+WW   | Pine Script |     ✗      |       ✗       |    ★    |  thinkScript   |  ★★★ auto   |     ✗      |       ✗        |
| **Portfolio + risk metrics**             |  ★★★ Sharpe etc   |      ★★★      |      ✗      |     ✗      |      ★★       |   ★★★   |   Brokerage    |      ✗      |  ★★★ best  |       ★★       |
| **Offline / PWA**                        |  ★★★ Workbox+SWR  | ★★★ BackFetch |      ✗      |     ✗      |       ✗       |    ✗    |    Desktop     |      ✗      |     ★★     |       ✗        |
| **Keyboard-first nav (`j/k`, `⌘K`)**     |        ★★★        |      ★★★      |     ★★      |     ✗      |       ✗       |   ★★    |       ★★       |      ✗      |     ✗      |       ✗        |
| **Accessible (WCAG 2.2 AA + axe CI)**    |   ★★ axe in CI    |  ★★★ +vitest  |   Partial   |     ✗      |    Partial    | Partial |       ✗        |      ✗      |     ★★     |    Partial     |
| **Multi-provider failover**              |  ★★★ circuit-bk   |      ★★★      | Proprietary |   Prop.    |     Prop.     |  Prop.  |     Broker     | Proprietary |   Varies   |     Prop.      |
| **Per-asset deep-link / OG image**       |   ★★ History+OG   |      ★★★      |     ★★★     |    ★★★     |      ★★★      |   ★★★   |       ✗        |     ★★      |     ★★     |      ★★★       |
| **Cloud sync (E2E encrypted)**           |         ✗         |    △ v8.0     |   Account   |  Account   |    Account    | Account |     Broker     |   Account   |  Account   |    Account     |
| **Crypto coverage**                      |        ★★         |      ★★★      |     ★★★     |     ✗      |       △       |   ★★    |       ✗        |      △      |    ★★★     |       ✗        |
| **Local-AI pattern recognition**         |         ✗         |  ★★★ Phase I  |      ✗      |     ✗      |       ✗       |    ✗    |       ✗        | ★★★ server  |     ✗      |       ✗        |
| **Signal scripting / custom indicators** |    ★★ DSL card    |  ★★★ Worker   |  ★★★ Pine   |     ✗      |       ✗       |    ✗    | ★★ thinkScript |      ✗      |     ✗      |       ✗        |
| **Structured logs + OpenAPI contract**   |         ✗         |      ★★★      |    Prop.    |   Prop.    |     Prop.     |  Prop.  |     Prop.      |    Prop.    |    ★★★     |     Prop.      |
| **Mobile installable (PWA)**             |        ★★★        |      ★★★      |     ★★★     |     ✗      |       △       |   ★★    |       ★★       |      ✗      |     △      |     ★★ PWA     |

### Where we win and where to close the gap

**CrossTide v7.7 wins outright:**

- Open source + self-hostable + privacy-first: **nobody else combines all three**
- Consensus engine: **genuinely unique in the market**
- Bundle size + Lighthouse: **10–30× smaller than every commercial competitor**
- Offline-first + Workbox: only GhostFolio competes; CrossTide's SW is deeper
- Keyboard nav + a11y-in-CI: only TradingView and Koyfin try, neither gate it in CI
- In-browser backtest with Web Worker: zero competitors in the OSS space

**Gaps to close (ordered by user impact):**

| Competitor best-of             | Competitor     | CrossTide action                                           |
| ------------------------------ | -------------- | ---------------------------------------------------------- |
| AI-powered pattern recognition | TrendSpider    | On-device ONNX (Phase I) — unique privacy-preserving angle |
| Structured logs + OpenAPI      | GhostFolio     | Hono + Logpush + `@hono/zod-openapi` (Phase G)             |
| Per-indicator docs             | thinkorswim    | Docs-site deploy + remaining MDX pages (Phase F)           |
| E2E confidence (≥15 flows)     | Linear, Vercel | Playwright expansion (Phase F)                             |
| Cloud sync (private)           | Any            | Passkey + AES-GCM + D1 (Phase H)                           |

---

## 5. Best Practices Harvested

New practices identified in the v3 rethink (practices from v1/v2 now implemented are omitted):

| Practice                                       | Source                         | CrossTide application                                        |
| ---------------------------------------------- | ------------------------------ | ------------------------------------------------------------ |
| `Temporal.PlainDate` for financial dates       | TC39 / Bloomberg               | Replace `Date` in domain date math with Temporal (G7)        |
| Navigation API intercept for SPA               | Chrome 102+ / web.dev          | Progressive enhancement over History API (G8)                |
| `popover` attribute for non-modal UI           | Web spec / Chrome 114+         | Toast, tooltip, context menu replacement (G9)                |
| CSS Anchor Positioning for chart overlays      | Chrome 125+ / Lea Verou        | Crosshair tooltip without `getBoundingClientRect` (H1)       |
| Speculation Rules `"prefetch"` declarations    | Google / Chrome blog           | Adjacent card chunk prefetch on hover/focus (H3)             |
| `CompressionStream('gzip')` before download    | MDN / browser APIs             | Export file size 3–10× smaller (G11)                         |
| `using` for deterministic cleanup              | TC39 / TS 5.2                  | Effect / WS / Worker handles (G12)                           |
| ONNX Runtime Web for local ML                  | Microsoft / onnxruntime.ai     | Candlestick pattern classifier, privacy-preserving (Phase I) |
| Hono for edge Worker                           | Cloudflare / Hono docs         | Typed routing + middleware + auto-OpenAPI (G1)               |
| Transferable `Float64Array` for Worker RPC     | MDN / Chromium perf docs       | Backtest OHLC transfer — zero serialization overhead (G4)    |
| `tsd` / `expect-type` for public API types     | Open-source norm               | Domain type regression net (G5)                              |
| CSS `@scope` for card containment              | CSS Working Group              | Scope card styles to card root (H5)                          |
| `@starting-style` for entry animations         | CSS Working Group              | Card mount transitions without JS (H2)                       |
| Scroll-driven animations for chart axis        | Chrome 115+ / CSS Houdini      | Time-axis scroll indicators (H4)                             |
| ETag + Last-Modified in cache layer            | HTTP/1.1 / RFC 7232            | 304 Not Modified reduces data transfer (G14)                 |
| `exceljs` XLSX export (lazy)                   | FinViz / Koyfin pattern        | Optional XLSX export of screener/backtest results (H13)      |
| Inter Variable font (self-hosted, woff2)       | Rasmus Andersson / inter.style | Better reading experience; ~18 KB gz (G16)                   |
| `font-display: optional` for self-hosted fonts | web.dev                        | Avoids FOUT / CLS from font swap (G16)                       |
| Market-hours detection before WS connect       | Algorithmic trading norm       | Avoid wasting Finnhub quota outside 9:30–16:00 ET (D11)      |
| OPFS for large sequential byte arrays          | MDN / WHATWG                   | OHLC archive >5y; avoids IDB fragmentation (H8)              |
| Background Fetch API for offline downloads     | Workbox / Chrome docs          | Multi-year OHLC dataset fetch with progress UI (H7)          |
| Cloudflare native Rate Limiting API            | Cloudflare blog (May 2025)     | Distributed rate limiting across Worker restarts (G13)       |
| Satori for edge OG image rendering             | Vercel / Satori docs           | Richer, more reliable share cards at CF edge (H14)           |
| `gitleaks` pre-commit secret scanning          | OSS security                   | Prevent API keys from reaching remote (F10)                  |

---

## 6. Architecture Vision

### 6.1 Target topology (v8.0)

```text
┌──────────────────────────────────────────────────────────────────────┐
│                           Browser (PWA)                              │
│                                                                      │
│  index.html → main.ts                                                │
│       │                                                              │
│       ├── Router (History API + Navigation API progressive)          │
│       ├── Signals store (signals.ts)                                 │
│       ├── Compute Worker (Transferable Float64Array OHLC)            │
│       ├── Storage Worker (OPFS for >5y OHLC archives)                │
│       ├── Service Worker (Workbox + Background Fetch)                │
│       └── ONNX Runtime (Phase I — lazy, on-device pattern recog.)    │
└──────────┬───────────────────────────────────────────────────────────┘
           │ HTTPS / WSS (COOP + COEP + strict-CSP)
┌──────────┴───────────────────────────────────────────────────────────┐
│  Cloudflare Pages (static SPA + `_headers`)                          │
│  + Pages Functions (Hono edge Worker)                                │
│      ├─ GET  /api/health              provider health + circuit state │
│      ├─ GET  /api/quote/:symbol       spot (KV 60s / 5m closed)      │
│      ├─ GET  /api/history/:symbol     OHLCV (KV 24h; R2 cold)        │
│      ├─ GET  /api/search?q=           autocomplete (KV 1h)           │
│      ├─ GET  /api/og/:symbol.png      Satori OG image (edge 1h)      │
│      ├─ WSS  /api/stream              Durable Object per symbol      │
│      ├─ POST /api/errors              sampled GlitchTip ingest       │
│      ├─ GET  /openapi.json            Hono auto-generated spec       │
│      └─ GET/PUT /api/sync            Passkey-encrypted D1 (v8)       │
└──────────┬───────────────────────────────────────────────────────────┘
           │
   ┌───────┼──────┬─────────┬──────────┬───────────┬────────────┐
   ▼       ▼      ▼         ▼          ▼           ▼            ▼
 Yahoo  Finnhub  Stooq  CoinGecko   Tiingo      Polygon      Alpha V.
 (free) (WS+REST)(EOD)   (crypto)   (alt paid)  (paid esc.)  (last resort)
```

### 6.2 Npm workspaces layout (Phase G target)

```text
CrossTide/                       ← workspace root
├── package.json                 ← workspaces: ["app","worker","docs-site"]
├── app/                         ← was src/
│   ├── types/
│   ├── domain/                  ← pure; no DOM, no I/O
│   ├── core/
│   │   ├── signals.ts
│   │   ├── cache/               ← memory.ts, idb.ts, tiered.ts
│   │   └── workers/             ← compute.worker.ts, storage.worker.ts
│   ├── providers/
│   ├── cards/
│   ├── ui/
│   └── styles/
├── worker/                      ← Hono CF Worker (own package.json)
├── docs-site/                   ← Astro Starlight (own package.json)
└── tests/
    ├── unit/
    ├── e2e/                     ← ≥15 Playwright flows
    └── fixtures/
```

### 6.3 Dependency rules

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

Enforced by `eslint-plugin-import-x` `no-restricted-imports` rules (Phase G).

---

## 7. Frontend Strategy

### 7.1 Rendering model (confirmed correct)

Vanilla TS + hand-written signals. `effect()` binds DOM reactively. Cards implement
`mount(host, ctx): CardHandle` where `CardHandle.dispose()` is called on navigate.
`using handle = loadCard(route, host, ctx)` — the `using` keyword makes cleanup
deterministic and removes the manual `dispose()` call obligation.

### 7.2 Routing (enhanced)

History API is the production implementation. Add progressive enhancement:

```ts
if ("navigation" in window) {
  navigation.addEventListener("navigate", (e: NavigateEvent) => {
    if (!shouldHandleNavigation(e)) return;
    e.intercept({
      async handler() {
        await loadCard(e.destination.url);
      },
    });
  });
}
```

Benefits: cleaner `scroll` restoration, `navigateEvent.signal` cancels in-flight
fetches automatically, `transitionWhile()` ties route-change to View Transitions.

Add Speculation Rules declaration in `index.html`:

```html
<script type="speculationrules">
  {"prefetch": [{"where": {"and": [{"href_matches": "/chart/*"}, ...]}}]}
</script>
```

### 7.3 New Web Platform APIs adoption plan

| API                      | Browser support             | CrossTide plan (Phase)                         |
| ------------------------ | --------------------------- | ---------------------------------------------- |
| Navigation API           | Chrome 102+ / FF 127+       | Progressive enhancement over History API (G8)  |
| Popover API              | Baseline 2024 (all)         | Replace custom modal/dropdown focus-traps (G9) |
| CSS Anchor Positioning   | Chrome 125+ / FF 130+       | Chart crosshair tooltip without JS (H1)        |
| Speculation Rules API    | Chrome 109+                 | Card chunk prefetch declarations (H3)          |
| Compression Streams      | Baseline 2023 (all)         | gzip data exports in-browser (G11)             |
| File System Access API   | Chrome 86+ / Edge 86+       | Save strategy to local file (H6)               |
| Temporal API             | Polyfill now; native coming | Financial date math in domain (G7)             |
| `using` / Symbol.dispose | TS 5.2+ native (all)        | Effect/Worker/WS cleanup (G12)                 |
| Background Fetch API     | Chrome 74+                  | Large OHLC downloads offline (H7)              |
| OPFS                     | Baseline 2023 (all)         | Large OHLC archive storage tier (H8)           |
| Scroll-driven animations | Chrome 115+ / FF 110+       | Chart time-axis indicator (H4)                 |
| `@starting-style` CSS    | Baseline 2024 (all)         | Card mount entry animations (H2)               |
| CSS `@scope`             | Baseline 2024 (all)         | Card-level style containment (H5)              |

### 7.4 Charts (extend)

- Lightweight Charts v5: primary interactive chart renderer (keep)
- Add `uPlot` (~10 KB gz) for static inline charts in screener result rows and
  consensus timeline (where LWC interactivity is unnecessary overhead)
- CSS Anchor Positioning for crosshair tooltip (Phase H)
- Scroll-driven animation for time-axis scroll indicator (Phase H)

### 7.5 Accessibility (extend)

- Current: skip-link, landmark roles, `:focus-visible`, ARIA live, axe in CI.
- Add `vitest-axe` for unit-level card render assertions.
- Add Popover API for toast/dropdown (removes need for custom focus-trap in most cases).
- WCAG 2.2 AA target with automated gate.

---

## 8. Backend, Data & Infrastructure Strategy

### 8.1 Worker migration to Hono (Phase G, P0)

Current Worker: bare `addEventListener('fetch')` + manual route dispatch.

Hono provides:

- Typed routing with `c.req.param('symbol')` (type-safe)
- Middleware chain (request logging, CORS, rate-limit, auth)
- Auto-generated OpenAPI 3.1 spec via `@hono/zod-openapi`
- < 15 KB added to bundle; same Cloudflare V8 isolate
- `hono/testing` for integration tests without deploying

```ts
// worker/index.ts (Phase G target)
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { quoteHandler } from "./routes/quote";
import { requestLogger } from "./middleware/logger";

const app = new Hono<{ Bindings: CloudflareEnv }>();
app.use("*", requestLogger());
app.get("/api/quote/:symbol", zValidator("param", symbolSchema), quoteHandler);
export default app;
```

### 8.2 Provider chain (updated)

```text
quote:    Yahoo → Finnhub → Tiingo → Alpha Vantage
history:  Yahoo → Stooq (free bulk EOD) → Finnhub → Tiingo → Polygon
search:   Yahoo → Finnhub
crypto:   CoinGecko (primary) → CoinGecko Pro (if rate-limited)
stream:   Finnhub WSS → Polygon WSS (paid fallback)
```

**Removes Twelve Data** (25 API calls/day is unusable in any realistic scenario).
**Adds Stooq** (unlimited EOD CSV; use for history >1y).
**Adds Tiingo** (REST + WS, $10/mo basic; cleaner than Polygon for quote/history).

### 8.3 Structured logging (Phase F)

Hono request-log middleware emits structured JSON per request, piped to
Cloudflare Logpush → R2 bucket for retention and analysis:

```json
{
  "ts": "2026-05-02T10:00:00Z",
  "route": "/api/quote/AAPL",
  "provider": "yahoo",
  "status": 200,
  "latencyMs": 142,
  "cached": false,
  "requestId": "ray-abc123"
}
```

### 8.4 Rate limiting (upgraded)

- CF native Rate Limiting API (GA, May 2025): distributed across all edge POPs;
  survives Worker restarts; free tier 1M rulesets included.
- In-memory token bucket remains as a first-line ultra-fast guard before the CF API
  call is needed.

### 8.5 Infrastructure summary

| Layer          | Tech                                | Why                                            |
| -------------- | ----------------------------------- | ---------------------------------------------- |
| Static hosting | Cloudflare Pages                    | Free, SPA fallback, preview deploys, edge POPs |
| Edge runtime   | Cloudflare Workers (Hono)           | Typed routes; auto-OpenAPI; same vendor        |
| Cold storage   | Cloudflare R2                       | $0 egress; free 10 GB; Worker log archive      |
| Hot KV         | Cloudflare KV                       | Free 100K ops/day; quote + search cache        |
| Rate limiting  | Cloudflare Rate Limiting API        | Distributed; no state loss on restart          |
| Streaming      | Cloudflare Durable Objects          | Per-symbol WS fan-out (Phase H)                |
| Cloud sync DB  | Cloudflare D1 (SQLite-on-edge)      | v8.0 only if Passkey sync lands                |
| DNS / TLS      | Cloudflare free tier                | Same vendor                                    |
| Mirror         | GitHub Pages                        | Redundancy if Cloudflare degrades              |
| Error tracking | Self-hosted GlitchTip (Fly.io free) | $0/mo; Sentry-compatible                       |
| Analytics      | Self-hosted Plausible (Fly.io free) | Cookieless; $0/mo                              |
| Status page    | Self-hosted Uptime Kuma             | Probes `/api/health`; free                     |
| CI             | GitHub Actions                      | Free for public repos                          |

**Total infra cost target: $0/mo for personal use.** First paid upgrade:
Tiingo starter at $10/mo if Yahoo API reliability degrades.

---

## 9. Storage, Sync & Offline Strategy

### 9.1 Storage tiers (v3 — adds OPFS)

| Tier         | Tech                                | Use                                   | TTL / Cap             |
| ------------ | ----------------------------------- | ------------------------------------- | --------------------- |
| L1           | `Map` in-memory                     | Hot quotes, computed series           | Session               |
| L2           | `localStorage`                      | Config, theme, sort prefs, last route | Persistent ~5 MB      |
| L3           | IndexedDB (`core/idb.ts`)           | Candles, alerts, portfolio, watchlist | LRU 50 MB             |
| L4           | Service Worker Cache API            | App shell (precache) + SWR            | Per-strategy          |
| L5 (Phase H) | OPFS (`FileSystemSyncAccessHandle`) | OHLC archives >5y; large byte arrays  | Persistent, unbounded |
| Edge         | Cloudflare KV / R2                  | Hot quotes / cold OHLCV               | TTL / cold            |
| Cloud (v8)   | Worker + D1                         | Passkey-user encrypted blobs          | Per-user              |

### 9.2 OPFS rationale

IndexedDB stores structured objects well but fragments badly for large sequential
byte arrays (e.g., 5 years of daily OHLC = 1825 candles × ~40 bytes = ~73 KB per
ticker; fine). For tick-level data or longer history, `FileSystemSyncAccessHandle`
in a dedicated `storage.worker.ts` avoids IDB's per-record overhead. Access is
synchronous inside the worker, eliminating I/O latency on hot reads.

### 9.3 Background Fetch for large downloads

```ts
// Phase H — initial backtest setup
const reg = await navigator.serviceWorker.ready;
const bgFetch = await reg.backgroundFetch.fetch(
  `history-${symbol}-5y`,
  [`/api/history/${symbol}?range=5y&interval=1d`],
  { title: `Downloading ${symbol} history`, icons: [] },
);
bgFetch.addEventListener("progress", updateProgressUI);
```

### 9.4 Cloud sync (v8.0, optional)

- Passkeys (WebAuthn) → credential-derived key via HKDF.
- Client encrypts blob with AES-GCM. Server stores ciphertext in D1.
- Conflict: last-writer-wins per key; vector clock for portfolio (CRDT-ish).
- Server never sees plaintext. Lost credential = lost data (by design, privacy win).

---

## 10. Quality, Security & Observability

### 10.1 CI gates (complete list)

```text
typecheck         tsc --noEmit (strict + noUncheckedIndexedAccess)
lint              eslint . --max-warnings 0 (+import-x +no-innerhtml-without-escape)
lint:css          stylelint
lint:html         htmlhint
lint:md           markdownlint-cli2
format:check      prettier
test              vitest run --coverage (≥90% statements, ≥80% branches)
test:e2e          playwright (≥15 flows)
a11y              axe in every E2E flow (0 serious/critical)
build             vite build
bundle            check-bundle-size.mjs (<180 KB gz initial)
lighthouse        lhci autorun (perf≥90 a11y≥95 best≥95 SEO≥90)
audit             npm audit --omit=dev (no high/critical)
audit:signatures  npm audit signatures
audit:supply      socket.dev PR check
secret-scan       gitleaks (pre-commit + CI)
types             tsd for domain/index.ts (Phase G)
openapi           hono openapi validate (Phase G)
```

### 10.2 Security (additions over v2 roadmap)

- `gitleaks` in pre-commit hook and CI pipeline (F10)
- Cloudflare native Rate Limiting (G13) — distributed abuse prevention
- `no-innerhtml-without-escape` custom ESLint rule (prevents XSS via innerHTML)
- `using` keyword sweep eliminates accidental listener accumulation (G12)
- Existing stack: CSP via Worker, SRI, Valibot at all boundaries, Permissions-Policy

### 10.3 Observability

- **Worker logs**: Hono request-log middleware → structured JSON → Logpush → R2
- **Errors**: GlitchTip SDK (25% sampled, PII scrubbed, Sentry protocol)
- **Analytics**: Plausible custom events for route changes, card mounts, errors
- **RUM**: `web-vitals.ts` → Plausible custom events (LCP, INP, CLS)
- **Status page**: Uptime Kuma probing `/api/health` every 60 s

---

## 11. Performance Budget

| Asset                         | Budget          | Gate                                  |
| ----------------------------- | --------------- | ------------------------------------- |
| HTML                          | < 8 KB          | LH CI                                 |
| CSS                           | < 30 KB gz      | bundle check                          |
| JS initial                    | < 180 KB gz     | `check:bundle`                        |
| Lazy card chunk               | < 50 KB gz each | per-route                             |
| Lightweight Charts chunk      | ~40 KB gz       | dynamic import only                   |
| uPlot chunk (Phase G)         | ~10 KB gz       | dynamic import only                   |
| ONNX model (Phase I)          | ~2 MB           | background fetch / Cache API          |
| Web Worker bundle             | < 60 KB gz      | per file                              |
| Fonts (Inter Variable, woff2) | < 25 KB gz      | self-hosted, `font-display: optional` |
| **Initial total**             | **< 200 KB gz** | CI                                    |
| LCP (4G, mid Android)         | < 1.8 s         | LH CI                                 |
| INP (p75)                     | < 200 ms        | LH CI                                 |
| CLS                           | < 0.05          | LH CI                                 |
| Lighthouse perf score         | ≥ 90            | LH CI                                 |
| Lighthouse a11y               | ≥ 95            | LH CI                                 |
| Lighthouse best practices     | ≥ 95            | LH CI                                 |
| Lighthouse SEO                | ≥ 90            | LH CI                                 |

---

## 12. Documentation Strategy

| Doc                                 | Status              | Target action                                |
| ----------------------------------- | ------------------- | -------------------------------------------- |
| `README.md`                         | ✅ Good             | Refresh badges; add docs-site link (Phase F) |
| `CHANGELOG.md`                      | ✅ Per-RC           | Keep; Changesets automated                   |
| `ARCHITECTURE.md`                   | ✅ v7.15            | Updated for v7.15.0 (R21)                    |
| `CONTRIBUTING.md`                   | ✅ Good             | Add "new Web API adoption" guide             |
| `CODE_OF_CONDUCT.md`, `SECURITY.md` | ✅ Standard         | Keep                                         |
| `docs/COPILOT_GUIDE.md`             | ✅ Unique           | Refresh quarterly; add Phase F/G context     |
| `docs/ROADMAP.md`                   | ✅ This document    | Refresh per phase                            |
| **Astro Starlight docs-site**       | ✅ Deployed         | `docs.yml` workflow (F2)                     |
| **Per-indicator MDX reference**     | ✅ 48 pages done    | Complete (F6)                                |
| **OpenAPI spec for Worker**         | ❌ Missing          | Auto-generated by Hono (Phase G, G10)        |
| **User guide**                      | ⚠️ 3 pages done     | Add chart, screener, backtest, alerts guides |
| **Architecture diagrams**           | ✅ Mermaid in docs/ | Extend with npm workspaces layout (G2)       |
| **JSDoc on all public exports**     | ⚠️ Partial          | Sweep in Phase G (G15)                       |

**Doc rules (unchanged):**

- Every domain module: top-of-file JSDoc with formula, defaults, references.
- Every public function: one-sentence JSDoc.
- README badges: build, coverage, version, license, bundle-size.
- Per-indicator MDX: formula (KaTeX), params, rationale, references, test vector.
- No Markdown file > 1000 lines without splitting.

---

## 13. Developer Experience

| Area              | Current state                         | Target (Phase G)                                 |
| ----------------- | ------------------------------------- | ------------------------------------------------ |
| Package manager   | npm (shared `MyScripts/node_modules`) | npm workspaces: `app/`, `worker/`, `docs-site/`  |
| TypeScript        | 5.9                                   | 6.0 — align with `MyScripts/` (G3)               |
| Validators        | Both `zod` + `valibot` in prod deps   | Remove `zod`; Valibot-only (F1)                  |
| Git hooks         | `simple-git-hooks` + `lint-staged`    | Add `gitleaks` pre-commit (F10)                  |
| Commit style      | Conventional Commits (commitlint)     | Keep                                             |
| Releases          | Changesets auto-changelog             | Keep                                             |
| Worker local dev  | `wrangler dev` + Vite proxy           | Add `wrangler types` for generated type bindings |
| E2E local         | `vite preview` on port 4173           | Add `--ui` flag for Playwright debug runs        |
| Component preview | `dev/components.html`                 | Keep; extend with new APIs as they land          |
| Docs preview      | `npm -w docs-site run dev`            | Alias to `npm run dev:docs` at workspace root    |
| CI secrets        | GitHub Actions secrets                | Add `SOCKET_DEV_API_KEY` for supply-chain check  |
| PR previews       | Cloudflare Pages auto-preview         | Add preview URL to PR description template       |

---

## 14. External Sources, APIs & Vendor Strategy

### 14.1 Data providers (updated)

| Provider                      | Free tier             | Use                           | Risk                  | Mitigation                           |
| ----------------------------- | --------------------- | ----------------------------- | --------------------- | ------------------------------------ |
| Yahoo Finance v8 (unofficial) | Unlimited best-effort | Primary quote/history         | Can break unannounced | Circuit breaker → Stooq fallback     |
| Finnhub                       | 60/min + WSS          | Secondary; streaming          | Free tier limits      | Market-hours guard; token bucket     |
| Stooq                         | Unlimited EOD CSV     | Bulk >1y history fallback     | EOD only; no API key  | Use for historical bulk only         |
| CoinGecko                     | 50/min free           | Crypto only                   | Schema changes        | Valibot validation; aggressive cache |
| Tiingo                        | 500/hour; $10/mo+     | Affordable paid escape hatch  | Cost                  | Only if user provides key            |
| Polygon                       | $29/mo basic          | Premium paid escape hatch     | Cost                  | Only if user provides key            |
| Alpha Vantage                 | 25/day                | Last-resort tertiary failover | Very slow / 25 limit  | Last failover position only          |

### 14.2 Removed from prior roadmap

- **Twelve Data**: 25 requests/day is below the threshold for any meaningful use
  case. Removed from provider chain entirely.

### 14.3 Vendor lock-in risk

| Vendor                  | Risk   | Mitigation                                              |
| ----------------------- | ------ | ------------------------------------------------------- |
| Cloudflare (full stack) | High   | Hono is portable to Deno Deploy / Bun with adapters     |
| GitHub (repo + Actions) | Medium | Mirror to GitLab on tag push; Actions are standard YAML |
| Lightweight Charts      | Low    | MIT; replaceable with `uPlot` or D3 at chart layer      |
| Fly.io (observability)  | Low    | GlitchTip + Plausible are Dockerized; portable in 1 day |
| ONNX Runtime Web        | Low    | MIT; open model format; browser-native inference        |

---

## 15. Phased Roadmap

Phases F–I continue from v7.8.0. Phases A–E are complete or archived.

### Phase F — v7.8.0 "Hardening & Deployment"

**Theme:** Deploy what's built; expand E2E coverage; remove validator duplication.

| #   | Task                                                                                                                                                                                               | Priority |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| F1  | Remove `zod` from prod deps; audit all imports; replace with Valibot equivalents                                                                                                                   | ✅ Done  |
| F2  | Deploy Astro Starlight docs-site; link from README                                                                                                                                                 | ✅ Done  |
| F3  | Expand E2E to ≥15 flows (chart, screener, backtest, portfolio, risk, alerts, heatmap, offline, share URL, keyboard nav, import/export, PWA install, consensus-timeline, provider-health, settings) | ✅ Done  |
| F4  | Hono request-log middleware in Worker; wire Logpush → R2 structured logs                                                                                                                           | ✅ Done  |
| F5  | Deploy GlitchTip + Plausible on Fly.io; set DSN + Plausible secrets in Vite/Worker                                                                                                                 | ✅ Done  |
| F6  | Complete per-indicator MDX reference for remaining ~37 indicators                                                                                                                                  | ✅ Done  |
| F7  | Add `AbortController` to all fetch paths; cancel in-flight requests on route change                                                                                                                | ✅ Done  |
| F8  | Deploy Uptime Kuma on Fly.io; add `/api/health` badge to README                                                                                                                                    |    P2    |
| F9  | Add `socket.dev` GitHub App to repo for PR supply-chain checks                                                                                                                                     |    P2    |
| F10 | Add `gitleaks` to pre-commit hook and CI                                                                                                                                                           | ✅ Done  |
| F11 | Confirm Worker production deploy; verify all 5 routes respond in staging + production                                                                                                              |    P0    |
| F12 | Implement Stooq provider (free bulk EOD CSV); add to history failover chain                                                                                                                        | ✅ Done  |

**Exit criteria:** `zod` absent from prod deps; ≥15 Playwright flows passing; docs-site
live; GlitchTip receiving errors; Plausible receiving page-views; Worker confirmed live.

---

### Phase G — v7.9.0 "Platform & Toolchain Modernization"

**Theme:** TypeScript 6.0, Hono Worker, modern Web APIs, structural cleanup.

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Priority |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| G1  | Worker Hono refactor: rewrite `worker/index.ts` with Hono typed routing + middleware                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | ✅ Done  |
| G2  | npm workspaces: `app/` (was `src/`), `worker/`, `docs-site/`; update CI + all import paths                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |    P1    |
| G3  | TypeScript 6.0 migration: bump `typescript` to `^6.0.3`; fix any breaking changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | ✅ Done  |
| G4  | Transferable OHLC Float64Array: zero-copy pass to compute Worker for backtest + screener                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | ✅ Done  |
| G5  | `tsd` type tests: add `expect-type` assertions for all `domain/index.ts` exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | ✅ Done  |
| G6  | `eslint-plugin-import-x`: replace ESLint import plugin; enforce no-cycle, no-unresolved                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ✅ Done  |
| G7  | Temporal API: `@js-temporal/polyfill`; replace `Date` in `core/timezone.ts` + domain date math                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | ✅ Done  |
| G8  | Navigation API PE: detect + delegate to `navigation.navigate` in `ui/router.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ✅ Done  |
| G9  | Popover API: replace custom focus-trap in command palette, toast, and context menus                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | ✅ Done  |
| G10 | Auto-generate `GET /openapi.json` from Hono Worker routes (`@hono/zod-openapi`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ✅ Done  |
| G11 | Compression Streams: wrap CSV/JSON export in `CompressionStream('gzip')` before download                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | ✅ Done  |
| G12 | `using` keyword sweep: apply to effect handles, WS connections, Worker handles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | ✅ Done  |
| G13 | Cloudflare native Rate Limiting API: replace in-memory-only token bucket                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | ✅ Done  |
| G14 | ETag / Last-Modified in cache layer: store and replay validators for HTTP 304 responses                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ✅ Done  |
| G15 | JSDoc sweep: one-sentence JSDoc on every public export in `domain/` and `core/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ✅ Done  |
| G16 | Inter Variable font: self-hosted `woff2` subset with `font-display: optional`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ✅ Done  |
| G17 | `@vitest/browser` mode: migrate 3–5 DOM-intensive tests to browser mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ✅ Done  |
| G18 | **ETF constituent drill-down**: collapsible ETF rows in Watchlist, Screener, and Heatmap; expand to show each constituent ticker with live quote, 52W range bar, consensus badge, and % weight in the ETF; collapse state persisted in `localStorage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | ✅ Done  |
| G19 | **Company name below ticker**: display the instrument's full company/fund name as a secondary line under the ticker symbol in the Watchlist table, Screener rows, Heatmap cells, Consensus card, and Chart card header. Populate `name` from the first successful quote response (Yahoo `shortName`); persist in `WatchlistEntry` and IDB so no extra fetch is needed. Add optional `name?: string` field to `WatchlistEntry` in `domain.ts`; update card render templates.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | ✅ Done  |
| G20 | **Per-method consensus weights**: add a `methodWeights: Record<MethodName, number>` map (range 0.0 = disabled → 3.0 = triple-weighted, default 1.0) to `AppConfig`. Add a "Consensus Weights" section to the Settings card with a labeled slider/input per method and a "Reset to defaults" button. Update `consensus-engine.ts` to apply per-method weights when tallying directional votes and computing `strength`. Weights are included in config export/import. Micho method retains its anchor-role logic; its weight scales the strength contribution.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ✅ Done  |
| G21 | **Heatmap sector drill-down**: clicking a sector cell in the heatmap zooms into that sector and renders its individual constituent stocks. Shows: (a) each stock as a treemap cell sized by absolute price move contribution (`Δprice × shares_proxy`), (b) a "sector attribution" bar showing which stock drove the most of the sector's net move, (c) a breadcrumb row (`All Sectors › Technology`) for navigating back, (d) sort toggles for % change / market-cap proxy / absolute move. Drill depth is one level only (sector → stocks). All data comes from existing quote responses; no new API endpoint required.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ✅ Done  |
| G22 | **Correlation Matrix card**: expose `domain/correlation-matrix.ts` (already implemented, tested, but UI-less) as a full card. Renders a `n×n` color-coded grid (red = strong positive, blue = negative) for all watchlist tickers using the last 60 trading days of close prices cached in IDB. Tooltip shows exact `r` value and period. Highlights pairs with `\|r\| > 0.85` as over-concentration warnings. Controls: period selector (20/60/120 days), exclude-crypto toggle.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | ✅ Done  |
| G23 | **Market Breadth card**: displays watchlist-aggregate signal health in a single glance. Panels: (a) BUY / NEUTRAL / SELL donut (count from latest consensus results), (b) % of watchlist with close above 50-day SMA and above 200-day SMA (uses `computeSma` already wired), (c) advance/decline bar for the current session (gainers vs losers from quote cache), (d) top 3 movers + laggards. No new API calls; reads data already fetched for the Watchlist card.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | ✅ Done  |
| G24 | **Per-card settings**: introduce a `cardSettings: Record<CardId, Record<string, unknown>>` namespace in `AppConfig` so each card can store and retrieve its own configuration independently from global settings. Each card declares a typed `CardSettings` schema (Valibot) and a default value; the Settings card gains a "Card Settings" section with a card picker and a rendered form for the selected card's options. Example settings exposed per card: Watchlist (visible columns, auto-refresh interval, density), Chart (default interval, sub-pane indicator set, crosshair snap), Consensus (methods to display, signal history depth), Screener (default preset, max results, sort column), Heatmap (color scale, cell label format), Backtest (default strategy, lookback window, benchmark), Alerts (default threshold type, notification channel), Portfolio (benchmark ticker, display currency), Risk (confidence level for VaR, benchmark). Settings round-trip through export/import. Changing a card's settings triggers a reactive re-render via the signals layer with no page reload. | ✅ Done  |

**Exit criteria:** Worker on Hono; TS 6.0; `openapi.json` auto-generated; Temporal
polyfill active; Compression Streams in export; `using` sweep complete.

---

### Phase H — v8.0.0 "Future-Web APIs & Power Features"

**Theme:** Adopt 2024–2025 Web platform APIs; complete the power-user toolset.

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Priority |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| H1  | CSS Anchor Positioning: chart crosshair tooltip without `getBoundingClientRect`                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ✅ Done  |
| H2  | `@starting-style` CSS entry animations for card mounts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | ✅ Done  |
| H3  | Speculation Rules API declarations for adjacent card chunk prefetch on hover/focus                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ✅ Done  |
| H4  | Scroll-driven animations for chart time-axis scroll indicator                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ✅ Done  |
| H5  | CSS `@scope` adoption: scope card styles to card root element (replaces BEM prefixes)                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ✅ Done  |
| H6  | File System Access API: "Save strategy to desktop" / "Open from file"                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ✅ Done  |
| H7  | Background Fetch API: large OHLC archive downloads with progress UI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ✅ Done  |
| H8  | OPFS tier: `FileSystemSyncAccessHandle` storage worker for OHLC archives >5y                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | ✅ Done  |
| H9  | Signal DSL Worker execution: run `signal-dsl.ts` scripts in compute Worker via Hono route                                                                                                                                                                                                                                                                                                                                                                                                                                                           | ✅ Done  |
| H10 | Durable Objects WS fan-out: one DO per symbol; live ticks to browser (B1 backlog item)                                                                                                                                                                                                                                                                                                                                                                                                                                                              | ✅ Done  |
| H11 | Web Push VAPID: price + indicator alerts via Push API; `vapid-send.ts` in Worker                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | ✅ Done  |
| H12 | Passkey auth + encrypted cloud sync: WebAuthn → AES-GCM → Cloudflare D1                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | ✅ Done  |
| H13 | Optional XLSX export: lazy-load `exceljs` for screener/portfolio results                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | ✅ Done  |
| H14 | OG image via Satori: SVG-from-template at Worker edge for richer share cards                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | ✅ Done  |
| H15 | Tiingo provider implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | ✅ Done  |
| H16 | `uPlot` integration for static inline charts (screener rows, consensus timeline)                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | ✅ Done  |
| H17 | Tauri 2.0 desktop wrapper: Win/Mac/Linux app wrapping the PWA build                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ✅ Done  |
| H18 | **Earnings Calendar card**: shows upcoming earnings dates for all watchlist tickers in a scrollable calendar / list view. Columns: ticker, company name, earnings date, EPS estimate (consensus), prior quarter EPS, historical surprise %. Source: Finnhub `/calendar/earnings` (free tier). Highlights tickers with earnings within 7 days. Integrates with the Alerts card to optionally fire a pre-earnings reminder notification.                                                                                                              | ✅ Done  |
| H19 | **Macro Dashboard card**: displays the five numbers every equity trader checks at market open — VIX, US 10Y yield, DXY (US Dollar Index), gold spot (XAU/USD), and WTI crude (CL=F). Each metric shows: current value, daily % change, 30-day sparkline, and a color-coded regime badge (risk-on / risk-off / neutral derived from VIX threshold and DXY trend). Data sourced from existing Yahoo provider (all five are Yahoo-queryable tickers). Renders as a horizontal summary bar that can dock above the Watchlist as a global context strip. | ✅ Done  |
| H20 | **Sector Rotation card**: renders an `11 × N` table (11 GICS sectors, N timeframes: 1W / 1M / 3M / 6M / 1Y) showing sector ETF (XLC, XLY, XLP, XLE, XLF, XLV, XLI, XLB, XLRE, XLK, XLU) relative performance vs SPY. Color-codes each cell by relative strength (green outperform, red underperform). Side panel shows a line chart of the top and bottom ranked sectors over the selected window. Identifies rotation opportunities. Uses existing Yahoo history provider; all 11 sector ETFs + SPY are standard tickers.                          | ✅ Done  |
| H21 | **Relative Strength Comparison card**: overlays multiple tickers' % return from a common base date on a single time-series chart, normalized to 0% at the start of the chosen window (1M / 3M / 6M / 1Y / YTD). Benchmark (SPY, QQQ, or custom ticker) rendered as a dashed reference line. Answers "which ticker in this sector should I own?" Controls: add/remove tickers from watchlist, window selector, benchmark picker. Uses existing LWC LineSeries; data from IDB candle cache.                                                           | ✅ Done  |

---

### Phase I — v9.0.0 "Intelligent & Collaborative"

**Theme:** On-device AI for pattern recognition; public API; shared signal strategies.

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Priority |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| I1  | ONNX Runtime Web: on-device candlestick pattern classifier (~2 MB model, lazy-loaded)                                                                                                                                                                                                                                                                                                                                                                       | ✅ Done  |
| I2  | Pattern recognition card: display detected patterns on chart (Head & Shoulders, etc.)                                                                                                                                                                                                                                                                                                                                                                       | ✅ Done  |
| I3  | Pattern backtesting: historical win-rate validation of ONNX-detected patterns                                                                                                                                                                                                                                                                                                                                                                               | ✅ Done  |
| I4  | ONNX model fine-tuning pipeline: offline Python → quantized ONNX → bundle                                                                                                                                                                                                                                                                                                                                                                                   | ✅ Done  |
| I5  | Read-only public REST API: rate-limited Hono Worker route for external consumers                                                                                                                                                                                                                                                                                                                                                                            | ✅ Done  |
| I6  | Shared signal strategies: import/export `signal-dsl.ts` strategies as portable JSON                                                                                                                                                                                                                                                                                                                                                                         | ✅ Done  |
| I7  | Multi-device cloud sync GA: Passkey-encrypted blobs with CRDT-ish conflict resolution                                                                                                                                                                                                                                                                                                                                                                       | ✅ Done  |
| I8  | Collaborative watchlists: share-by-URL read-only snapshots with TTL (no auth required)                                                                                                                                                                                                                                                                                                                                                                      | ✅ Done  |
| I9  | Market regime detection: macro-regime classifier (ONNX or rule-based) in consensus engine                                                                                                                                                                                                                                                                                                                                                                   | ✅ Done  |
| I10 | **Economic Calendar card**: lists scheduled macro events (Fed meetings, FOMC minutes, CPI, PPI, NFP, GDP, PCE) for the next 30 days with consensus forecast, prior value, and actual (populated after release). Source: FRED API (free, no auth for public series) + Finnhub `/calendar/economic`. Color-codes high/medium/low impact events. Crosslinks to the Macro Dashboard card to show post-release moves.                                            | ✅ Done  |
| I11 | **News Digest card**: curates recent headlines per watchlist ticker from public RSS/Atom feeds (Yahoo Finance RSS, Seeking Alpha public feed, Google News finance RSS). Groups headlines by ticker; shows publication time, source, and sentiment badge (rule-based keyword classifier, no LLM). Marks headlines within ±30 min of a significant price move on the chart timeline. No API key required; fetch via Worker CORS proxy to avoid mixed-content. | ✅ Done  |

---

## 16. Outstanding Work Consolidated

### Phase F items (v7.8.0)

| #   | Item                             | Notes                                                                   |
| --- | -------------------------------- | ----------------------------------------------------------------------- |
| F1  | Remove `zod` from prod deps      | ✅ Done — replaced with Valibot v1.3.1                                  |
| F2  | Deploy docs-site                 | ✅ Done — docs.yml workflow + README badge                              |
| F3  | E2E expansion (2 → ≥15 flows)    | ✅ Done — keyboard.spec + settings.spec added                           |
| F4  | Structured Worker logs           | ✅ Done — core/request-logger.ts (31 tests)                             |
| F5  | GlitchTip + Plausible            | ✅ Done — .env.example + telemetry fully wired                          |
| F6  | ~37 missing indicator MDX pages  | ✅ Done — 48 total MDX indicator reference pages                        |
| F7  | AbortController on route change  | Cancel all pending fetches on navigate                                  |
| F8  | Uptime Kuma                      | Docker on Fly.io + README badge                                         |
| F9  | socket.dev supply-chain check    | Add as GitHub App to repo                                               |
| F10 | gitleaks                         | ✅ Done — config/.gitleaks.toml + CI job                                |
| F11 | Confirm Worker production deploy | Verify all routes live on `*.crosstide.pages.dev`                       |
| F12 | Stooq provider                   | ✅ Done — Stooq EOD CSV provider in failover chain                      |
| F13 | ETF constituent drill-down       | Collapsible ETF rows showing constituent tickers; see G18 for full spec |

### Phase G items (v7.9.0) — see §15 Phase G table

| #   | Item                         | Notes                                                                                             |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| G19 | Company name below ticker    | ✅ Done — `WatchlistEntry.name?` populated from quote                                             |
| G20 | Per-method consensus weights | ✅ Done — `AppConfig.methodWeights` + Settings sliders                                            |
| G21 | Heatmap sector drill-down    | ✅ Done — click sector → constituent stocks; attribution bar; breadcrumb nav                      |
| G22 | Correlation Matrix card      | ✅ Done — `n×n` color grid; over-concentration warnings; period selector                          |
| G23 | Market Breadth card          | ✅ Done — BUY/SELL donut + MA breadth + advance/decline + top movers                              |
| G24 | Per-card settings            | ✅ Done — `AppConfig.cardSettings[CardId]`; typed Valibot schema; Settings UI; reactive re-render |

### New cards — Phase H (v8.0.0)

| #   | Item                              | Notes                                                     |
| --- | --------------------------------- | --------------------------------------------------------- |
| H18 | Earnings Calendar card            | ✅ Done — Finnhub `/calendar/earnings` integrated         |
| H19 | Macro Dashboard card              | ✅ Done — VIX, 10Y, DXY, gold, crude; regime badge        |
| H20 | Sector Rotation card              | ✅ Done — 11 GICS sectors vs SPY; relative strength table |
| H21 | Relative Strength Comparison card | ✅ Done — multi-ticker % return overlay vs benchmark      |

### New cards — Phase I (v9.0.0)

| #   | Item                   | Notes                                                               |
| --- | ---------------------- | ------------------------------------------------------------------- |
| I10 | Economic Calendar card | ✅ Done — FRED + Finnhub macro events; crosslinks Macro Dashboard   |
| I11 | News Digest card       | ✅ Done — RSS per ticker; keyword sentiment badge; chart annotation |

### Phase H items (v8.0.0) — see §15 Phase H table

### Phase I items (v9.0.0) — see §15 Phase I table

### Carried over from v2 roadmap (pending)

| Item                           | Status                 | Phase |
| ------------------------------ | ---------------------- | ----- |
| Worker → Hono                  | ✅ Done (G1)           | G1    |
| `src/` → `app/` npm workspaces | R3 still pending       | G2    |
| TypeScript 6.0                 | ✅ Done (G3)           | G3    |
| Stooq provider                 | ✅ Done (F12)          | F12   |
| GlitchTip + Plausible          | ✅ Done (.env.example) | F5    |
| Docs-site deployment           | ✅ Done (docs.yml)     | F2    |
| Per-indicator MDX (full set)   | ✅ Done (48 pages)     | F6    |
| `tsd` type tests               | ✅ Done (R13)          | G5    |
| `eslint-plugin-import-x`       | ✅ Done (R10)          | G6    |
| Passkey + cloud sync           | ✅ Done (H12)          | H12   |
| VAPID push notifications       | ✅ Done (H11)          | H11   |
| Tauri 2.0 desktop              | ✅ Done (H17)          | H17   |

---

## Phase J — Polish, Coverage & Documentation (v10.0.0)

_Focus: close remaining test coverage gaps, expand the user-guide documentation
suite, and prepare the codebase for long-term maintainability._

### J1 — CHANGELOG Backfill

| #   | Item                                 | Status  |
| --- | ------------------------------------ | ------- |
| J1  | Backfill CHANGELOG v7.14.0 – v7.16.0 | ✅ Done |

### J2 — User-Guide Expansion

| #   | Item                             | Status  |
| --- | -------------------------------- | ------- |
| J2  | Screener user guide (MDX)        | ✅ Done |
| J3  | Backtest Engine user guide (MDX) | ✅ Done |
| J4  | Alerts user guide (MDX)          | ✅ Done |
| J5  | Docs sidebar — add User Guides   | ✅ Done |

### J3 — Test Coverage Sweep

| #   | Item                                                      | Status  |
| --- | --------------------------------------------------------- | ------- |
| J6  | chart-card / consensus-card / watchlist-card tests        | ✅ Done |
| J7  | market-breadth-data / screener-data / settings-card tests | ✅ Done |
| J8  | app-store / backtest-worker / compute-worker tests        | ✅ Done |

### J4 — Future Items (planned)

| #   | Item                                      | Priority | Notes                                                   |
| --- | ----------------------------------------- | -------- | ------------------------------------------------------- |
| J9  | npm workspaces refactor (`src/` → `app/`) | P1       | Carried from G2/R3; monorepo structure                  |
| J10 | E2E Playwright smoke tests                | P2       | Automated smoke for key user flows                      |
| J11 | Accessibility audit (WCAG 2.2 AA)         | P2       | Keyboard nav, ARIA roles, colour contrast               |
| J12 | Performance budget CI gate                | P3       | Bundle size + LCP/FID/CLS budgets in CI pipeline        |
| J13 | i18n framework scaffolding                | P3       | Extract strings; ICU MessageFormat; RTL layout support  |
| J14 | Plugin API for custom indicators          | P3       | External ESM indicator modules loaded at runtime        |
| J15 | Mobile-responsive card layouts            | P2       | Responsive grid breakpoints; touch-optimised controls   |
| J16 | WebSocket reconnect stress tests          | P3       | Simulate network flaps; verify circuit-breaker recovery |

---

## 17. Refactor & Rewrite Backlog

| #   | Refactor                                                                              | Status             | Target      |
| --- | ------------------------------------------------------------------------------------- | ------------------ | ----------- |
| R1  | Delete `core/state.ts`                                                                | ✅ Done            | —           |
| R2  | Standardize `cards/` `mount()` signature to `CardHandle`                              | ✅ Done            | —           |
| R3  | **`src/` → `app/` + npm workspaces**                                                  | Pending            | G2          |
| R4  | **Replace `core/index.ts` barrel** with subpath exports                               | ✅ Done (v7.16.0)  | G2          |
| R5  | Remove remaining `as` casts (run `no-unnecessary-type-assertion`)                     | **Done** (v7.15.0) | G3          |
| R6  | JSDoc sweep on all public exports                                                     | **Done** (v7.15.0) | G15         |
| R7  | Replace `cards/index.ts` static imports with registry lazy imports                    | ✅ Done            | —           |
| R8  | **Unify `ui/date-format` and `core/date-format`** under `core/`                       | **Done** (v7.15.0) | G7          |
| R9  | Replace `EventTarget` callbacks with signals                                          | ✅ Done            | —           |
| R10 | **Migrate to `eslint-plugin-import-x`**                                               | ✅ Done            | G6          |
| R11 | **Worker rewrite to Hono**                                                            | ✅ Done            | G1          |
| R12 | Extract `makeCandles()` fixture to shared `tests/fixtures/candles.ts`                 | ✅ Done            | G2          |
| R13 | **`tsd` / `expect-type` type tests for `domain/index.ts`**                            | ✅ Done            | G5          |
| R14 | CHANGELOG to Changesets-generated                                                     | ✅ Done            | —           |
| R15 | Move inline `<script>` to module entry (CSP `'self'`)                                 | ✅ Done            | —           |
| R16 | **Consolidate `core/cache.ts`, `tiered-cache.ts`, `lru-cache.ts`** into `core/cache/` | **Done** (v7.15.0) | G2          |
| R17 | Make `domain/heikin-ashi.ts` Candle the canonical type                                | ✅ Done            | —           |
| R18 | **`using` keyword sweep** for all effect/WS/Worker handles                            | ✅ Done            | G12         |
| R19 | **Remove `zod` prod dep**; replace remaining usages with Valibot                      | ✅ Done            | F1          |
| R20 | **CSS `@scope`** for card style isolation                                             | ✅ Done            | H5          |
| R21 | **Update `ARCHITECTURE.md`** for v7.15.0                                              | ✅ Done (v7.16.0)  | G2          |
| R22 | **`Date` → `Temporal.PlainDate`** in `core/timezone.ts` and domain date math          | ✅ Done            | G7          |
| R23 | **Remove Twelve Data provider**; clean up imports and failover chain                  | ✅ Done            | F12         |
| R24 | **Market-hours detection** for WS connection gating                                   | ✅ Done            | H — ongoing |

---

## 18. Decisions Reaffirmed / Reversed / New

### Reaffirmed (confirmed after v3 rethink)

- TypeScript strict + all extras (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Vanilla DOM + hand-written signals (zero framework; confirmed right after 130 sprints)
- Design tokens + `@layer` CSS (reject Tailwind/UnoCSS/CSS-in-JS)
- Lightweight Charts v5 as primary chart renderer
- Cloudflare Pages + Workers (with Hono upgrade)
- IndexedDB + localStorage tiers (no Dexie)
- MIT license, no-account default, $0/mo infra target
- Shared `MyScripts/tooling/` DX setup

### Reversed since May 2026 v2 roadmap

- **Twelve Data removed from provider chain** — 25/day unusable; replaced by Tiingo
- **`zod` removed** (F1/R19) — fully replaced with Valibot v1.3.1
- **Worker migrated to Hono** (G1/R11) — typed routing + middleware
- **Structured logs live** — Hono middleware + Logpush → R2 (F4)
- **OPFS tier added** for large OHLC archives (H8)

### New decisions (not in v1 or v2 roadmaps)

- Temporal API for financial date math (G7)
- Navigation API as progressive enhancement over History API (G8)
- Popover API for overlay UI (G9)
- ONNX Runtime Web for on-device pattern recognition (Phase I)
- OpenAPI spec auto-generated from Hono (G10)
- OPFS tier for large OHLC archives (H8)
- Background Fetch API for large dataset downloads (H7)
- Compression Streams for export file gzip (G11)
- Transferable Float64Array for zero-copy Worker RPC (G4)
- CSS `@scope` for card-level style containment (H5)
- `@starting-style` for card entry animations (H2)
- Inter Variable font self-hosted (G16)
- `using` keyword for deterministic cleanup (G12, R18)
- Cloudflare Rate Limiting API replacing in-memory token bucket (G13)
- ETag / Last-Modified support in tiered cache (G14)
- Tiingo as a cheaper paid provider alternative (D7, H15)
- `gitleaks` in pre-commit + CI (F10)
- `socket.dev` supply-chain check on PRs (F9)
- Satori for edge OG image rendering (H14)
- `uPlot` for static inline chart views (D5, H16)

### Explicit non-decisions (intentionally not chosen)

- No React / Vue / Svelte / Solid / Lit (vanilla + signals is sufficient)
- No Tailwind / UnoCSS (tokens + `@layer` is cleaner and smaller)
- No Dexie (`idb.ts` is proven; no additional abstraction needed)
- No Sentry SaaS (GlitchTip self-hosted, same protocol)
- No Google Analytics (Plausible self-hosted, cookieless)
- No Postgres (KV + R2 + D1 covers the data model)
- No Electron (Tauri only if desktop wrapper happens)
- No native iOS/Android (PWA until proven insufficient)
- No paid data feeds in default config (Tiingo/Polygon opt-in only)
- No LLM in the bundle (ONNX local model only; no network inference calls)
- No Rust/WASM until a compute path demonstrably exceeds 16 ms p95

---

## 19. Risks & Mitigations

| Risk                                     | Likelihood | Impact | Mitigation                                                  |
| ---------------------------------------- | ---------- | ------ | ----------------------------------------------------------- |
| Yahoo unofficial API breaks              | Medium     | High   | Circuit breaker → Stooq → Finnhub → Tiingo fall-through     |
| Cloudflare free-tier limits exceeded     | Low        | Medium | KV/R2 cache; CF Rate Limiting; daily budget alarm           |
| TypeScript 6.0 breaking changes          | Medium     | Medium | Dedicated migration PR; `tsc --noEmit` against 6.0 first    |
| `Temporal` polyfill size (~20 KB gz)     | Low        | Low    | Lazy-load polyfill; native support arriving in all browsers |
| ONNX model size (~2 MB)                  | Low        | Medium | Background Fetch + Cache API; never blocks initial load     |
| Navigation API Safari support gaps       | Medium     | Low    | Progressive enhancement; graceful fallback to History API   |
| Hono refactor breaks Worker routes       | Low        | Medium | Full E2E against Worker in staging before merge             |
| Stooq CSV format changes                 | Medium     | Low    | Pinned parser with integration test against live endpoint   |
| Lighthouse v13 assertion changes         | Low        | Low    | Review on update; adjust budgets if warranted               |
| Cloudflare Durable Object pricing change | Low        | Medium | Defer DO WS fan-out until confirmed stable free tier        |
| GlitchTip / Plausible Fly.io outage      | Low        | Low    | Errors degrade to console only; no data loss                |
| Single-maintainer bus factor             | High       | High   | Comprehensive docs (this roadmap); MIT enables forks        |
| OneDrive sync conflicts on dev machine   | Low        | Low    | `.gitattributes` CRLF config; documented in CONTRIBUTING.md |

---

## 20. Scope Boundaries

**Building:**

- Browser-based stock & crypto monitoring dashboard (open source, self-hostable)
- 12-method consensus engine (unique product differentiator) with per-method user weights
- Interactive charting with drawing tools, multi-pane sub-indicators
- Screener, alerts, backtest, portfolio analytics, risk metrics
- Heatmap with sector drill-down and market-attribution view
- Per-card settings system (card-scoped configuration persisted in `AppConfig`)
- Correlation Matrix card, Market Breadth card, Relative Strength Comparison card
- Earnings Calendar, Macro Dashboard, Sector Rotation cards (Phase H)
- Economic Calendar, News Digest cards (Phase I)
- Offline-first PWA with Workbox + Background Fetch
- Signal scripting DSL via Web Worker
- On-device AI pattern recognition (ONNX, Phase I)
- Optional Passkey-encrypted cloud sync (v8.0)
- Cloudflare edge API proxy with structured logging and OpenAPI spec

**Not building:**

- Brokerage / order execution / real money flow
- Social features / chat / public profiles
- Paid SaaS tier
- News aggregation or sentiment analysis
- Crypto wallets or on-chain transactions
- AI chat assistants or cloud LLM features
- Native iOS/Android apps (PWA covers mobile)
- Multi-user / multi-tenant functionality

---

## Sprint Log — v7.23.0 (Production Readiness Audit)

> **Date:** May 3, 2026 | **Release:** [v7.23.0](https://github.com/RajwanYair/CrossTide/releases/tag/v7.23.0)

20-task production sprint executed against the standardized web-project checklist.

| #   | Task                                   | Status  | Notes                                                            |
| --- | -------------------------------------- | ------- | ---------------------------------------------------------------- |
| 1   | Inventory & delete non-web code paths  | ✅ Done | No desktop/mobile/backend scaffolding found                      |
| 2   | Remove Python scripts/steps            | ✅ Done | No Python in repo; pure Node.js pipeline                         |
| 3   | Define architecture in ARCHITECTURE.md | ✅ Done | 3 Mermaid diagrams, layered deps, data flow (v7.15.0)            |
| 4   | Standardize build system               | ✅ Done | npm lockfile only, Node >=20.19.0, deterministic installs        |
| 5   | Clean project structure                | ✅ Done | src/, public/, tests/, docs/, config/, .github/                  |
| 6   | Deduplicate utilities                  | ✅ Done | Removed dead `ui/date-format.ts` re-export (v7.23.0)             |
| 7   | Warnings as errors                     | ✅ Done | `--max-warnings 0` in all linters, strict TS mode                |
| 8   | Fix all warnings                       | ✅ Done | 0 TS / 0 ESLint / 0 Stylelint / 0 HTMLHint errors                |
| 9   | Formatting & linting standards         | ✅ Done | Prettier + ESLint + Stylelint + Markdownlint configured          |
| 10  | GitHub Actions CI                      | ✅ Done | install → lint → test → build → artifact upload                  |
| 11  | GitHub Actions Release                 | ✅ Done | Tag triggers build + zip + SHA256 → GitHub Release               |
| 12  | .vscode workspace standards            | ✅ Done | settings, extensions, tasks, launch.json                         |
| 13  | .github hygiene                        | ✅ Done | Issue templates, PR template, CODEOWNERS, CONTRIBUTING, SECURITY |
| 14  | Dependabot                             | ✅ Done | npm (root + docs-site) + github-actions, weekly                  |
| 15  | README completeness                    | ✅ Done | Purpose, dev, build, deploy, troubleshooting covered             |
| 16  | CHANGELOG with SemVer                  | ✅ Done | Keep a Changelog format, SemVer bumps                            |
| 17  | Diagrams/graphics                      | ✅ Done | Mermaid in ARCHITECTURE.md + SVG exports                         |
| 18  | Remove redundant configs               | ✅ Done | Single source of truth per linter/formatter                      |
| 19  | Consolidate documentation              | ✅ Done | No duplicates, no broken links                                   |
| 20  | Final consolidation pass               | ✅ Done | Dead re-export removed, barrel created, community files moved    |

**Footprint reduction (v7.22.0 → v7.23.0):**

- Removed `src/ui/date-format.ts` (dead re-export, 20 lines)
- Net code reduction: −21 lines removed, +2 lines added (barrel)

---

## 21. Glossary & Acronyms

| Term         | Meaning                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| **CRDT**     | Conflict-free Replicated Data Type                                       |
| **CSP**      | Content Security Policy                                                  |
| **D1**       | Cloudflare's serverless SQLite (edge database)                           |
| **DO**       | Cloudflare Durable Object                                                |
| **EOD**      | End-of-Day pricing                                                       |
| **INP**      | Interaction to Next Paint (Core Web Vital)                               |
| **KV**       | Cloudflare Key-Value store                                               |
| **LCP**      | Largest Contentful Paint (Core Web Vital)                                |
| **LH CI**    | Lighthouse CI                                                            |
| **LWC**      | Lightweight Charts (TradingView OSS)                                     |
| **ONNX**     | Open Neural Network Exchange format                                      |
| **OPFS**     | Origin Private File System (browser storage API)                         |
| **OG image** | Open Graph share image                                                   |
| **PE**       | Progressive Enhancement                                                  |
| **PWA**      | Progressive Web App                                                      |
| **R2**       | Cloudflare's S3-compatible object storage                                |
| **RUM**      | Real User Monitoring                                                     |
| **SAB**      | SharedArrayBuffer                                                        |
| **SPA**      | Single-Page Application                                                  |
| **SRI**      | Subresource Integrity                                                    |
| **SWR**      | Stale-While-Revalidate caching                                           |
| **Temporal** | TC39 Stage 4 date/time API (replaces `Date` for DST-safe financial math) |
| **VAPID**    | Voluntary Application Server Identification (Web Push)                   |
| **WS / WSS** | WebSocket / WebSocket Secure                                             |

---

_Previous roadmap version archived at_ `docs/ROADMAP.archive-2026-05.md`.
_Earlier archive at_ `docs/ROADMAP.archive-2026-04.md`.
