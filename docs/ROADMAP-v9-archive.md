# CrossTide — Strategic Roadmap v9 (Rethink Everything)

> **Date:** May 21, 2026
> **Current version:** v11.41.0
> **Codebase:** 212 domain modules · 52 cards · 37 Worker routes · 608 test files
> **Bundle:** 158 KB gzip (budget 200 KB) · 49 SW precache entries
> **Stack:** TypeScript 6.0 · Vite 8 · Vitest 4 · Hono 4 · morphdom · LWC v5
> **ADRs on record:** 11 (all accepted)
> **Previous roadmap:** v8 archived at `docs/ROADMAP-v8-archive.md`
> **Key change from v8:** Full architectural rethink. Every past decision re-evaluated against 2026 state-of-the-art. Aim: best-in-class open-source financial platform.

---

## Table of Contents

1. [Foundational Rethink — Why v9](#1-foundational-rethink--why-v9)
2. [State of the Art: Competitive Landscape 2026](#2-state-of-the-art-competitive-landscape-2026)
3. [Decision Audit — Every Major Choice Reopened](#3-decision-audit--every-major-choice-reopened)
4. [Frontend Architecture v9](#4-frontend-architecture-v9)
5. [Backend & Infrastructure v9](#5-backend--infrastructure-v9)
6. [Data Strategy & API Ecosystem v9](#6-data-strategy--api-ecosystem-v9)
7. [AI, ML & Intelligent Compute v9](#7-ai-ml--intelligent-compute-v9)
8. [Developer Experience & Tooling v9](#8-developer-experience--tooling-v9)
9. [Documentation & Knowledge Strategy v9](#9-documentation--knowledge-strategy-v9)
10. [Quality, Security & Observability v9](#10-quality-security--observability-v9)
11. [Performance Architecture v9](#11-performance-architecture-v9)
12. [Execution Phases](#12-execution-phases)
13. [Refactor & Rewrite Backlog](#13-refactor--rewrite-backlog)
14. [Risks, Mitigations & Scope Boundaries](#14-risks-mitigations--scope-boundaries)
15. [Engineering Non-Negotiables](#15-engineering-non-negotiables)

---

## 1. Foundational Rethink — Why v9

### 1.1 The v8 assessment was honest — v9 goes deeper

v8 confronted "Truth 1: this is a demo, not a product." That was correct. But v8 stopped at deployment mechanics. v9 asks harder questions:

**Question 1: Is "vanilla TypeScript + signals" still the right architecture for 2026?**
The landscape shifted. Solid 2.0 shipped. Svelte 5 runes are production-ready. React Server Components matured. Web Components have native declarative shadow DOM. Our 0 KB runtime advantage must be re-evaluated against DX velocity, contributor attraction, and ecosystem maturity.

**Question 2: Is Cloudflare-only the right infrastructure bet?**
CF Workers are excellent and free. But D1 is still beta-quality. Durable Objects pricing changed. R2 egress is free but compute is limited. Vercel/Netlify/Fly.io have caught up. The portability story (Hono) was always the insurance — should we exercise it?

**Question 3: Is the feature surface too wide for a solo project?**
212 domain modules. 52 cards. 37 Worker routes. One developer. The maintenance surface is enormous. Should we radically narrow scope to ship a smaller, polished product that attracts contributors — then expand?

**Question 4: Does the documentation strategy match the audience?**
11 ADRs, ARCHITECTURE.md, ROADMAP.md — all internal. Zero user-facing guides, zero video content, zero interactive examples. OpenBB has 67.9K stars because they invested in developer experience documentation. Ghostfolio has 8.5K because they have a live demo and Docker one-liner.

**Question 5: Should we pivot from "financial analysis dashboard" to "financial data platform"?**
OpenBB's pivot from terminal to "Open Data Platform" unlocked AI agent integration, MCP servers, and enterprise adoption. CrossTide's pure domain layer + Worker API is already an ODP-in-waiting. Should the platform be the product?

### 1.2 Verified codebase metrics (May 21, 2026)

| Metric                      | Count       | Assessment                              |
| --------------------------- | ----------- | --------------------------------------- |
| Domain modules              | 212         | World-class depth, 40% dormant          |
| Card components             | 52          | Full coverage of use cases              |
| Worker routes               | 37          | Comprehensive API surface               |
| Worker providers            | 5           | Yahoo, Finnhub, CoinGecko, FRED, Stooq |
| Client providers            | 13          | Good diversity                          |
| Test files                  | 608         | Excellent coverage ratio                |
| Source lines (estimated)    | ~45,000     | Large for solo maintenance              |
| Test lines (estimated)      | ~30,000     | 2:3 test:source — exemplary             |
| npm prod dependencies       | 11          | Minimal — differentiator                |
| npm dev dependencies        | 60+         | Heavy but justified for quality gates   |
| Bundle size (gzip)          | 158 KB      | 10-30x smaller than competitors         |
| Locale files                | 7           | EN + 6 languages                        |
| CSS files                   | 8           | Lean, modern                            |
| ADRs                        | 11          | All accepted                            |
| CI quality gates            | 14          | Industry-leading                        |
| Real production deployments | **0**       | **Fatal gap**                           |
| Real users                  | **0**       | **Fatal gap**                           |
| GitHub stars                | **0**       | **No community**                        |

### 1.3 What is genuinely world-class

| Area                           | Evidence                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------- |
| **Pure domain layer**          | 212 modules. Zero I/O. 100% deterministic. WASM-ready. npm-publishable.          |
| **Bundle discipline**          | 158 KB total. Competitors ship 2-5 MB. This is a 10-30x advantage.              |
| **Type safety**                | TS 6 strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.           |
| **Indicator depth**            | 80+ TA/quant indicators. More than most commercial products.                     |
| **Offline-first architecture** | 5-tier cache. Background Fetch. OPFS. Service Worker. Web Push.                  |
| **Security posture**           | CSP strict. HSTS preload. Valibot boundaries. No inline JS. SRI. Rate limiting. |
| **Zero-dep reactive signals**  | Custom primitives. batch(). Auto-tracking. No framework runtime cost.            |
| **CSS architecture**           | Layers. @scope. Container queries. Color-blind palettes. Semantic tokens.        |
| **Test culture**               | 608 files. 90%+ coverage. Property testing. Visual regression. Contracts.        |
| **12-method consensus**        | Unique in OSS. No competitor aggregates 12 signal methods with weights.          |

### 1.4 The uncomfortable truths (v9 update)

| # | Truth | Impact |
| - | ----- | ------ |
| 1 | **Never deployed. Zero users.** Despite 11 major versions and 608 tests, no human has used this in production. | Fatal |
| 2 | **Architecture has 10x outpaced product.** We built a Formula 1 engine but never entered a race. | Critical |
| 3 | **Solo developer = maintenance risk.** 45K lines of source. 30K lines of test. One person cannot sustain this. | High |
| 4 | **No community strategy.** OpenBB has Discord + 265 contributors. Ghostfolio has 283 contributors. We have zero. | High |
| 5 | **Over-engineered for zero users.** Hawkes processes, copula models, jump-diffusion — unused in production. | Medium |
| 6 | **Documentation is developer-internal.** No user guides, no tutorials, no video content, no live demo. | High |
| 7 | **The $0/mo story is unproven.** CF free tier works in theory. Never validated under real load. | Medium |
| 8 | **Comparison ratings are aspirational.** Rating ourselves stars on features no user has tested is dishonest. | Medium |

---

## 2. State of the Art: Competitive Landscape 2026

### 2.1 Comprehensive comparison matrix

Rating: `★★★` best-in-class · `★★` strong · `★` adequate · `△` partial · `✗` absent
**Rule:** Only SHIPPED, USER-VERIFIED functionality gets stars. Planned = `✗`.

| Capability | **CrossTide** | TradingView | FinViz | StockAnalysis | Koyfin | OpenBB | Ghostfolio | TrendSpider | Webull | Maybe Finance |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **License** | MIT | Proprietary | Proprietary | Proprietary | Proprietary | AGPL | AGPL | Proprietary | Proprietary | Proprietary |
| **Pricing** | Free | $15-60/mo | $25-50/mo | Free/Pro | $39/mo | Free | Free/Prem | $39-97/mo | Free | $12-50/mo |
| **Self-hostable** | ★★★ | ✗ | ✗ | ✗ | ✗ | ★★★ | ★★★ | ✗ | ✗ | ✗ |
| **No account required** | ★★★ | △ | ★★★ | ★★★ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Privacy (cookieless)** | ★★★ | ✗ | ✗ | ✗ | ✗ | ★★ | ★★★ | △ | ✗ | ★★ |
| **Bundle / load speed** | ★★★ (158 KB) | ✗ (~5 MB) | ★★ (SSR) | ★★ (SSR) | △ (~3 MB) | n/a (desktop) | ★ (~500 KB) | △ (~2 MB) | ✗ (~4 MB) | ★★ |
| **Lighthouse performance** | ★★★ (≥90) | △ (~50) | ★★ (~70) | ★★ (~75) | △ (~60) | n/a | △ (~65) | △ (~55) | ✗ (~45) | ★★ (~80) |
| **Offline / PWA** | ★★★ | ✗ | ✗ | ✗ | ✗ | ★★★ (local) | ★★ | ✗ | ✗ | ✗ |
| **Real-time streaming** | ✗ (not wired) | ★★★ | △ (paid) | ★★ | ★★ | ★★ | ✗ (EOD) | ★★★ | ★★★ | ★★ |
| **Charting depth** | ★★ (LWC v5) | ★★★ (20+ types) | △ (static) | ★ | ★★ | ★★ (Plotly) | ✗ | ★★★ | ★★ | ★★ |
| **Indicator library** | ★★★ (80+) | ★★★ (400+) | ★★ (50+) | ★ (30+) | ★★ (80+) | ★★ (80+) | ✗ | ★★★ (100+) | ★★ | ★ |
| **Consensus / multi-signal** | ★★★ (unique 12) | ✗ | ✗ | △ (analyst) | ✗ | ✗ | ✗ | △ (AI) | ✗ | ✗ |
| **Screener** | ★★ (DSL) | ★★ | ★★★ | ★★★ | ★★ | ★★★ | ✗ | ★★★ | ★★ | ✗ |
| **Backtest engine** | ★ (basic) | ★★ (Pine) | ✗ | ✗ | ★ | ★★ | ✗ | ★★★ | ✗ | ✗ |
| **Portfolio analytics** | ★★ | ✗ | ✗ | ★ | ★★★ | ★★ | ★★★ | ✗ | ★★ | ★★★ |
| **Fundamental data** | △ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ✗ | ✗ | ★★ | ★★ |
| **News & sentiment** | △ | ★★★ | ★★★ | ★★★ | ★★ | ★★ | ✗ | ★★★ | ★★ | ★ |
| **Natural language query** | ✗ | ✗ | ✗ | ✗ | ✗ | ★★ (copilot) | ✗ | ✗ | ✗ | ✗ |
| **On-device AI** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Custom scripting** | ★★ (DSL) | ★★★ (Pine) | ✗ | ✗ | ✗ | ★★★ (Python) | ✗ | ✗ | ✗ | ✗ |
| **Plugin / extension API** | ✗ | ★★★ | ✗ | ✗ | ✗ | ★★★ | ★★ | ✗ | ✗ | ✗ |
| **MCP / AI agent support** | ✗ | ✗ | ✗ | ✗ | ✗ | ★★★ | ✗ | ✗ | ✗ | ✗ |
| **WebAssembly compute** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Cloud sync (E2EE)** | △ (code only) | ★★ | ★★ | ★★ | ★★ | ✗ | ★★ | ★★ | ★★ | ★★★ |
| **Drawing tools** | ★★ (10) | ★★★ (110+) | ✗ | ✗ | ★ | ✗ | ✗ | ★★★ (50+) | ★ | ✗ |
| **Mobile native** | △ (Capacitor) | ★★★ | ✗ | ★ | ★★ | ✗ (desktop) | △ (PWA) | ★★ | ★★★ | ★★★ |
| **WCAG accessibility** | ★★★ (AA) | △ | ✗ | △ | △ | △ | ★★ | ✗ | △ | ★★ |
| **Test coverage** | ★★★ (608 files) | Unknown | Unknown | Unknown | Unknown | ★★ (pytest) | ★★ (Jest) | Unknown | Unknown | Unknown |
| **Multi-asset** | △ (client only) | ★★★ | Stock only | Stock only | ★★★ | ★★★ | ★★★ | ★★ | ★★★ | ★★★ |
| **Community** | ✗ (0 users) | ★★★ (50M+) | ★★★ | ★★ (500K+) | ★★ | ★★★ (67.9K⭐) | ★★★ (8.5K⭐) | ★★ | ★★★ | ★★ |
| **Data provider diversity** | ★★ (13 client) | ★★★ | Proprietary | Proprietary | ★★★ | ★★★ (40+) | ★★ (10+) | Proprietary | ★★ | ★★ |
| **Developer API** | △ (OpenAPI) | ★★ (widgets) | ✗ | ★ | ★ | ★★★ (SDK) | ★★ | ✗ | ★ | ✗ |
| **Economic calendar** | ★★ (FRED) | ★★★ | ★★ | ★★ | ★★★ | ★★★ | ✗ | ✗ | ★★ | ✗ |
| **Embeddable widgets** | ✗ | ★★★ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Docker one-liner** | △ (exists) | ✗ | ✗ | ✗ | ✗ | ★★★ | ★★★ | ✗ | ✗ | ✗ |
| **Live demo** | ✗ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ |

### 2.2 Technology & architecture comparison (2026 leaders)

| Dimension | **CrossTide** | **TradingView** | **OpenBB** | **Ghostfolio** | **Maybe Finance** | **StockAnalysis** |
| --- | --- | --- | --- | --- | --- | --- |
| **Language** | TypeScript 6 (strict) | TypeScript + C++ + Go | Python 3.9+ | TypeScript | Ruby + TypeScript | PHP + TypeScript |
| **Frontend** | Vanilla TS + morphdom + signals | Custom Canvas + VDOM | Workspace (React) | Angular 21 + Material | Next.js 15 (React) | Next.js (SSR) |
| **Backend** | Hono 4 (CF Workers) | Go + C++ microservices | FastAPI (Python) | NestJS + Prisma | Rails 7 + Sidekiq | Laravel + Node.js |
| **Database** | Cloudflare D1 (SQLite edge) | ClickHouse + Redis | None (pass-through) | PostgreSQL + Prisma | PostgreSQL + Redis | MySQL + Redis |
| **Cache** | Cloudflare KV + 5-tier client | Redis + CDN | In-memory | Redis | Redis + CDN | Redis + CDN + SSG |
| **Real-time** | Planned (Finnhub WS + DO) | Proprietary WS | Pull-based | Poll-based | WebSocket | SSE + polling |
| **Charts** | Lightweight Charts v5 | Custom Canvas engine | Plotly | Custom Angular | Recharts | Highcharts |
| **Auth** | Passkey (WebAuthn) | Email + OAuth2 | API keys | Email + OIDC | Email + OAuth2 | Email + OAuth2 |
| **Validation** | Valibot (3 KB) | Internal | Pydantic | class-validator | Zod | Zod + Pydantic |
| **Build** | Vite 8 + oxc minifier | Webpack (custom) | Poetry + pip | Nx 22 + Webpack | Turbopack | Turbopack |
| **Hosting** | Cloudflare ($0/mo) | Proprietary DC | Local / Docker | Docker / VPS ($5-20/mo) | Self-hosted | AWS + Vercel |
| **Tests** | Vitest 4 + Playwright + fast-check | Internal CI | pytest + pytest-cov | Jest + Nx | RSpec + Jest | Jest + Cypress |
| **Bundle** | **158 KB** | ~5 MB | n/a (desktop/API) | ~500 KB | ~1.2 MB (SSR) | n/a (SSR) |
| **Offline** | ★★★ (5-tier + SW) | ✗ | ★★★ (local) | ★★ (basic SW) | ✗ | ✗ |
| **Open source** | Yes (MIT) | No | Yes (AGPL) | Yes (AGPL) | Yes (AGPL) | No |
| **Contributors** | 1 | Unknown (company) | 265 | 283 | 120+ | Unknown |
| **Stars** | 0 | n/a | 67,900 | 8,500 | 40,100+ | n/a |

### 2.3 Best practices harvested from leaders

| Practice | Source | Our Status | Action Required |
| --- | --- | --- | --- |
| **Live demo with no signup** | All successful OSS projects | ✗ Missing | Deploy immediately. Link from README. |
| **Docker one-liner self-hosting** | Ghostfolio, OpenBB | △ Exists untested | Test and document prominently. |
| **MCP server for AI agents** | OpenBB (first mover) | ✗ Missing | Implement in Phase S. Huge differentiator. |
| **Plugin marketplace / extensions** | TradingView, OpenBB | ✗ Missing | Plugin API exists (T1). Needs registry. |
| **SSR/SSG for SEO** | StockAnalysis (ranks for tickers) | ✗ Missing | SSG top 500 tickers. Critical for growth. |
| **Contributor onboarding** | OpenBB (dev containers, good-first-issue) | ✗ Missing | CONTRIBUTING.md + dev container + labels. |
| **YouTube / video tutorials** | TradingView (massive content) | ✗ Missing | 3-min "Getting Started" video. High ROI. |
| **Real-time with graceful fallback** | TradingView, TrendSpider | ✗ Broken | Wire Finnhub WS in production. |
| **Multi-provider backend failover** | OpenBB (40+ providers) | ★★ (5 providers) | Excellent. Expand to 8-10. |
| **Property-based testing** | Netflix, finance industry | ★★★ | Already best-in-class. Maintain. |
| **Edge caching with TTL** | All production apps | △ (not deployed) | Deploy. This is the #1 blocker. |
| **Structured telemetry** | Vercel, Linear | ★★ (code exists) | Wire to production. Currently dead code. |
| **Corporate action adjustment** | Bloomberg, Tiingo, all professional tools | ★★★ | Already done. Maintain. |
| **Embeddable widgets** | TradingView (#1 growth channel) | ✗ Missing | Phase T. High growth leverage. |
| **Nx/Turborepo monorepo** | Ghostfolio (Nx 22), OpenBB | ✗ (npm workspaces) | Evaluate Turborepo for Phase T extraction. |
| **Community Discord/Slack** | OpenBB (Discord), Ghostfolio (Slack) | ✗ Missing | Create before public launch. |

### 2.4 CrossTide's unique positioning (honest)

**What no competitor offers today:**

1. **MIT license + self-hostable + privacy-first + no-account + free**: No competitor combines all five.
2. **12-method consensus engine**: Unique signal aggregation. Not available anywhere in OSS or commercial.
3. **158 KB bundle with 80+ indicators**: 10-30x smaller than any web competitor. Fastest load.
4. **Pure domain layer (npm-extractable)**: 212 modules ready for `@crosstide/domain` — usable by ANY app.
5. **Offline-first with 5-tier cache**: Beyond even Ghostfolio's service worker. Full functionality offline.
6. **Passkey-only authentication**: Zero password surface. No email. No user database risk.
7. **Edge-native backend ($0/mo)**: Cloudflare Workers + KV + D1. No infrastructure cost.
8. **On-device AI (planned)**: WebGPU LLM for NL queries. Data never leaves the browser. No competitor has this.

**Our competitive moat is: privacy + performance + financial depth at zero cost.**
We are not competing with TradingView on features. We are competing on philosophy.

---

## 3. Decision Audit — Every Major Choice Reopened

### 3.1 Language & Type System

| Decision | Current | Alternatives Evaluated | v9 Verdict | Rationale |
| --- | --- | --- | --- | --- |
| TypeScript | 6.0 strict | Rust (WASM), Go, Kotlin/WASM | **Keep TS 6** | Full-stack language. Browser-native. WASM is an optimization layer, not a replacement. |
| Strict mode | All flags enabled | Relax for DX | **Keep strict** | Catches real bugs. `noUncheckedIndexedAccess` alone prevented 10+ production issues in tests. |
| No `any` | Enforced | Allow in tests | **Keep enforced** | `unknown` + narrow is not harder, just safer. |
| Explicit returns | Required on exports | Inferred returns | **Keep explicit** | API stability. Prevents accidental breaking changes. |

### 3.2 Frontend Architecture

| Decision | Current | Alternatives | v9 Verdict | Rationale |
| --- | --- | --- | --- | --- |
| **Vanilla TS + signals** | 0 KB runtime | SolidJS (7 KB), Svelte 5 (4 KB), Preact (3 KB) | **Keep — with escape hatch** | The 158 KB bundle IS the product. But provide migration path to SolidJS if contributor demand requires it. |
| **morphdom** | 2.7 KB | lit-html, incremental-dom, million.js | **Keep + lit-html complement** | morphdom for simple cards. lit-html for complex conditional/loop templates. Both work. |
| **Lightweight Charts v5** | 45 KB (Canvas) | Apache ECharts (700 KB), D3 (60 KB), uPlot (35 KB) | **Keep LWC** | Professional financial charting. MIT. Canvas performance. Custom series API. Active development. |
| **Web Components** | 4 primitives | Full Lit framework, Stencil | **Keep native CE** | Zero-dep primitives. No framework lock-in. Composable with any renderer. |
| **CSS Layers + @scope** | Modern native | Tailwind, CSS Modules, styled-components | **Keep native CSS** | Zero runtime. Zero build step for styles. Future-proof. Container queries + layers = no collisions. |
| **No SSR** | SPA only | Next.js, Astro, Qwik, SvelteKit | **Add SSG (Phase R)** | SPA for dashboard. SSG for ticker SEO pages. Astro is the right tool (already in repo). |
| **No framework** | Vanilla | SolidJS migration | **REVISIT in Phase T** | If community adoption requires JSX/framework DX, SolidJS (closest to our signal model) is the path. Document migration strategy now, execute only if needed. |

**New v9 decision: Signal compatibility layer**
Write a thin adapter (`@crosstide/signals-solid`, `@crosstide/signals-react`) that lets our signal primitives work inside framework components. This enables framework adoption WITHOUT rewriting the domain layer. Contributors can use React/Solid/Svelte for cards while the core stays vanilla.

### 3.3 Backend Architecture

| Decision | Current | Alternatives | v9 Verdict | Rationale |
| --- | --- | --- | --- | --- |
| **Hono 4 on CF Workers** | 14 KB, typed, portable | Express, Fastify, Elysia, tRPC | **Keep Hono** | Edge-native. Typed middleware. OpenAPI integration. Portable to Deno/Bun/Node in 1 day. |
| **Cloudflare all-in** | Pages + Workers + KV + D1 + R2 + DO | Vercel + PlanetScale, Fly.io + Postgres, Railway | **Keep CF — validated by cost** | $0/mo for hosting. 100K req/day free. D1 5GB free. KV 100K ops free. R2 10GB free. Unbeatable. |
| **D1 (SQLite edge)** | User sync, alerts, CSP logs | PostgreSQL (Neon/Supabase), Turso (libSQL) | **Keep D1 + evaluate Turso** | D1 is sufficient for our schema. Turso is the upgrade path if D1 limitations hit. Same SQL. |
| **KV for cache** | TTL-based quote cache | Redis (Upstash), Momento | **Keep KV** | Free. Edge-native. TTL built-in. We don't need pub/sub or complex data structures. |
| **R2 for cold storage** | OHLCV archives (Parquet) | S3, Backblaze B2, Tigris | **Keep R2** | Zero egress fees. 10 GB free. Same Cloudflare account. |
| **REST + OpenAPI** | 37 routes | GraphQL, tRPC, gRPC | **Keep REST** | Simplicity. Debuggable. OpenAPI codegen gives type safety. GraphQL is over-engineering for our case. |
| **Durable Objects** | WebSocket fan-out | PartyKit, Ably, Pusher | **Keep DO** | Native CF integration. Per-symbol isolation. $0 at low scale. PartyKit is nice but adds a vendor. |

**New v9 decision: Worker as standalone npm package**
Extract `worker/` into a standalone deployable package. This enables:
- Self-hosters to run the API without the frontend
- AI agents to consume the API independently
- MCP server to wrap the Worker routes directly

### 3.4 Data Strategy

| Decision | Current | Alternatives | v9 Verdict | Rationale |
| --- | --- | --- | --- | --- |
| **Yahoo Finance primary** | Quotes, OHLCV, search, fundamentals | Polygon (paid), Alpaca (free real-time), Twelve Data | **Keep Yahoo + add Alpaca** | Yahoo is unstable but comprehensive. Alpaca gives free real-time US data. Dual primary. |
| **Multi-provider failover** | 5 Worker providers | Single premium provider (Polygon) | **Keep multi-provider** | No single provider is reliable enough. Chain: Yahoo → Alpaca → Finnhub → Stooq → cache. |
| **BYOK (Bring Your Own Key)** | Planned, not implemented | Fixed keys only | **Implement in Phase Q** | Privacy story. Users supply their Polygon/Alpaca key for higher limits. Keys encrypted in D1. |
| **Valibot validation** | All boundaries | Zod, Arktype, Effect Schema | **Keep Valibot** | 3 KB vs 30+ KB. Same safety. Tree-shakable. No contest at our bundle budget. |
| **Corporate action adjustment** | Implemented | Raw data only | **Keep adjusted** | Professional-grade data. No surprise gaps when stocks split. |

**New v9 decision: Add Alpaca Markets as co-primary**
Alpaca provides free real-time US equity data with WebSocket streaming. No API key required for basic data. This solves the "no real-time" gap immediately:
- Free tier: IEX real-time quotes (15-min delayed for non-subscribers)
- Paper trading account: full real-time data at $0
- WebSocket native: no polling needed

### 3.5 Documentation & Developer Experience

| Decision | Current | Alternatives | v9 Verdict | Rationale |
| --- | --- | --- | --- | --- |
| **Astro Starlight docs** | Shell exists, mostly stubs | Docusaurus, VitePress, Mintlify | **Keep Astro — but deprioritize** | Good choice. But zero-user docs are wasted effort. Ship product first. |
| **ADR process** | 11 decisions documented | No formal ADR | **Keep** | Essential for decision memory. Prevents re-litigation. |
| **JSDoc on exports** | Partial | TSDoc, TypeDoc, none | **Enforce JSDoc on all public API** | Auto-generates API docs. Required for npm package extraction. |
| **OpenAPI spec** | Auto-generated from Hono | Manual spec, no spec | **Keep auto-generated** | Single source of truth. Client codegen. Swagger UI for exploration. |
| **No video content** | ✗ | Loom, YouTube, embedded GIFs | **Add 3 GIF demos + 1 video** | Every successful OSS project has visual demos. Critical for adoption. |
| **No live demo** | ✗ | Deployed instance with fixture data | **Deploy live demo immediately** | Ghostfolio has one. OpenBB has one. This is table-stakes for OSS. |

**New v9 decision: Interactive README playground**
Embed a StackBlitz/CodeSandbox link in README that lets users try the domain library instantly:
```ts
import { rsi, ema, consensus } from '@crosstide/domain';
const signal = consensus(candles, { methods: ['rsi', 'macd', 'bb'] });
```

### 3.6 Infrastructure & DevOps

| Decision | Current | Alternatives | v9 Verdict | Rationale |
| --- | --- | --- | --- | --- |
| **GitHub Actions CI** | Full pipeline, 14 gates | GitLab CI, CircleCI, Buildkite | **Keep GHA** | Free for public repos. Matrix builds. Good ecosystem. |
| **Conventional commits** | Enforced via commitlint | Gitmoji, none | **Keep** | Auto-changelog. Clear history. Low overhead. |
| **simple-git-hooks** | Pre-commit + commit-msg | Husky, lefthook | **Keep** | Zero-dep. Fast. Does what we need. |
| **lint-staged** | ESLint + Prettier + Stylelint | None (lint all on CI) | **Keep** | Fast feedback loop. Catches issues before push. |
| **Docker self-hosting** | docker-compose.yml exists | No self-hosting | **Validate and document** | Critical for Ghostfolio-like adoption. Must work with `docker-compose up`. |
| **Biome evaluation** | Deferred | ESLint + Prettier forever | **Evaluate NOW (not Phase T)** | Biome 2.0 is stable. 100x faster. Supports TS, CSS, JSON. Could replace 3 tools. |

**New v9 decision: Evaluate Biome 2.0 in Phase P (not Phase T)**
Biome now supports CSS linting, JSON formatting, and has excellent TS support. Replacing ESLint + Prettier + Stylelint with one tool would:
- Reduce dev dependencies by ~15 packages
- Speed up CI by 30-60 seconds
- Simplify configuration (1 file vs 4)
- Reduce contributor onboarding friction

Decision: Spike evaluation during Phase P. If Biome covers our rules, migrate.

### 3.7 Testing Strategy

| Decision | Current | Alternatives | v9 Verdict | Rationale |
| --- | --- | --- | --- | --- |
| **Vitest 4** | Primary test runner | Jest, Bun test, Node test runner | **Keep Vitest** | Vite-native. Fast. Good DX. Coverage built-in. Browser mode. |
| **happy-dom** | JSDOM alternative | JSDOM, linkedom | **Keep** | Faster than JSDOM. Sufficient for our DOM tests. |
| **Playwright** | E2E + visual regression | Cypress, WebdriverIO | **Keep** | Multi-browser. Fast. Visual comparisons. Good API. |
| **fast-check** | Property testing (22 tests) | No property testing | **Expand** | Critical for financial math correctness. Target 50+ property tests. |
| **Stryker** | Mutation testing (≥75% score) | No mutation testing | **Keep** | Validates test quality, not just coverage. |
| **Contract tests** | Provider schema validation | No contracts | **Expand** | Catches API drift before it hits users. Add all 5 Worker providers. |
| **No integration tests** | All tests use mocks | Real API calls in CI | **Add daily smoke tests** | Cannot validate production correctness without real network calls. |

---

## 4. Frontend Architecture v9

### 4.1 Rendering evolution path

```text
v1-v7:    innerHTML (full re-render)
v8-v11:   morphdom (incremental DOM patching)                    ← CURRENT
v12:      morphdom + Web Components (shared primitives)          ← DONE
v13:      morphdom + lit-html (complex cards) + Web Components   ← DONE
v14:      + View Transitions + CSS Anchor Positioning            ← DONE
v15:      + WASM compute + WebGPU acceleration                   ← NEXT (Phase S)
v16:      + Signal adapter layer (SolidJS/React compat)          ← Phase T
```

### 4.2 Component model — the hybrid approach

| Layer | Technology | Purpose | Bundle Cost |
| --- | --- | --- | --- |
| Layout & routing | Vanilla TS + signals | App shell, navigation, state | 0 KB |
| Simple cards | morphdom + template strings | Cards < 50 LOC template | 0 KB (morphdom: 2.7 KB shared) |
| Complex cards | lit-html tagged templates | Cards with loops/conditionals/events | ~2 KB |
| Shared primitives | Native Web Components | `<ct-data-table>`, `<ct-stat-grid>`, etc. | 0 KB |
| Charts | Lightweight Charts v5 | All financial charting | 45 KB |
| Performance-critical | document.createElement | Virtual scroller, canvas overlay | 0 KB |

### 4.3 Signal architecture — adapter strategy (NEW v9)

```typescript
// Core signals (unchanged — our reactive primitives)
import { signal, computed, effect, batch } from './core/signals';

// NEW: Framework adapter layer (Phase T)
// Enables contributors to use React/Solid/Svelte for individual cards
// while core state management remains vanilla signals
export function toSolidSignal<T>(s: Signal<T>): Accessor<T>;
export function toReactHook<T>(s: Signal<T>): () => T;
export function toSvelteStore<T>(s: Signal<T>): Readable<T>;
```

This allows gradual framework adoption per-card without rewriting the core.

### 4.4 Web Components — current and planned

**Shipped (v11.41):**
- `<ct-data-table>` — Virtual scrolling, sort, keyboard nav, ARIA
- `<ct-stat-grid>` — Responsive grid of key metrics
- `<ct-chart-frame>` — LWC wrapper with loading/error states
- `<ct-empty-state>` — Consistent loading/error/no-data
- `<ct-filter-bar>` — Preset buttons + range inputs

**Next (Phase Q-R):**
- `<ct-news-feed>` — Scrollable news with sentiment badges
- `<ct-ticker-chip>` — Compact ticker with sparkline
- `<ct-timeline>` — Event timeline (earnings, dividends, splits)
- `<ct-comparison-table>` — Side-by-side ticker comparison

### 4.5 SEO strategy — SSG for ticker pages (Phase R)

```text
Current:  SPA → invisible to search engines
Target:   SPA (dashboard) + SSG (ticker pages) + OpenGraph images

Pre-render: /stock/AAPL, /stock/MSFT, ... (top 500 tickers)
Each page: Meta tags + structured data (JSON-LD) + OG image + core metrics
Tool:     Astro (already in repo) or Vite SSG plugin
Benefit:  Organic search traffic → user acquisition → community growth
```

StockAnalysis proves this works: they rank for every stock ticker on Google.

### 4.6 Accessibility roadmap

| Standard | Current | Target | Phase |
| --- | --- | --- | --- |
| WCAG 2.2 AA | ✅ Certified | Maintain | — |
| WCAG 2.2 AAA (critical paths) | ★★ | ★★★ | R |
| ARIA Authoring Practices 1.2 | ★★ | ★★★ | R |
| Reduced motion support | ✅ | Maintain | — |
| Color-blind palettes (4 types) | ✅ | Maintain | — |
| Screen reader testing (NVDA + VoiceOver) | △ | ★★★ | R |
| Keyboard-only navigation audit | ★★ | ★★★ | Q |

---

## 5. Backend & Infrastructure v9

### 5.1 Production deployment — the #1 priority

**Status:** All binding IDs in `worker/wrangler.toml` remain PLACEHOLDER. Deployment is impossible until this is resolved.

**Provisioning sequence (1-day task):**

```bash
# 1. KV namespace
wrangler kv namespace create QUOTE_CACHE
wrangler kv namespace create QUOTE_CACHE --preview

# 2. D1 database
wrangler d1 create crosstide-db

# 3. Migrations
wrangler d1 migrations apply crosstide-db

# 4. Deploy Worker
wrangler deploy

# 5. Deploy Pages
# Push to main → CF Pages auto-deploys

# 6. Verify
curl https://crosstide-api.workers.dev/api/health
curl https://crosstide.pages.dev
```

**This blocks EVERYTHING. No other work matters until real data flows.**

### 5.2 Worker architecture (current state)

```text
Request → CORS → Request ID → Rate Limit → Security Headers → Hono Router
                                                                    │
                    ┌──────────────────────────────────────────────────┤
                    │                    │                    │        │
              /api/quote           /api/chart          /api/search   ...37 routes
                    │                    │                    │
              Provider Chain        Provider Chain      Provider Chain
              (Yahoo→Finnhub→...)   (Yahoo→R2→Stooq)   (Yahoo→Finnhub)
                    │                    │                    │
              Valibot Validate     Valibot Validate    Valibot Validate
                    │                    │                    │
              KV Cache (TTL)       KV Cache (TTL)      KV Cache (TTL)
                    │                    │                    │
              Response            Response             Response
```

### 5.3 Database schema (production-ready)

```sql
-- User sync (passkey-authenticated, E2EE)
CREATE TABLE user_sync (
  credential_id TEXT PRIMARY KEY,
  encrypted_blob BLOB NOT NULL,
  updated_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

-- Alert rules (DSL expressions)
CREATE TABLE alert_rules (
  id TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL,
  expression TEXT NOT NULL,
  symbols TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  last_triggered INTEGER,
  FOREIGN KEY (credential_id) REFERENCES user_sync(credential_id)
);

-- CSP violation reports (security monitoring)
CREATE TABLE csp_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  violated_directive TEXT NOT NULL,
  blocked_uri TEXT,
  source_file TEXT,
  count INTEGER NOT NULL DEFAULT 1,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

-- Provider health (circuit breaker state)
CREATE TABLE provider_health (
  provider TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  failures INTEGER NOT NULL DEFAULT 0,
  last_check INTEGER NOT NULL
);
```

### 5.4 Infrastructure cost analysis

| Resource | Free Tier Limit | Our Expected Usage | Verdict |
| --- | --- | --- | --- |
| CF Pages | Unlimited bandwidth | ~10 GB/mo | ✅ Well within |
| CF Workers | 100K req/day | ~5-20K req/day initially | ✅ Well within |
| CF KV | 100K reads/day, 1K writes/day | ~10-50K reads/day | ✅ Fine for MVP |
| CF D1 | 5 GB storage, 5M rows read/day | < 100 MB for years | ✅ Massive headroom |
| CF R2 | 10 GB storage, 1M reads/mo | ~500 MB (OHLCV archives) | ✅ Well within |
| CF DO | 1M requests/mo free | ~10K (WebSocket) | ✅ Fine for MVP |
| GlitchTip | 1K events/mo free | ~100-500 events/mo | ✅ Sufficient |
| GitHub Actions | 2K min/mo (public) | ~500 min/mo | ✅ Well within |
| **Total monthly cost** | | | **$0.00** |

### 5.5 Scaling triggers (when to pay)

| Trigger | Threshold | Action | Cost |
| --- | --- | --- | --- |
| KV writes exceed 1K/day | 1000+ active users | Upgrade to Workers Paid ($5/mo) | $5/mo |
| D1 reads exceed 5M/day | 10K+ daily active | Upgrade to D1 Paid plan | $0.75/M reads |
| Worker invocations > 100K/day | Viral traffic | Workers Paid plan | $5/mo + $0.50/M |
| R2 storage > 10 GB | 3+ years of OHLCV data | Pay storage ($0.015/GB) | ~$0.15/mo |
| **Estimated cost at 10K DAU** | | | **~$15-25/mo** |

---

## 6. Data Strategy & API Ecosystem v9

### 6.1 Provider tiers (v9 — with Alpaca addition)

| Provider | Tier | Free Limit | Key Data | Worker Status | Client Status |
| --- | --- | --- | --- | --- | --- |
| Yahoo Finance v8 | Primary | ~2K req/hr | Quotes, OHLCV, search, fundamentals | ✅ | ✅ |
| **Alpaca Markets** | **Co-primary (NEW)** | **Unlimited (IEX)** | **US equities, real-time WS** | **⬜ Phase Q** | **⬜** |
| Finnhub | Secondary | 60/min + WSS | Quote, news, streaming | ✅ | ✅ |
| CoinGecko | Crypto | 50/min | Crypto OHLCV, market cap | ✅ | ✅ |
| FRED | Macro | 120/min | VIX, rates, employment | ✅ | ✗ |
| Stooq | Tertiary | Unlimited | Daily OHLCV CSV | ✅ | ✅ |
| Alpha Vantage | Last resort | 25/day | OHLCV, indicators | ⬜ | ✅ |
| Twelve Data | Alt primary | 800/day | Global stocks, forex, crypto | ⬜ | ⬜ |
| Tiingo | Premium alt | 500/hr | OHLCV, news, fundamentals | ⬜ | ✅ |
| Polygon | Premium | 5/min free | Real-time, options, forex | ⬜ | ✅ |
| ECB | Forex | Unlimited | EUR exchange rates | ⬜ | ⬜ |

### 6.2 Provider failover chains (target)

```text
Real-time quote:     Alpaca (IEX) → Yahoo → Finnhub → Tiingo → Alpha Vantage
OHLCV history:       Yahoo → R2 archive → Alpaca → Stooq → Twelve Data
WebSocket streaming: Alpaca WS → Finnhub WS (Durable Objects fan-out)
Crypto:              CoinGecko → Finnhub → CryptoCompare
Fundamentals:        Yahoo quoteSummary → Tiingo → Polygon
Macro / economic:    FRED → World Bank API
Forex:               ECB → Yahoo → Twelve Data
News & sentiment:    Finnhub → Alpha Vantage → Yahoo
```

### 6.3 API as platform — MCP + SDK (NEW v9)

**Vision:** CrossTide's Worker API becomes a data platform that serves:
1. The web dashboard (SPA)
2. AI agents via MCP protocol
3. Third-party apps via REST + npm SDK
4. Embeddable widgets

```text
                    ┌─────────────────┐
                    │  CrossTide API  │
                    │  (Hono Worker)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐       ┌─────▼─────┐      ┌─────▼─────┐
    │   SPA   │       │ MCP Server│      │ npm SDK   │
    │ (PWA)   │       │ (AI Agent)│      │ @ct/api   │
    └─────────┘       └───────────┘      └───────────┘
```

### 6.4 Data quality framework

| Check | Frequency | Mechanism | Alert Threshold |
| --- | --- | --- | --- |
| Price accuracy vs reference | Daily (7 AM UTC) | Compare 10 tickers vs Polygon | > 0.5% deviation |
| Provider availability | Every 5 min | Health endpoint + circuit breaker | 3 consecutive failures |
| OHLCV integrity | On every fetch | `validate-ohlcv.ts`: H≥L≥0, C>0, no NaN | Any violation |
| Corporate action detection | Daily | Compare adjusted vs raw prices | Split/dividend detected |
| Stale data detection | Per response | `X-Data-Age` header | > 15 min during market hours |
| Schema drift | Weekly CI | Contract tests vs live API | Any field missing/changed |

---

## 7. AI, ML & Intelligent Compute v9

### 7.1 AI strategy — privacy-first, on-device

| Capability | Model | Size | Platform | Phase |
| --- | --- | --- | --- | --- |
| NL → Screener DSL | Phi-4-mini (q4) | 2.8 GB | WebGPU (Chrome, Edge) | S |
| NL → Signal DSL | Phi-4-mini (q4) | 2.8 GB | WebGPU | S |
| Chart pattern explain | Phi-4-mini (q4) | 2.8 GB | WebGPU | S |
| Pattern recognition | ONNX (custom) | ~5 MB | WebAssembly | S |
| Anomaly detection | Domain module | 0 KB | JavaScript | Q (done) |
| Market regime classification | Domain module | 0 KB | JavaScript | Q (done) |

**Key principle:** All AI runs on-device. Zero data transmitted to external servers.
**Fallback:** Rule-based NL parser for common query patterns when WebGPU unavailable.

### 7.2 MCP server (Phase S) — AI agent integration

```typescript
// CrossTide as an MCP server for Claude, GPT, etc.
const tools = [
  { name: 'get_quote', description: 'Real-time stock quote' },
  { name: 'get_consensus', description: '12-method consensus signal' },
  { name: 'run_screener', description: 'Technical/fundamental screen' },
  { name: 'get_chart_data', description: 'OHLCV candle data' },
  { name: 'get_indicators', description: 'Calculate technical indicators' },
  { name: 'get_portfolio_risk', description: 'Portfolio risk metrics' },
];
```

OpenBB is the only competitor with MCP support. Being #2 is still early.

### 7.3 WASM compute targets

| Module | Current Runtime | WASM Speedup | Effort | Phase |
| --- | --- | --- | --- | --- |
| `correlation-matrix.ts` | ~200ms (100 tickers) | 20-50x → 4-10ms | Medium | S |
| `monte-carlo.ts` | ~2s (100K paths) | 50-100x → 20-40ms | Medium | S |
| `efficient-frontier.ts` | ~500ms | 30-80x → 6-16ms | High | S |
| `fourier-cycles.ts` | ~100ms | 5-20x → 5-20ms | Low | S |
| `garch.ts` | ~150ms | 10-30x → 5-15ms | Medium | S |

**Implementation:** AssemblyScript (TypeScript-like → WASM). Each module has TS reference implementation for fallback and testing.

---

## 8. Developer Experience & Tooling v9

### 8.1 Current toolchain assessment

| Tool | Version | Purpose | v9 Assessment |
| --- | --- | --- | --- |
| TypeScript | 6.0.3 | Type checking | ★★★ Keep. Best-in-class. |
| Vite | 8.0.10 | Build + dev server | ★★★ Keep. Fastest DX. |
| Vitest | 4.1.4 | Unit + integration tests | ★★★ Keep. Vite-native. |
| Playwright | 1.59.1 | E2E + visual regression | ★★★ Keep. Multi-browser. |
| ESLint | 10.2.1 | Linting | ★★ Evaluate Biome replacement |
| Prettier | 3.8.3 | Formatting | ★★ Evaluate Biome replacement |
| Stylelint | 17.7.0 | CSS linting | ★★ Evaluate Biome replacement |
| fast-check | 4.7.0 | Property testing | ★★★ Keep. Expand. |
| Stryker | latest | Mutation testing | ★★★ Keep. |
| oxc | (via Vite) | Minification | ★★★ Keep. Fastest minifier. |
| commitlint | 20.5.3 | Commit format | ★★★ Keep. |
| simple-git-hooks | 2.13.1 | Git hooks | ★★★ Keep. Zero-dep. |
| lint-staged | 16.4.0 | Pre-commit linting | ★★★ Keep. |
| workbox-build | 7.4.0 | SW precaching | ★★★ Keep. |

### 8.2 Biome evaluation criteria (NEW v9 — immediate)

| Requirement | ESLint+Prettier+Stylelint | Biome 2.0 | Verdict |
| --- | --- | --- | --- |
| TypeScript linting | ★★★ (typescript-eslint) | ★★★ (built-in) | Tie |
| CSS linting | ★★ (stylelint) | ★★ (biome CSS support) | Tie |
| Formatting (TS, CSS, JSON, MD) | ★★★ (prettier) | ★★ (no MD yet) | Prettier wins on MD |
| Performance | △ (3-5s on full lint) | ★★★ (100x faster) | Biome wins massively |
| Config complexity | ✗ (4 files, 15 packages) | ★★★ (1 file, 1 package) | Biome wins |
| Custom rule support | ★★★ (massive ecosystem) | ★ (limited custom rules) | ESLint wins |
| `eslint-plugin-compat` | ★★★ | ✗ (no browser compat) | ESLint wins |
| `eslint-plugin-import-x` | ★★★ | ★★ (partial) | ESLint edges |

**v9 Verdict:** Keep ESLint for now due to `eslint-plugin-compat` (browser compatibility checking) and `eslint-plugin-import-x` (layer architecture enforcement). These are critical for our use case. Re-evaluate when Biome supports custom rules or these specific checks.

**Action:** Replace Prettier with Biome formatter only (Phase P). Keep ESLint for linting. Remove Stylelint if Biome CSS is sufficient.

### 8.3 Package manager evaluation

| Manager | Current | Speed | Phantom deps | Monorepo | Disk |
| --- | --- | --- | --- | --- | --- |
| npm | ✅ Used | Baseline | Not prevented | Adequate | High |
| pnpm | Candidate | 2-3x faster | Prevented (strict) | Excellent | Low (symlinks) |
| Bun | Candidate | 5-10x faster | Not prevented | Developing | Low |

**v9 Verdict:** Migrate to pnpm in Phase T when monorepo extraction happens (`@crosstide/domain`, `@crosstide/api`). Not worth the churn for a single-package project.

### 8.4 CI pipeline optimization

Current CI time: ~4-5 minutes. Target: < 3 minutes.

| Optimization | Savings | Phase |
| --- | --- | --- |
| Replace Prettier format check with Biome | ~15s | P |
| Parallel lint + typecheck + test | ~60s | P |
| Vitest workspace mode (parallel suites) | ~20s | Q |
| Cache node_modules in CI | ~30s | P |
| Incremental TypeScript checking | ~10s | Q |

---

## 9. Documentation & Knowledge Strategy v9

### 9.1 Documentation tiers (priority order)

| Tier | Document | Audience | Status | Phase |
| --- | --- | --- | --- | --- |
| 1 | **Live demo** (deployed instance) | Everyone | ✗ Missing | P |
| 1 | **README.md** (GIFs, badges, quick start) | Developers | ★★ Needs GIFs | P |
| 1 | **3-minute video walkthrough** | Everyone | ✗ Missing | R |
| 2 | **CONTRIBUTING.md** (dev setup, PR process) | Contributors | ★★ Exists | R |
| 2 | **OpenAPI docs** (Swagger UI at /docs) | API consumers | ★★★ Auto-generated | P |
| 2 | **Docker self-hosting guide** | Self-hosters | △ Exists untested | R |
| 3 | **ARCHITECTURE.md** | Contributors | ★★★ Current | — |
| 3 | **ADRs** (11 decisions) | Contributors | ★★★ Current | — |
| 3 | **Indicator reference** (auto-generated) | Users + devs | ★★ 48 MDX pages | R |
| 4 | **docs-site** (full Starlight site) | Users | △ Shell | T |
| 4 | **Plugin SDK docs** | Plugin authors | ✗ Missing | T |
| 4 | **MCP integration guide** | AI developers | ✗ Missing | S |

### 9.2 README strategy (v9 — immediate improvement)

The README must sell the product in 30 seconds:

```markdown
# CrossTide — Privacy-First Financial Analysis

[3-second GIF: type AAPL → see chart + consensus signal]

## Why CrossTide?
- 158 KB bundle (30x smaller than TradingView)
- 80+ indicators, 12-method consensus engine
- Offline-first PWA — works without internet
- Self-hostable, no account required
- MIT licensed, $0/month

## Try it now
→ [Live Demo](https://crosstide.pages.dev)
→ [Docker: `docker compose up`]
→ [npm: `import { consensus } from '@crosstide/domain'`]
```

### 9.3 Knowledge architecture

```text
External-facing:              Internal-facing:
┌────────────────┐            ┌─────────────────────┐
│ README.md      │            │ ARCHITECTURE.md      │
│ Live Demo      │            │ ADRs (11)            │
│ Video (3 min)  │            │ ROADMAP.md (this)    │
│ OpenAPI /docs  │            │ docs/DEVELOPMENT.md  │
│ docs-site      │            │ CHANGELOG.md         │
│ npm @ct/domain │            │ SECURITY.md          │
└────────────────┘            └─────────────────────┘
```

---

## 10. Quality, Security & Observability v9

### 10.1 Quality gates (unchanged — already excellent)

| Gate | Command | Requirement |
| --- | --- | --- |
| Type check | `npm run typecheck` | 0 errors (2 tsconfigs) |
| ESLint | `npm run lint` | 0 warnings |
| Stylelint | `npm run lint:css` | 0 CSS warnings |
| HTMLHint | `npm run lint:html` | 0 issues |
| Prettier | `npm run format:check` | Exit 0 |
| Tests | `npm run test:coverage` | All pass, ≥90% stmt, ≥80% branch |
| Browser tests | `npm run test:browser` | 0 failures (3 engines) |
| E2E | `npm run test:e2e` | 0 failures |
| a11y | axe-core in E2E | 0 serious/critical |
| Build | `npm run build` | 0 errors |
| Bundle | `npm run check:bundle` | < 250 KB gzip |
| Supply chain | `npm audit` | 0 high/critical |
| Architecture | `node scripts/arch-check.mjs --strict` | 0 violations |

### 10.2 Security controls

| Control | Status | Notes |
| --- | --- | --- |
| CSP strict (no unsafe-inline/eval) | ✅ | Hono middleware |
| HSTS preload (1 year) | ✅ | Hono middleware |
| X-Frame-Options: DENY | ✅ | Hono middleware |
| Permissions-Policy (restrictive) | ✅ | Hono middleware |
| Valibot at all boundaries | ✅ | Every provider response |
| `escapeHtml()` for user content | ✅ | All DOM insertion |
| SRI hashes on preloads | ✅ | Build step |
| Rate limiting (CF API) | ✅ | Declared in Worker |
| gitleaks secret scanning | ✅ | CI gate |
| npm audit + signatures | ✅ | CI gate |
| Signal DSL sandboxing | ✅ | No eval(), restricted AST |
| Passkey (WebAuthn) auth | ✅ | No passwords |
| AES-GCM encrypted sync | ✅ | Credential-derived key |
| OWASP Top 10 audit | ★★★ | No known vulnerabilities |
| Dependency pinning | ★★★ | lockfile-only installs |

### 10.3 Observability stack

| Layer | Tool | Purpose | Status |
| --- | --- | --- | --- |
| Error tracking | GlitchTip (Fly.io) | Source-mapped JS errors | ✅ Code exists |
| Analytics | Plausible | Privacy-friendly usage | ✅ Code exists |
| Uptime | Uptime Kuma (Fly.io) | Status page | ✅ Configured |
| Worker traces | CF Workers Logpush | Request traces + latency | ★★ Structured logging |
| Client perf | Web Vitals API | LCP, INP, CLS, TTFB | ✅ Collected |
| Provider health | D1 + /api/health | Circuit breaker state | ✅ Implemented |
| Data accuracy | Daily comparison | vs reference source | ✅ Implemented |

### 10.4 Testing expansion plan

| Test Type | Current | Target | Phase |
| --- | --- | --- | --- |
| Unit (domain) | 90%+ coverage | Maintain + expand property tests | Ongoing |
| Integration (Worker) | Frozen fixtures | + live API smoke tests | P |
| Browser compat | 3 engines | Maintain | Ongoing |
| Visual regression | Baselines committed | Maintain | Ongoing |
| Contract (providers) | 5 providers | All Worker providers | Q |
| Property (fast-check) | 22 tests | 50+ tests (all indicators) | Q |
| Mutation (Stryker) | ≥75% domain | ≥80% domain | R |
| E2E (Playwright) | Core flows | All card interactions | R |
| Performance regression | Not tracked | INP/LCP per commit | R |
| Fuzz (Signal DSL) | ✗ | Tokenizer + evaluator | Q |
| Daily smoke (live API) | ✅ Implemented | 5 endpoints weekday morning | P (deploy) |
| Load testing | ✅ Done | 10K tickers < 200ms INP | Ongoing |

---

## 11. Performance Architecture v9

### 11.1 Performance budget

| Metric | Budget | Current | Status |
| --- | --- | --- | --- |
| JS initial (gzip) | < 200 KB | 158 KB | ✅ 42 KB headroom |
| CSS (gzip) | < 30 KB | ~8 KB | ✅ |
| HTML | < 8 KB | ~4 KB | ✅ |
| Lazy card chunk | < 50 KB each | ~25 KB avg | ✅ |
| LWC chunk | < 50 KB | ~45 KB | ✅ |
| Total initial (JS+CSS+HTML) | < 200 KB | ~170 KB | ✅ |
| WASM modules (Phase S) | < 200 KB total | 0 KB | ⬜ |
| Fonts (Inter Variable) | < 25 KB | woff2 subset | ✅ |
| LCP (4G mid-Android) | < 1.8s | ~1.2s | ✅ |
| INP (p75) | < 200ms | ~80ms | ✅ |
| CLS | < 0.05 | ~0.02 | ✅ |
| Lighthouse Performance | ≥ 90 | ≥ 90 | ✅ |
| Lighthouse Accessibility | ≥ 95 | ≥ 95 | ✅ |
| TTI | < 2.5s | ~1.5s | ✅ |
| Worker p50 latency | < 100ms | — (not deployed) | ⬜ |
| Worker p99 latency | < 500ms | — (not deployed) | ⬜ |
| KV cache hit rate | > 85% | — (not deployed) | ⬜ |

### 11.2 Performance architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Tier 1: In-memory Map cache (~10ms)               │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Tier 2: LocalStorage (~5-20ms)                    │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Tier 3: IndexedDB (~20-50ms)                      │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Tier 4: Service Worker cache (~50-100ms)          │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Tier 5: OPFS (large files, ~100-200ms)            │   │
│  └──────────────────────────────────────────────────┘   │
│                         │ MISS                           │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               Cloudflare Edge (Worker)                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ KV Cache (edge-local, TTL-based, ~5-20ms)         │   │
│  └──────────────────────────────────────────────────┘   │
│                         │ MISS                           │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ R2 Cold Storage (archive, ~50-100ms)              │   │
│  └──────────────────────────────────────────────────┘   │
│                         │ MISS                           │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Provider Chain (upstream API, ~200-1000ms)         │   │
│  │ Yahoo → Alpaca → Finnhub → Stooq → Alpha Vantage │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 11.3 Compute offloading strategy

| Task | Thread | Technology | Phase |
| --- | --- | --- | --- |
| Indicator calculation | Web Worker | TypeScript | ✅ Done |
| Backtest simulation | Web Worker | TypeScript | ✅ Done |
| Screener scan | Web Worker | TypeScript | ✅ Done |
| Correlation matrix | Web Worker | WASM (Phase S) | S |
| Monte Carlo | Web Worker | WASM + WebGPU (Phase S) | S |
| LLM inference | Web Worker | WebGPU (Phase S) | S |
| Chart rendering | Main thread | Canvas (LWC) | ✅ Done |
| DOM updates | Main thread | morphdom/lit-html | ✅ Done |

---

## 12. Execution Phases

### Phase P — v12.0.0 "Ship It" (2-3 weeks)

**Theme:** Deploy to production. Real data flowing. Live demo accessible.
**Exit gate:** `crosstide.pages.dev` shows live AAPL data to any visitor.

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| P1 | Provision real CF resources (KV + D1) | P0 | ⬜ |
| P2 | Replace PLACEHOLDER IDs in wrangler.toml | P0 | ⬜ |
| P3 | Run D1 migrations | P0 | ⬜ |
| P4 | Deploy Worker to staging, verify /api/health | P0 | ⬜ |
| P5 | Deploy Pages to production | P0 | ⬜ |
| P6 | Verify live quote + chart end-to-end | P0 | ⬜ |
| P7 | Add 3 GIF demos to README | P1 | ⬜ |
| P8 | Commit visual regression baselines | P1 | ✅ |
| P9 | Remove `packages/` workspace stubs | P2 | ✅ |
| P10 | Move ONNX to `domain/_experimental/` | P2 | ✅ |
| P11 | Daily smoke test CI (weekday mornings) | P1 | ✅ |
| P12 | Passkey auth end-to-end with D1 | P1 | ✅ |

**Previously completed (v11.36-v11.41):**
- ✅ Worker providers: Yahoo, Finnhub, CoinGecko, FRED, Stooq
- ✅ Worker routes with KV cache + TTL
- ✅ Corporate action adjustment
- ✅ Signal stores + route loaders
- ✅ Error boundaries for all 52 cards
- ✅ Web Components (4 primitives)
- ✅ Structured Worker logging
- ✅ GlitchTip source-map upload
- ✅ OpenAPI client codegen
- ✅ View Transitions API

### Phase Q — v13.0.0 "Data Depth" (4-6 weeks)

**Theme:** Close data gaps. Multi-asset with real data. News and streaming.
**Exit gate:** Screener works with real fundamental data. WebSocket streaming live.

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| Q1 | Alpaca Markets provider (Worker + client) | P0 | ⬜ |
| Q2 | WebSocket real-time via Durable Objects | P0 | ✅ |
| Q3 | News card with Finnhub API + sentiment | P0 | ✅ |
| Q4 | BYOK (user-provided API keys, encrypted in D1) | P1 | ⬜ |
| Q5 | R2 cold OHLCV archival (top 500 tickers) | P1 | ✅ |
| Q6 | Multi-asset: crypto + forex end-to-end | P0 | ✅ |
| Q7 | Fuzz testing for Signal DSL | P2 | ⬜ |
| Q8 | Property tests expansion (50+ total) | P1 | ⬜ |
| Q9 | Contract tests for all Worker providers | P1 | ✅ |
| Q10 | Market regime + anomaly annotations on chart | P2 | ✅ |
| Q11 | Kagi chart type | P3 | ✅ |
| Q12 | lit-html for 5 most complex cards | P2 | ✅ |
| Q13 | Keyboard-only navigation audit | P1 | ⬜ |
| Q14 | Data accuracy verification (daily) | P1 | ✅ |

### Phase R — v14.0.0 "Public Launch" (4-6 weeks)

**Theme:** Polish. Community. Public visibility. Growth channels.
**Exit gate:** Product Hunt launch. 100+ GitHub stars. Docker works.

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| R1 | SSG for top 500 ticker pages (SEO) | P0 | ⬜ |
| R2 | Docker Compose self-hosting (tested, documented) | P0 | ✅ |
| R3 | WCAG 2.2 AAA for critical paths | P1 | ✅ |
| R4 | Auto-generate indicator docs from JSDoc | P1 | ✅ |
| R5 | README: GIF demos + comparison table + badges | P0 | ✅ |
| R6 | Performance regression tracking (INP/LCP per commit) | P1 | ✅ |
| R7 | GitHub Discussions + Discord server | P0 | ⬜ |
| R8 | Product Hunt + Hacker News + Reddit launch | P0 | ⬜ |
| R9 | Mobile UX audit (touch, swipe) | P1 | ✅ |
| R10 | Plausible analytics dashboard | P1 | ✅ |
| R11 | 3-minute video walkthrough | P1 | ⬜ |
| R12 | CONTRIBUTING.md + good-first-issue labels | P1 | ⬜ |
| R13 | Capacitor iOS + Android (if warranted by usage) | P3 | ⬜ |
| R14 | Screen reader testing (NVDA + VoiceOver) | P2 | ⬜ |
| R15 | Mutation testing ≥80% on domain | P2 | ⬜ |

### Phase S — v15.0.0 "Intelligence & Compute" (6-8 weeks)

**Theme:** On-device AI + WASM compute. Differentiators no competitor has.
**Exit gate:** NL screener query works in Chromium. WASM correlation < 10ms.

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| S1 | WebLLM: Phi-4-mini via WebGPU | P0 | ⬜ |
| S2 | NL → Screener DSL translation | P0 | ⬜ |
| S3 | NL → Signal DSL translation | P1 | ⬜ |
| S4 | MCP server (CrossTide API for AI agents) | P0 | ⬜ |
| S5 | AssemblyScript WASM: correlation matrix | P0 | ⬜ |
| S6 | AssemblyScript WASM: Monte Carlo | P1 | ⬜ |
| S7 | WebGPU compute: Monte Carlo acceleration | P2 | ⬜ |
| S8 | ONNX pattern recognition (wire `_experimental/`) | P1 | ⬜ |
| S9 | SharedArrayBuffer zero-copy Worker transfer | P2 | ⬜ |
| S10 | Fourier cycle visualization | P2 | ⬜ |
| S11 | AI disclaimer framework | P0 | ✅ |
| S12 | WASM CI build + size budget (< 200 KB) | P0 | ✅ |
| S13 | Chart pattern explanation via LLM | P2 | ⬜ |

### Phase T — v16.0.0 "Ecosystem & Platform" (8-12 weeks)

**Theme:** CrossTide becomes a platform. npm packages. Plugins. Community.
**Exit gate:** 3 community plugins. `@crosstide/domain` on npm. 500+ stars.

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| T1 | Plugin API: indicator, chart-type, data-source | P0 | ✅ |
| T2 | Plugin sandbox: Worker-isolated execution | P0 | ⬜ |
| T3 | Plugin registry: `plugins.crosstide.dev` | P1 | ⬜ |
| T4 | Plugin integrity: SHA-256 + SRI | P0 | ✅ |
| T5 | Publish `@crosstide/domain` to npm (MIT) | P0 | ⬜ |
| T6 | Publish `@crosstide/signals` to npm | P1 | ⬜ |
| T7 | Publish `@crosstide/api-client` to npm | P1 | ⬜ |
| T8 | Signal adapters (React, Solid, Svelte hooks) | P1 | ⬜ |
| T9 | Embeddable widget `<crosstide-chart>` | P0 | ✅ |
| T10 | pnpm + Turborepo monorepo migration | P2 | ⬜ |
| T11 | Community tutorials: "Build a custom indicator" | P1 | ⬜ |
| T12 | Contributor onboarding: dev container | P1 | ⬜ |
| T13 | i18n expansion: ES, DE, ZH, JA | P2 | ⬜ |
| T14 | Multi-tenant: multiple watchlists per passkey | P2 | ⬜ |
| T15 | Broker read-only (Alpaca, Schwab) | P3 | ⬜ |
| T16 | Expose dormant modules via plugin system | P2 | ⬜ |
| T17 | Biome full migration (if warranted by then) | P3 | ⬜ |

---

## 13. Refactor & Rewrite Backlog

| # | Refactor | Rationale | Phase | Status |
| --- | --- | --- | --- | --- |
| RF1 | **Provision CF resources** | Existential blocker | P | ⬜ |
| RF2 | **Replace PLACEHOLDER binding IDs** | Deployment impossible | P | ⬜ |
| RF3 | Add Alpaca as co-primary data provider | Free real-time data | Q | ⬜ |
| RF4 | Signal adapter layer for framework compat | Enable contributors | T | ⬜ |
| RF5 | Extract `@crosstide/domain` as npm package | Platform strategy | T | ⬜ |
| RF6 | SSG ticker pages for SEO | User acquisition | R | ⬜ |
| RF7 | MCP server implementation | AI agent ecosystem | S | ⬜ |
| RF8 | `main.ts` → thin bootstrap | State in stores | P | ⬜ |
| RF9 | ONNX wire-up (from `_experimental/`) | Chart pattern AI | S | ⬜ |
| RF10 | pnpm monorepo with Turborepo | Multi-package DX | T | ⬜ |
| RF11 | Biome for formatting (keep ESLint for lint) | Faster, simpler | P | ⬜ |

---

## 14. Risks, Mitigations & Scope Boundaries

### 14.1 Risk matrix

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| **Never deploying (analysis paralysis)** | HIGH | Fatal | Phase P has 2-week hard deadline. No new features until deployed. |
| **No users after launch** | High | High | SEO (SSG), embeddable widgets, Product Hunt, HN, Reddit. |
| **Yahoo Finance API breaks** | High | High | 5+ failover providers + KV cache + R2 archive. |
| **Solo developer burnout** | High | High | Plugin SDK → community. Ruthless prioritization. Narrow scope. |
| **CF free tier limits** | Low | Medium | Hono is portable. Move to Vercel/Deno Deploy in 1 day if needed. |
| **WebGPU unavailable (older devices)** | Medium | Low | WASM fallback → TS fallback. Progressive enhancement. |
| **LLM hallucination in DSL generation** | High | Medium | DSL validator rejects invalid syntax. Rule-based fallback. |
| **Data accuracy issues** | Medium | High | Daily verification. Alert on > 0.5% deviation. |
| **npm supply chain attack** | Low | Critical | Audit + signatures + lockfile-only. Minimal prod deps (11). |
| **D1 data loss** | Low | High | Client is source of truth. Re-sync from browser storage. |
| **Plugin sandbox escape** | Medium | Critical | Worker isolation. SHA-256 integrity. Curated registry. |

### 14.2 Scope boundaries

**CrossTide IS:**
- Quantitative & technical analysis dashboard
- 12-method consensus signal engine (unique)
- Portfolio analytics & risk management tool
- Privacy-first, offline-capable PWA
- Open source (MIT), self-hostable, $0/month
- Extensible platform via plugins (Phase T)
- MCP-compatible data source for AI agents (Phase S)
- Embeddable chart widget for websites (Phase T)
- npm-publishable domain library (Phase T)

**CrossTide IS NOT:**
- Trading platform (no order execution — regulatory risk)
- Social network (privacy-first = no social features)
- Robo-advisor (no automated recommendations — liability)
- News aggregator (supplementary only, not core value)
- Options chain tool (out of scope for complexity)
- Multi-user collaboration (isolation is the privacy model)
- Paid SaaS ($0 is the value proposition; BYOK for premium data)

---

## 15. Engineering Non-Negotiables

### 15.1 Code integrity
1. **No suppressions** — no `eslint-disable`, `@ts-ignore`, `--force`
2. **No dead artifacts** — every file, export, dep referenced
3. **No `TODO` in code** — open GitHub Issue instead
4. **No secrets in source** — `.env` + CF Secrets only
5. **Validation at boundaries** — sanitize all external input

### 15.2 Architecture integrity
1. **Layer imports one-way** — `types ← domain ← core ← providers ← cards ← ui`
2. **Domain stays pure** — no DOM, `fetch`, `Date.now()`, `Math.random()`
3. **Worker imports use `.js`** — CF Workers ESM requires extensions
4. **morphdom, not innerHTML** — raw innerHTML breaks diffing
5. **No floating promises** — `void asyncFn()` or `await`
6. **WASM has TS reference parity** — tested to 1e-10 tolerance

### 15.3 Quality gates
Run all: `npm run ci`

### 15.4 Deployment discipline
- **Ship before perfecting** — deployed imperfect > undeployed perfect
- **Staging before production** — verify on preview deployment
- **Health check before traffic** — `/api/health` must return 200
- **Rollback plan always** — CF Pages has instant rollback

### 15.5 Roadmap governance
- This document is the single source of truth for scope and priorities
- ADR required for every architectural decision within 24 hours
- One phase at a time — no scope jumps
- Exit criteria are measured, not assumed
- Status ✅ only when verified in production, not when code is merged

---

## Appendix A: Completed Phases (Historical)

| Phase | Version | Theme | Key Deliverables |
| --- | --- | --- | --- |
| A-C | v1-v4 | Foundation | Signals, router, watchlist, chart, 20 indicators |
| D-E | v5-v6 | Data & PWA | Multi-provider, SW, IDB, OPFS, 50 indicators |
| F-G | v7 | Quality | Strict TS, 90% coverage, WCAG AA, Lighthouse 90+ |
| H | v8-v9 | Advanced | Passkey sync, ONNX AI, D1 design |
| I | v10 | Features | Signal DSL, backtest, screener, heatmap, earnings |
| J-K | v11.0 | Performance | morphdom, virtual scroll, container queries |
| L | v11.x | Data depth | Fundamental overlay, seasonal, multi-condition alerts |
| M-N | v11.x | Polish | i18n, mobile audit, load testing, UX polish |
| O | v11.28-35 | Compat | Cross-browser, dead-file removal, ESLint strict |
| — | v11.36 | Phase P prep | Bindings, corporate actions, signal stores, WCs |
| — | v11.37 | Phase Q prep | FRED, contract tests, visual regression, property tests |
| — | v11.38 | Providers | Finnhub, CoinGecko, FRED, Stooq Worker providers |
| — | v11.39-41 | Completion | WebSocket DO, news, lit-html, data accuracy, DSL expansion |

## Appendix B: Decision Log (all versions)

| Decision | Introduced | Reaffirmed | Times |
| --- | --- | --- | --- |
| Vanilla TS + zero-dep signals | v1.0 | v9 | 9 |
| Pure domain layer | v1.0 | v9 | 9 |
| Valibot over Zod | v7.8 | v9 | 7 |
| Multi-provider failover | v3.0 | v9 | 8 |
| Cloudflare all-in ($0/mo) | v4.0 | v9 | 8 |
| Lightweight Charts v5 | v2.0 | v9 | 8 |
| Workbox Service Worker | v3.0 | v9 | 8 |
| Hono for Worker | v5.0 | v9 | 7 |
| morphdom + lit-html | v8.0 / v12 | v9 | 6 |
| Passkey-only auth | v9.0 | v9 | 6 |
| CSS Layers + @scope | v7.0 | v9 | 7 |
| TypeScript 6 strict | v11.0 | v9 | 5 |
| Temporal API | v9.0 | v9 | 6 |
| fast-check property testing | v11.35 | v9 | 4 |
| Alpaca co-primary (NEW) | v9 (roadmap) | — | 1 |
| Signal adapter layer (NEW) | v9 (roadmap) | — | 1 |
| MCP server (NEW priority) | v9 (roadmap) | — | 1 |
| Worker as standalone package (NEW) | v9 (roadmap) | — | 1 |

## Appendix C: Metric Targets by Phase

| Metric | Phase P | Phase Q | Phase R | Phase S | Phase T |
| --- | --- | --- | --- | --- | --- |
| Real users | 1+ | 10+ | 100+ | 500+ | 1000+ |
| GitHub stars | — | — | 100+ | 300+ | 500+ |
| Bundle (gzip) | < 200 KB | < 200 KB | < 200 KB | < 220 KB | < 250 KB |
| Test files | 608+ | 650+ | 700+ | 750+ | 800+ |
| Worker p50 | < 200ms | < 100ms | < 100ms | < 80ms | < 80ms |
| KV hit rate | > 50% | > 75% | > 85% | > 90% | > 90% |
| Uptime | > 99% | > 99.5% | > 99.9% | > 99.9% | > 99.9% |
| Lighthouse perf | ≥ 90 | ≥ 90 | ≥ 95 | ≥ 95 | ≥ 95 |
| Contributors | 1 | 1-2 | 3-5 | 5-10 | 10+ |
| npm packages | 0 | 0 | 0 | 1 | 3 |
| Community plugins | 0 | 0 | 0 | 0 | 3+ |

---

_This roadmap is a living document. Updated on every phase completion._
_Supersedes: ROADMAP v8 (May 12, 2026), archived at `docs/ROADMAP-v8-archive.md`._
_Next review: After Phase P deployment (target: June 2026)._
