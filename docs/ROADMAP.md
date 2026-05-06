# CrossTide — Strategic Roadmap v6 (Deep Rethink)

> **Date:** May 5, 2026
> **Current version:** v11.37.0
> **Codebase:** 218 domain modules · 54 cards · 36 Worker routes · 582+ test files
> **Bundle:** 158 KB gzip (budget 200 KB) · 49 SW precache entries
> **Stack:** TypeScript 6.0 · Vite 8 · Vitest 4 · Hono 4 · morphdom · LWC v5
> **ADRs on record:** 11 (all accepted, 2026-05-04)
> **Previous roadmap:** v5 archived in git history (tag v11.28.0)

---

## Table of Contents

1. [Honest Assessment v6](#1-honest-assessment-v6)
2. [Comprehensive Competitor Comparison](#2-comprehensive-competitor-comparison)
3. [Best Practices Harvested v6](#3-best-practices-harvested-v6)
4. [Decision Rethink v6 — Everything on the Table](#4-decision-rethink-v6)
5. [Frontend Strategy v6](#5-frontend-strategy-v6)
6. [Backend & Data Strategy v6](#6-backend--data-strategy-v6)
7. [AI/ML & Intelligence Strategy](#7-aiml--intelligence-strategy)
8. [WebAssembly & Performance Architecture](#8-webassembly--performance-architecture)
9. [Plugin & Extension System](#9-plugin--extension-system)
10. [Infrastructure & Deployment v6](#10-infrastructure--deployment-v6)
11. [External APIs & Vendor Strategy v6](#11-external-apis--vendor-strategy-v6)
12. [Data Quality & Financial Accuracy](#12-data-quality--financial-accuracy)
13. [Quality, Security & Observability v6](#13-quality-security--observability-v6)
14. [Documentation Strategy v6](#14-documentation-strategy-v6)
15. [Performance Budget v6](#15-performance-budget-v6)
16. [Phase P — v12.0.0 "Real Data & Architecture Foundation"](#16-phase-p--v1200-real-data--architecture-foundation)
17. [Phase Q — v13.0.0 "Data Depth & Charting"](#17-phase-q--v1300-data-depth--charting)
18. [Phase R — v14.0.0 "Polish, Scale & Distribution"](#18-phase-r--v1400-polish-scale--distribution)
19. [Phase S — v15.0.0 "Intelligence & AI"](#19-phase-s--v1500-intelligence--ai)
20. [Phase T — v16.0.0 "Ecosystem & Community"](#20-phase-t--v1600-ecosystem--community)
21. [Refactor & Rewrite Backlog v6](#21-refactor--rewrite-backlog-v6)
22. [Decision Log v6](#22-decision-log-v6)
23. [Risks & Mitigations v6](#23-risks--mitigations-v6)
24. [Scope Boundaries v6](#24-scope-boundaries-v6)
25. [Engineering Non-Negotiables](#25-engineering-non-negotiables)

---

## 1. Honest Assessment v6

### 1.1 What is genuinely excellent

| Area                      | Evidence                                                                   | Verdict       |
| ------------------------- | -------------------------------------------------------------------------- | ------------- |
| **Pure domain layer**     | 218 modules, zero I/O, 100% deterministic, shareable to WASM               | World-class   |
| **Bundle size**           | 158 KB gzip — 10-30× smaller than commercial competitors                   | World-class   |
| **Type safety**           | TS 6 strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`    | World-class   |
| **Indicator depth**       | 80+ domain modules cover TA, quant finance, statistics, ML                 | Best-in-class |
| **Offline-first**         | 5-tier cache (Map→LS→IDB→SW→OPFS), Background Fetch, Web Push              | Best-in-class |
| **Signal system**         | Zero-dep reactive primitives, `batch()`, auto-tracking, lazy evaluation    | Excellent     |
| **CSS architecture**      | Layers, `@scope`, container queries, semantic tokens, color-blind palettes | Excellent     |
| **Security posture**      | CSP strict, HSTS preload, Valibot at every boundary, no inline JS, SRI     | Excellent     |
| **Worker route coverage** | 36 routes including Monte Carlo, pairs trading, factor model, DSL          | Excellent     |
| **DevEx**                 | Full CI, git hooks, commitlint, lint-staged, ADR process, preview deploys  | Excellent     |
| **WCAG compliance**       | AA certified, axe-core E2E, contrast CI check, reduced-motion support      | Excellent     |
| **ADR process**           | 11 documented decisions with context, rationale, consequences              | Excellent     |

### 1.2 What is genuinely broken or incomplete

| #       | Area                                    | Reality                                                                             | Severity |
| ------- | --------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| **B1**  | `wrangler.toml` missing all bindings    | No KV, D1, or DO bindings — Worker can't use cache, DB, or fan-out in prod          | Critical |
| **B2**  | Worker routes return fixture/PRNG data  | `/api/chart`, `/api/screener` serve synthetic data; production is fake              | Critical |
| **B3**  | No real Yahoo/provider calls in Worker  | `worker/providers/yahoo.ts` exists but routes don't call real upstream APIs         | Critical |
| **B4**  | D1 schema migrations never applied      | `worker/migrations/` exists but no `database_id` in `wrangler.toml`                 | High     |
| **B5**  | Passkey auth never wired to D1          | `passkey.ts` and `webauthn.ts` code exists but no DB binding plumbed                | High     |
| **B6**  | debug.log files committed to repo       | `src/domain/debug.log` and `src/cards/debug.log` should be gitignored               | Medium   |
| **B7**  | Component composition still scattered   | 54 cards reimplement tables, stat grids, loading states independently               | Medium   |
| **B8**  | Router lacks query strings and guards   | Navigation has no query string support; no pre-route data loading                   | Medium   |
| **B9**  | Signal batching exists but underused    | `batch()` implemented but most card updates still unbatched                         | Medium   |
| **B10** | ONNX models exist but not exercised     | `onnx-patterns.ts`, `onnx-pipeline.ts` — no integration test, no model file         | Medium   |
| **B11** | 218 domain modules — some untested live | Copula, Granger, jump-diffusion — theoretically correct but never runtime-validated | Medium   |
| **B12** | `packages/` workspace dirs empty        | `packages/app`, `packages/worker`, `packages/domain` stubs not populated            | Low      |
| **B13** | No Temporal polyfill removal plan       | `@js-temporal/polyfill` + native Temporal both ship in Chrome 131+                  | Low      |
| **B14** | Docs-site content gaps                  | Astro site structure exists; many MDX pages are stubs                               | Low      |
| **B15** | No visual regression tests for charts   | Playwright screenshots exist; no baseline comparison CI gate                        | Low      |
| **B16** | No contract tests for provider APIs     | Provider schemas validated at runtime; no offline contract tests                    | Low      |

### 1.3 The uncomfortable truths

**Truth 1 — The backend is still fake.** Despite 11 ADRs documenting what _should_ be done, and
Phase P items marked ✅ in the previous roadmap, the `wrangler.toml` has no KV, D1, or DO
bindings. The Worker cannot use Cloudflare infrastructure. This is the single highest-priority
gap between CrossTide and a deployable application.

**Truth 2 — The domain layer is over-engineered relative to the UI.** 218 pure domain modules
including Hawkes processes, copula models, wavelet transforms, and jump-diffusion. This depth is
extraordinary but 40% of these modules likely have zero UI surface. The smart move is not to
delete them — but to expose them through the plugin system (Phase T) and make them discoverable.

**Truth 3 — The comparison table has blind spots.** v5's comparison omitted AI-native tools
(Perplexity Finance, Bloomberg GPT-era terminal), collaborative tools (Koyfin Teams), and
professional tools (Bloomberg Terminal as the gold standard). The gap between CrossTide and
professional tools is larger on fundamental data depth and real-time precision than on charting.

**Truth 4 — WebAssembly is an untapped advantage.** The domain layer's total purity (zero I/O,
zero side effects) makes it a perfect WebAssembly target. Monte Carlo simulation, correlation
matrix computation, and Fourier cycle analysis would run 10-100× faster as WASM. No competitor
does this in-browser.

**Priority order for v6:**

1. Wire `wrangler.toml` bindings and make data real (B1–B3)
2. Fix data quality: corporate actions, adjusted prices, split-handling (B4, D12)
3. Implement Web Component primitives and signal stores
4. Layer in WebAssembly for hot computational paths
5. Add AI/LLM natural-language query interface
6. Build plugin system and community tools

---

## 2. Comprehensive Competitor Comparison

Rating: `★★★` best-in-class · `★★` strong · `★` adequate · `△` partial · `✗` absent

| Capability                 | **CrossTide** |  TradingView  |   FinViz   | Koyfin  | thinkorswim | Bloomberg  | Seeking Alpha | GhostFolio | TrendSpider | Perplexity Fin |
| -------------------------- | :-----------: | :-----------: | :--------: | :-----: | :---------: | :--------: | :-----------: | :--------: | :---------: | :------------: |
| **Pricing**                |   Free OSS    |   $15-60/mo   | $25-50/mo  | $39/mo  | Free/Schwab | $6,000/yr  |   $0-35/mo    |  Free OSS  |  $39-97/mo  |     $20/mo     |
| **Open source**            |    ★★★ MIT    |       ✗       |     ✗      |    ✗    |      ✗      |     ✗      |       ✗       |   ★ AGPL   |      ✗      |       ✗        |
| **Self-hostable**          |      ★★★      |       ✗       |     ✗      |    ✗    |      ✗      |     ✗      |       ✗       | ★★ Docker  |      ✗      |       ✗        |
| **No account required**    |      ★★★      |       △       |    ★★★     |    ✗    |      ✗      |     ✗      |       △       |     ✗      |      ✗      |       ✗        |
| **Privacy (cookieless)**   |      ★★★      |  ✗ trackers   |   ✗ ads    |    ✗    |      ✗      |     ✗      |     ✗ ads     |    ★★★     |      △      |       ✗        |
| **Bundle / load speed**    |  ★★★ 158 KB   |    ✗ ~5 MB    |    SSR     |  ~3 MB  |   Desktop   |  Desktop   |    ~2.5 MB    |  ~500 KB   |    ~2 MB    |    ~800 KB     |
| **Lighthouse perf score**  |    ★★★ ≥90    |      ~50      |    ~70     |   ~60   |     n/a     |    n/a     |      ~55      |    ~65     |     ~55     |      ~70       |
| **Offline / PWA**          |   ★★★ full    |       ✗       |     ✗      |    ✗    |   Desktop   |     ✗      |       ✗       |     ★★     |      ✗      |       ✗        |
| **Real-time streaming**    | ★★ Finnhub WS |      ★★★      |    Paid    |   ★★    |     ★★★     |    ★★★     |      EOD      |    EOD     |     ★★★     |   Headlines    |
| **Charting depth**         |   ★★ LWC v5   | ★★★ 20 types  |   Static   |   ★★    |     ★★★     |  ★★★ 100+  |       ★       |     ✗      |     ★★★     |       ✗        |
| **Indicator library**      |    ★★★ 80+    |   ★★★ 400+    |    50+     |   80+   |  ★★★ 400+   | ★★★ 1000+  |       ✗       |     ✗      |  ★★★ 100+   |       ✗        |
| **Consensus / signals**    |  ★★★ unique   |       ✗       |     ✗      |    ✗    |      ✗      | ★★ analyst |  ★★ analyst   |     ✗      |    △ AI     |  ★★ AI digest  |
| **Screener**               |    ★★ DSL     |      ★★       | ★★★ iconic |   ★★    |     ★★      |  ★★★ BQL   |   ★★★ (FA)    |     ✗      |     ★★★     |       △        |
| **Backtest engine**        |   ★★ DSL+WF   |  Pine Script  |     ✗      |    ★    | thinkScript |    BTCA    |       ✗       |     ✗      |     ★★★     |       ✗        |
| **Portfolio analytics**    |      ★★★      |       ✗       |     ✗      |   ★★★   |   Broker    |  ★★★ PORT  |   ★★ basic    |    ★★★     |      ✗      |       ✗        |
| **Fundamental data**       |   △ overlay   |   ★★★ 100+    |    ★★★     |   ★★★   |     ★★★     | ★★★ 1000+  |   ★★★ deep    |     ✗      |      ✗      |   ★★ AI-gen    |
| **Natural language query** |  ★★ planned   |       ✗       |     ✗      |    ✗    |      ✗      |  ★★★ BQNA  |  ★★ Copilot   |     ✗      |      ✗      |      ★★★       |
| **On-device AI / privacy** |  ★★★ planned  |       ✗       |     ✗      |    ✗    |      ✗      |     ✗      |       ✗       |     ✗      |   Server    |  Server-side   |
| **Custom scripting**       |    ★★ DSL     |   ★★★ Pine    |     ✗      |    ✗    | ★★ tScript  |  ★★★ BQL   |       ✗       |     ✗      |      ✗      |       ✗        |
| **Plugin / extension API** |  ★★★ planned  |      ★★★      |     ✗      |    ✗    |      △      |    ★★★     |       ✗       |     ★★     |      ✗      |       ✗        |
| **WebAssembly compute**    |  ★★★ planned  |       ✗       |     ✗      |    ✗    |      ✗      |     ✗      |       ✗       |     ✗      |      ✗      |       ✗        |
| **Cloud sync (E2EE)**      |  ★★★ Passkey  |    Account    |  Account   | Account |   Broker    |  Firm SSO  |    Account    |  Account   |   Account   |    Account     |
| **Economic calendar**      |   ★★★ FRED    |      ★★★      |     ★★     |   ★★★   |     ★★★     |    ★★★     |      ★★★      |     ✗      |      ✗      |       ★        |
| **Drawing tools**          | ★★ (10 tools) |  ★★★ (110+)   |     ✗      |    ★    |     ★★      |  ★★★ 80+   |       ✗       |     ✗      |   ★★★ 50+   |       ✗        |
| **Mobile native**          |   PWA only    | ★★★ iOS+Droid |     ✗      |   ★★    |     ★★★     |  ★★★ apps  |   ★★★ apps    |   △ PWA    |     ★★      |   ★★★ mobile   |
| **WCAG accessibility**     |    ★★★ AA     |       △       |     ✗      |    △    |      ✗      |     ★★     |       △       |     ★★     |      ✗      |       ★        |
| **Test coverage**          | ★★★ 582 files |    Unknown    |  Unknown   | Unknown |   Unknown   |  Unknown   |    Unknown    |     ★★     |   Unknown   |    Unknown     |
| **Open API / SDK**         |  ★★ planned   |      ★★★      |     ✗      |    ✗    |      △      |  ★★★ paid  |       ✗       |     ★★     |      ✗      |       ✗        |

### Where CrossTide uniquely wins today

1. **OSS + self-hostable + privacy-first + no-account**: No competitor combines all four
2. **12-method consensus engine**: Unique weighted signal aggregation in OSS or commercial
3. **Bundle size**: 10-30× smaller, 2× better Lighthouse than any commercial competitor
4. **Offline depth**: 5-tier cache + Background Fetch + OPFS — beyond even GhostFolio
5. **In-browser backtest with walk-forward**: Zero OSS competitors match this
6. **Passkey-only E2EE sync**: Unique authentication model — no email, no password
7. **218 pure domain modules**: The mathematical depth rivals professional quant libraries
8. **Type safety floor**: TS 6 strict + `noUncheckedIndexedAccess` — no competitor open-sources this

### Where CrossTide must close the gap

| Gap                          | Leader                  | Action                                         | Phase |
| ---------------------------- | ----------------------- | ---------------------------------------------- | ----- |
| Worker backend is fake       | All competitors         | Wire wrangler.toml, real provider calls        | P     |
| Fundamental data depth       | Bloomberg, Koyfin       | Expand `quoteSummary` + Tiingo fundamentals    | Q     |
| Chart types (4 vs 20+)       | TradingView, Bloomberg  | Heikin-Ashi, Renko, Range bars, Volume Profile | Q     |
| Drawing tools (10 vs 110)    | TradingView             | 10 more high-value tools                       | Q     |
| Natural language query       | Bloomberg, Perplexity   | On-device LLM (WebLLM + Phi-3.5)               | S     |
| Plugin/extension marketplace | TradingView, Bloomberg  | Plugin SDK + registry                          | T     |
| News integration quality     | TradingView (real-time) | Structured news API with NLP sentiment         | R     |
| Corporate actions handling   | All commercial apps     | Split/dividend-adjusted prices                 | P/Q   |
| WebAssembly acceleration     | None (unique advantage) | AssemblyScript WASM for hot paths              | S     |

---

## 3. Best Practices Harvested v6

| Practice                                    | Source                         | How to Apply                                                               | Priority |
| ------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------- | -------- |
| **Real data with edge caching**             | All commercial apps            | Wire KV cache, market-hours TTL, KV/D1 bindings in wrangler.toml           | P0       |
| **Corporate action adjustment**             | Bloomberg, Tiingo              | All OHLCV returned as split-adjusted by default; raw optional              | P0       |
| **Web Components for composable UI**        | Lit, GitHub Catalyst, Shoelace | `<ct-data-table>`, `<ct-chart-frame>`, `<ct-stat-grid>` base elements      | P1       |
| **Signal stores per domain**                | SolidJS, Svelte stores         | `createWatchlistStore()`, `createPortfolioStore()` replace main.ts binding | P1       |
| **Route-level data loading**                | Remix, SvelteKit, TanStack     | `loader()` before render; navigation aborts pending loaders                | P1       |
| **WASM for hot computation**                | Figma, Photoshop Web, AutoCAD  | AssemblyScript compile of RSI/EMA/correlation matrix to WASM               | S1       |
| **WebGPU for parallel workloads**           | Figma, Google Maps             | Monte Carlo, heatmap, efficient frontier via WebGPU compute shaders        | S2       |
| **On-device LLM for NL queries**            | LangChain, WebLLM, Perplexity  | Phi-3.5 mini via WebLLM; "show stocks with RSI < 30 and rising volume"     | S1       |
| **View Transitions API for navigation**     | Chrome, MPA/SPA demos          | Smooth cross-route animations; hero element transitions for chart card     | P2       |
| **Contract testing for provider APIs**      | Pact, Postman                  | Offline contracts for Yahoo/Finnhub schemas; catch breaks before runtime   | Q2       |
| **Visual regression for charts**            | Percy, Chromatic, Playwright   | Playwright screenshot baseline comparison in CI                            | Q2       |
| **Volume Profile / TPO charts**             | TradingView, thinkorswim       | LWC custom series for volume-at-price distribution                         | Q2       |
| **OpenAPI-to-TypeScript code generation**   | OpenAPI Generator, orval       | Auto-generate typed client from `worker/routes/openapi.ts` spec            | Q1       |
| **Natural language indicator scripting**    | Bloomberg BQNA, Perplexity     | LLM translates English → Signal DSL expression                             | S1       |
| **Plugin registry with versioned API**      | TradingView, VSCode            | Indicator + chart-type + data-source + theme plugins; isolated execution   | T1       |
| **pnpm + Turborepo for monorepo**           | Vercel, Linear, many OSS monos | Better dependency hoisting, incremental build caching vs npm workspaces    | T2       |
| **Mutation testing**                        | Stryker, PIT                   | Verify tests actually catch real bugs in indicator calculations            | Q3       |
| **Property-based testing for finance math** | fast-check, Hypothesis         | Already in devDeps; expand to all 80+ indicators                           | Q1       |
| **Bar Replay with order simulation**        | TradingView                    | Play historical data tick-by-tick; simulate strategy in real-time          | R1       |
| **Structured OTEL traces in Worker**        | Vercel, Linear                 | Correlate client error → Worker request → upstream API call                | R2       |
| **Economic data overlay on charts**         | Koyfin, Bloomberg              | FRED series (VIX, yield curve, M2) as optional chart overlay               | Q3       |
| **Keyboard-driven table operations**        | Bloomberg Terminal, Notion     | Ctrl+C copies cells, Tab between columns, `/` to filter                    | Q2       |

---

## 4. Decision Rethink v6

### 4.1 Decisions REAFFIRMED (confirmed correct on 6th review)

| Decision                              | Why it's right                                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Vanilla TS + zero-dep signals**     | 158 KB proves it. React + SolidJS adds 4-40 KB before app code. Our signals outperform VDOM for this use case. |
| **Pure domain layer**                 | 218 modules, zero side effects. Perfect for WASM compilation. The project's crown jewel.                       |
| **Valibot over Zod/Effect**           | 3 KB vs 30 KB vs 120 KB. Same safety. No runtime overhead.                                                     |
| **Multi-provider failover pattern**   | Yahoo breaks monthly. 5 fallbacks + circuit breaker is production-grade.                                       |
| **Cloudflare all-in ($0/mo)**         | Pages + Workers + KV + D1 + R2 + DO. Hono makes it portable. Can't beat free.                                  |
| **Lightweight Charts v5**             | 45 KB. Professional charting. Same TradingView OSS. MIT license. Superior to uPlot for financial charts.       |
| **Workbox Service Worker**            | Offline-first non-negotiable for PWA. 5-tier cache is best-in-class.                                           |
| **Hono for Worker**                   | 14 KB. Typed routes, middleware, OpenAPI, Durable Objects. Portable to Deno/Bun/Lambda.                        |
| **morphdom + View Transitions API**   | morphdom 2.7 KB stays for incremental DOM updates; View Transitions API layered on top for animations.         |
| **Passkey auth**                      | No password hashes, no email, no user table. Unique and genuinely privacy-first.                               |
| **CSS Layers + @scope + container q** | Modern CSS that eliminates class collisions. No runtime cost. No framework.                                    |
| **TypeScript 6 strict**               | `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` catches real bugs at compile time.                   |
| **Temporal API**                      | Financial dates need timezone-safe arithmetic. Native Temporal in Chrome 131+; polyfill removal on roadmap.    |
| **fast-check property testing**       | Financial math must be correct for ANY input. Already in devDeps; needs full expansion.                        |

### 4.2 Decisions to REVERSE or REFINE

| Old Decision                              | Problem                                                     | New Decision                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **wrangler.toml: no bindings**            | Worker can't use KV, D1, or DO in production                | Add all bindings immediately; Phase P exit criterion                                           |
| **Cards as string templates**             | No composition, XSS by accident, duplicated table/grid code | Lit-html for complex templates; 5 Web Component base classes                                   |
| **Data binding in main.ts**               | 54 cards wired manually; impossible to trace data flow      | Signal stores per domain; cards subscribe to stores                                            |
| **Demo data in Worker routes**            | Production shows fake numbers; useless at any scale         | Real provider calls with KV cache + Valibot validation                                         |
| **All indicators use hardcoded defaults** | RSI(14) everywhere; not user-configurable                   | Indicator config registry (JSON schema per method); user-tunable via Settings card             |
| **Backtest: majority-vote only**          | No fees, no slippage, no position sizing — unrealistic      | Commission model + slippage estimation + Kelly criterion sizing                                |
| **npm workspaces declared, unused**       | `packages/` dirs are empty stubs                            | Either populate or remove; if populated, evaluate pnpm + Turborepo                             |
| **Temporal polyfill permanent dep**       | Temporal ships natively in Chrome 131+ / Node 22.6+         | Conditional polyfill: `if (!('Temporal' in globalThis)) await import('@js-temporal/polyfill')` |
| **Per-isolate rate limiting**             | Memory lost on isolate eviction; not globally consistent    | KV-backed sliding window rate limiter (ADR-0004 design, needs wrangler.toml binding)           |
| **Passkey auth implemented in isolation** | No D1 binding plumbed; auth system exists but can't persist | Wire D1 `credential_id` table; connect auth to sync endpoint                                   |

### 4.3 NEW decisions for v6

| Decision                                     | Rationale                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **AssemblyScript WASM for domain hot paths** | RSI, EMA, correlation matrix, Monte Carlo: 10-100× faster as WASM; domain purity enables this     |
| **WebGPU for massively parallel compute**    | Correlation heatmap (500×500), efficient frontier, Monte Carlo convergence via compute shaders    |
| **WebLLM + Phi-3.5 mini for NL queries**     | On-device LLM inference (WebGPU); no data leaves browser; "find tech stocks with weakening RSI"   |
| **View Transitions API for navigation**      | Chrome 111+; hero element transitions between chart and card views; native-app feel at zero cost  |
| **Plugin system with sandboxed execution**   | Custom indicators, chart types, data sources, themes as isolated ES modules; TradingView-level UX |
| **OpenAPI → TypeScript client codegen**      | `worker/routes/openapi.ts` drives typed client; never write fetch boilerplate manually            |
| **Contract testing for provider APIs**       | Pact-style offline contracts for Yahoo/Finnhub; catch schema changes in CI before production      |
| **Visual regression tests for charts**       | Playwright screenshot baseline comparison; catches LWC rendering regressions                      |
| **Conditional Temporal polyfill removal**    | Chrome 131+ has native Temporal; detect capability and skip polyfill (saves ~8 KB)                |
| **pnpm + Turborepo evaluation**              | Once packages/ is populated, evaluate better task caching and dep resolution                      |
| **CSS Anchor Positioning for tooltips**      | Native browser API (Chrome 125+); replaces Popper.js/floating-ui — zero runtime cost              |
| **Popover API for modals/overlays**          | Native HTML `popover` attribute (all major browsers 2024+); replaces JS-managed overlays          |
| **R2 for OHLCV cold storage archival**       | Store 20-year daily OHLCV as Parquet in R2; serve bulk history without hitting Yahoo rate limits  |
| **GlitchTip source-map upload**              | Correlate production errors to exact source lines; critical before public launch                  |
| **Stryker mutation testing**                 | Verify 582 test files actually _catch_ bugs; mutation score target ≥ 75%                          |

### 4.4 Architectural rethinks: things we considered and why we stay/change

| Option                             | What we considered                                        | Verdict                                                                                       |
| ---------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **React / Vue / Svelte migration** | Ecosystem, hiring, component libraries                    | ✗ Bundle 2-3× for equivalent functionality; signals outperform VDOM for our use case          |
| **D3.js for charts**               | More chart types, SVG control                             | ✗ 60 KB; performance inferior to LWC Canvas; maintaining custom chart types is high burden    |
| **Apache ECharts**                 | 100+ chart types, good defaults                           | △ 700 KB unminified; too heavy; LWC plugin API achieves new types at 2-5 KB each              |
| **WebTransport for real-time**     | Lower latency than WebSocket, QUIC multiplexing           | △ Not yet supported by Finnhub; plan to use when provider support materializes (Phase T)      |
| **tRPC for Worker API**            | End-to-end type safety, automatic client inference        | ✗ Hono already provides this with less overhead; OpenAPI codegen achieves same result         |
| **GraphQL for API**                | Flexible queries, client-driven data shape                | ✗ Over-engineering for 36 routes; REST + OpenAPI codegen is simpler and sufficient            |
| **PostgreSQL / Supabase**          | Rich SQL, ecosystem, realtime subscriptions               | ✗ D1 handles our schema at $0/mo; no self-hosting requirement for auth-required features      |
| **Tailwind CSS**                   | Utility classes, consistent design tokens                 | ✗ CSS Layers + custom properties achieves same goals without 50 KB utility output             |
| **Storybook for components**       | Isolated component development, visual docs               | ✗ `docs/components-preview.html` + Astro docs covers this; Storybook is heavyweight           |
| **Rust compiled to WASM**          | Fastest possible WASM, large ecosystem (ndarray, statrs)  | △ High barrier; AssemblyScript is sufficient and TypeScript-adjacent; revisit in Phase T      |
| **Electron desktop app**           | File system access, native menus, no browser restrictions | ✗ PWA covers this; Capacitor covers mobile stores; Tauri v2 achieves desktop at 1/10 the size |
| **Kubernetes deployment**          | Container orchestration, scaling                          | ✗ Cloudflare Workers handles scaling automatically at $0/mo; massive operational overhead     |
| **SSR via Cloudflare Pages**       | SEO, first paint speed                                    | ✗ Dashboard SPA; no SEO need for authenticated content; MPA shell loads in <200ms anyway      |

---

## 5. Frontend Strategy v6

### 5.1 Rendering model — evolution path

```text
v1-v7:    innerHTML (full re-render on each update)
v8-v11:   morphdom (incremental DOM patching)          ← CURRENT
v12:      morphdom + Web Components (shared primitives)
v13:      morphdom + Web Components + lit-html (complex cards)
v13+:     View Transitions API layered on all navigation
v15+:     WebAssembly computation + WebGPU acceleration
```

morphdom is NOT being replaced — it remains the correct choice for incremental DOM updates.
The evolution adds capability on top, not in place of.

### 5.2 Web Components — 5 base primitives (Phase P)

Extract and share across all 54 cards:

```ts
// <ct-data-table> — virtual scrolling, sort, keyboard nav, ARIA, copy-cell
// <ct-stat-grid>  — responsive grid of key metrics (P/E, volume, 52-week)
// <ct-chart-frame>— LWC wrapper: loading skeleton, error fallback, resize
// <ct-filter-bar> — preset buttons + text/range inputs + active filter count
// <ct-empty-state>— consistent loading/error/no-data states with actions
```

Expected result: 40-60% reduction in card boilerplate; consistent UX across all 54 cards.

### 5.3 Signal stores — unidirectional data flow (Phase P)

```ts
// src/stores/watchlist.store.ts
export const watchlistStore = createStore({
  tickers: signal<string[]>([]),
  quotes: computed(() => /* derives from tickers + quote cache */),
  loading: signal(false),
  async addTicker(symbol: string) { ... },
  async refresh() { batch(() => { /* bulk update quotes */ }); },
});

// Card subscribes: no more scattered main.ts wiring
effect(() => render(watchlistStore.quotes()));
```

### 5.4 Router upgrade — loaders + query strings (Phase P)

```ts
defineRoute({
  path: "/chart/:symbol",
  querySchema: v.object({ range: v.optional(v.picklist(["1d", "1w", "1mo", "1y", "5y"])) }),
  loader: async ({ params, query, signal }) => {
    const [candles, quote] = await Promise.all([
      fetchCandles(params.symbol, query.range ?? "1y", { signal }),
      fetchQuote(params.symbol, { signal }),
    ]);
    return { candles, quote };
  },
  component: () => import("./cards/chart-card"),
});
```

### 5.5 View Transitions API — smooth navigation (Phase Q)

```ts
// src/ui/router.ts
async function navigate(path: string): Promise<void> {
  if (!document.startViewTransition) {
    await doNavigate(path);
    return;
  }
  document.startViewTransition(() => doNavigate(path));
}
```

CSS for card-to-chart hero transition:

```css
.chart-card {
  view-transition-name: chart-primary;
}
.watchlist-row[data-symbol] {
  view-transition-name: var(--symbol);
}
```

### 5.6 Chart type expansion

| Type                 | Priority | Status  | Implementation                                          |
| -------------------- | -------- | ------- | ------------------------------------------------------- |
| Candlestick          | P0       | ✅ Done | LWC native                                              |
| Line / Area          | P0       | ✅ Done | LWC native                                              |
| Heikin-Ashi          | P1       | ✅ Done | `domain/heikin-ashi.ts` → candlestick renderer          |
| Renko                | P1       | ✅ Done | `domain/renko.ts` → LWC custom series                   |
| Range bars           | P1       | ✅ Done | `domain/range-bars.ts` → LWC custom series              |
| Point & Figure       | P1       | ✅ Done | `domain/point-and-figure.ts` → SVG renderer             |
| Volume Profile       | P2       | ⬜      | LWC custom series: horizontal histogram at price levels |
| Bar Replay           | P2       | ✅ Done | `domain/bar-replay.ts` domain model exists              |
| Multi-timeframe sync | P2       | ✅ Done | `domain/multi-timeframe.ts` domain model exists         |
| Fundamental overlay  | P2       | ✅ Done | `domain/fundamental-data.ts` + secondary axis           |

### 5.7 Accessibility — WCAG 2.2 AAA target (Phase Q)

The current AA certification is excellent but AAA for critical user journeys is achievable:

| Criterion           | Current | Target | Action                                               |
| ------------------- | ------- | ------ | ---------------------------------------------------- |
| Color contrast      | AA 4.5  | AAA 7  | Audit tokens; darken chart grid lines only           |
| Text resize to 200% | AA      | AAA    | Validate chart labels reflow at 200%                 |
| No timing limits    | AA      | AAA    | All time-sensitive alerts dismissable; no auto-close |
| Error suggestion    | AA      | AAA    | Screener filter errors suggest valid values          |
| Context on focus    | AA      | AAA    | Focus indicators are 3:1 contrast minimum            |

### 5.8 CSS — modern API adoption

| API                     | Status     | Plan                                                        |
| ----------------------- | ---------- | ----------------------------------------------------------- |
| CSS `@layer`            | ✅ Done    | —                                                           |
| CSS `@scope`            | ✅ Done    | —                                                           |
| Container queries       | ✅ Done    | —                                                           |
| CSS custom properties   | ✅ Done    | —                                                           |
| CSS Anchor Positioning  | ⬜ Phase Q | Replaces JS tooltip positioning; Chrome 125+ / Safari 18.2+ |
| CSS `popover` attribute | ⬜ Phase Q | Replaces JS modal management; all major browsers 2024+      |
| CSS `if()` function     | ⬜ Phase T | Conditional styling without class toggles; landing 2025+    |
| CSS Houdini paint       | △ Future   | Custom chart backgrounds via Paint Worklet; low priority    |

---

## 6. Backend & Data Strategy v6

### 6.1 Critical fix: wire wrangler.toml bindings (Phase P — MUST DO FIRST)

**Current state:** `wrangler.toml` has zero bindings. Worker code for KV caching, D1, and
Durable Objects exists and is well-written — it simply cannot access Cloudflare infrastructure
because `wrangler.toml` doesn't declare the bindings.

**Target `wrangler.toml`:**

```toml
name = "crosstide"
compatibility_date = "2024-12-01"
pages_build_output_dir = "dist"

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "CACHE"
id = "<production-namespace-id>"
preview_id = "<preview-namespace-id>"

[[d1_databases]]
binding = "DB"
database_name = "crosstide"
database_id = "<production-database-id>"

[[durable_objects.bindings]]
name = "TICKER_FANOUT"
class_name = "TickerFanout"

[[migrations]]
tag = "v1"
new_classes = ["TickerFanout"]
```

**Then:** Apply D1 migrations (`wrangler d1 migrations apply crosstide`).

### 6.2 Real data in Worker routes (Phase P)

```text
Client → Worker /api/chart?ticker=AAPL&range=1y
  → Check KV cache (key: "chart:AAPL:1y:v1", TTL: market-hours ? 5min : 24h)
  → Cache hit  → Return immediately
  → Cache miss → Fetch Yahoo Finance v8 chart API
                → Validate with Valibot schema
                → Normalize to CrossTide OHLCV format
                → Apply corporate action adjustments
                → Store in KV with TTL
                → Return to client
```

### 6.3 Data quality: corporate actions (Phase P/Q — critical for financial accuracy)

Financial applications that don't handle splits and dividends produce WRONG results. A stock
that 10-split at $1000/share looks like it "crashed" to $100 in unadjusted data.

**Requirements:**

```ts
interface OHLCVBar {
  readonly time: number; // Unix seconds
  readonly open: number; // Split-adjusted (default)
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly unadjClose?: number; // Raw price (optional overlay)
  readonly splitFactor?: number; // Factor applied at this bar
  readonly dividendAmount?: number;
}
```

**Provider support:**

| Provider | Split-adjusted | Dividend-adjusted | Raw prices | Corporate action history |
| -------- | :------------: | :---------------: | :--------: | :----------------------: |
| Yahoo v8 |   ✅ default   |    ✅ optional    |  ✅ `raw`  |        △ limited         |
| Tiingo   |       ✅       |        ✅         |     ✅     |         ✅ full          |
| Polygon  |       ✅       |        ✅         |     ✅     |         ✅ full          |
| Stooq    |       ✅       |         ✗         |     ✗      |            ✗             |

**Plan:** Yahoo default-adjusted prices; store `splitFactor` in OHLCV; UI toggle for
raw/adjusted; back-fill corporate action history from Tiingo (user API key).

### 6.4 D1 schema (production target)

```sql
-- User sync: encrypted blobs, passkey-keyed
CREATE TABLE user_sync (
  credential_id TEXT PRIMARY KEY,
  encrypted_blob BLOB NOT NULL,
  updated_at     INTEGER NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1
);

-- Alert rules: server-side evaluation via DO cron
CREATE TABLE alert_rules (
  id             TEXT PRIMARY KEY,
  credential_id  TEXT NOT NULL,
  expression     TEXT NOT NULL,   -- Signal DSL expression
  symbols        TEXT NOT NULL,   -- JSON array
  active         INTEGER NOT NULL DEFAULT 1,
  last_triggered INTEGER,
  FOREIGN KEY (credential_id) REFERENCES user_sync(credential_id)
);

-- CSP violations: aggregated, no PII
CREATE TABLE csp_reports (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  violated_directive  TEXT NOT NULL,
  blocked_uri         TEXT,
  source_file         TEXT,
  count               INTEGER NOT NULL DEFAULT 1,
  first_seen          INTEGER NOT NULL,
  last_seen           INTEGER NOT NULL
);

-- Provider health: circuit-breaker state
CREATE TABLE provider_health (
  provider    TEXT PRIMARY KEY,
  state       TEXT NOT NULL,  -- 'closed' | 'open' | 'half-open'
  failures    INTEGER NOT NULL DEFAULT 0,
  last_check  INTEGER NOT NULL
);
```

### 6.5 WebSocket fan-out (Durable Objects — Phase R)

```text
Client WSS → Worker → TickerFanout DO (per-symbol)
                            ↓
                       Fan out to N clients
                       Buffer last tick (late joiners)
                       Reconnect upstream (exp. backoff + jitter)
                       Free at 0 subscribers
```

Benefits: single upstream Finnhub connection per symbol regardless of client count.

### 6.6 Worker middleware stack (production)

```text
1. CORS                (allowOrigin from CF_ALLOWED_ORIGINS env)
2. Request ID          (X-Request-ID: crypto.randomUUID())
3. Rate limiting       (KV-backed sliding window, 100 req/60s/IP)
4. Security headers    (CSP, HSTS, X-Frame-Options, Permissions-Policy)
5. Hono router
6. Response transform  (strip provider headers, add cache-control)
7. Structured logging  (JSON → Logpush → R2, includes request ID + latency)
```

### 6.7 R2 for cold OHLCV archival (Phase Q)

Yahoo returns at most 30 years of daily data but rate-limits heavily. Storing bulk history
in R2 as Parquet files eliminates dependency on upstream availability for historical analysis:

```text
r2://crosstide-data/ohlcv/daily/{SYMBOL}/{YEAR}.parquet
r2://crosstide-data/ohlcv/weekly/{SYMBOL}/all.parquet
r2://crosstide-data/fundamentals/{SYMBOL}/latest.json
```

The domain module `domain/resample.ts` already handles timeframe aggregation.

---

## 7. AI/ML & Intelligence Strategy

This section is entirely new in v6 and represents CrossTide's biggest potential differentiator.

### 7.1 What's already there (underutilized)

The domain already has:

- `domain/onnx-patterns.ts` — ONNX Runtime Web for pattern recognition
- `domain/onnx-pipeline.ts` — ONNX pipeline orchestration
- `domain/market-regime.ts` — HMM-based regime classification
- `domain/anomaly-detection` — via distribution-fit and changepoint-detection
- `domain/fourier-cycles.ts` — spectral cycle detection
- `domain/wavelet.ts` — multi-scale analysis

**Problem:** No UI surface for these capabilities. They exist as pure computation but are never
exercised in production because the Worker doesn't call real data.

### 7.2 On-device LLM: natural language interface (Phase S)

**Proposal:** Integrate WebLLM (https://webllm.mlc.ai) with Phi-3.5-mini (3.8B params).
The model runs entirely in the browser via WebGPU. No API key, no data leaves the browser.

```ts
// src/ai/nl-query.ts
import { CreateMLCEngine } from "@mlc-ai/web-llm";

const engine = await CreateMLCEngine("Phi-3.5-mini-instruct-q4f16_1-MLC");

async function naturalToScreenerDSL(query: string): Promise<string> {
  const response = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SCREENER_DSL_SYSTEM_PROMPT },
      { role: "user", content: query },
    ],
  });
  return response.choices[0].message.content ?? "";
}

// Usage: "find tech stocks with RSI below 30 and rising volume"
// → 'sector === "Technology" && rsi(14) < 30 && volume > volume_sma(20)'
```

**System prompt** provides the DSL grammar; model translates English → valid DSL.

**Model sizes and capabilities:**

| Model           | Size  | WebGPU Required | Screener DSL | Chart explanation | Trade analysis |
| --------------- | ----- | :-------------: | :----------: | :---------------: | :------------: |
| Phi-3.5-mini q4 | 2.4GB |       ✅        | ✅ excellent |      ✅ good      |    ✅ good     |
| Llama-3.2-3B q4 | 2.0GB |       ✅        |   ✅ good    |      ✅ good      |    ✅ good     |
| Gemma-2-2B q4   | 1.5GB |       ✅        |      ★★      |      ✅ good      |       ★★       |

**Fallback:** If WebGPU unavailable, fall back to rule-based NL parser for common queries.

### 7.3 Pattern recognition upgrade (Phase S)

Current `onnx-patterns.ts` loads a model but no model file is bundled. The plan:

1. Train a lightweight ONNX classifier on historical candle pattern data
2. Export as < 2 MB ONNX model (stored in R2, lazy-loaded)
3. Classify: Head & Shoulders, Cup & Handle, Double Top/Bottom, Triangle, Flag
4. Surface as confidence overlay on chart; not a trading recommendation

### 7.4 Anomaly detection (Phase S)

Use the existing `domain/changepoint-detection.ts` + `domain/distribution-fit.ts` to flag:

- Unusual volume spikes
- Price action outside 3σ of historical distribution
- Regime changes detected by `domain/market-regime.ts`

Surface as chart annotations: colored bands + hover tooltip explaining the anomaly.

### 7.5 AI disclaimer and ethics

All AI-generated content must include a clear disclaimer:

> _This analysis is generated by an on-device AI model for educational purposes only.
> It is not financial advice. CrossTide does not guarantee accuracy._

The model runs entirely on the user's device. No data is transmitted to CrossTide servers.

---

## 8. WebAssembly & Performance Architecture

### 8.1 Why WASM for CrossTide's domain layer

The domain layer (218 modules, zero I/O, zero side effects) is the ideal WASM target:

| Module                  | Current (TS) | WASM target | Expected speedup | Effort |
| ----------------------- | :----------: | :---------: | :--------------: | :----: |
| `correlation-matrix.ts` |   O(n²) JS   |  WASM SIMD  |      20-50×      | Medium |
| `monte-carlo.ts`        | O(n·sim) JS  |  WASM SIMD  |     50-100×      | Medium |
| `efficient-frontier.ts` | Iterative JS |  WASM SIMD  |      30-80×      |  High  |
| `fourier-cycles.ts`     |    FFT JS    |  WASM FFT   |      5-20×       |  Low   |
| `garch.ts`              | Iterative JS |    WASM     |      10-30×      | Medium |
| `rsi-calculator.ts`     |   O(n) JS    |    WASM     |       2-5×       |  Low   |
| `ema-calculator.ts`     |   O(n) JS    |    WASM     |       2-5×       |  Low   |

### 8.2 Implementation approach: AssemblyScript (Phase S)

AssemblyScript compiles a TypeScript-like language to WASM. Because our domain modules use
only primitives (numbers, arrays), the port is mechanical:

```ts
// as/correlation-matrix.ts (AssemblyScript)
export function pearsonMatrix(data: Float64Array, n: i32, cols: i32): Float64Array {
  const result = new Float64Array(cols * cols);
  // ... SIMD-optimized implementation
  return result;
}
```

**Build integration:**

```json
// package.json scripts
"build:wasm": "asc as/correlation-matrix.ts -o public/wasm/correlation.wasm --optimize",
"build": "... && npm run build:wasm"
```

**Loading pattern:**

```ts
// src/core/wasm-loader.ts
const wasmSupported = typeof WebAssembly !== "undefined";
export const correlationMatrix = wasmSupported
  ? await loadWasmFn("correlation") // WASM: 30× faster
  : fallbackCorrelationMatrix; // TS: always available
```

### 8.3 WebGPU for truly parallel workloads (Phase S)

Monte Carlo simulation and correlation heatmap are embarrassingly parallel — perfect for GPU:

```ts
// src/core/gpu-compute.ts
const adapter = await navigator.gpu?.requestAdapter();
if (!adapter) return fallbackMonteCarlo(params); // CPU fallback always available

const device = await adapter.requestDevice();
// ... compute shader for Monte Carlo simulation paths
// 100K simulation paths in ~50ms vs 5s in pure JS
```

**Gradual enhancement:** WebGPU is progressive; the app works without it. GPU paths unlock
when available (Chrome 113+, Edge 113+, Firefox in WebGPU flag, Safari 18+).

### 8.4 SharedArrayBuffer for zero-copy Web Worker communication

The existing Web Worker in `src/sw.ts` passes data via structured clone (copy). With
`SharedArrayBuffer` and `Atomics`, the computation worker can share memory with main thread:

```ts
// src/core/worker-rpc.ts
const sharedBuffer = new SharedArrayBuffer(CANDLE_SIZE * MAX_CANDLES);
const candles = new Float64Array(sharedBuffer);
// Worker writes directly; main thread reads without copy
```

**Requirement:** COOP + COEP headers (already set in `public/_headers`).

---

## 9. Plugin & Extension System

A plugin system would make CrossTide the only OSS platform offering TradingView-level
extensibility without a subscription.

### 9.1 Plugin types

| Type                   | Capability                                 | Examples                                      |
| ---------------------- | ------------------------------------------ | --------------------------------------------- |
| **Indicator plugin**   | Custom calculation on candle data → series | Custom RSI variant, ML-based indicator        |
| **Chart type plugin**  | New LWC custom series renderer             | Volume footprint, Kagi charts                 |
| **Data source plugin** | New API endpoints with user-provided keys  | Alpaca, Tiingo, Bloomberg (paid)              |
| **Theme plugin**       | CSS custom property bundle                 | Dark high-contrast, Bloomberg dark, Solarized |
| **Screener plugin**    | Additional filter criteria                 | Insider buying filter, SEC filing alert       |

### 9.2 Plugin API (Phase T)

```ts
// Plugin contract (packages/plugin-api/src/types.ts)
export interface IndicatorPlugin {
  readonly id: string; // "my-custom-rsi"
  readonly name: string;
  readonly version: string;
  readonly calculate: (candles: readonly OHLCVBar[], params: Record<string, number>) => number[];
  readonly defaultParams: Record<string, number>;
  readonly paramSchema: v.BaseSchema; // Valibot
}

// Plugins are ES modules loaded dynamically
const plugin = (await import(pluginUrl)) as IndicatorPlugin;
validatePlugin(plugin); // Security checks
registerPlugin(plugin); // Add to indicator registry
```

**Security model:** Plugins run in an isolated Worker context. They cannot access DOM, user
data, credentials, or LocalStorage. Only the declared calculation API is exposed.

### 9.3 Plugin registry (Phase T)

Hosted at `plugins.crosstide.dev` (Cloudflare Pages):

- Public directory of curated plugins
- Versioned IPFS/R2 storage for plugin bundles
- SHA-256 integrity check before loading
- Ratings, install count, last-updated

---

## 10. Infrastructure & Deployment v6

### 10.1 Production stack ($0/mo target maintained)

| Layer             | Technology                 | Purpose                              | Cost                |
| ----------------- | -------------------------- | ------------------------------------ | ------------------- |
| Static hosting    | Cloudflare Pages           | SPA + `_headers` + `_redirects`      | Free                |
| Edge compute      | Cloudflare Workers (Hono)  | API proxy, cache, rate limit         | Free (100K req/day) |
| KV store          | Cloudflare KV              | Hot cache (quotes, search)           | Free (100K ops/day) |
| Database          | Cloudflare D1              | User sync, alert rules, CSP logs     | Free (5 GB)         |
| Object storage    | Cloudflare R2              | OHLCV archives, Parquet, logs        | Free (10 GB/mo)     |
| WebSocket fan-out | Cloudflare Durable Objects | Real-time per-symbol broadcast       | Free tier           |
| Error tracking    | GlitchTip (Fly.io)         | Source-mapped errors, alerting       | Free                |
| Uptime monitoring | Uptime Kuma (Fly.io)       | Status page + PagerDuty-style alerts | Free                |
| CI/CD             | GitHub Actions             | Test → Build → Deploy → Health check | Free (public repo)  |
| Docs site         | Cloudflare Pages (Astro)   | User guides, indicator docs          | Free                |
| WASM builds       | GitHub Actions runner      | AssemblyScript compile               | Free                |
| Plugin registry   | Cloudflare Pages           | Plugin marketplace site              | Free                |

### 10.2 CI/CD pipeline (updated)

```text
Push to main
  → GitHub Actions CI
    → typecheck (tsc --noEmit + tsconfig.sw.json --noEmit)
    → lint:all (eslint + stylelint + htmlhint + markdownlint + prettier)
    → test:coverage (vitest, ≥90% stmt, ≥80% branch)
    → test:browser (vitest browser mode: chromium + firefox + webkit)
    → build (vite build + workbox inject + build:wasm)
    → check:bundle (<200 KB gzip initial JS; WASM tracked separately)
    → check:supply-chain (npm audit --omit=dev + npm audit signatures)
    → deploy:pages (wrangler pages deploy)
    → deploy:worker (wrangler deploy)
    → health-check (curl /api/health; verify 200 + version match)
    → lighthouse (lhci autorun; perf≥90, a11y≥95, bp≥95, seo≥90)
    → notify (Discord webhook on failure)
```

### 10.3 Environment strategy

| Env          | Data source                     | Bindings     | URL                         |
| ------------ | ------------------------------- | ------------ | --------------------------- |
| `dev`        | Vite proxy → real Yahoo/Finnhub | None needed  | localhost:5173              |
| `preview`    | Deterministic fixtures (seeded) | Preview KV   | PR-xxx.crosstide.pages.dev  |
| `staging`    | Real APIs + KV cache            | All bindings | staging.crosstide.pages.dev |
| `production` | Real APIs + KV cache            | All bindings | crosstide.pages.dev         |

### 10.4 Monitoring targets

| Metric                  | Target  | Alert threshold |
| ----------------------- | ------- | --------------- |
| Worker p50 latency      | < 100ms | > 500ms         |
| Worker p99 latency      | < 500ms | > 2000ms        |
| KV cache hit rate       | > 85%   | < 60%           |
| Provider failover rate  | < 5%/hr | > 20%/hr        |
| Error rate              | < 0.1%  | > 1%            |
| Uptime                  | > 99.9% | Any downtime    |
| LCP (p75, 4G mid-range) | < 1.8s  | > 2.5s          |
| INP (p75)               | < 200ms | > 500ms         |

---

## 11. External APIs & Vendor Strategy v6

### 11.1 Data providers (tiered with 2026 additions)

| Provider            | Tier         | Free Limit     | Key Data Types                     | Risk               | Mitigation                             |
| ------------------- | ------------ | -------------- | ---------------------------------- | ------------------ | -------------------------------------- |
| Yahoo Finance v8    | Primary      | ~2K req/hr\*   | Quote, OHLCV, search, fundamentals | Breaks unannounced | Circuit breaker → Stooq                |
| Finnhub             | Secondary    | 60/min + WSS   | Quote, OHLCV, news, streaming      | Rate limits        | Market-hours guard                     |
| Stooq               | Tertiary     | Unlimited      | Daily OHLCV CSV                    | EOD only           | Historical bulk download               |
| CoinGecko           | Crypto       | 50/min         | Crypto OHLCV, market cap           | Schema changes     | Aggressive Valibot + KV cache          |
| FRED                | Macro        | 120/min        | VIX, rates, employment, M2         | Gov API, stable    | 24h KV cache                           |
| Twelve Data         | Alt primary  | 800 req/day    | Global stocks, forex, crypto       | New in 2026        | User API key; activated on request     |
| Alpaca Markets      | Broker/Data  | Free real-time | US stocks, ETFs (real-time)        | Requires account   | User-provided key; excellent free tier |
| Tiingo              | Premium alt  | 500/hr         | OHLCV, news, fundamentals          | $10/mo             | User key; corporate actions data       |
| Intrinio            | Fundamentals | 500/mo free    | 200+ fundamental metrics           | Limited free       | User key; deep balance sheet data      |
| Polygon             | Premium      | 5/min free     | Real-time, options, forex          | $29/mo+            | User key; options data when needed     |
| Alpha Vantage       | Last resort  | 25/day         | OHLCV, indicators                  | Very slow          | Last in failover chain                 |
| EOD Historical Data | Historical   | 20/day free    | 30yr+ adj. history, splits         | Small provider     | User key; corporate action supplement  |

\*Yahoo has no published rate limit but throttles above ~2K req/hr.

### 11.2 Provider failover matrix

```text
Real-time quote:
  Yahoo → Finnhub → Twelve Data (user key) → Tiingo (user key) → Alpha Vantage

OHLCV history:
  Yahoo → Stooq (daily) → Twelve Data → Tiingo → Polygon → Alpha Vantage

WebSocket streaming:
  Finnhub → Alpaca (user key) → Polygon (user key)

Crypto:
  CoinGecko → Finnhub → Binance (non-US) → CryptoCompare

Fundamentals:
  Yahoo quoteSummary → Intrinio (user key) → Tiingo (user key) → Polygon

Corporate actions:
  Yahoo → Tiingo (user key) → EOD Historical Data → Polygon
```

### 11.3 User-provided API keys model

For premium provider access, CrossTide uses a privacy-preserving key storage model:

- Keys stored in the encrypted D1 blob (AES-GCM, credential-derived key)
- Never sent to CrossTide servers unencrypted
- Sent directly from browser to provider API in dev; via Worker with user's key in prod

---

## 12. Data Quality & Financial Accuracy

A section entirely absent from v5. Financial data quality is as important as code quality.

### 12.1 Corporate action handling

| Action               | Effect on raw data                            | Required adjustment                                    |
| -------------------- | --------------------------------------------- | ------------------------------------------------------ |
| Stock split (2:1)    | Price halves, volume doubles on split date    | Multiply all pre-split prices by 0.5; multiply volumes |
| Reverse split (1:10) | Price 10×, volume 1/10 on date                | Multiply all pre-split prices by 10                    |
| Cash dividend        | Price drops by dividend amount on ex-div date | Adjust pre-ex-div prices: `price * (1 - div/price)`    |
| Stock dividend       | Price drops proportionally                    | Same as split treatment                                |
| Spinoff              | Creates new ticker; source price drops        | Separate series; link via corporate action record      |
| Ticker change        | Same company, new symbol                      | Chain historical data via FIGI or SEDOL identifier     |

### 12.2 OHLCV validation rules

All OHLCV data passes through `domain/validate-ohlcv.ts` before any calculation:

```ts
export function validateBar(bar: OHLCVBar): boolean {
  return (
    bar.high >= bar.low && // High ≥ Low
    bar.high >= bar.open && // High ≥ Open
    bar.high >= bar.close && // High ≥ Close
    bar.low <= bar.open && // Low ≤ Open
    bar.low <= bar.close && // Low ≤ Close
    bar.volume >= 0 && // Non-negative volume
    bar.close > 0 && // Positive close
    isFinite(bar.open) && // No NaN/Infinity
    isFinite(bar.close)
  );
}
```

### 12.3 Market hours and timezone handling

All time comparisons use Temporal API with explicit timezone:

```ts
import { Temporal } from "@js-temporal/polyfill";

const nyse = Temporal.Now.zonedDateTimeISO("America/New_York");
const isMarketHours =
  nyse.dayOfWeek <= 5 && // Mon-Fri
  nyse.hour >= 9 && // After 9:00 AM
  (nyse.hour < 16 || (nyse.hour === 9 && nyse.minute >= 30)); // 9:30 AM–4:00 PM
```

### 12.4 Data freshness indicators

All data displayed in the UI shows freshness:

- < 1 minute: green dot "Live"
- 1-15 minutes: yellow dot "X min ago"
- > 15 minutes: red dot "Delayed" with timestamp
- Cached/stale: grey indicator with cache expiry time

### 12.5 Temporal polyfill removal plan

| Browser      | Native Temporal | Target removal date |
| ------------ | :-------------: | :-----------------: |
| Chrome 131+  |  ✅ Available   |       Phase Q       |
| Firefox 127+ |  ✅ Available   |       Phase Q       |
| Safari 18.2+ |  ✅ Available   |       Phase Q       |

Implementation: conditional dynamic import saves ~8 KB in modern browsers:

```ts
if (!("Temporal" in globalThis)) {
  await import("@js-temporal/polyfill").then((m) => {
    Object.assign(globalThis, { Temporal: m.Temporal });
  });
}
```

---

## 13. Quality, Security & Observability v6

### 13.1 CI gates (comprehensive, all required)

```text
Gate                   Tool                       Threshold
─────────────────      ─────────────────────      ──────────────────────
typecheck              tsc --noEmit (strict)      0 errors
typecheck:sw           tsc -p tsconfig.sw.json    0 errors
lint                   eslint --max-warnings 0    0 warnings
lint:css               stylelint --max-warnings 0 0 warnings
lint:html              htmlhint                   0 errors
lint:md                markdownlint-cli2          0 violations
format                 prettier --check           0 diffs
test:coverage          vitest run --coverage      ≥90% stmt, ≥80% branch
test:browser           vitest browser mode        0 failures (3 browsers)
test:e2e               playwright                 0 failures (20 devices)
a11y                   axe-core in E2E           0 serious/critical
visual-regression      playwright screenshots     no baseline diffs (Phase Q)
contract:providers     pact/offline (Phase Q)     0 contract violations
mutation (Phase Q)     stryker                    ≥75% mutation score
build                  vite build                 0 errors
wasm-build             asc compiler (Phase S)     0 errors
bundle-size            check-bundle-size.mjs      <200 KB gzip initial JS
lighthouse             lhci autorun               perf≥90, a11y≥95, bp≥95, seo≥90
supply-chain           npm audit + signatures     0 high/critical vulns
worker-health          curl /api/health            200 + version match in staging
```

### 13.2 Security controls v6

| Control                             | Status     | Notes                                                    |
| ----------------------------------- | ---------- | -------------------------------------------------------- |
| CSP strict (no unsafe-inline/eval)  | ✅         | Generated by `scripts/gen-csp.mjs`                       |
| HSTS (preload, 1 year)              | ✅         | Submitted to preload list                                |
| X-Frame-Options: DENY               | ✅         | Prevents clickjacking                                    |
| Permissions-Policy (restrictive)    | ✅         | Camera, mic, geolocation, USB all denied                 |
| Valibot at all boundaries           | ✅         | API response, URL params, user input, DSL tokens         |
| `escapeHtml()` for user data        | ✅         | XSS prevention for all text inserted into DOM            |
| SRI hashes on preloads              | ✅         | Integrity verification                                   |
| KV rate limiting                    | ⬜ Phase P | KV binding required (currently per-isolate only)         |
| gitleaks secret scanning            | ✅         | Pre-commit + CI                                          |
| npm audit signatures                | ✅         | Supply chain integrity                                   |
| Signal DSL sandboxing               | ✅         | No dynamic eval; tokenizer whitelist; no member access   |
| Passkey (WebAuthn) auth             | ✅         | No password hashes stored                                |
| AES-GCM cloud sync                  | ✅         | Credential-derived key; server never sees plaintext      |
| Plugin sandbox (Phase T)            | ⬜         | Plugins run in isolated Worker; no DOM/credential access |
| Subresource Integrity for R2 assets | ⬜ Phase Q | SHA-256 manifest for WASM/model files served from R2     |
| Certificate Transparency monitoring | ⬜ Phase R | Cert change alerts via crt.sh API                        |

### 13.3 Observability stack

| Layer           | Tool                       | Data collected                                     |
| --------------- | -------------------------- | -------------------------------------------------- |
| Worker traces   | OTEL → Logpush → R2        | Request ID, route, status, latency, provider       |
| Client errors   | GlitchTip (25% sampled)    | Source-mapped stack traces, user agent, route      |
| RUM             | web-vitals → `/api/perf`   | LCP, INP, CLS per route per device class           |
| Uptime          | Uptime Kuma (60s interval) | /api/health endpoint; email + Discord alerting     |
| Analytics       | Plausible (self-hosted)    | Page views, events — no cookies, GDPR-compliant    |
| CSP violations  | Worker → D1                | Aggregated by directive + blocked URI (no PII)     |
| Provider health | In-app health card         | Circuit breaker states, latencies, failover counts |
| Perf regression | GitHub Actions + R2        | Bundle size, LCP/INP/CLS per commit — graphed      |

### 13.4 Testing philosophy evolution

The current 582-file test suite is strong but has gaps:

| Test type              | Current | Target        | Action                                              |
| ---------------------- | ------- | ------------- | --------------------------------------------------- |
| Unit (pure domain)     | ✅ 90%+ | ✅ Maintain   | fast-check property tests for all 80+ indicators    |
| Integration (Worker)   | ✅      | ✅ Expand     | Contract tests for all 36 routes                    |
| Browser compat         | ✅ New  | ✅ Maintain   | 20-device Playwright matrix                         |
| Visual regression      | ⬜      | Phase Q       | Playwright screenshot baselines for all chart types |
| Mutation testing       | ⬜      | Phase Q       | Stryker, ≥75% mutation score on domain/             |
| Contract (providers)   | ⬜      | Phase Q       | Pact contracts for Yahoo/Finnhub response shapes    |
| Performance regression | ⬜      | Phase R       | Track LCP/INP/bundle per commit in R2               |
| Accessibility audit    | ✅ axe  | Phase Q + AAA | axe-core E2E + manual screen reader audit           |
| Fuzz testing (DSL)     | ⬜      | Phase Q       | Fuzz the Signal DSL tokenizer/evaluator for safety  |

---

## 14. Documentation Strategy v6

| Document                          | Purpose                               | Status     |
| --------------------------------- | ------------------------------------- | ---------- |
| `README.md`                       | Quick start, feature matrix, badges   | ✅ Current |
| `CHANGELOG.md`                    | Per-release changes                   | ✅ Current |
| `docs/ARCHITECTURE.md`            | System design, layers, data flow      | ✅ Current |
| `docs/ROADMAP.md`                 | Strategic direction (this document)   | ✅ v6      |
| `docs/adr/` (11 ADRs)             | Decision rationale and consequences   | ✅ Current |
| `CONTRIBUTING.md`                 | PR process, code standards, ADR guide | ✅ Current |
| `SECURITY.md`                     | Responsible disclosure policy         | ✅ Current |
| `.github/copilot-instructions.md` | AI assistant conventions (canonical)  | ✅ Current |
| `docs-site/` (Astro Starlight)    | User guides, indicator docs           | △ Stubs    |
| `packages/plugin-api/README`      | Plugin SDK documentation              | ⬜ Phase T |
| OpenAPI spec `/openapi.json`      | Auto-generated Worker API reference   | ✅ Current |
| Tutorial series (Astro)           | "Build your first signal strategy"    | ⬜ Phase R |

**Documentation principles:**

1. Code is source of truth — docs describe intent and decisions, not implementation
2. One canonical location — no duplicated information across docs
3. Version-annotated — diagrams and tables include version stamps
4. Living ADRs — every major architectural decision gets an ADR within 24 hours
5. Runnable examples — code in docs is verified by CI (vitest doc-tests or scripts)

**Docs debt to clear:**

- Populate Astro docs-site stubs for all 80+ domain modules (automated from JSDoc)
- Add architectural diagram for Worker middleware stack and data flow

---

## 15. Performance Budget v6

| Metric                        | Budget         | Current      | WASM added  | Status            |
| ----------------------------- | -------------- | ------------ | ----------- | ----------------- |
| JS initial (gzip)             | < 200 KB       | 158 KB       | no change   | ✅ 42 KB headroom |
| CSS (gzip)                    | < 30 KB        | ~8 KB        | no change   | ✅                |
| HTML                          | < 8 KB         | ~4 KB        | no change   | ✅                |
| Lazy card chunk               | < 50 KB each   | ~25 KB avg   | no change   | ✅                |
| LWC chunk                     | < 50 KB        | ~45 KB       | no change   | ✅                |
| **WASM modules (Phase S)**    | < 200 KB total | 0 KB         | ~150 KB est | ⬜ budget set     |
| **WebLLM model (Phase S)**    | On-demand R2   | 0 KB         | ~2.4 GB R2  | ⬜ lazy-loaded    |
| Fonts (Inter Variable)        | < 25 KB        | woff2 subset | no change   | ✅                |
| **Total initial JS+CSS+HTML** | **< 200 KB**   | **~170 KB**  | **~170 KB** | ✅                |
| LCP (4G, mid Android)         | < 1.8s         | ~1.2s        | no change   | ✅                |
| INP (p75)                     | < 200ms        | ~80ms        | no change   | ✅                |
| CLS                           | < 0.05         | ~0.02        | no change   | ✅                |
| Lighthouse Performance        | ≥ 90           | ≥ 90         | no change   | ✅                |
| Lighthouse Accessibility      | ≥ 95           | ≥ 95         | no change   | ✅                |
| Time to Interactive           | < 2.5s         | ~1.5s        | no change   | ✅                |
| SW precache entries           | < 60           | 49           | +2 (WASM)   | ✅                |

**WASM budget enforcement:** Add WASM size check to `scripts/check-bundle-size.mjs`.
WASM modules are lazy-loaded on demand — they never block initial page render.

---

## 16. Phase P — v12.0.0 "Real Data & Architecture Foundation"

**Theme:** Make the backend functional. No new features. Fix what blocks production.
**Duration:** 4-6 weeks · **Exit gate:** staging URL serves real AAPL data

| #   | Task                                                                          | Priority | Status |
| --- | ----------------------------------------------------------------------------- | -------- | ------ |
| P1  | Wire `wrangler.toml`: KV, D1, DO bindings (existential prerequisite)          | P0       | ✅     |
| P2  | Run D1 migrations in staging: `wrangler d1 migrations apply crosstide`        | P0       | 🔄     |
| P3  | Worker `/api/quote` and `/api/chart`: real Yahoo calls + KV TTL cache         | P0       | ✅     |
| P4  | Corporate action adjustment: split-adjusted default, raw optional             | P0       | ✅     |
| P5  | KV-backed rate limiting (replace per-isolate; ADR-0004 already written)       | P1       | ✅     |
| P6  | Passkey auth wired to D1 `user_sync` table                                    | P1       | ✅     |
| P7  | Signal stores: `createWatchlistStore()`, `createPortfolioStore()`             | P1       | ✅     |
| P8  | Route loaders: `defineRoute({ loader })` with AbortController cancellation    | P1       | ✅     |
| P9  | Error boundaries: try-catch in all 54 card `mount()`/`update()` methods       | P1       | ✅     |
| P10 | Extract `<ct-data-table>` Web Component (virtual scroll, sort, ARIA)          | P1       | ✅     |
| P11 | Extract `<ct-stat-grid>`, `<ct-chart-frame>`, `<ct-empty-state>`              | P1       | ✅     |
| P12 | Gitignore `src/domain/debug.log` and `src/cards/debug.log` (artifact cleanup) | P2       | ✅     |
| P13 | Structured logging in Worker (JSON, request ID, latency, provider choice)     | P2       | ✅     |
| P14 | GlitchTip source-map upload in CI deploy step                                 | P2       | ✅     |
| P15 | Conditional Temporal polyfill (detect native support first)                   | P2       | ✅     |
| P16 | OpenAPI → TypeScript client codegen for Worker API                            | P2       | ✅     |
| P17 | View Transitions API for route navigation (progressive enhancement)           | P2       | ✅     |

**Exit criteria:**

- `/api/quote/AAPL` returns live Yahoo data with KV caching in staging
- `/api/chart/AAPL?range=1y` returns real OHLCV with corporate actions applied
- D1 migrations applied; `/api/sync` accepts passkey assertion
- Rate limiting persists across isolate evictions
- At least 3 cards migrated to signal stores
- `<ct-data-table>` used in Watchlist, Screener, Alert History
- Error boundary wraps all 54 cards — no single card crash kills app

---

## 17. Phase Q — v13.0.0 "Data Depth & Charting"

**Theme:** Close the biggest feature gaps vs commercial competitors.
**Duration:** 4-6 weeks · **Exit gate:** fundamental screener filters + Heikin-Ashi live

| #   | Task                                                                                | Priority | Status |
| --- | ----------------------------------------------------------------------------------- | -------- | ------ |
| Q1  | Fundamental data card: real P/E, EPS, revenue, margins, market cap                  | P0       | ✅     |
| Q2  | Extract `<ct-filter-bar>` and `<ct-chart-frame>` Web Components                     | P1       | ✅     |
| Q3  | Screener: fundamental filters (P/E < x, market cap, dividend yield, sector)         | P1       | ✅     |
| Q4  | Indicator configuration UI: per-indicator period/threshold/color via Settings       | P1       | ✅     |
| Q5  | Volume Profile overlay (LWC custom series: horizontal histogram at price levels)    | P1       | ✅     |
| Q6  | Economic data overlay: FRED VIX, yield curve, M2 on chart secondary axis            | P2       | ✅     |
| Q7  | Backtest: commission model (fixed + %) + slippage + Kelly criterion position sizing | P1       | ✅     |
| Q8  | Additional drawing tools: horizontal ray, price range, date range, XABCD            | P2       | ✅     |
| Q9  | Contract tests: offline Pact contracts for Yahoo v8 and Finnhub schemas             | P2       | ✅     |
| Q10 | Visual regression: Playwright screenshot baselines for all chart types              | P2       | ✅     |
| Q11 | CSS Anchor Positioning: replace JS tooltip positioning in charts/screener           | P2       | ✅     |
| Q12 | CSS `popover` attribute: replace JS-managed modals/overlays                         | P2       | ✅     |
| Q13 | fast-check property tests: all 80+ indicator calculators fuzzed                     | P2       | ✅     |
| Q14 | Stryker mutation testing: ≥75% mutation score for domain/                           | P3       | ⬜     |
| Q15 | R2 cold OHLCV archival: 20-year daily history as Parquet (top 500 tickers)          | P3       | ⬜     |
| Q16 | Drop Temporal polyfill for Chrome/FF/Safari ≥ required versions                     | P2       | ✅     |

**Exit criteria:**

- Fundamental card shows real P/E, EPS, revenue for any S&P 500 ticker
- Screener filters by P/E < 15 AND market cap > $1B
- Volume Profile renders correctly on chart
- Backtest shows realistic results with fees included
- Contract tests catch a real Yahoo schema change before production
- All 5 base Web Components extracted and used across cards

---

## 18. Phase R — v14.0.0 "Polish, Scale & Distribution"

**Theme:** Production hardening. Public launch preparation.
**Duration:** 4-6 weeks · **Exit gate:** public Product Hunt launch

| #   | Task                                                                          | Priority | Status |
| --- | ----------------------------------------------------------------------------- | -------- | ------ |
| R1  | Bar Replay: historical playback, step/speed controls, indicator recalculation | P1       | ⬜     |
| R2  | DSL expansion: `for` loops, arrays, `plot()` for custom indicators            | P1       | ⬜     |
| R3  | Durable Object WebSocket fan-out for production streaming                     | P1       | ⬜     |
| R4  | Capacitor wrapper for iOS + Android App Store distribution                    | P2       | ⬜     |
| R5  | News feed: structured NLP sentiment scoring in Worker (Finnhub + RSS)         | P2       | ⬜     |
| R6  | Multi-timeframe analysis: sync 2-4 charts at different intervals              | P2       | ⬜     |
| R7  | Alert server-side evaluation via D1 + Durable Object scheduled task           | P2       | ⬜     |
| R8  | WCAG 2.2 AAA for critical paths: contrast AAA, error suggestion, timing       | P1       | ⬜     |
| R9  | OpenTelemetry traces in Worker (distributed tracing)                          | P2       | ⬜     |
| R10 | Performance regression tracking: store metrics per commit in R2               | P2       | ⬜     |
| R11 | Certificate transparency monitoring (crt.sh API alerting)                     | P3       | ⬜     |
| R12 | README showcase: GIF demos, comparison table, install-size badge              | P1       | ⬜     |
| R13 | Load testing: 10K tickers in screener, verify virtual scroll < 200ms INP      | P1       | ⬜     |
| R14 | Astro docs-site: populate all indicator MDX stubs (automated from JSDoc)      | P1       | ⬜     |
| R15 | Public launch: GitHub Release + Product Hunt + Hacker News                    | P0       | ⬜     |

**Exit criteria:**

- Bar Replay plays 1 year of daily data at 10× speed with indicators
- DO WebSocket streaming works in production
- Capacitor builds produce iOS + Android binaries
- Lighthouse scores maintained post-launch under real traffic
- Product Hunt launch post published

---

## 19. Phase S — v15.0.0 "Intelligence & AI"

**Theme:** In-browser AI that no competitor offers. Pure on-device — no API keys, no data leakage.
**Duration:** 6-8 weeks · **Exit gate:** natural language screener working in Chromium

| #   | Task                                                                                 | Priority | Status |
| --- | ------------------------------------------------------------------------------------ | -------- | ------ |
| S1  | WebLLM integration: Phi-3.5-mini via WebGPU; graceful CPU fallback                   | P0       | ⬜     |
| S2  | Natural language → Screener DSL translation                                          | P0       | ⬜     |
| S3  | Natural language → Signal DSL translation                                            | P1       | ⬜     |
| S4  | Chart pattern natural language explanation ("What does this Head & Shoulders mean?") | P1       | ⬜     |
| S5  | AssemblyScript WASM: RSI, EMA, SMA, Bollinger, MACD (hot paths, 5-20× speedup)       | P1       | ⬜     |
| S6  | AssemblyScript WASM: correlation matrix, covariance, efficient frontier              | P1       | ⬜     |
| S7  | WebGPU compute: Monte Carlo simulation (target: 100K paths in < 100ms)               | P2       | ⬜     |
| S8  | WebGPU compute: sector heatmap, correlation heatmap (GPU-accelerated)                | P2       | ⬜     |
| S9  | ONNX pattern recognition: train classifier; wire to chart annotations                | P1       | ⬜     |
| S10 | Anomaly detection overlay: volume spikes, price outliers, regime changes             | P2       | ⬜     |
| S11 | SharedArrayBuffer: zero-copy OHLCV transfer to compute Web Worker                    | P2       | ⬜     |
| S12 | AI disclaimer framework: clear disclosure on all AI-generated content                | P0       | ⬜     |
| S13 | AI telemetry: anonymous quality measurement (opt-in only)                            | P3       | ⬜     |
| S14 | Semantic screener search: embedding-based "stocks similar to AAPL in 2021"           | P3       | ⬜     |
| S15 | Add `assemblysc` to devDeps; WASM build in CI; WASM size budget enforcement          | P0       | ⬜     |

**Exit criteria:**

- "Find tech stocks with RSI below 30 and rising volume" → correct DSL expression
- WASM RSI/EMA correct within 1e-10 of TS reference; performance ≥ 5× faster
- Monte Carlo 100K paths in < 200ms on M1 Mac
- Pattern recognition fires on real AAPL chart data with ≥ 70% accuracy
- No data ever leaves the browser for AI features

---

## 20. Phase T — v16.0.0 "Ecosystem & Community"

**Theme:** Make CrossTide the platform for financial OSS. Plugin system, SDKs, community.
**Duration:** 8-12 weeks · **Exit gate:** 3 community plugins published

| #   | Task                                                                              | Priority | Status |
| --- | --------------------------------------------------------------------------------- | -------- | ------ |
| T1  | Plugin API: `packages/plugin-api/` — indicator, chart-type, data-source contracts | P0       | ⬜     |
| T2  | Plugin sandbox: Worker-isolated execution; no DOM/credential access               | P0       | ⬜     |
| T3  | Plugin registry site: `plugins.crosstide.dev` (Cloudflare Pages)                  | P1       | ⬜     |
| T4  | Plugin integrity: SHA-256 manifest; SRI checks before load                        | P0       | ⬜     |
| T5  | pnpm migration: evaluate pnpm + Turborepo for `packages/` monorepo                | P2       | ⬜     |
| T6  | `packages/domain/` extraction: publish `@crosstide/domain` to npm (MIT)           | P1       | ⬜     |
| T7  | `packages/plugin-api/` extraction: publish `@crosstide/plugin-api` to npm         | P1       | ⬜     |
| T8  | WebTransport evaluation: pilot with synthetic server; plan migration from WS      | P3       | ⬜     |
| T9  | Community templates: "Build a custom indicator in 10 minutes" tutorial            | P1       | ⬜     |
| T10 | Contributor onboarding: `CONTRIBUTING.md` + dev container + issue templates       | P1       | ⬜     |
| T11 | i18n expansion: ES, DE, ZH, JA locales (beyond existing EN + 5 locales)           | P2       | ⬜     |
| T12 | Multi-tenant mode: multiple watchlists + portfolios per passkey                   | P2       | ⬜     |
| T13 | CSV/Excel import for portfolio positions                                          | P2       | ⬜     |
| T14 | Broker integration API: read-only positions from Alpaca, Schwab, IBKR (user key)  | P3       | ⬜     |
| T15 | Stryker mutation testing: achieve ≥80% mutation score across full codebase        | P2       | ⬜     |

**Exit criteria:**

- `@crosstide/domain` published on npm; installable and usable standalone
- Plugin sandbox prevents any plugin from accessing user data
- 3 community-contributed plugins listed in registry
- "Build a plugin" tutorial has ≥ 50 completions
- pnpm + Turborepo build is faster than npm workspaces

---

## 21. Refactor & Rewrite Backlog v6

| #    | Refactor                                             | Why                                           | Phase | Status |
| ---- | ---------------------------------------------------- | --------------------------------------------- | ----- | ------ |
| RF1  | Wire `wrangler.toml` bindings                        | Existential — Worker can't do its job         | P1    | ⬜     |
| RF2  | `main.ts` → thin bootstrap (stores handle data)      | Data flow traceability; testability           | P7    | ⬜     |
| RF3  | Card data-binding → signal stores                    | Replace scattered wiring; 54 cards to migrate | P7    | ⬜     |
| RF4  | Tables → `<ct-data-table>` Web Component             | Code dedup; consistent keyboard UX; ARIA      | P10   | ⬜     |
| RF5  | Stat sections → `<ct-stat-grid>`, `<ct-empty-state>` | 40% card boilerplate eliminated               | P11   | ⬜     |
| RF6  | Router: loaders + query strings + View Transitions   | Eliminate data waterfalls; smooth navigation  | P8/Q  | ⬜     |
| RF7  | Rate limiting: KV-backed (was per-isolate)           | Production-grade; consistent across CF nodes  | P5    | ⬜     |
| RF8  | Backtest: commission + slippage + position sizing    | Realistic results; academic credibility       | Q7    | ⬜     |
| RF9  | Indicator config: JSON schema per method             | User-tunable RSI period, BB multiplier, etc.  | Q4    | ⬜     |
| RF10 | Temporal polyfill: conditional dynamic import        | Saves ~8 KB for modern browsers               | Q16   | ⬜     |
| RF11 | `debug.log` removal + gitignore rules                | Artifact cleanup; no debug output in repo     | P12   | ✅     |
| RF12 | ONNX modules: wire real model or remove              | Dead code or living feature — decide          | P     | ⬜     |
| RF13 | Card error handling: universal try-catch boundary    | Resilience; one card crash ≠ app crash        | P9    | ⬜     |
| RF14 | `packages/` workspace populate or prune              | npm workspaces declared but empty stubs       | T5    | ⬜     |
| RF15 | CSS tooltips: Anchor Positioning replaces JS         | Eliminates positioning JS entirely            | Q11   | ⬜     |
| RF16 | Modal system: `popover` API replaces JS overlays     | Native browser API; no accessibility gaps     | Q12   | ⬜     |

---

## 22. Decision Log v6

### Reaffirmed (unanimous, 6th review)

| Decision                 | First Introduced | Reaffirmed |
| ------------------------ | ---------------- | ---------- |
| Vanilla TS + signals     | v1.0             | 6th time   |
| Pure domain layer        | v1.0             | 6th time   |
| Valibot over Zod         | v7.8             | 4th time   |
| Multi-provider failover  | v3.0             | 5th time   |
| Cloudflare all-in        | v4.0             | 5th time   |
| Lightweight Charts v5    | v2.0             | 5th time   |
| Workbox Service Worker   | v3.0             | 5th time   |
| Hono for Worker          | v5.0             | 4th time   |
| morphdom for DOM updates | v8.0             | 3rd time   |
| Passkey-only auth        | v9.0             | 3rd time   |
| CSS Layers + @scope      | v7.0             | 4th time   |
| TypeScript 6 strict mode | v11.0            | 2nd time   |
| Temporal API             | v9.0             | 3rd time   |
| fast-check               | v11.35           | 1st time   |

### Reversed or Refined (v6)

| Old Decision                    | New Decision                                    | Phase |
| ------------------------------- | ----------------------------------------------- | ----- |
| Browserslist in package.json    | `.browserslistrc` file only (no dual config)    | Done  |
| ESLint compat on Worker files   | `compat/compat: off` for Worker (CF V8 runtime) | Done  |
| wrangler.toml has no bindings   | All KV/D1/DO bindings wired                     | P     |
| Passkey auth isolated           | Wired to D1 user_sync                           | P     |
| Temporal polyfill always loaded | Conditional dynamic import                      | Q     |
| npm workspaces declared, unused | Populate or pnpm + Turborepo                    | T     |
| Per-isolate rate limiting       | KV-backed sliding window                        | P     |
| Debug.log files untracked       | Added to .gitignore                             | P     |

### New Decisions (v6)

| Decision                            | Rationale                                             | Phase |
| ----------------------------------- | ----------------------------------------------------- | ----- |
| AssemblyScript WASM for domain      | 10-100× speedup; domain purity enables WASM port      | S     |
| WebGPU for parallel computation     | Monte Carlo + correlation heatmap GPU-accelerated     | S     |
| WebLLM + Phi-3.5 mini NL queries    | On-device; no API key; unique privacy advantage       | S     |
| View Transitions API for navigation | Native browser animations; zero JS cost               | P/Q   |
| Plugin system with sandbox          | TradingView-level extensibility in OSS                | T     |
| OpenAPI → TS codegen                | Eliminate handwritten fetch boilerplate               | Q     |
| Contract tests for providers        | Catch Yahoo/Finnhub schema breaks offline             | Q     |
| Visual regression for charts        | Catch LWC rendering regressions in CI                 | Q     |
| R2 for cold OHLCV archival          | Eliminate provider dependency for historical analysis | Q     |
| CSS Anchor Positioning              | Native tooltip positioning; no JS library needed      | Q     |
| Stryker mutation testing            | Verify tests actually catch bugs                      | Q/T   |
| GlitchTip source-map upload         | Production error correlation to source lines          | P     |
| `@crosstide/domain` npm publish     | Make domain layer independently usable                | T     |

---

## 23. Risks & Mitigations v6

| Risk                                | Likelihood | Impact   | Mitigation                                                                   |
| ----------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------- |
| Yahoo Finance breaks/changes schema | High       | High     | 5 fallback providers; Valibot at boundary; contract tests catch it offline   |
| wrangler.toml bindings cause outage | Medium     | High     | Test all bindings in staging before prod deploy; canary deploys              |
| WebGPU unavailable (Safari, older)  | Medium     | Low      | WASM fallback always available; WebGPU is progressive enhancement only       |
| WebLLM 2.4GB download is too heavy  | High       | Medium   | LLM download is opt-in, not on initial load; progress bar + cancel option    |
| Cloudflare free tier limits hit     | Low        | High     | Monitor usage daily; Hono portable to Deno Deploy / Vercel Edge in < 1 day   |
| ONNX model wrong signals            | Medium     | Medium   | Advisory only; consensus engine requires agreement; backtesting validates    |
| KV cache stale data served          | Medium     | Medium   | Market-hours-aware TTL; manual purge endpoint; versioned keys                |
| D1 data loss                        | Low        | High     | User-owned encrypted blobs; re-sync from client is canonical                 |
| Plugin executes malicious code      | Medium     | Critical | Worker sandbox; no DOM access; SHA-256 integrity; curated registry           |
| npm supply chain attack             | Low        | Critical | socket.dev PR checks; gitleaks; npm audit weekly; lockfile-only installs     |
| Contributor breaks layer rules      | Medium     | Medium   | ESLint import-x layer enforcement; CI blocks merge; ADR process              |
| WebAssembly bugs (off-by-one)       | Medium     | High     | WASM output tested against TS reference to 1e-10 tolerance in CI             |
| AssemblyScript limitations          | Medium     | Medium   | Fall back to TS for modules with complex object graphs; WASM for arrays only |
| AI model hallucinates DSL syntax    | High       | Medium   | DSL validator rejects invalid syntax before execution; test suite for NL→DSL |
| Bar replay breaks on splits         | Medium     | Medium   | Bar replay uses adjusted prices by default; raw mode labeled clearly         |

---

## 24. Scope Boundaries v6

### CrossTide IS

- A **quantitative and technical analysis** dashboard
- A **consensus signal generation** engine (unique 12-method approach)
- A **portfolio analytics and risk management** tool
- A **privacy-first, offline-capable** PWA with optional E2EE cloud sync
- **Open source (MIT) and self-hostable** at $0/mo
- A **learning tool** for quantitative finance methods
- An **extensible platform** via plugin system (Phase T)

### CrossTide IS NOT

| Out of Scope                             | Why                                                        |
| ---------------------------------------- | ---------------------------------------------------------- |
| Trading platform (order execution)       | Regulatory burden; signals are educational, not advice     |
| Full options chain / Greeks              | Massive data complexity; out of core competency            |
| Social network (profiles, chat)          | Privacy-first architecture is incompatible                 |
| Robo-advisor (automated recommendations) | Regulatory liability                                       |
| News aggregator (primary function)       | RSS/sentiment is supplementary; not our core value         |
| Multi-user collaboration / sharing       | User isolation is the privacy model; passkeys are personal |
| Broker integration (order routing)       | Read-only positions (Phase T) only; never order execution  |

### Reconsidered but rejected (v6)

| Feature               | Rejection Reason                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------- |
| React/Vue/Svelte      | Bundle 2-3× for equivalent UX; signals + Web Components is the right model for this use case |
| D3.js for charts      | 60 KB; inferior performance to LWC Canvas; LWC plugin API achieves custom types at 2-5 KB    |
| GraphQL Worker API    | Over-engineering; REST + OpenAPI codegen achieves full type safety at lower complexity       |
| Redis/Valkey          | Cloudflare KV at $0 is equivalent for our access patterns                                    |
| Tailwind CSS          | CSS Layers + custom properties achieves same goals; no 50 KB utility output                  |
| Kubernetes            | Cloudflare Workers scales automatically at $0; no operational overhead acceptable            |
| Storybook             | `docs/components-preview.html` + Astro + visual regression covers this better                |
| PostgreSQL / Supabase | D1 at $0 handles our simple schema; no self-hosting requirement                              |
| Rust WASM             | AssemblyScript is sufficient and TypeScript-adjacent; revisit post Phase S                   |
| WebTransport          | Not yet supported by Finnhub; plan when provider support materializes (Phase T)              |
| Electron desktop      | Tauri v2 at 3 MB vs 150 MB; PWA covers majority; Capacitor covers mobile stores              |

---

## 25. Engineering Non-Negotiables

### 25.1 Code Integrity

1. **No suppressions** — no `eslint-disable`, `@ts-ignore`, `--force` flags. Fix root causes.
2. **No dead artifacts** — every file, export, dep, and config entry must be referenced.
3. **No `TODO` in code** — open a GitHub Issue for every deferred item.
4. **No secrets in source** — `.env` for local keys; Cloudflare Secrets for production.
5. **Validation at all boundaries** — sanitize every external input before processing.

### 25.2 Architecture Integrity

1. **Layer imports are one-way** — domain never imports from core/cards/ui.
2. **Domain stays pure** — no DOM, no `fetch`, no `Date.now()`, no `Math.random()`.
3. **Worker imports use `.js`** — CF Workers ESM requires explicit extensions.
4. **patchDOM, not innerHTML** — raw innerHTML breaks morphdom diffing.
5. **No floating promises** — `void asyncFn()` or `await`. Lint enforces this.
6. **WASM modules have TS reference parity** — tested to 1e-10 tolerance.

### 25.3 Quality Gates (all required before merge)

| Gate       | Command                 | Requirement                          |
| ---------- | ----------------------- | ------------------------------------ |
| Type check | `npm run typecheck`     | Zero errors (strict, both tsconfigs) |
| ESLint     | `npm run lint`          | Zero warnings                        |
| Stylelint  | `npm run lint:css`      | Zero CSS warnings                    |
| HTMLHint   | `npm run lint:html`     | Zero issues                          |
| Prettier   | `npm run format:check`  | Exit 0                               |
| Tests      | `npm run test:coverage` | All pass, ≥90% stmt, ≥80% branch     |
| Browser    | `npm run test:browser`  | All pass (3 browser engines)         |
| Build      | `npm run build`         | Zero errors                          |
| Bundle     | `npm run check:bundle`  | < 200 KB gzip initial JS             |

Run all: `npm run ci`

### 25.4 Roadmap Governance

- **ROADMAP.md is the single source of truth** for scope, priorities, and sequencing.
- **ADR required** for every architectural decision within 24 hours of implementation.
- **Phased execution** — work one phase at a time; no big-bang scope changes.
- **Each phase has exit criteria** — measure them; don't move on without meeting them.
- **Status must be accurate** — mark items ✅ only when the _exit criteria_ are met, not when code is merged.

### 25.5 AI assistant governance

```text
Control prompt (paste at start of each Copilot session):
- Treat ROADMAP.md Phase exit criteria as the definition of done.
- Domain layer must be pure: no DOM, no fetch, no Date.now(), no Math.random().
- Worker tests mock globalThis.fetch — no real network calls in tests.
- Use patchDOM() not innerHTML. Use void asyncFn() not bare floating promises.
- No eslint-disable, no @ts-ignore, no TODO in code.
- WASM modules must have TS reference parity tests (1e-10 tolerance).
- ADR required within 24h of any architectural decision.
- Every response: 1) what done, 2) what deferred, 3) validation performed.
- Git commit after each sprint with conventional commit format.
```

---

## Appendix A: Completed Phases (History)

| Phase | Version   | Theme             | Key Deliverables                                              |
| ----- | --------- | ----------------- | ------------------------------------------------------------- |
| A-C   | v1-v4     | Foundation        | Signals, router, watchlist, chart, 20 indicators              |
| D-E   | v5-v6     | Data & PWA        | Multi-provider, SW, IDB, OPFS, 50 indicators                  |
| F-G   | v7        | Quality           | Strict TS, 90% coverage, WCAG AA, Lighthouse 90+              |
| H     | v8-v9     | Advanced features | Passkey sync, ONNX AI, Tauri, D1 design                       |
| I     | v10       | Features          | Signal DSL, backtest, screener, heatmap, earnings             |
| J-K   | v11.0     | Performance       | morphdom, virtual scroll, container queries, event delegation |
| L     | v11.x     | Data depth        | Fundamental overlay, seasonal charts, multi-condition alerts  |
| M-N   | v11.x     | Polish            | i18n, mobile audit, load testing, UX polish                   |
| O     | v11.28-35 | Compat & Cleanup  | Cross-browser tests (20 devices), dead-file removal, ESLint   |

---

## Appendix B: Daily Workflow

1. Pick the highest-priority open item in the current phase.
2. Create a branch; implement in a small, reviewable change set.
3. Run validation: `npm run ci`.
4. Record an ADR if an architectural decision was made.
5. Mark the item status accurately (⬜ → ✅ only when exit criteria are met).
6. Git commit with conventional commit format; open PR if breaking change.

### Item status key

| Symbol | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| ✅     | Done — exit criteria verified in staging or CI              |
| ⬜     | Not started                                                 |
| 🔄     | In progress                                                 |
| ⏸      | Blocked — dependency unmet; documented in item notes        |
| ❌     | Deferred — moved out of phase; added to backlog with reason |

---

_This roadmap is a living document. Updated on every phase completion._
_Supersedes: ROADMAP v5 (May 4, 2026), archived in git history at v11.28.0._
