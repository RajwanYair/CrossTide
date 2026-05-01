# CrossTide — Strategic Roadmap (Deep Rethink, May 2026)

> **Last updated:** May 1, 2026
> **Declared version:** v6.4.0 (Sprints 1–130 shipped)
> **Codebase scale:** 215 source modules, 1772 unit tests, ~98% domain coverage,
> 359 commits, 11 release candidates.
> **Honest verdict:** We have built a **best-in-class utility/domain library**.
> We have **not yet** built a best-in-class **product**. This roadmap closes that gap.

This document supersedes the prior roadmap (`ROADMAP.archive-2026-04.md`). It is the
result of a **second** end-to-end rethink — every decision, including the ones that
looked clean six months ago, is re-examined against where the project actually is in
May 2026. The conclusion drove a re-prioritization, not a re-architecture: the
foundations are sound; what's missing is **integration, deployment, and
product-grade UX**.

---

## Table of Contents

1. [Executive Summary (read this first)](#1-executive-summary)
2. [State of the Project — Honest Audit, Round 2](#2-state-of-the-project--honest-audit-round-2)
3. [Decision Rethink Matrix v2 (every prior call re-examined)](#3-decision-rethink-matrix-v2)
4. [Best-in-Class Comparison Table](#4-best-in-class-comparison-table)
5. [Best Practices Harvested](#5-best-practices-harvested)
6. [Target Architecture (v6.2+)](#6-target-architecture-v62)
7. [Frontend Strategy](#7-frontend-strategy)
8. [Backend, Data & Infrastructure Strategy](#8-backend-data--infrastructure-strategy)
9. [Storage, Sync & Offline Strategy](#9-storage-sync--offline-strategy)
10. [Quality, Security & Observability](#10-quality-security--observability)
11. [Performance Budget](#11-performance-budget)
12. [Documentation Strategy](#12-documentation-strategy)
13. [Developer Experience](#13-developer-experience)
14. [External Sources, APIs & Vendor Strategy](#14-external-sources-apis--vendor-strategy)
15. [Phased Roadmap (v6.2 → v8.0)](#15-phased-roadmap)
16. [Outstanding Work Consolidated](#16-outstanding-work-consolidated)
17. [Refactor & Rewrite Backlog](#17-refactor--rewrite-backlog)
18. [Decisions Reaffirmed / Reversed / New](#18-decisions-reaffirmed--reversed--new)
19. [Risks & Mitigations](#19-risks--mitigations)
20. [Scope Boundaries](#20-scope-boundaries)
21. [Glossary & Acronyms](#21-glossary--acronyms)

---

## 1. Executive Summary

**Where we are.** Eleven release candidates and 130 sprints in, CrossTide has the
deepest pure-TypeScript indicator/utility library in its peer set: 30+ technical
indicators with exhaustive tests, a complete consensus engine, alert state
machine, backtest engine with risk metrics, portfolio analytics, IndexedDB-backed
tiered cache, sync queue, token-bucket limiter, CSP/SRI builders, signals store,
worker RPC, fuzzy match, ARIA live announcer, and dozens more — all strict-typed,
tree-shakable, and tested.

**The honest gap.** None of that is yet a _product a user can open and love_.
`main.ts` wires watchlist + theme only. Charts render an OHLC table. The
Cloudflare Worker exists but isn't deployed. The PWA shell is minimal. There is
no E2E test, no Lighthouse CI run, no real charting library on the page.

**The pivot.** Stop adding library modules at v6.1's pace. Spend v6.2 on
**Integration & Activation**: deploy the Worker, swap to History API routing,
adopt signals-based state, lazy-mount every existing card via the registry, ship
Lightweight Charts, and turn on Workbox + Playwright + Lighthouse CI. v6.3 polishes
real-time, portfolio, and screener. v7.0 brings optional Passkey-encrypted cloud
sync. v8.0 (stretch) opens streaming/social features.

**One sentence.** _We've built the engine; v6.2 builds the car around it._

---

## 2. State of the Project — Honest Audit, Round 2

### 2.1 What is genuinely done (May 2026)

| Area                                                                                                                                                         | Status                   | Evidence                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | -------------------------------------------------------- |
| **Domain library** — 30+ indicators, consensus, alerts, backtest                                                                                             | ✅ Excellent             | `src/domain/*` (~75 files), 98%+ coverage                |
| **Core utilities** — signals, IDB, tiered cache, fetch, retry, circuit-breaker, RPC, sync-queue, token-bucket, CSP/SRI builders, hash/uuid/seedrandom/easing | ✅ Excellent             | `src/core/*` (~70 files)                                 |
| **UI utilities** — toast, modal, sortable, sparkline, command palette, fuzzy-match, focus-trap, container-query, ARIA live                                   | ✅ Built, mostly unwired | `src/ui/*` (~35 files)                                   |
| **Card scaffolds** — 15+ feature cards                                                                                                                       | ⚠️ Skeletons             | render summaries, not interactive                        |
| **TypeScript strictness**                                                                                                                                    | ✅ Maximum               | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| **Toolchain** — TS 5.9, Vite 8, Vitest 4.1, ESLint 10, Stylelint, htmlhint, markdownlint                                                                     | ✅ Modern                | shared with `MyScripts/tooling`                          |
| **CI gates** — typecheck, lint:all, test:coverage, build, bundle-size                                                                                        | ✅ Green                 | `npm run ci` passes; 1772 tests                          |
| **Worker source** — Yahoo / Twelve / CoinGecko / Polygon proxy                                                                                               | ✅ Authored              | `worker/src/*`                                           |
| **PWA scaffold** — manifest + `sw.ts` (precache + SWR)                                                                                                       | ✅ Minimal               | not Workbox                                              |
| **Documentation** — README, CHANGELOG, ARCHITECTURE, CONTRIBUTING, COPILOT_GUIDE, this roadmap                                                               | ✅ Honest                | but no per-indicator reference                           |

### 2.2 What is missing or weak (the gap)

- **Integration debt #1: `main.ts` is still 30 lines.** The card registry isn't
  wired; only watchlist + theme + add/remove are live. Every other card sits in
  `src/cards/` exporting `mount()` functions nobody calls.
- **No real charting.** `cards/chart.ts` renders an OHLC table.
  `lightweight-charts` is not in `package.json`.
- **Hash router still in use** (`src/ui/router.ts`). Defers History API,
  blocks deep links and OG images.
- **State plumbing is split.** `core/state.ts` (EventTarget) and `core/signals.ts`
  (signal/computed/effect) coexist. Cards use neither consistently. Pick one.
- **Worker not deployed.** No `wrangler.toml` env, no DNS, no production secret
  store. Browser still hits mock fixtures in tests.
- **No live-data path.** Polling code exists; nobody calls it from the UI.
- **No E2E tests.** `tests/` has `unit/` only.
- **No accessibility tests.** `axe-core` not in deps; ARIA helpers exist but
  aren't asserted.
- **No Lighthouse CI.** Bundle-size gate exists, performance budget not enforced.
- **No error tracking, no analytics.** Code paths exist (`analytics.ts`,
  `error-boundary.ts`) but no sink.
- **No streaming.** Polling-only, even though Finnhub WS is in the design.
- **No auth, no cloud sync.** Acceptable for v6.x; blocks multi-device users at v7.
- **No Web Worker offload of compute** despite `compute-worker.ts` and
  `worker-rpc.ts` existing — backtests still run on the main thread when invoked.
- **Hash-only IDB schema versioning is informal.** `idb-migrations.ts` exists but
  isn't exercised by every store.
- **Library modules vastly outnumber product modules.** ~140 library files vs
  ~15 product (card) files. The ratio is upside-down for a product.
- **Per-indicator documentation is absent.** 30 indicators, ~0 reference pages.
- **No design system catalog.** Tokens exist; nobody can browse the components.

### 2.3 What changed since the April rethink

| Change                                                                                                                                        | Impact                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 8 more release candidates shipped (rc.4 → rc.11)                                                                                              | +60 modules, +900 tests                                   |
| Toolchain stayed pinned to TS 5.9 / Vite 8 / Vitest 4.1                                                                                       | No drift, low risk                                        |
| Library coverage now spans hashing, RNG, easing, base64, timezone, clipboard, ARIA-live, etc.                                                 | Foundation **over-saturated** for current product surface |
| Worker code unchanged                                                                                                                         | Deploy still pending                                      |
| `main.ts` unchanged                                                                                                                           | Wiring still pending                                      |
| Cards `screener`, `portfolio`, `consensus`, `alerts`, `settings`, `heatmap`, `provider-health`, `performance-metrics` etc. exist as scaffolds | Need activation, not creation                             |

**Conclusion of round 2:** the _strategy_ in the April roadmap was right. The
_execution priority_ has drifted — we kept building library, not product. This
roadmap re-anchors the next 12 months on **product activation**.

---

## 3. Decision Rethink Matrix v2

Every prior decision is re-examined for May 2026. Verdict = `Keep` / `Refine` /
`Replace` / `Defer`. Bold rows changed since April.

| #       | Topic                  | Prior decision                                 | New verdict (May 2026)             | Action                                                                                                                                                                              |
| ------- | ---------------------- | ---------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1      | UI framework           | Vanilla TS + optional Preact Signals           | **Refine**                         | Adopt `@preact/signals-core` (1.4 KB) **now** as the only state primitive; deprecate `core/state.ts` EventTarget store. Reject Lit until a card actually demands it.                |
| D2      | Routing                | Hash-based                                     | **Replace (P0)**                   | Switch to History API + Cloudflare Pages SPA fallback. Add 404 redirect for any static-host fallback.                                                                               |
| D3      | State store            | EventTarget                                    | **Replace (P0)**                   | Single signal-based store (`core/signals.ts`) + `persistedSignal` adapters for `localStorage` and IDB. Remove `core/state.ts` after migration.                                      |
| D4      | Styling                | Vanilla CSS + tokens + `@layer`                | **Keep + extend**                  | Add OpenProps-style scale, `:has()` patterns, `view-transition-name` for route animations. Reject Tailwind/UnoCSS.                                                                  |
| D5      | Charts                 | Lightweight Charts (planned)                   | **Keep — actually integrate (P0)** | Add `lightweight-charts@^5` as dynamic import; multi-pane sub-indicators wired to existing domain calculators.                                                                      |
| D6      | Edge runtime           | Cloudflare Workers                             | **Keep + extend**                  | Add Durable Objects for WS fan-out, R2 for cold OHLC, KV for hot quotes + rate-limit counters.                                                                                      |
| D7      | Data providers         | Yahoo (primary) / Twelve / CoinGecko / Polygon | **Refine**                         | Add **Finnhub** as 2nd-tier (60 req/min free + WS). Demote Twelve Data to tertiary. Keep Polygon as paid escape hatch. Add **Stooq** as a free EOD bulk fallback for daily history. |
| D8      | Auth                   | None                                           | **Refine**                         | "No account" stays default. v7.0 adds **Passkey-only** (WebAuthn) opt-in. Reject email/password forever.                                                                            |
| D9      | Hosting                | GitHub Pages                                   | **Replace (P0)**                   | Move to **Cloudflare Pages** + Pages Functions. Same $0/mo, native SPA fallback, preview deploys per PR, edge functions co-located. Keep GH Pages mirror as redundancy.             |
| D10     | Service Worker         | Hand-rolled (`public/sw.ts`)                   | **Refine (P1)**                    | Adopt Workbox build (precache manifest, runtime caching strategies, Background Sync queue, Navigation Preload). Adds ~10 KB but eliminates a class of bugs.                         |
| D11     | Live data              | Polling only                                   | **Extend (P1)**                    | Add WebSocket via Finnhub behind feature flag; reuse `reconnecting-ws.ts`.                                                                                                          |
| D12     | Compute offload        | Main-thread only                               | **Replace (P0)**                   | Run backtests, full-history scans, screener evaluation in `compute.worker.ts` via existing `worker-rpc.ts`.                                                                         |
| D13     | Persistent cache       | localStorage + IDB                             | **Refine**                         | Keep tiered cache. Add LRU eviction (already wrote `lru-cache.ts` — wire it). Add `navigator.storage.estimate()` listener (already wrote `storage-pressure.ts` — wire it).          |
| D14     | Runtime validation     | None                                           | **Add (P0)**                       | Adopt **Valibot** (~3 KB, 90% smaller than Zod) at every external boundary. Brand `Ticker`/`ISODate`/`Price` (already in `branded.ts`).                                             |
| D15     | Error tracking         | None                                           | **Add (P1)**                       | Self-hosted **GlitchTip** on Fly.io. Sample 25%, scrub PII.                                                                                                                         |
| D16     | Telemetry              | None                                           | **Add (P1)**                       | Self-hosted **Plausible** (cookieless). Route changes, card mounts, Web Vitals (already wrote `web-vitals.ts` — wire it).                                                           |
| D17     | Lighthouse CI          | None                                           | **Add (P0)**                       | `lhci autorun` in GH Actions with `lighthouserc.json` budgets file.                                                                                                                 |
| D18     | E2E tests              | None                                           | **Add (P0)**                       | **Playwright** for 10 critical flows. Reject Cypress (slower, heavier).                                                                                                             |
| D19     | A11y tests             | None                                           | **Add (P0)**                       | `@axe-core/playwright` per E2E run; `vitest-axe` for unit-level. WCAG 2.2 AA target.                                                                                                |
| D20     | Versioning             | Manual + per-sprint commits                    | **Refine (P2)**                    | Adopt **Changesets** for v6.2+. Per-sprint commits stay; release notes auto-aggregate.                                                                                              |
| D21     | Toolchain location     | Shared `MyScripts/tooling/*`                   | **Keep**                           | DX win confirmed across 130 sprints.                                                                                                                                                |
| D22     | Component catalog      | None                                           | **Add (P1)**                       | Single `dev/components.html` mounting every card with mock signals. Cheaper than Storybook.                                                                                         |
| D23     | Supply chain           | npm audit only                                 | **Add (P1)**                       | `npm audit signatures` + `socket.dev` PR check + Dependabot weekly + lockfile-only renovate.                                                                                        |
| D24     | i18n                   | None                                           | **Add (P2)**                       | `@formatjs/intl` + ICU. English first, Hebrew (RTL) second. Tokens already direction-agnostic.                                                                                      |
| D25     | Docs site              | Markdown only                                  | **Add (P2)**                       | Astro Starlight at `docs-site/` deployed to `/docs`. Per-indicator MDX with KaTeX formulas + test vectors.                                                                          |
| D26     | Multi-tenancy          | None                                           | **Keep**                           | Single-user device-local. Cloud sync (v7) is per-passkey, isolated, encrypted.                                                                                                      |
| D27     | TS strictness          | strict + extras                                | **Keep + tighten**                 | Add `tsd` for public-API type tests; add `verbatimModuleSyntax`.                                                                                                                    |
| D28     | Test runner            | Vitest                                         | **Keep + extend**                  | + `vitest-axe`, `@vitest/browser` (5% of tests need real DOM).                                                                                                                      |
| D29     | Provider health        | Manual                                         | **Refine**                         | Wire existing `circuit-breaker.ts` per provider; surface in Provider Health card.                                                                                                   |
| D30     | Indicator docs         | None                                           | **Add (P2)**                       | Per-indicator MDX page (formula, defaults, references, test vectors).                                                                                                               |
| **D31** | **Code language**      | TypeScript only                                | **Reaffirm (P0)**                  | TS 5.9 stays. Reject Rust/WASM until proven hot path emerges (signals + `Float64Array` are fast enough for daily OHLC ≤ 5y). Revisit at v8 if streaming + millisecond ticks land.   |
| **D32** | **Bundler**            | Vite 8 (Rollup 4)                              | **Keep**                           | Re-evaluate **Rolldown** when stable; track but don't migrate yet.                                                                                                                  |
| **D33** | **Test runner**        | Vitest 4.1                                     | **Keep**                           | Stable, fast, native ESM, perfect coverage UI.                                                                                                                                      |
| **D34** | **Linter**             | ESLint 10 + typescript-eslint v8               | **Keep + extend**                  | Add `eslint-plugin-import-x`, `eslint-plugin-jsx-a11y` (no-op for vanilla but helps if Lit lands), and a custom `no-innerhtml-without-escape` rule.                                 |
| **D35** | **Formatter**          | Prettier                                       | **Keep**                           | Reject Biome until it matches our markdown table formatting.                                                                                                                        |
| **D36** | **Database (client)**  | IndexedDB                                      | **Keep**                           | `idb.ts` already proven; don't add Dexie.                                                                                                                                           |
| **D37** | **Database (server)**  | None                                           | **Defer to v7**                    | Cloudflare KV + R2 only. If we ever need relational queries, **D1** (Cloudflare's SQLite-on-edge) — never Postgres for this app.                                                    |
| **D38** | **CSS architecture**   | tokens + `@layer`                              | **Keep + extend**                  | Add `@property` typed custom properties for animations; container queries for cards.                                                                                                |
| **D39** | **Animation**          | None                                           | **Add (P2)**                       | View Transitions API for route changes; `core/easing.ts` already in place for JS-driven motion. Reject Motion One / GSAP.                                                           |
| **D40** | **Icons**              | None / inline SVG                              | **Keep**                           | Inline SVG sprite, tree-shakable. Reject icon-font and SVG sprites loaded via HTTP.                                                                                                 |
| **D41** | **Fonts**              | System stack                                   | **Keep**                           | No web font in v6.x. v7 may add Inter Variable subset (woff2, ~30 KB) behind a flag.                                                                                                |
| **D42** | **Markdown rendering** | None                                           | **Add (P2)**                       | Need only for docs site. Use `marked` (smallest API). Reject MDX runtime in app bundle.                                                                                             |
| **D43** | **Push notifications** | None                                           | **Defer**                          | v6.2 in-tab Notification API only. Real Web Push (VAPID) deferred to v7.0.                                                                                                          |
| **D44** | **Mobile**             | Responsive only                                | **Keep + polish (P2)**             | No native app. Add iOS PWA install prompt + Android `beforeinstallprompt`.                                                                                                          |
| **D45** | **Theming**            | dark/light/auto                                | **Extend (P2)**                    | High-contrast and color-blind palettes (`palettes.ts` already exists — wire it).                                                                                                    |
| **D46** | **Compute hot paths**  | TypeScript                                     | **Keep, watch**                    | Profile with Chrome DevTools. Only consider WASM if a single indicator > 16 ms p95 on 5y daily.                                                                                     |
| **D47** | **Data export**        | JSON + CSV                                     | **Keep**                           | Already in `core/data-export.ts`. Add schema-versioned envelope (v7).                                                                                                               |
| **D48** | **License**            | MIT                                            | **Keep**                           | Permissive maximizes adoption.                                                                                                                                                      |
| **D49** | **Distribution**       | Web only                                       | **Keep + add (P3)**                | Add Tauri 2.0 desktop wrapper as a stretch goal (no Electron).                                                                                                                      |
| **D50** | **Repo structure**     | Single repo                                    | **Keep + structure**               | Convert to npm workspaces internally: `app/`, `worker/`, `docs-site/`. Same repo.                                                                                                   |

---

## 4. Best-in-Class Comparison Table

A focused comparison against the apps users will actually compare us against.
✅✅✅ = best-in-class, ✅✅ = strong, ✅ = adequate, ⚠️ = partial, ❌ = absent.

| Capability                         | **CrossTide v6.1 (today)** |    **CrossTide v6.3 (target)**    | TradingView |     FinViz      | StockAnalysis |   Koyfin    |  thinkorswim   |  Webull   | GhostFolio  | Yahoo Finance |
| ---------------------------------- | :------------------------: | :-------------------------------: | :---------: | :-------------: | :-----------: | :---------: | :------------: | :-------: | :---------: | :-----------: |
| Cost                               |         Free / OSS         |            Free / OSS             |  Freemium   |    Freemium     |   Freemium    |    Paid     | Free (Schwab)  |   Free    | OSS / Paid  |     Free      |
| Open source                        |           ✅ MIT           |              ✅ MIT               |     ❌      |       ❌        |      ❌       |     ❌      |       ❌       |    ❌     |    AGPL     |      ❌       |
| Self-hostable                      |             ✅             |                ✅                 |     ❌      |       ❌        |      ❌       |     ❌      |       ❌       |    ❌     |  ✅ Docker  |      ❌       |
| No-account default                 |             ✅             |                ✅                 |     ⚠️      |       ✅        |      ✅       |     ❌      |       ❌       |    ❌     |     ❌      |      ⚠️       |
| Privacy (no tracking, cookieless)  |             ✅             |                ✅                 |     ❌      |       ads       |      ads      |     ❌      |     broker     |  broker   |     ✅      |      ads      |
| Real-time data                     |          ❌ poll           |           ✅ WSS opt-in           |   ✅✅✅    |      paid       |      ✅       |    ✅✅     |      ✅✅      |    ✅     |     EOD     |    delayed    |
| Candlestick + overlays             |          ❌ table          |       ✅✅ LWC + sub-panes        |   ✅✅✅    |     static      |      ✅       |    ✅✅     |      ✅✅      |    ✅     |     ❌      |      ✅       |
| Indicator count                    |            30+             |                35+                |    100+     |       50+       |      30+      |     80+     |      400+      |    50+    |      0      |      ~10      |
| **Multi-method consensus engine**  |         ✅ unique          |            ✅✅ unique            |     ❌      |       ❌        | analyst-only  |     ❌      |       ❌       |    ❌     |     ❌      |      ❌       |
| Screener                           |        ⚠️ scaffold         |        ✅ preset + custom         |     ✅      |   ✅✅✅ best   |      ✅       |     ✅      |       ✅       |    ✅     |     ❌      |     basic     |
| Sector heatmap                     |        ⚠️ scaffold         |         ✅ Canvas treemap         |     ✅      |  ✅✅✅ iconic  |      ✅       |     ✅      |       ❌       |    ❌     |     ❌      |      ❌       |
| Backtest engine                    |        ✅ headless         |    ✅✅ in-browser Worker + UI    | Pine Script |       ❌        |      ❌       |     ✅      |  thinkScript   |    ❌     |     ❌      |      ❌       |
| Portfolio + risk metrics           |        ✅ headless         | ✅✅ Sharpe / Sortino / DD / Beta |     ❌      |       ❌        |      ✅       |     ✅      |   brokerage    | brokerage | ✅✅✅ best |      ✅       |
| Benchmark vs SPY                   |        ⚠️ headless         |            ✅ overlay             |     ❌      |       ❌        |      ✅       |     ✅      |       ❌       |    ❌     |    ✅✅     |      ❌       |
| Alerts (price + indicator)         |       ✅ engine only       |         ✅ + browser push         |    ✅✅     |       ✅        |      ✅       |     ✅      |       ✅       |    ✅     |     ❌      |      ✅       |
| Drawing tools                      |             ❌             |               ⚠️ v7               |   ✅✅✅    |       ❌        |      ❌       |     ✅      |      ✅✅      |    ✅     |     ❌      |      ❌       |
| Custom signal scripting            |             ❌             |          ⚠️ v7 mini-DSL           |  ✅✅ Pine  |       ❌        |      ❌       |   partial   | ✅ thinkScript |    ❌     |     ❌      |      ❌       |
| Crypto coverage                    |             ✅             |                ✅                 |     ✅      |       ❌        |      ⚠️       |     ✅      |       ❌       |    ✅     |     ✅      |      ✅       |
| Offline / PWA                      |        ⚠️ scaffold         |  ✅✅ Workbox + Background Sync   |     ❌      |       ❌        |      ❌       |     ❌      |    desktop     |    ❌     |     ✅      |      ❌       |
| Bundle size (initial JS, gz)       |        ~120 KB est         |             < 180 KB              |    ~5 MB    | server-rendered |     ~2 MB     |    ~3 MB    |    desktop     |   ~3 MB   |   ~500 KB   |     ~4 MB     |
| Lighthouse perf                    |        not measured        |               ≥ 90                |     ~50     |       ~70       |      ~75      |     ~60     |      n/a       |    ~50    |     ~65     |      ~55      |
| Keyboard-first (`j/k`, `/`, `⌘K`)  |      ✅ helpers exist      |             ✅ wired              |     ✅      |       ❌        |      ❌       |     ✅      |       ✅       |    ❌     |     ❌      |      ❌       |
| Accessible (WCAG 2.2 AA)           |      ⚠️ helpers exist      |           ✅ axe in CI            |   partial   |       ❌        |    partial    |   partial   |       ❌       |  partial  |     ✅      |    partial    |
| Multi-provider failover            |       ✅ chain coded       |      ✅ circuit breaker live      | proprietary |   proprietary   |  proprietary  | proprietary |     broker     |  broker   |   varies    |  proprietary  |
| Per-asset deep-link share          |          ❌ hash           |     ✅ History API + OG image     |     ✅      |       ✅        |      ✅       |     ✅      |       ❌       |    ❌     |     ✅      |      ✅       |
| Cloud sync (opt-in, E2E encrypted) |             ❌             |          ⚠️ v7.0 Passkey          |   account   |     account     |    account    |   account   |   brokerage    | brokerage |   account   |    account    |
| Mobile native app                  |             ❌             |            ❌ PWA only            |     ✅      |       ✅        |      ⚠️       |     ✅      |       ✅       |    ✅     |     ❌      |      ✅       |
| Desktop app                        |             ❌             |            ⚠️ v8 Tauri            |     ✅      |       ❌        |      ❌       |     ❌      |       ✅       |    ✅     |     ⚠️      |      ❌       |
| API for users                      |             ❌             |          ⚠️ v8 read-only          |    paid     |       ❌        |      ❌       |    paid     |       ✅       |    ⚠️     |     ✅      |     paid      |

### What this comparison tells us

**Where we already win or will win in v6.3:**

- Open source + self-hostable + privacy (nobody else combines all three)
- Consensus engine (genuinely unique product feature)
- Bundle size & Lighthouse (10–25× smaller than incumbents)
- Offline + Workbox + Background Sync (only GhostFolio competes)
- Keyboard + a11y (only TradingView and Koyfin try)

**Where we must close gaps to be best-in-class:**

| Gap                                               | Source app to learn from | Our action                                               |
| ------------------------------------------------- | ------------------------ | -------------------------------------------------------- |
| Charting polish (multi-pane, smooth interactions) | TradingView              | Lightweight Charts v5 + sub-panes (A1)                   |
| Iconic sector heatmap                             | FinViz                   | Canvas treemap (A12)                                     |
| Screener depth (50+ filters, presets)             | FinViz, StockAnalysis    | Preset + custom builder (A13)                            |
| Risk dashboard                                    | GhostFolio, Koyfin       | Wire `risk-ratios.ts` + `portfolio-analytics.ts` (B2/B3) |
| Indicator breadth (toward 50)                     | thinkorswim              | Continue domain sprints, **after** Phase A               |
| Real-time depth                                   | TradingView, Finnhub     | Finnhub WSS + Durable Object fan-out (B1)                |
| Drawing tools                                     | TradingView              | v7.0 Phase D                                             |
| Pine-Script-style scripting                       | TradingView              | v7.0 mini-DSL (`signal-dsl.ts` already started)          |
| Per-PR preview deploys                            | Vercel, Cloudflare Pages | Cloudflare Pages native (A7)                             |
| OG share images                                   | TradingView, Linear      | Worker `/api/og/:symbol.png` (B7)                        |

---

## 5. Best Practices Harvested

| Practice                                            | Harvested from                   | CrossTide application                                       |
| --------------------------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| Treemap heatmap colored by % change                 | FinViz, TradingView              | Canvas treemap card; click → chart route                    |
| Multi-pane chart (price + sub-indicators)           | TradingView, Koyfin              | Lightweight Charts + `chart-panels` wrapper                 |
| Drawing tools plugin                                | TradingView                      | `lightweight-charts-drawing` (Phase D)                      |
| Pine-Script-style signals                           | TradingView                      | JSON-AST mini-DSL → Web Worker                              |
| 52-week range progress bar                          | StockAnalysis, Webull            | Watchlist column (A11)                                      |
| Sparklines in tables                                | FinViz, Robinhood                | SVG path per row (already in `ui/sparkline.ts`)             |
| Risk dashboard (Sharpe / Sortino / DD / Beta)       | GhostFolio, Koyfin               | Wire `risk-ratios.ts` (B3)                                  |
| Benchmark comparison (vs SPY)                       | GhostFolio                       | Portfolio overlay (B2)                                      |
| Dividend projection                                 | StockAnalysis, Webull            | Phase C stretch                                             |
| Preset screeners (oversold, breakout, golden cross) | FinViz                           | `cards/preset-filters.ts` activation (A13)                  |
| Keyboard nav (`j/k`, `/`, `g h`)                    | TradingView, GitHub, Linear      | `core/keyboard.ts` activation (A10)                         |
| Command palette (`⌘K`)                              | Linear, Raycast, GitHub, VS Code | `ui/command-palette.ts` activation (A10)                    |
| Stale-while-revalidate caching                      | Workbox, SWR                     | App SW + tiered cache (A6)                                  |
| Stale-data badge                                    | Robinhood                        | `cards/watchlist-card.ts` `(stale 12s)` chip                |
| Optimistic UI on add/remove                         | Linear, Notion                   | Use signals + rollback on error (`core/optimistic.ts`)      |
| Cookieless analytics                                | Plausible, Fathom                | Self-host Plausible (A17)                                   |
| Passkey auth (no passwords)                         | Apple, GitHub, Cloudflare        | v7.0 cloud sync (D1)                                        |
| Background Sync for queued mutations                | Workbox                          | Already in `core/sync-queue.ts` — wire SW glue              |
| OG image per share URL                              | TradingView, Linear              | Worker `/api/og/:symbol.png` (B7)                           |
| Per-PR preview deploys                              | Vercel, Cloudflare Pages         | CF Pages native (A7)                                        |
| Changesets-driven releases                          | npm OSS norm                     | Adopt v6.2 (A18)                                            |
| Lazy route chunks                                   | Next.js, Remix                   | Per-card `import()` in registry (A2)                        |
| View Transitions API                                | Astro, Chrome                    | Route animations (C5)                                       |
| Container queries                                   | Chrome, Safari 16+               | Card layout (`core/container-query.ts`)                     |
| Schema-versioned IDB                                | Workbox, Dexie examples          | `idb-migrations.ts` already exists — exercise it everywhere |
| Per-symbol Durable Object                           | Cloudflare WS reference          | WS fan-out (B1)                                             |
| Edge KV hot quote cache                             | Cloudflare KV                    | Worker `/api/quote/:symbol` (A8)                            |

---

## 6. Target Architecture (v6.2+)

### 6.1 Topology

```text
┌─────────────────────────────────────────────────────────────────────┐
│                            Browser (PWA)                            │
│                                                                     │
│   index.html → main.ts                                              │
│        │                                                            │
│        ├── Router (History API)        ──→ lazy import card        │
│        ├── Signals store (signals.ts)  ──→ persisted via IDB+LS    │
│        ├── Worker (compute.worker)     ──→ backtest, scan, screener│
│        └── Service Worker (Workbox)    ──→ precache + SWR + sync   │
└──────────┬──────────────────────────────────────────────────────────┘
           │ HTTPS + WSS  (Origin-locked, CSP-strict)
┌──────────┴──────────────────────────────────────────────────────────┐
│  Cloudflare Pages (static SPA)                                      │
│  + Pages Functions / Workers (API)                                  │
│      ├─ /api/health               status + provider health          │
│      ├─ /api/quote/:symbol        spot quote (KV 60s)               │
│      ├─ /api/history/:symbol      OHLCV (KV 24h, R2 cold)           │
│      ├─ /api/search?q=            symbol autocomplete (KV 1h)       │
│      ├─ /api/og/:symbol.png       OG image (edge cache 1h)          │
│      ├─ /api/errors               sampled error ingest              │
│      └─ /api/stream  (WSS)        Durable Object per symbol         │
└──────────┬──────────────────────────────────────────────────────────┘
           │
   ┌───────┼───────┬─────────────┬─────────────┬───────────────┐
   ▼       ▼       ▼             ▼             ▼               ▼
 Yahoo  Finnhub  Alpha V.     Polygon       CoinGecko        Stooq
 (free) (free)   (free)       (paid)        (free crypto)    (free EOD)
```

### 6.2 Layered code structure (target)

```text
app/                            (was src/)
  types/                        domain.ts, api.ts, branded.ts, schemas.ts (Valibot)
  domain/                       pure functions, no I/O, no DOM           ─ stable
  core/
    signals.ts                  signal/computed/effect (Preact Signals re-export)
    cache/
      memory.ts                 L1 Map
      idb.ts                    L3 IndexedDB + LRU (lru-cache.ts wired)
      tiered.ts                 L1+L2+L3 facade
    fetch.ts                    circuit-breaker-aware fetch
    workers/
      compute.worker.ts         backtest, scan, full-history calc
      compute.client.ts         worker-rpc.ts wrapper
    sw/                         Workbox config + runtime strategies
    config/                     schema (Valibot), migrations
    keyboard.ts                 command palette + j/k
    a11y.ts                     focus traps, sr-only helpers, ARIA live
  providers/
    types.ts                    MarketDataProvider + Valibot schemas
    yahoo, finnhub, alpha-vantage, polygon, coingecko, stooq
    chain.ts                    circuit breaker + health
  cards/
    <feature>/                  index.ts (mount), styles.css, *.test.ts
  ui/
    router.ts                   History API, route → card mapping
    theme.ts, toast.ts, modal.ts, command-palette.ts
  styles/                       tokens, base, layout, components, a11y
worker/                         Cloudflare Pages Functions / Workers
docs-site/                      Astro Starlight (separate workspace pkg)
tests/
  unit/
  e2e/                          Playwright + axe
  fixtures/
```

### 6.3 Dependency rules (enforced by ESLint `import/no-restricted-paths`)

```text
types/      ← nothing
domain/     ← types/                     (no DOM, no I/O)
core/       ← types/, domain/            (no UI)
providers/  ← types/, core/
cards/      ← types/, domain/, core/, providers/, ui/
ui/         ← types/, core/
worker/     ← independent (own tsconfig)
docs-site/  ← independent (own tsconfig)
```

Boundary violations fail CI.

---

## 7. Frontend Strategy

### 7.1 Rendering model

- **Default:** Vanilla TS + `@preact/signals-core`. Cards declare a `mount(host, signals)` and a `dispose()`. `effect()` reactively binds DOM.
- **Promote to Lit only when justified:** chart toolbar, screener filter chip group, command palette. Each promotion needs a one-page rationale in the PR.
- **No JSX runtime in the bundle.** Lit uses tagged templates; vanilla cards use `el.textContent = …` with `escapeHtml` enforcement.

### 7.2 Routing

- History API. Routes (final list):

```text
/                            → dashboard (default cards)
/watchlist                   → watchlist card focused
/chart/:symbol               → chart + panels
/screener                    → screener card
/portfolio                   → portfolio card
/backtest/:symbol            → backtest UI
/alerts                      → alerts card + history
/settings                    → settings card
/about                       → static about
```

- Cloudflare Pages SPA fallback handles refresh on any path. GH Pages mirror gets `404.html` redirect trick.
- Per-route lazy `import()` of card module; preload on hover/focus.

### 7.3 State

- `signal<T>(initial)` is the only state primitive.
- `persistedSignal('key', initial, { storage: 'idb' | 'local' })` for durable state.
- `BroadcastChannel` for cross-tab sync (`broadcast-channel.ts` to be added in A4 — small).
- No global mutable singletons except the registry of signals.

### 7.4 Charting

- `lightweight-charts@^5` dynamic import only on `/chart/*` route.
- Sub-panes for RSI, MACD, Stochastic, ADX, Klinger, Choppiness. All wired to existing domain calculators.
- Signal markers driven by `consensus-engine`.
- Saved chart state (overlays, range) persisted per symbol in IDB.

### 7.5 Accessibility

- Skip-link, landmark roles, `:focus-visible` rings.
- All interactive cards keyboard-reachable; `role="application"` on charts only.
- `prefers-reduced-motion`, `prefers-contrast`, forced-colors mode honored.
- WCAG 2.2 AA gated by axe in CI.
- Live announcer (`announceLive`) used on add/remove/error.

### 7.6 Theming

- `data-theme="dark|light|auto"` + system preference.
- High-contrast, deuteranopia, protanopia palettes (Phase C).
- `view-transition-name` on route container for smooth switches.

### 7.7 Internationalization (Phase C)

- `@formatjs/intl` + ICU.
- `dir="rtl"` for Hebrew; tokens already direction-agnostic.
- Date/number formatting via `Intl.*` (already in `core/date-format.ts`, `ui/date-format.ts`, `ui/number-format.ts`, `core/timezone.ts`).

---

## 8. Backend, Data & Infrastructure Strategy

### 8.1 API surface (Cloudflare Pages Functions)

| Route                                       | Method  | Purpose                      | Cache                   |
| ------------------------------------------- | ------- | ---------------------------- | ----------------------- |
| `/api/health`                               | GET     | Status + provider health     | none                    |
| `/api/quote/:symbol`                        | GET     | Spot quote                   | KV 60s open / 5m closed |
| `/api/history/:symbol?range=1y&interval=1d` | GET     | Daily OHLCV                  | KV 24h, R2 cold         |
| `/api/search?q=`                            | GET     | Symbol autocomplete          | KV 1h                   |
| `/api/og/:symbol.png`                       | GET     | OG image (mini chart)        | edge 1h                 |
| `/api/stream`                               | WSS     | Live quotes (Durable Object) | n/a                     |
| `/api/errors`                               | POST    | Sampled error ingestion      | none                    |
| `/api/sync`                                 | GET/PUT | Encrypted user blob (v7)     | n/a                     |

### 8.2 Provider chain

```text
quote:    Yahoo → Finnhub → Alpha Vantage   (circuit breaker per provider)
history:  Yahoo → Stooq → Finnhub → Polygon
search:   Yahoo → Finnhub
crypto:   CoinGecko (only)
stream:   Finnhub WSS → Polygon WSS         (auth headers in Worker only)
```

### 8.3 Circuit breaker

- States: `closed` (normal), `open` (skip provider 60 s), `half-open` (one probe).
- Per-provider counters in Worker memory + KV (mirrored).
- Surfaced via `/api/health` and Provider Health card.
- Already implemented in `core/circuit-breaker.ts`; needs wiring at the chain boundary.

### 8.4 Secrets

- All API keys are **Worker env vars only**. No keys in browser, no keys in repo.
- `wrangler secret put` for production; `.dev.vars` (gitignored) for local.
- Repo-level guard: pre-commit hook runs `git diff --staged | rg -q '(api[_-]?key|token).*=.*[A-Za-z0-9]{20,}'` and aborts on hit.

### 8.5 Rate limits & abuse

- Per-IP token bucket (`core/token-bucket.ts` already implemented; wire KV-backed variant in Worker) at 60 req/min per route.
- Reject requests without a known `Origin` in production.
- Daily budget alarm via Cloudflare Analytics.

### 8.6 Infrastructure summary

| Layer          | Tech                                 | Why                                            |
| -------------- | ------------------------------------ | ---------------------------------------------- |
| Static hosting | Cloudflare Pages                     | Free, SPA fallback, preview deploys, edge POPs |
| Edge runtime   | Cloudflare Workers (Pages Functions) | Same vendor, same deploy, V8 isolates          |
| Cold storage   | Cloudflare R2 (S3-compatible)        | $0 egress, free tier 10 GB                     |
| Hot KV         | Cloudflare KV                        | Free tier 100K ops/day                         |
| Streaming      | Cloudflare Durable Objects (WS)      | Per-symbol consistent fan-out                  |
| DNS / TLS      | Cloudflare (free tier)               | Same vendor                                    |
| Mirror         | GitHub Pages                         | Redundancy if Cloudflare degrades              |
| CI             | GitHub Actions                       | Free for public repos                          |
| Error tracking | Self-hosted GlitchTip on Fly.io      | $0/mo personal hobby tier                      |
| Analytics      | Self-hosted Plausible on Fly.io      | $0/mo personal tier                            |
| Status page    | Self-hosted Uptime Kuma              | $0/mo personal tier                            |

**Total infrastructure cost target: $0/mo for personal use.** First paid line if/when Polygon API key is needed (~$29/mo).

---

## 9. Storage, Sync & Offline Strategy

### 9.1 Tiers (refined)

| Tier        | Tech                                          | Use                                   | TTL / Cap         |
| ----------- | --------------------------------------------- | ------------------------------------- | ----------------- |
| L1          | `Map` (`core/cache.ts`)                       | Hot quotes, computed series           | session           |
| L2          | `localStorage`                                | Config, theme, last route             | persistent, ~5 MB |
| L3          | IndexedDB (`core/idb.ts` + `tiered-cache.ts`) | Candles, alerts, portfolio, snapshots | LRU 50 MB         |
| L4          | Service Worker Cache API                      | App shell + API responses (SWR)       | per-strategy      |
| Edge        | Cloudflare KV / R2                            | Hot quotes / cold history             | TTL / cold        |
| Cloud (opt) | Worker + KV (v7)                              | Per-passkey-user encrypted blobs      | per-user          |

### 9.2 Storage pressure

- `navigator.storage.estimate()` polled hourly (`storage-pressure.ts` already exists — wire it).
- Warn at 80%, evict L3 LRU, offer one-tap clear.
- `navigator.storage.persist()` requested after first opt-in action.

### 9.3 Schema versioning

- IDB version migrations declared in `core/idb-migrations.ts`. Every store has a numbered version.
- Config schema validated by Valibot; migrations declared per version bump.
- Export envelope: `{ schema: 'crosstide.export', version: 3, exportedAt, payload }`. Import refuses unknown versions older than current minus 2.

### 9.4 Cloud sync (v7.0, optional)

- Passkeys → opaque user id → Worker stores **encrypted** blob in KV.
- Client-side encryption with key derived from a user-chosen pass-phrase (Argon2id via WASM, or HKDF over WebAuthn challenge response).
- Server never sees plaintext watchlist/portfolio.
- Conflict strategy: last-writer-wins per top-level key, with vector clock for portfolio (CRDT-ish but not a full CRDT — too heavy for v7).

---

## 10. Quality, Security & Observability

### 10.1 CI gates (every required for merge)

```text
typecheck            tsc --noEmit (strict + noUncheckedIndexedAccess)
lint                 eslint . --max-warnings 0
lint:css             stylelint
lint:html            htmlhint
lint:md              markdownlint-cli2
test                 vitest run --coverage  (≥90% statements, ≥80% branches)
test:e2e             playwright (10 flows)
a11y                 axe in E2E (0 serious/critical)
build                vite build
bundle               check-bundle-size.mjs (<180 KB gz initial)
lighthouse           lhci autorun (perf ≥90, a11y ≥95, best ≥95, SEO ≥90)
audit                npm audit --omit=dev (no high/critical) + audit-signatures
audit:supply         socket.dev PR check
secret-scan          gitleaks
```

### 10.2 Security

- **CSP** via Worker headers, built by existing `core/csp-builder.ts`:
  `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://api.crosstide.dev wss://api.crosstide.dev; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'`.
- **SRI** on every third-party asset (target: zero third-party assets).
- **Permissions-Policy:** `camera=(), microphone=(), geolocation=(), payment=()`.
- **Subresource hashes** verified in CI (`core/sri.ts` already built).
- **Valibot validation** on every external input (provider responses, URL params, imported JSON).
- **`escapeHtml` enforced** via custom ESLint rule — no `innerHTML` without it.
- **Dependabot weekly** + manual review for major bumps.
- **`gitleaks`** in pre-commit and CI.

### 10.3 Observability

- **Errors:** GlitchTip (self-hosted, Sentry-compatible), 25% sampled, scrubbed, no PII.
- **Analytics:** Plausible (cookieless). Route changes, card mounts, uncaught error counts.
- **RUM:** `core/web-vitals.ts` reported to Plausible custom events.
- **Server-side:** Cloudflare Analytics + structured `console.log` → Logpush → R2.
- **Status page:** Uptime Kuma probing `/api/health` every minute.

---

## 11. Performance Budget

| Asset                     | Budget          | Gate                  |
| ------------------------- | --------------- | --------------------- |
| HTML                      | < 8 KB          | LH CI                 |
| CSS                       | < 30 KB gz      | bundle check          |
| JS initial                | < 180 KB gz     | `check:bundle`        |
| Lazy card chunk           | < 50 KB gz each | per-route             |
| Lightweight Charts chunk  | ~40 KB gz       | dynamic import        |
| Web Worker bundle         | < 60 KB gz      | per file              |
| Fonts (subset, woff2)     | < 80 KB         | self-hosted, optional |
| **Initial total**         | **< 200 KB gz** | CI                    |
| LCP (4G, mid Android)     | < 1.8 s         | LH CI                 |
| INP (p75)                 | < 200 ms        | LH CI                 |
| CLS                       | < 0.05          | LH CI                 |
| TTI                       | < 2.5 s         | LH CI                 |
| Lighthouse perf score     | ≥ 90            | LH CI                 |
| Lighthouse a11y           | ≥ 95            | LH CI                 |
| Lighthouse best practices | ≥ 95            | LH CI                 |
| Lighthouse SEO            | ≥ 90            | LH CI                 |

Tooling: `rollup-plugin-visualizer` artifact uploaded per PR.

---

## 12. Documentation Strategy

A best-in-class app has best-in-class docs. We currently have:

| Doc                                    | Status           | Target                                           |
| -------------------------------------- | ---------------- | ------------------------------------------------ |
| `README.md`                            | ✅ Good          | Keep, refresh badges per release                 |
| `CHANGELOG.md`                         | ✅ Per-RC        | Keep, automate via Changesets (A18)              |
| `ARCHITECTURE.md`                      | ⚠️ Out of date   | **Rewrite (P1)** to match v6.2 layered structure |
| `CONTRIBUTING.md`                      | ✅ Good          | Add "card author guide" appendix                 |
| `CODE_OF_CONDUCT.md`, `SECURITY.md`    | ✅ Standard      | Keep                                             |
| `docs/COPILOT_GUIDE.md`                | ✅ Unique        | Keep, refresh quarterly                          |
| `docs/ROADMAP.md`                      | ✅ This document | Refresh per phase                                |
| **Per-indicator reference**            | ❌ Missing       | **Add** in Astro Starlight (C3/C4)               |
| **API reference** (provider contracts) | ❌ Missing       | Add MDX in docs site                             |
| **User guide** (how to use the app)    | ❌ Missing       | Add 5 short MDX pages                            |
| **Architecture diagrams**              | ⚠️ ASCII only    | Add Mermaid diagrams where helpful               |
| **JSDoc on public exports**            | ⚠️ Partial       | Sweep in v6.2                                    |
| **Playwright recordings**              | ❌ Missing       | Capture on first E2E pass                        |

**Doc rules:**

- Every domain module has a top-of-file JSDoc with formula, defaults, references.
- Every public function has a one-sentence JSDoc.
- README badges: build, coverage, version, license, bundle-size.
- Per-indicator MDX page: formula (KaTeX), default params, rationale, references, **test vector**.
- No Markdown file > 1000 lines without splitting.

---

## 13. Developer Experience

| Area            | Decision                                                               |
| --------------- | ---------------------------------------------------------------------- |
| Package manager | npm (shared `MyScripts/node_modules`) — keep                           |
| Workspaces      | Convert to npm workspaces: `app/`, `worker/`, `docs-site/`             |
| Git hooks       | `simple-git-hooks` + `lint-staged` (no Husky bloat)                    |
| Commit style    | Conventional Commits, enforced by `commitlint` (start v6.2)            |
| Releases        | **Changesets** auto-generated CHANGELOG + version bump PR (start v6.2) |
| PR previews     | Cloudflare Pages auto preview per branch                               |
| Local Worker    | `wrangler dev` proxied through Vite (`server.proxy`)                   |
| Mock data       | `tests/fixtures/` realistic OHLC fixtures                              |
| Component dev   | `dev/components.html` mounting every card with mock signals            |
| Editor          | `.vscode/settings.json` shared in repo                                 |
| Docs preview    | `npm -w docs-site run dev`                                             |

**Sprint cadence (continued from rc.11):**

- Per-sprint commit. Per-RC tag + GitHub prerelease.
- One sprint = one cohesive change with passing CI.
- 10 sprints per RC was sustainable; **drop to 5 sprints per RC for v6.2** because each sprint is now a _product activation_ (heavier, riskier) rather than a _library module_ (light, isolated).

---

## 14. External Sources, APIs & Vendor Strategy

### 14.1 Data providers

| Provider                      | Free tier             | Use                      | Risk                  | Mitigation                               |
| ----------------------------- | --------------------- | ------------------------ | --------------------- | ---------------------------------------- |
| Yahoo Finance v8 (unofficial) | unlimited best-effort | Primary quote/history    | Can break unannounced | Circuit breaker, fall-through to Finnhub |
| Finnhub                       | 60/min + WSS          | Secondary, streaming     | Free tier limits      | Per-IP token bucket                      |
| Alpha Vantage                 | 25/day                | Tertiary fallback        | Slow                  | Daily-only, last resort                  |
| Polygon                       | $29/mo basic          | Paid escape hatch        | Cost                  | Only if user provides key                |
| CoinGecko                     | 50/min                | Crypto only              | Schema changes        | Valibot validation                       |
| Stooq                         | unlimited EOD CSV     | Historical bulk fallback | EOD only              | Use for >1y history only                 |

### 14.2 Vendor lock-in risk audit

| Vendor                                  | Lock-in risk        | Mitigation                                                                                                                          |
| --------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare (Pages, Workers, KV, R2, DO) | High (entire infra) | Worker code is portable: `Hono` framework + `@cloudflare/workers-types` adapter. Could move to Deno Deploy or Bun + S3 in 1 sprint. |
| GitHub (repo, Actions, Pages mirror)    | Medium              | Mirror to GitLab on tag push. Actions are standard YAML.                                                                            |
| Lightweight Charts (TradingView OSS)    | Low                 | MIT, embeddable; replaceable with `uPlot` if needed.                                                                                |
| Preact Signals                          | Low                 | 1.4 KB, replaceable with Solid signals or hand-rolled.                                                                              |
| Fly.io (GlitchTip + Plausible host)     | Low                 | Both Dockerized; portable to any container host.                                                                                    |
| Self-hosted GlitchTip / Plausible       | Low (we run them)   | n/a                                                                                                                                 |

### 14.3 Third-party JS in the bundle (target final state)

| Lib                                  | Size (gz)      | Why                          | Lazy?                  |
| ------------------------------------ | -------------- | ---------------------------- | ---------------------- |
| `@preact/signals-core`               | 1.4 KB         | State primitive              | No (used everywhere)   |
| `lightweight-charts`                 | ~40 KB         | Charts                       | Yes (`/chart/*` only)  |
| `valibot`                            | ~3 KB          | Schema validation            | No                     |
| `comlink`                            | ~1 KB          | Worker RPC ergonomic wrapper | No                     |
| `workbox-*` (build only)             | runtime ~10 KB | Service worker               | Yes (SW only)          |
| `@formatjs/intl` (Phase C)           | ~12 KB         | i18n                         | Yes (per-locale chunk) |
| **Total runtime (initial)**          | **~16 KB gz**  |                              |                        |
| **Total runtime (worst-case route)** | **~70 KB gz**  |                              |                        |

Everything else is hand-written or zero-dep.

---

## 15. Phased Roadmap

### Phase A — v6.2 _Activation_ (the central pivot)

**Theme:** wire the library into a product. Stop adding library modules until every existing card mounts, charts work, the Worker is deployed, and CI runs Lighthouse + Playwright.

**Sprint cadence:** 5 sprints per RC. Each RC ends with a green Lighthouse run.

| #   | Task                                                                                                                                                                    | Priority | Notes                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | --------------------------------------- |
| A1  | Add `lightweight-charts@^5`, integrate in `cards/chart.ts` (multi-pane, signal markers, sub-indicators wired to existing domain calcs)                                  |    P0    | Largest single win                      |
| A2  | Wire `card-registry` in `main.ts` with lazy `import()` per route                                                                                                        |    P0    | Activates 15+ existing cards            |
| A3  | Replace hash router with History API + 404 fallback for static-host mirror                                                                                              |    P0    | Existing `ui/router.ts` rewrite         |
| A4  | Replace `core/state.ts` with `signals.ts`-only API; migrate cards; delete `state.ts`                                                                                    |    P0    | One source of truth                     |
| A5  | Move backtest + full-history scan into Web Worker via existing `worker-rpc.ts`                                                                                          |    P0    | Existing `compute-worker.ts` activation |
| A6  | Workbox SW: precache + runtime caching (NetworkFirst for `/api/*`, StaleWhileRevalidate for assets) + Background Sync (wires `core/sync-queue.ts`) + Navigation Preload |    P1    | Replaces hand-rolled `sw.ts`            |
| A7  | Deploy Worker to Cloudflare; switch deploy target to Cloudflare Pages with preview-per-PR                                                                               |    P0    | Requires Cloudflare account + DNS       |
| A8  | Add Finnhub provider + circuit-breaker activation + Provider Health card surfacing                                                                                      |    P0    | ✅ Done (v7.4.0)                        |
| A9  | Adopt **Valibot** schemas at every provider boundary; brand `Ticker`/`ISODate`/`Price` everywhere (already in `branded.ts`)                                             |    P0    | Replace any leftover `as` casts         |
| A10 | Activate command palette (`⌘K`) + finish keyboard shortcuts (`j/k`, `/`, `g h`) — wires existing `ui/command-palette.ts` + `core/keyboard.ts`                           |    P0    | ✅ Done (v7.3.0)                        |
| A11 | Watchlist polish: sparkline, 52W range, volume vs avg, sort, drag reorder — wires existing `ui/sparkline.ts` + `ui/sortable.ts` + `ui/reorder.ts`                       |    P0    | ✅ Done (v7.4.0)                        |
| A12 | Heatmap card activation (existing `cards/heatmap.ts` + `core/treemap-layout.ts`)                                                                                        |    P1    | ✅ Done (v7.4.0)                        |
| A13 | Screener card activation: preset filters (oversold, breakout, golden cross) + custom builder                                                                            |    P1    | ✅ Done (v7.4.0)                        |
| A14 | Alert history card activation + browser Notifications API permission flow (in-tab; Web Push deferred to v7)                                                             |    P1    | ✅ Done (v7.4.0)                        |
| A15 | **Playwright** E2E for 10 flows + `@axe-core/playwright`                                                                                                                |    P0    | Add `tests/e2e/`                        |
| A16 | **Lighthouse CI** (`lhci autorun`) + budgets file                                                                                                                       |    P0    |                                         |
| A17 | Self-host GlitchTip + Plausible on Fly.io; integrate sampled error/analytics ingestion                                                                                  |    P1    |                                         |
| A18 | Adopt **Changesets** + `commitlint` Conventional Commits                                                                                                                |    P1    | ✅ Done (v7.2.0)                        |
| A19 | Component preview page `dev/components.html` mounting every card with mock signals                                                                                      |    P1    | ✅ Done (v7.3.0)                        |
| A20 | CSP, Permissions-Policy, security headers via Worker (wires existing `csp-builder.ts`)                                                                                  |    P0    | ✅ Done (v7.2.0)                        |
| A21 | Storage pressure handling + LRU eviction in IDB (wires existing `lru-cache.ts` + `storage-pressure.ts`)                                                                 |    P1    | ✅ Done (v7.2.0)                        |
| A22 | Rewrite `ARCHITECTURE.md` to match v6.2 reality                                                                                                                         |    P1    | ✅ Done (v7.2.0)                        |

**Exit criteria for v6.2:**

- Every card in `src/cards/` mounts via the registry.
- Charts render with Lightweight Charts and signal markers.
- Worker is deployed; provider chain works end-to-end against real APIs.
- 10 Playwright flows pass; axe finds zero serious/critical issues.
- Lighthouse: perf ≥ 90, a11y ≥ 95, best ≥ 95, SEO ≥ 90.
- Bundle ≤ 180 KB gz initial.

### Phase B — v6.3 _Streaming, Portfolio & Polish_

| #   | Task                                                                                                 | Priority | Notes                                                 |
| --- | ---------------------------------------------------------------------------------------------------- | :------: | ----------------------------------------------------- |
| B1  | WebSocket streaming via Finnhub (Durable Object fan-out)                                             |    P1    |                                                       |
| B2  | Portfolio card: holdings, P/L, sector allocation (wires `portfolio-analytics.ts`), benchmark vs SPY  |    P1    | ✅ Done (v7.4.0)                                      |
| B3  | Risk metrics card: Sharpe, Sortino, max DD, beta, volatility (wires `risk-ratios.ts`)                |    P1    | ✅ Done (v7.4.0)                                      |
| B4  | Backtest UI on top of existing engine (equity curve via `equity-curve.ts` + perf table)              |    P1    | ✅ Done (v7.4.0)                                      |
| B5  | Provider Health card from circuit-breaker stats                                                      |    P2    | ✅ Done (v7.4.0)                                      |
| B6  | Consensus history timeline (wires `cards/consensus-timeline.ts`)                                     |    P2    | ✅ Done (v7.4.0)                                      |
| B7  | OG image rendering (`/api/og/:symbol.png`)                                                           |    P2    |                                                       |
| B8  | Polygon provider (paid escape hatch)                                                                 |    P2    |                                                       |
| B9  | Synced crosshair across multi-pane chart                                                             |    P2    | ✅ Done (v7.3.0)                                      |
| B10 | URL state encoder/decoder activation (wires `share-state.ts`)                                        |    P2    | ✅ Done (v7.2.0)                                      |
| B11 | Cross-tab sync via BroadcastChannel                                                                  |    P2    | ✅ Done (v7.2.0)                                      |
| B12 | **Instrument-type views — Stocks / ETFs / Crypto** (see detail below)                                |    P1    | ✅ Done (v7.3.0); Requested by user                   |
| B13 | **Sector grouping** - collapsible sector rows with per-sector consensus aggregate (see detail below) |    P1    | ✅ Done (v7.3.0); Requested by user                   |
| B14 | **Universal sortable column headers** across all data tables (see detail below)                      |    P1    | ✅ Done (v7.3.0); Requested by user; extends A11 sort |

#### B12 — Instrument-type views (Stocks / ETFs / Crypto)

Auto-classify each watchlist entry using the `quoteType` field returned by Yahoo Finance
(`EQUITY` → Stock, `ETF` → ETF, `CRYPTOCURRENCY` → Crypto, unknown → Other).
Add a filter-chip bar above the watchlist table (`All / Stocks / ETFs / Crypto`) that
instantly filters rows without re-fetching. Store the user's last-selected tab in
`localStorage`. Manual override: right-click (or long-press) a ticker to force-assign a
type. Extend `WatchlistEntry` in the config schema and persist overrides in IDB.
Type badges appear in the ticker cell (a small coloured chip).

#### B13 — Sector grouping in the watchlist

Resolve GICS sector for each equity from Yahoo Finance `sector` field in the chart
`meta` object. Group watchlist rows under collapsible `<tr class="sector-header">` rows
per sector (Technology, Healthcare, Financials, …). Each sector header shows: sector
name, row count, and an aggregated mini-consensus badge (% BUY across holdings in that
sector). Sector headers sort alphabetically; tickers within a sector respect the current
sort column. Collapsed/expanded state is persisted per sector in `localStorage`. ETFs
and Crypto fall into `— ETFs —` / `— Crypto —` group rows at the bottom.

#### B14 — Universal sortable column headers

Every `<table>` in the app (watchlist, screener, portfolio holdings, backtest results,
alert history) must have fully interactive `<th>` headers with:

- `aria-sort="ascending | descending | none"` attribute kept in sync
- Visual sort-indicator chevron (▲ / ▼) in the header cell
- Keyboard activation (Enter / Space on focused header)
- Screen-reader announcement of new sort order via the existing `announceLive` helper
- Sort state persisted per-table key in `localStorage`

Extends and standardises the existing `ui/sortable.ts` utility — no per-card
reimplementation allowed. Covers both numeric and string columns with locale-aware
`Intl.Collator` comparison.

### Phase C — v6.4 _Reach, Polish, A11y+_

| #   | Task                                                                |     Priority     |
| --- | ------------------------------------------------------------------- | :--------------: | ---------------- |
| C1  | i18n (English + Hebrew RTL) via `@formatjs/intl`                    |        P2        | ✅ Done (v7.5.0) |
| C2  | High-contrast & color-blind palettes (wires `palettes.ts`)          |        P2        | ✅ Done (v7.3.0) |
| C3  | Astro Starlight docs site at `/docs`                                |        P2        |
| C4  | Per-indicator MDX reference (formula + defaults + tests)            |     ✅ Done      |
| C5  | Mobile-first layout pass + container queries + View Transitions API |        P2        |
| C6  | Dividend projection in Portfolio                                    |        P3        |
| C7  | CSV/JSON full-data export with schema-versioned envelope            | ✅ Done (v7.2.0) |
| C8  | iOS PWA install prompt + Android `beforeinstallprompt` UX           |        P3        |
| C9  | Onboarding tour (3 steps, dismissible, persisted)                   | ✅ Done (v7.2.0) |

### Phase D — v7.0 _Optional Cloud + Power Tools_

| #   | Task                                                                           | Priority |
| --- | ------------------------------------------------------------------------------ | :------: | ---------------- |
| D1  | Passkey auth (WebAuthn) + opt-in cloud sync (E2E encrypted, KV-backed)         |    P3    |
| D2  | Multi-chart layout (2×2, 1+3) with synced crosshair                            |    P3    |
| D3  | Drawing tools (trendline, fib retracement, channel)                            |    P3    |
| D4  | Custom-signal mini-DSL (JSON-AST → Web Worker) — activation of `signal-dsl.ts` |    P3    |
| D5  | Shared watchlist URLs (read-only encoded state)                                |    P3    | ✅ Done (v7.5.0) |
| D6  | Native Web Push via VAPID for price/indicator alerts                           |    P3    |
| D7  | ICU-lite message formatter (full ICU for v6.4 may be overkill)                 |    P4    |
| D8  | Optional Supabase or Cloudflare D1 backend for multi-device families           |    P4    |

### Phase E — v8.0 _Stretch_ (everything beyond is wishlist)

| #   | Task                                                               | Priority |
| --- | ------------------------------------------------------------------ | :------: |
| E1  | Tauri 2.0 desktop wrapper (Win/Mac/Linux)                          |    P4    |
| E2  | Read-only public REST API (rate-limited)                           | ✅ Done  |
| E3  | Public "research notes" pages (per-symbol blog, optional)          |    P5    |
| E4  | Optional WASM hot-path for tick-level streaming compute            |    P4    |
| E5  | Native iOS/Android via Capacitor (only if PWA proves insufficient) |    P5    |

---

## 16. Outstanding Work Consolidated

**From prior sprint backlogs (the legacy `Sprint 41–50` todos):**

| Legacy item                                 | Status                              | Mapped to        |
| ------------------------------------------- | ----------------------------------- | ---------------- |
| Sprint 41: URL state encoder/decoder        | ✅ Built (`share-state.ts`)         | B10 (activation) |
| Sprint 42: CSP header builder               | ✅ Built (`csp-builder.ts`)         | A20 (activation) |
| Sprint 43: SRI/integrity hash helper        | ✅ Built (`sri.ts`)                 | A20 (activation) |
| Sprint 44: Notifications permission wrapper | ✅ Built (`notifications.ts`)       | A14 (activation) |
| Sprint 45: Background sync queue (IDB)      | ✅ Built (`sync-queue.ts`)          | A6 (SW glue)     |
| Sprint 46: Token bucket rate limiter        | ✅ Built (`token-bucket.ts`)        | A8 (Worker side) |
| Sprint 47: ICU-lite message formatter       | ⚠️ Partial                          | C1 / D7          |
| Sprint 48: Synced crosshair state           | ⚠️ Pending                          | B9               |
| Sprint 49: Portfolio sector allocation      | ✅ Built (`portfolio-analytics.ts`) | B2 (activation)  |
| Sprint 50: Equity curve from trades         | ✅ Built (`equity-curve.ts`)        | B4 (activation)  |

**Conclusion:** the legacy todo list is overwhelmingly _built but unwired_. v6.2 (Phase A) is mostly an integration sprint, not a build sprint.

**v7.1.0 sprint session (10 sprints):**

| Sprint | Item                                                                           | Status |
| ------ | ------------------------------------------------------------------------------ | ------ |
| 1      | E2: Cloudflare Worker API (5 endpoints, 34 tests)                              | ✅     |
| 2      | C4: 8 indicator MDX docs (ATR, VWAP, EMA/SMA, CCI, Williams%R, OBV, Aroon, AO) | ✅     |
| 3      | User guide MDX pages (Watchlist, Charts, Portfolio)                            | ✅     |
| 4      | D7: RTL locale wiring (`setLocale`, `getTextDirection`, `initLocale`)          | ✅     |
| 5      | Coverage: web-vitals (21 tests) + telemetry (20 tests)                         | ✅     |
| 6      | Coverage: analytics-client (15 tests) + deep-clone (21 tests)                  | ✅     |
| 7      | R7: Registry — mock all 14 cards + retry-on-failure test                       | ✅     |
| 8      | R13: Domain API type-level tests (20 `expectTypeOf` assertions)                | ✅     |
| 9      | R6: JSDoc sweep + ROADMAP update                                               | ✅     |
| 10     | CHANGELOG + v7.1.0 bump + `gh release`                                         | ✅     |

**Conclusion:** all 10 sprints complete; v7.1.0 released.

| Item                                  | Status                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| Lightweight Charts integration        | ⏳ → A1                                                                        |
| History API router                    | ⏳ → A3                                                                        |
| Signals state                         | ⏳ → A4                                                                        |
| Web Worker compute                    | ⏳ → A5                                                                        |
| Workbox SW                            | ⏳ → A6                                                                        |
| Cloudflare Pages deploy               | ⏳ → A7                                                                        |
| Finnhub provider                      | ⏳ → A8                                                                        |
| Valibot/Zod boundaries                | ⏳ → A9 (chose Valibot over Zod for size)                                      |
| Command palette + keyboard            | ⏳ → A10                                                                       |
| Playwright + axe E2E                  | ⏳ → A15                                                                       |
| Lighthouse CI                         | ⏳ → A16                                                                       |
| GlitchTip + Plausible                 | ⏳ → A17                                                                       |
| Changesets                            | ⏳ → A18                                                                       |
| Component preview                     | ⏳ → A19                                                                       |
| CSP via Worker                        | ⏳ → A20                                                                       |
| Heatmap, Screener, Alerts cards       | ⏳ → A12/A13/A14                                                               |
| WebSocket streaming                   | ⏳ → B1                                                                        |
| Portfolio + risk cards                | ⏳ → B2/B3                                                                     |
| Backtest UI                           | ⏳ → B4                                                                        |
| Provider Health card                  | ⏳ → B5                                                                        |
| OG image                              | ⏳ → B7                                                                        |
| i18n + RTL                            | ✅ Partial: RTL wiring (setLocale/dir) done; full message catalogue pending C1 |
| High-contrast palettes                | ⏳ → C2                                                                        |
| Astro Starlight docs                  | ⏳ → C3                                                                        |
| Per-indicator MDX                     | ✅ Done (13 indicators, 8 added v7.1)                                          |
| Mobile responsive + container queries | ⏳ → C5                                                                        |
| Passkey auth + cloud sync             | ⏳ → D1                                                                        |
| Multi-chart layout                    | ⏳ → D2                                                                        |
| Drawing tools                         | ⏳ → D3                                                                        |
| Custom-signal DSL                     | ⏳ → D4                                                                        |
| Shared watchlist URLs                 | ⏳ → D5                                                                        |

Anything not listed is descoped.

---

## 17. Refactor & Rewrite Backlog

Items that improve the codebase without changing user-visible behavior. Scheduled opportunistically inside Phase A/B/C.

| #   | Refactor                                                                                                           | Why                                | When               |
| --- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------- | ------------------ |
| R1  | **Delete `core/state.ts`**                                                                                         | Replaced by signals (D3)           | A4                 |
| R2  | **Consolidate `cards/` `mount()` signature** to `(host: HTMLElement, ctx: CardContext) => CardHandle`              | Predictable lifecycle              | A2                 |
| R3  | **`src/` → `app/`** rename + npm workspaces                                                                        | Clarity vs `worker/`, `docs-site/` | A22                |
| R4  | **Replace `core/index.ts` 150-line barrel** with subpath exports (`@app/core/signals` style)                       | Better tree-shaking, faster TS     | A4–A22 incremental |
| R5  | **Remove `as` casts** flagged by `no-unnecessary-type-assertion`                                                   | Strictness                         | Ongoing            |
| R6  | **Sweep JSDoc on every public export**                                                                             | Doc site quality                   | C3/C4              |
| R7  | **Replace `cards/index.ts` static imports** with the registry's lazy imports                                       | Bundle splitting                   | A2                 |
| R8  | **Unify `ui/date-format` and `core/date-format`** under `core/`; UI re-exports only                                | Single source                      | C5                 |
| R9  | **Replace `ad-hoc EventTarget` callbacks** in cards with signals + `effect()`                                      | Consistency                        | A2                 |
| R10 | **Migrate ESLint config to `eslint-plugin-import-x`**                                                              | Faster, maintained                 | A22                |
| R11 | **`worker/` rewrite to Hono** (currently bare `addEventListener`)                                                  | Cleaner routing, same size         | A7                 |
| R12 | **Tests: extract `makeCandles()` fixture** from per-test repeats                                                   | DRY                                | Ongoing            |
| R13 | **Public-API type tests** (`tsd`) for `domain/index.ts` exports                                                    | Catch breaking changes             | A22                |
| R14 | **Switch CHANGELOG to Changesets-generated**                                                                       | Release velocity                   | A18                |
| R15 | **Move `index.html` inline `<script>` to module entry**                                                            | CSP `'self'` only                  | A20                |
| R16 | **Consolidate `core/cache.ts`, `tiered-cache.ts`, `lru-cache.ts`** into `core/cache/` package with explicit facade | Discoverability                    | A21                |
| R17 | **Make `domain/heikin-ashi.ts` Candle the canonical type**; re-export from `types/`                                | Avoid circular type imports        | A9                 |
| R18 | **Drop unused color helpers if unused after C2**                                                                   | Bundle                             | C2                 |

---

## 18. Decisions Reaffirmed / Reversed / New

### Reaffirmed (kept after rethink #2)

- TypeScript strict, vanilla DOM-first, design tokens, IndexedDB+localStorage tiers,
  Lightweight Charts, Cloudflare Workers, MIT, no-account default, $0/mo target,
  shared MyScripts toolchain, npm, Vite, Vitest, ESLint, Prettier.

### Reversed since April 2026

- **Zod → Valibot** (D14): 90% smaller, identical ergonomics for our use case.
- **Lit "where useful" → Lit only when justified per-card** (D1): risk of toolchain creep.
- **GitHub Pages primary → Cloudflare Pages primary, GH Pages mirror** (D9): preview deploys are non-negotiable.
- **10 sprints/RC → 5 sprints/RC for v6.2** (DX): activation sprints are heavier.

### New since April 2026

- **`src/` → `app/` + npm workspaces** (D50, R3)
- **Stooq as bulk EOD fallback provider** (D7)
- **Per-card `mount()` signature standardization** (R2)
- **Public-API type tests via `tsd`** (D27, R13)
- **`gitleaks` + `socket.dev` supply-chain checks** (D23)
- **Status page via Uptime Kuma** (8.6)
- **View Transitions API for route changes** (D39)
- **Tauri 2.0 desktop wrapper** as v8 stretch (D49)
- **`@property` typed CSS custom properties** (D38)
- **Refactor & Rewrite Backlog** as a first-class section (§17)

### Explicit non-decisions (intentionally not chosen)

- **No Rust/WASM** until profiled need (D31, D46).
- **No React/Vue/Svelte/Solid framework.** Signals + vanilla DOM is sufficient (D1).
- **No Tailwind/UnoCSS.** Tokens + `@layer` win (D4).
- **No Dexie.** `idb.ts` is enough (D36).
- **No Sentry SaaS.** GlitchTip self-hosted (D15).
- **No Google Analytics.** Plausible self-hosted (D16).
- **No Postgres.** KV + R2 + (eventually) D1 (D37).
- **No Electron.** Tauri only if desktop happens (D49).
- **No native iOS/Android** until PWA proven insufficient (D44, E5).
- **No paid data feeds in default config.** Polygon only if user opts in (D7, 14.1).

---

## 19. Risks & Mitigations

| Risk                                   | Likelihood | Impact | Mitigation                                                               |
| -------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------ |
| Yahoo unofficial API breaks            | Medium     | High   | Circuit breaker → Finnhub → Stooq fall-through                           |
| Cloudflare free-tier limits exceeded   | Low        | Medium | KV cache, per-IP rate limit, daily budget alarm                          |
| Library-vs-product imbalance returns   | High       | High   | **Phase A enforces "no new library modules" rule until activation done** |
| Lightweight Charts v5 breaking change  | Low        | Medium | Pin major; smoke E2E                                                     |
| Workbox config drift                   | Low        | Medium | Use Workbox build, not runtime injection                                 |
| TS 5.9 → TS 6 migration friction       | Medium     | Low    | Track in Renovate; major bumps in dedicated PR                           |
| Self-hosted GlitchTip outage           | Low        | Low    | Errors degrade to console only; no data loss                             |
| Finnhub rate-limit surprises           | Medium     | Low    | Worker-side token bucket + cache                                         |
| Passkey browser compat (Safari quirks) | Medium     | Medium | Feature-detect; degrade to "no cloud sync"                               |
| OneDrive sync conflicts on dev machine | Medium     | Low    | Repo lives in OneDrive; document `.gitattributes` for CRLF; warn devs    |
| Single-maintainer bus factor           | High       | High   | Document everything (this roadmap); MIT license enables forks            |

---

## 20. Scope Boundaries

**Building.** Browser-based stock & crypto monitoring dashboard, multi-method
consensus engine, charting, screener, alerts, backtest, portfolio, offline-first
PWA, optional encrypted cloud sync — open source, self-hostable, $0/mo default.

**Not building.**

- Brokerage / order execution / real money flow.
- Social / chat / public profiles.
- Paid SaaS tier.
- Native mobile apps (PWA only).
- AI/LLM features baked into the bundle. (Optional sidecar, never default.)
- Crypto wallets, on-chain anything.
- Newsfeed aggregation (out of scope).
- News sentiment (out of scope).

---

## 21. Glossary & Acronyms

| Term         | Meaning                                                |
| ------------ | ------------------------------------------------------ |
| **CRDT**     | Conflict-free Replicated Data Type                     |
| **CSP**      | Content Security Policy                                |
| **D1**       | Cloudflare's serverless SQLite                         |
| **DO**       | Cloudflare Durable Object                              |
| **EOD**      | End-of-Day pricing                                     |
| **ICU**      | International Components for Unicode (message format)  |
| **INP**      | Interaction to Next Paint (Web Vital)                  |
| **KV**       | Cloudflare Key-Value store                             |
| **LCP**      | Largest Contentful Paint (Web Vital)                   |
| **LH CI**    | Lighthouse CI                                          |
| **LWC**      | Lightweight Charts (TradingView OSS)                   |
| **MDX**      | Markdown + JSX                                         |
| **OG image** | Open Graph share image                                 |
| **PWA**      | Progressive Web App                                    |
| **R2**       | Cloudflare's S3-compatible object storage              |
| **RUM**      | Real User Monitoring                                   |
| **SPA**      | Single-Page Application                                |
| **SRI**      | Subresource Integrity                                  |
| **SWR**      | Stale-While-Revalidate caching                         |
| **VAPID**    | Voluntary Application Server Identification (Web Push) |
| **WSS**      | WebSocket Secure                                       |

---

_End of roadmap. Previous version archived at_ `docs/ROADMAP.archive-2026-04.md`.
