# CrossTide — Strategic Roadmap v8 (Ship-First Rethink)

> **Date:** May 12, 2026
> **Current version:** v11.37.0
> **Codebase:** 219 domain modules · 52 cards · 37 Worker routes · 608 test files
> **Bundle:** 158 KB gzip (budget 200 KB) · 49 SW precache entries
> **Stack:** TypeScript 6.0 · Vite 8 · Vitest 4 · Hono 4 · morphdom · LWC v5
> **ADRs on record:** 11 (all accepted)
> **Previous roadmap:** v7 archived in git history (tag v11.37.0)
> **Key change from v7:** Ruthless focus on shipping. No new features until real users exist.

---

## Table of Contents

1. [The Brutal Audit](#1-the-brutal-audit)
2. [Comprehensive Competitor Comparison](#2-comprehensive-competitor-comparison)
3. [Best Practices Harvested from Leaders](#3-best-practices-harvested-from-leaders)
4. [Decision Rethink v8 — Everything Reopened](#4-decision-rethink-v8--everything-reopened)
5. [Frontend Strategy v8](#5-frontend-strategy-v8)
6. [Backend & Data Strategy v8](#6-backend--data-strategy-v8)
7. [AI/ML & Intelligence Strategy](#7-aiml--intelligence-strategy)
8. [WebAssembly & Performance Architecture](#8-webassembly--performance-architecture)
9. [Plugin & Extension System](#9-plugin--extension-system)
10. [External APIs & Vendor Strategy v8](#10-external-apis--vendor-strategy-v8)
11. [Data Quality & Financial Accuracy](#11-data-quality--financial-accuracy)
12. [Infrastructure & Deployment v8](#12-infrastructure--deployment-v8)
13. [Documentation Strategy v8](#13-documentation-strategy-v8)
14. [Quality, Security & Observability v8](#14-quality-security--observability-v8)
15. [Performance Budget v8](#15-performance-budget-v8)
16. [Phase P — v12.0.0 "Ship It"](#16-phase-p--v1200-ship-it)
17. [Phase Q — v13.0.0 "Real Data Everywhere"](#17-phase-q--v1300-real-data-everywhere)
18. [Phase R — v14.0.0 "Public Launch"](#18-phase-r--v1400-public-launch)
19. [Phase S — v15.0.0 "Intelligence & Compute"](#19-phase-s--v1500-intelligence--compute)
20. [Phase T — v16.0.0 "Ecosystem & Community"](#20-phase-t--v1600-ecosystem--community)
21. [Refactor & Rewrite Backlog](#21-refactor--rewrite-backlog)
22. [Decision Log v8](#22-decision-log-v8)
23. [Risks & Mitigations v8](#23-risks--mitigations-v8)
24. [Scope Boundaries v8](#24-scope-boundaries-v8)
25. [Engineering Non-Negotiables](#25-engineering-non-negotiables)

---

## 1. The Brutal Audit

Every claim is verified against the codebase as of v11.37.0. v7's audit was honest about
gaps but too kind about priorities. v8 confronts the deeper pattern.

### 1.1 Verified file counts (May 12, 2026)

| Metric                  | v7 Claim | **Actual**  | Verdict                                |
| ----------------------- | :------: | :---------: | -------------------------------------- |
| Test files              |   608    |   **608**   | Accurate                               |
| Domain modules          |   219    |   **219**   | Accurate                               |
| Card files              |    52    |   **52**    | Accurate                               |
| Worker routes           |    37    |   **37**    | Accurate                               |
| Core modules            |   134    |   **134**   | Accurate                               |
| UI modules              |    69    |   **69**    | Accurate                               |
| Provider files (client) |    13    |   **13**    | Good diversity                         |
| Provider files (Worker) |    1     |    **5**    | Finnhub, CoinGecko, FRED, Stooq, Yahoo |
| Locale files            |    7     |    **7**    | EN + 6 languages                       |
| CSS files               |    8     |    **8**    | Lean                                   |
| Lines of source (est.)  |    —     | **~45,000** | Large for solo dev                     |
| Lines of test (est.)    |    —     | **~30,000** | Excellent ratio                        |
| npm dependencies (prod) |    —     |   **11**    | Minimal — excellent                    |
| npm dependencies (dev)  |    —     |   **60+**   | Heavy but justified                    |

### 1.2 What is genuinely excellent

| Area                  | Evidence                                                                   | Verdict       |
| --------------------- | -------------------------------------------------------------------------- | ------------- |
| **Pure domain layer** | 219 modules, zero I/O, 100% deterministic, 608 test files                  | World-class   |
| **Bundle size**       | 158 KB gzip — 10–30× smaller than commercial competitors                   | World-class   |
| **Type safety**       | TS 6 strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`    | World-class   |
| **Indicator depth**   | 80+ indicators covering TA, quant finance, statistics                      | Best-in-class |
| **Offline-first**     | 5-tier cache (Map → LS → IDB → SW → OPFS), Background Fetch, Web Push      | Best-in-class |
| **Signal system**     | Zero-dep reactive primitives, `batch()`, auto-tracking, lazy evaluation    | Excellent     |
| **CSS architecture**  | Layers, `@scope`, container queries, semantic tokens, color-blind palettes | Excellent     |
| **Security posture**  | CSP strict, HSTS preload, Valibot at every boundary, no inline JS, SRI     | Excellent     |
| **DevEx**             | Full CI, git hooks, commitlint, lint-staged, ADR process, preview deploys  | Excellent     |
| **WCAG compliance**   | AA certified, axe-core E2E, contrast CI check, reduced-motion support      | Excellent     |
| **ADR process**       | 11 documented decisions with context, rationale, consequences              | Excellent     |
| **Test culture**      | 608 files, 90%+ stmt/line, fast-check, visual regression, contracts        | Excellent     |

### 1.3 What is genuinely broken or incomplete

| #       | Area                                        | Reality                                                                                       | Severity  |
| ------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- | --------- |
| **B1**  | **Never deployed to production**            | Zero real users. Zero real data flowing. The app is a demo.                                   | **Fatal** |
| **B2**  | Only 1 Worker provider (Yahoo)              | 13 client-side providers; Worker has only `yahoo.ts`. All other routes use fixture fallbacks. | Critical  |
| **B3**  | wrangler.toml IDs are PLACEHOLDERs          | KV, D1, DO, Rate Limiter — ALL use `PLACEHOLDER_*` strings. Deployment literally impossible.  | Critical  |
| **B4**  | D1 migrations never applied                 | SQL exists; never run against a real D1 instance.                                             | High      |
| **B5**  | Passkey auth never wired to D1              | `passkey.ts` + `webauthn.ts` exist; no DB binding connected end-to-end.                       | High      |
| **B6**  | No Finnhub provider in Worker               | Real-time streaming blocked entirely.                                                         | High      |
| **B7**  | No CoinGecko provider in Worker             | Crypto routes return fixture data only.                                                       | High      |
| **B8**  | ~40% of domain modules have zero UI surface | Hawkes, copula, wavelet, jump-diffusion — mathematically correct, operationally dormant.      | Medium    |
| **B9**  | ONNX modules are dead code                  | `onnx-patterns.ts`, `onnx-pipeline.ts` — no model file, no integration, never called.         | Medium    |
| **B10** | `packages/` workspace dirs are stubs        | npm workspaces declared but empty. Adds complexity for zero value.                            | Medium    |
| **B11** | Docs-site is a shell                        | Astro Starlight structure exists; most MDX pages are stubs with boilerplate content.          | Low       |
| **B12** | No visual regression baselines committed    | Screenshot tests exist but baselines regenerate each run — catches nothing.                   | Low       |
| **B13** | Test suite tests only synthetic paths       | 608 files run against mocks. Zero real network calls, D1 writes, or KV caching validated.     | Medium    |

### 1.4 The uncomfortable truths

**Truth 1 — This is a demo, not a product.**
Despite 11 major versions, 608 tests, and 219 domain modules — the application has never
served a single real user. Every binding ID is a placeholder. The Worker has never connected
to Cloudflare. The chart has never rendered live market data in production. This truth must
anchor every v8 decision.

**Truth 2 — Architecture has outpaced product.**
We built a world-class engine and forgot to put it in a car. The pure domain layer is
genuinely excellent. The signal system works. The CSS is modern. But none of this matters
if `crosstide.pages.dev` shows fixture data or fails to load.

**Truth 3 — The feature backlog is a trap.**
v7 planned 5 phases spanning 30+ weeks: WASM compilation, on-device LLM, plugin
marketplaces, MCP servers, Docker self-hosting. For a solo developer with zero users, this
is scope fantasy. Every planned feature that doesn't serve "type a ticker → see real data"
is a distraction.

**Truth 4 — The comparison table was aspirational, not factual.**
v7 rated "planned" features with stars (★★★). A user comparing CrossTide to TradingView
would feel deceived — we claim ★★★ Natural Language Query but have zero lines of NL code.
v8 rates only what exists today.

**Truth 5 — Over-engineering is the primary risk.**
The project doesn't need more indicators, more chart types, or more infrastructure. It
needs one thing: **deploy and serve real data to real people.** Everything else follows.

**Truth 6 — ~40% of domain modules are dormant.**
Hawkes processes, copula models, jump-diffusion — extraordinary math with no data flowing
through them. These should be surfaced through the plugin system, not the core app.

**Truth 7 — The solo developer bottleneck is real.**
608 test files need maintenance. 52 cards need updates. 37 Worker routes need real
bindings. 80+ indicators need documentation. One person cannot maintain all of this
at quality. The v8 strategy must ruthlessly prioritize.

### 1.5 Priority order for v8

1. **Deploy to production** — the only thing that matters right now
2. **First real user flow** — ticker → live data → chart → consensus
3. **Wire 3 more Worker providers** — Finnhub, CoinGecko, FRED
4. **Gather real user feedback** — analytics, error reports, usability
5. **Fix what breaks** — real data will expose real bugs
6. **Then, and only then** — consider new features

---

## 2. Comprehensive Competitor Comparison

### 2.1 Product comparison matrix — HONEST ratings (current state only)

Rating: `★★★` best-in-class · `★★` strong · `★` adequate · `△` partial/basic · `✗` absent
**Important:** Ratings reflect SHIPPED functionality only. "Planned" features are rated `✗`.

| Capability                        | **CrossTide** |  TradingView  |   FinViz    | StockAnalysis |  Koyfin  | thinkorswim |  Bloomberg  |   OpenBB    | Ghostfolio | TrendSpider |  Webull  |
| --------------------------------- | :-----------: | :-----------: | :---------: | :-----------: | :------: | :---------: | :---------: | :---------: | :--------: | :---------: | :------: |
| **License**                       |   MIT (OSS)   |  Proprietary  | Proprietary |  Proprietary  | Propriet | Proprietary | Proprietary | AGPL (OSS)  | AGPL (OSS) | Proprietary | Propriet |
| **Pricing**                       |     Free      |   $15–60/mo   |  $25–50/mo  |   Free/Pro    |  $39/mo  | Free/Schwab |  $6,000/yr  |    Free     | Free/Prem  |  $39–97/mo  |   Free   |
| **Self-hostable**                 |      ★★★      |       ✗       |      ✗      |       ✗       |    ✗     |      ✗      |      ✗      |     ★★★     | ★★ Docker  |      ✗      |    ✗     |
| **No account required**           |      ★★★      |       △       |     ★★★     |      ★★★      |    ✗     |      ✗      |      ✗      |      ✗      |     ✗      |      ✗      |    ✗     |
| **Privacy (cookieless)**          |      ★★★      |  ✗ trackers   |    ✗ ads    |     ✗ ads     |    ✗     |      ✗      |      ✗      |     ★★      |    ★★★     |      △      |    ✗     |
| **Bundle / load speed**           |  ★★★ 158 KB   |    ✗ ~5 MB    |     SSR     |   SSR ~2 MB   |  ~3 MB   |   Desktop   |   Desktop   |   Desktop   |  ~500 KB   |    ~2 MB    |  ~4 MB   |
| **Lighthouse perf score**         |    ★★★ ≥90    |      ~50      |     ~70     |      ~75      |   ~60    |     n/a     |     n/a     |     n/a     |    ~65     |     ~55     |   ~45    |
| **Offline / PWA**                 |   ★★★ full    |       ✗       |      ✗      |       ✗       |    ✗     |   Desktop   |      ✗      |    Local    |     ★★     |      ✗      |    ✗     |
| **Real-time streaming**           |   ✗ broken    |      ★★★      |    Paid     |      ★★       |    ★★    |     ★★★     |     ★★★     |     ★★      |    EOD     |     ★★★     |   ★★★    |
| **Charting depth**                |   ★★ LWC v5   | ★★★ 20 types  |   Static    |    ★ basic    |    ★★    |     ★★★     |  ★★★ 100+   |     ★★      |     ✗      |     ★★★     |    ★★    |
| **Indicator library**             |    ★★★ 80+    |   ★★★ 400+    |     50+     |      30+      |   80+    |  ★★★ 400+   |  ★★★ 1000+  |     80+     |     ✗      |  ★★★ 100+   |    ★★    |
| **Consensus / multi-signal**      |  ★★★ unique   |       ✗       |      ✗      |   △ analyst   |    ✗     |      ✗      | ★★ analyst  |      ✗      |     ✗      |    △ AI     |    ✗     |
| **Screener**                      |    ★★ DSL     |      ★★       | ★★★ iconic  |      ★★★      |    ★★    |     ★★      |   ★★★ BQL   |     ★★★     |     ✗      |     ★★★     |    ★★    |
| **Backtest engine**               |    ★ basic    |  Pine Script  |      ✗      |       ✗       |    ★     | thinkScript |    BTCA     |     ★★      |     ✗      |     ★★★     |    ✗     |
| **Portfolio analytics**           |      ★★       |       ✗       |      ✗      |    ★ watch    |   ★★★    |   Broker    |  ★★★ PORT   |     ★★      |    ★★★     |      ✗      |    ★★    |
| **Fundamental data**              |   △ overlay   |   ★★★ 100+    |     ★★★     |   ★★★ 200+    |   ★★★    |     ★★★     |  ★★★ 1000+  |     ★★★     |     ✗      |      ✗      |    ★★    |
| **Natural language query**        |       ✗       |       ✗       |      ✗      |       ✗       |    ✗     |      ✗      |  ★★★ BQNA   |     ★★      |     ✗      |      ✗      |    ✗     |
| **On-device AI / privacy**        |       ✗       |       ✗       |      ✗      |       ✗       |    ✗     |      ✗      |      ✗      |      ✗      |     ✗      |   Server    |    ✗     |
| **Custom scripting**              |    ★★ DSL     |   ★★★ Pine    |      ✗      |       ✗       |    ✗     | ★★ tScript  |   ★★★ BQL   |   ★★★ Py    |     ✗      |      ✗      |    ✗     |
| **Plugin / extension API**        |       ✗       |      ★★★      |      ✗      |       ✗       |    ✗     |      △      |     ★★★     |     ★★★     |     ★★     |      ✗      |    ✗     |
| **WebAssembly compute**           |       ✗       |       ✗       |      ✗      |       ✗       |    ✗     |      ✗      |      ✗      |      ✗      |     ✗      |      ✗      |    ✗     |
| **Cloud sync (E2EE)**             |  △ code only  |    Account    |   Account   |    Account    | Account  |   Broker    |  Firm SSO   |   Account   |  Account   |   Account   | Account  |
| **Economic calendar**             |    ★★ FRED    |      ★★★      |     ★★      |      ★★       |   ★★★    |     ★★★     |     ★★★     |     ★★★     |     ✗      |      ✗      |    ★★    |
| **Drawing tools**                 | ★★ (10 tools) |  ★★★ (110+)   |      ✗      |       ✗       |    ★     |     ★★      |   ★★★ 80+   |      ✗      |     ✗      |   ★★★ 50+   |    ★     |
| **Mobile native**                 |  △ Capacitor  | ★★★ iOS+Droid |      ✗      |   ★ mobile    |    ★★    |     ★★★     |  ★★★ apps   |   Desktop   |   △ PWA    |     ★★      |   ★★★    |
| **WCAG accessibility**            |    ★★★ AA     |       △       |      ✗      |       △       |    △     |      ✗      |     ★★      |      △      |     ★★     |      ✗      |    △     |
| **Test coverage / quality**       | ★★★ 608 files |    Unknown    |   Unknown   |    Unknown    | Unknown  |   Unknown   |   Unknown   |  ★★ pytest  |  ★★ Jest   |   Unknown   | Unknown  |
| **Multi-asset (stock+crypto+fx)** | △ client only |      ★★★      | Stock only  |  Stock only   |   ★★★    |     ★★★     |     ★★★     |     ★★★     |    ★★★     |     ★★      |   ★★★    |
| **Community / ecosystem**         |  ✗ solo dev   |   ★★★ 50M+    |     ★★★     |   ★★ 500K+    |    ★★    |     ★★★     |     ★★★     | ★★★ 67.5K⭐ | ★★ 8.4K⭐  |     ★★      |   ★★★    |
| **Data provider diversity**       | ★★ 13 client  |      ★★★      | Proprietary |  Proprietary  |   ★★★    | Proprietary |  ★★★ 100+   |   ★★★ 40+   |   ★★ 10+   | Proprietary |    ★★    |
| **API / Developer access**        |   △ OpenAPI   |  ★★ widgets   |      ✗      |     ★ API     |    ★     |      △      | ★★★ BLPAPI  |   ★★★ SDK   |     ★★     |      ✗      |    ★     |
| **News & sentiment analysis**     |   △ planned   |      ★★★      |     ★★★     |      ★★★      |    ★★    |     ★★★     |     ★★★     |     ★★      |     ✗      |     ★★★     |    ★★    |

### 2.2 Architecture & technology comparison

| Dimension              | **CrossTide**                      | **TradingView**        | **StockAnalysis**   | **OpenBB**               | **Ghostfolio**         | **TrendSpider**     |
| ---------------------- | ---------------------------------- | ---------------------- | ------------------- | ------------------------ | ---------------------- | ------------------- |
| **Language**           | TypeScript 6 (strict)              | TypeScript + C++       | PHP + TypeScript    | Python 3.9+              | TypeScript (Angular)   | TypeScript + Python |
| **Frontend framework** | Vanilla TS + morphdom + signals    | Custom VDOM + Canvas   | Next.js (React SSR) | Desktop (Tauri/Electron) | Angular 21 + Material  | React + Highcharts  |
| **Backend framework**  | Hono 4 (Cloudflare Workers)        | Go + C++ microservices | Laravel + Node.js   | FastAPI (Python)         | NestJS (Node) + Prisma | Node.js + Go        |
| **Database**           | Cloudflare D1 (SQLite edge)        | ClickHouse + Redis     | MySQL + Redis       | None (API pass-through)  | PostgreSQL + Prisma    | PostgreSQL + Redis  |
| **Cache**              | Cloudflare KV + 5-tier client      | Redis + CDN            | Redis + CDN + SSG   | In-memory                | Redis                  | Redis + CDN         |
| **Real-time**          | ✗ Not wired (Finnhub WS planned)   | Proprietary WS infra   | SSE + polling       | None (pull-based)        | None (poll)            | WebSocket           |
| **Charts**             | Lightweight Charts v5 (Canvas)     | Custom Canvas engine   | Highcharts          | Plotly / matplotlib      | Custom Angular charts  | Highcharts + custom |
| **Auth**               | Passkey (WebAuthn), no email/pass  | Email + OAuth          | Email + OAuth       | API keys                 | Email + OIDC           | Email + OAuth       |
| **Validation**         | Valibot (3 KB)                     | Unknown (internal)     | Zod + Pydantic      | Pydantic                 | class-validator        | Joi / Yup           |
| **Build tool**         | Vite 8 + oxc                       | Webpack (custom)       | Next.js (Turbopack) | Poetry + pip             | Nx + Webpack           | Webpack             |
| **Hosting**            | Cloudflare (all-in, $0/mo)         | Proprietary DC         | AWS + Vercel        | Local / Docker           | Docker / cloud VPS     | AWS                 |
| **Tests**              | Vitest 4 + Playwright + fast-check | Internal CI            | Jest + Cypress      | pytest + pytest-cov      | Jest + Cypress         | Jest                |
| **Bundle gzip**        | **158 KB**                         | ~5 MB                  | n/a (SSR)           | n/a (desktop)            | ~500 KB                | ~2 MB               |
| **Offline support**    | ★★★ (5-tier + SW)                  | ✗                      | ✗                   | ★★★ (local)              | ★★ (basic SW)          | ✗                   |
| **Open source**        | Yes (MIT)                          | No                     | No                  | Yes (AGPL)               | Yes (AGPL)             | No                  |

### 2.3 What CrossTide uniquely offers TODAY

1. **OSS (MIT) + self-hostable + privacy-first + no-account**: No competitor combines all four.
2. **12-method consensus engine**: Unique weighted signal aggregation — no OSS or commercial
   competitor has an equivalent multi-method consensus with configurable weights.
3. **158 KB bundle**: 10–30× smaller than any web-based competitor. 2× better Lighthouse score.
4. **Offline depth**: 5-tier cache + Background Fetch + OPFS — beyond even Ghostfolio's SW.
5. **80+ indicators in a pure domain layer**: Zero I/O, deterministic, testable, WASM-ready.
6. **Passkey-only auth model**: No email, no password, no user database — genuinely unique.
7. **Strict TypeScript**: `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` — no
   competitor open-sources this level of type safety.
8. **Zero-dep reactive signals**: Custom signal system that outperforms VDOM for dashboard use.

### 2.4 Where CrossTide is behind (honest gaps)

1. **No real data in production** — every competitor ships working data; CrossTide doesn't.
2. **No real-time streaming** — TradingView, thinkorswim, TrendSpider, Webull all offer it.
3. **Fundamental data is thin** — StockAnalysis and Koyfin have 200+ metrics; we have a few.
4. **No news/sentiment** — FinViz, StockAnalysis, TradingView all have news feeds.
5. **No community** — OpenBB has 67K stars; Ghostfolio 8K; CrossTide has zero external users.
6. **Backtest is basic** — TrendSpider and TradingView have sophisticated backtesting.
7. **Drawing tools are limited** — 10 vs TradingView's 110+.
8. **No mobile app store presence** — Capacitor exists but no published app.
9. **Zero plugins** — TradingView, OpenBB, and Bloomberg all have plugin ecosystems.
10. **No SSR/SEO** — StockAnalysis ranks for every stock ticker; CrossTide is invisible.

### 2.5 What we MUST harvest from competitors

| Gap                               | Leader                   | What to harvest                                          | Phase |
| --------------------------------- | ------------------------ | -------------------------------------------------------- | ----- |
| **Ship real data**                | All competitors          | Provision CF; wire providers; serve live quotes. Period. | P     |
| **Provider diversity in backend** | OpenBB (40+ sources)     | Port top 4 client providers to Worker; failover chain    | P–Q   |
| **Fundamental data depth**        | StockAnalysis, Koyfin    | Parse Yahoo `quoteSummary` fully; add Intrinio/Tiingo    | Q     |
| **News + sentiment**              | FinViz, StockAnalysis    | Finnhub news API + basic NLP sentiment scoring           | Q     |
| **Fast page load via SSG**        | StockAnalysis, FinViz    | Pre-render popular ticker pages for SEO + instant paint  | R     |
| **Docker self-hosting**           | Ghostfolio               | `docker-compose.yml` with miniflare + D1 + KV            | R     |
| **Chart types (6 vs 20+)**        | TradingView, TrendSpider | Volume Profile, Kagi, multi-pane sync                    | Q     |
| **Drawing tools (10 vs 110)**     | TradingView              | Prioritize top 15: channels, Gann, pitchfork             | Q     |
| **Natural language queries**      | Bloomberg BQNA, OpenBB   | On-device LLM (WebGPU + Phi-3.5); NL → DSL               | S     |
| **Plugin marketplace**            | TradingView, OpenBB      | Plugin SDK + registry + sandbox                          | T     |
| **Community building**            | OpenBB (67K stars)       | npm package, Discord, contributor docs, tutorials        | T     |
| **Broker integration**            | Webull, thinkorswim      | Read-only Alpaca/Schwab positions                        | T     |
| **AI-powered analysis**           | TrendSpider              | ONNX pattern recognition on charts                       | S     |
| **Mobile app stores**             | TradingView, Webull      | Capacitor → iOS/Android stores                           | R     |
| **MCP for AI agents**             | OpenBB                   | Expose API as MCP server for LLM tool use                | T     |
| **Real-time alerting**            | TradingView, TrendSpider | Push notifications for price/indicator conditions        | Q     |

---

## 3. Best Practices Harvested from Leaders

| Practice                                    | Source                            | How to apply                                                             | Priority |
| ------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------ | -------- |
| **Ship before perfecting**                  | Every successful startup          | Deploy v12 with Yahoo-only; iterate with real user feedback              | P0       |
| **Real data with edge caching**             | All commercial apps               | Provision CF resources; KV cache with market-hours TTL                   | P0       |
| **Multi-provider failover in backend**      | OpenBB (40+ data sources)         | Port Yahoo/Finnhub/CoinGecko/FRED to Worker; provider-chain pattern      | P0       |
| **SSG for SEO + instant load**              | StockAnalysis (ranks for tickers) | Pre-render top 500 ticker pages; index in Google; drive organic traffic  | R1       |
| **Corporate action adjustment**             | Bloomberg, Tiingo                 | All OHLCV returned split-adjusted by default; raw optional               | P0       |
| **Structured news feed**                    | FinViz, StockAnalysis             | Finnhub news API with basic sentiment scoring; surface in card           | Q1       |
| **Docker Compose self-hosting**             | Ghostfolio                        | Single `docker-compose.yml` with all dependencies for self-hosters       | R1       |
| **Signal stores per domain**                | SolidJS, Svelte stores            | `createWatchlistStore()`, `createPortfolioStore()` per-domain stores     | P1 ✅    |
| **Route-level data loading**                | Remix, SvelteKit, TanStack        | `loader()` before render; abort on navigate; already done                | P1 ✅    |
| **Web Components for composable UI**        | Lit, GitHub Catalyst, Shoelace    | `<ct-data-table>`, `<ct-chart-frame>`, `<ct-stat-grid>` already done     | P1 ✅    |
| **lit-html for complex templates**          | Lit, GitHub Primer                | Tagged template literals for cards with complex conditional HTML         | Q1       |
| **WASM for hot computation**                | Figma, Photoshop Web              | AssemblyScript for RSI/EMA/correlation matrix                            | S1       |
| **On-device LLM for NL queries**            | Bloomberg BQNA, WebLLM            | Phi-3.5 mini via WebGPU; zero data leaves browser                        | S1       |
| **Contract testing for provider APIs**      | Pact, OpenBB test suite           | Offline contracts for Yahoo/Finnhub; catch schema breaks before runtime  | Q2 ✅    |
| **Property-based testing for finance math** | fast-check, Hypothesis            | Expand to all 80+ indicators; range invariants, degenerate inputs        | Q1 ✅    |
| **OpenAPI → TypeScript client codegen**     | OpenAPI Generator, orval          | Auto-generate typed client from `openapi.json`                           | Q1 ✅    |
| **Volume Profile / TPO charts**             | TradingView, thinkorswim          | LWC custom series for volume-at-price distribution                       | Q2 ✅    |
| **Mutation testing**                        | Stryker, PIT                      | Verify tests actually catch real bugs in indicator calculations          | Q3       |
| **Daily real API smoke tests**              | Netflix, Vercel                   | Scheduled CI job tests 5 key endpoints against live APIs daily           | P1       |
| **Plugin registry with versioned API**      | TradingView, VSCode, OpenBB       | Indicator + chart-type + data-source + theme plugins; isolated execution | T1       |
| **Bar Replay with order simulation**        | TradingView                       | Play historical data tick-by-tick; strategy simulation in real-time      | R1       |
| **Structured OTEL traces in Worker**        | Vercel, Linear                    | Correlate client error → Worker request → upstream API call              | R2 ✅    |
| **MCP server for AI agents**                | OpenBB                            | Expose CrossTide API as MCP server for LLM tool use                      | T3       |
| **Streaming SSR for critical paths**        | StockAnalysis, Next.js            | Server-render watchlist + consensus for instant meaningful paint         | R2       |
| **Mobile-first analytics dashboard**        | Webull, TradingView mobile        | Touch-optimized chart interactions; swipe between tickers                | R1       |
| **Community Discord + contributor guide**   | OpenBB (active Discord)           | Structured onboarding for contributors; issue triage process             | T1       |
| **Embedded analytics widget**               | TradingView (widgets)             | `<script>` embed for blogs/websites; drives awareness + adoption         | T2       |

---

## 4. Decision Rethink v8 — Everything Reopened

### 4.1 Decisions REAFFIRMED (confirmed correct on 8th review)

| Decision                              | Why it's right                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Vanilla TS + zero-dep signals**     | 158 KB proves it. React adds 40 KB. SolidJS adds 7 KB. Our signals outperform VDOM for dashboard updates.       |
| **Pure domain layer**                 | 219 modules, zero side effects. The crown jewel. Perfect for WASM compilation and npm extraction.               |
| **Valibot over Zod/Effect**           | 3 KB vs 30 KB vs 120 KB. Same safety at every boundary. No contest.                                             |
| **Multi-provider failover pattern**   | Yahoo breaks monthly. 5+ fallbacks + circuit breaker is production-grade. Validated by OpenBB's approach.       |
| **Cloudflare all-in ($0/mo)**         | Pages + Workers + KV + D1 + R2 + DO. Hono makes it portable. Can't beat free. Risk is low: Hono ports in 1 day. |
| **Lightweight Charts v5**             | 45 KB. Professional charting. TradingView OSS. MIT. Superior to uPlot for financial charts.                     |
| **Workbox Service Worker**            | Offline-first non-negotiable for PWA. 5-tier cache is best-in-class. No competitor matches this.                |
| **Hono for Worker**                   | 14 KB. Typed routes, middleware, OpenAPI, DO support. Portable to Deno/Bun/Lambda if needed.                    |
| **morphdom for DOM updates**          | 2.7 KB. Incremental DOM patching without framework. Works perfectly with signals.                               |
| **Passkey-only auth**                 | No password hashes, no email, no user table. Unique privacy story. WebAuthn browser support is universal.       |
| **CSS Layers + @scope + container q** | Modern CSS that eliminates class collisions at zero runtime cost. No framework overhead.                        |
| **TypeScript 6 strict mode**          | `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` catches real bugs at compile time.                    |
| **Temporal API**                      | Financial dates need timezone-safe arithmetic. Native in Chrome 131+; polyfill conditional.                     |
| **fast-check property testing**       | Financial math must be correct for ANY input. 22 property tests and growing.                                    |

### 4.2 Decisions GENUINELY CHALLENGED in v8

| Old Decision                          | Challenge                                                     | v8 Verdict                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vanilla TS vs SolidJS**             | SolidJS is 7 KB, has JSX, fine-grained reactivity, ecosystem  | **Keep vanilla TS.** Migration cost of 52 cards + all UI is enormous. Signals already work. DX gap closed by Web Components + lit-html. Revisit only if hiring contributors who expect JSX. |
| **morphdom vs lit-html**              | lit-html has better DX for complex conditional templates      | **Add lit-html (~2 KB) for complex cards.** morphdom stays for simple cards. Not a replacement — a complement. Use where string templates become unreadable.                                |
| **SPA-only vs SSR/SSG**               | StockAnalysis ranks for every ticker via SSR; we're invisible | **Add SSG for top 500 tickers in Phase R.** Pre-render static pages for SEO. SPA remains for interactive use. Astro or Vite SSG plugin.                                                     |
| **No React/Vue/Svelte ever**          | Contributors may expect a framework                           | **Hold firm for now.** The 158 KB bundle IS the product differentiator. If community adoption requires framework, evaluate SolidJS (closest match) in Phase T.                              |
| **D1 for everything**                 | D1 is SQLite at edge — limited query capability               | **Keep D1 for user data.** Add R2 for OHLCV archives (Parquet). D1 handles alerts, sync, CSP logs — that's its sweet spot.                                                                  |
| **npm workspaces (broken)**           | `packages/` are stubs adding complexity                       | **Remove `packages/` stubs now.** Reintroduce as real packages when `@crosstide/domain` is ready for npm publish (Phase T).                                                                 |
| **ONNX modules (dead code)**          | `onnx-patterns.ts`, `onnx-pipeline.ts` never called           | **Move to `domain/_experimental/`.** Keep the code but clearly mark it as not integrated. Wire in Phase S or remove.                                                                        |
| **Astro docs-site (shell)**           | 48+ MDX pages that are mostly stubs                           | **Pause docs-site until Phase R.** Focus on shipping. Auto-generate from JSDoc when ready.                                                                                                  |
| **60+ dev dependencies**              | Heavy for a solo project                                      | **Audit and trim.** Remove unused lint plugins. Consider combining tools (e.g., Biome for lint+format). Evaluate post Phase P.                                                              |
| **wrangler.toml PLACEHOLDER pattern** | Deployment literally impossible                               | **Fix immediately in Phase P.** This is the #1 blocker for the entire project.                                                                                                              |
| **No real integration tests**         | 608 tests but zero real network validation                    | **Add daily smoke test CI job.** 5 endpoints against live APIs. Catches schema drift, rate limits, auth issues.                                                                             |
| **Capacitor for mobile**              | Never built or published                                      | **Defer to Phase R.** PWA is sufficient for now. Capacitor only when app store presence is needed.                                                                                          |

### 4.3 NEW decisions for v8

| Decision                                     | Rationale                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Deploy by end of Phase P — no exceptions** | Every other improvement is meaningless without real users. This is a hard gate.                 |
| **Remove `packages/` stubs immediately**     | They add npm workspace complexity for zero value. Reintroduce when real packages exist.         |
| **Add lit-html for complex card templates**  | 2 KB. Better DX for conditional/loop-heavy templates. Complement morphdom, don't replace it.    |
| **Daily smoke test CI against live APIs**    | Catch Yahoo/Finnhub schema changes before they hit users. Runs on schedule, not on every push.  |
| **Pre-render top 500 tickers (SSG)**         | SEO visibility drives organic traffic. StockAnalysis proves this strategy works.                |
| **Move ONNX to `_experimental/`**            | Clearly separate working code from aspirational code. Reduces confusion.                        |
| **Pause Astro docs-site**                    | Solo developer bandwidth is finite. Ship product first, document later.                         |
| **R2 cold storage for OHLCV in Phase Q**     | Reduce Yahoo rate-limit dependency. Store 20-year history for top 500 tickers.                  |
| **News card with Finnhub API in Phase Q**    | Every competitor has news. It's table-stakes for a financial dashboard.                         |
| **Embedded widget in Phase T**               | `<crosstide-chart ticker="AAPL">` — drives adoption like TradingView widgets.                   |
| **Biome evaluation for lint+format**         | Biome replaces ESLint + Prettier in one tool (Rust-based, 100× faster). Evaluate after Phase P. |
| **pnpm over npm for workspace management**   | If we reintroduce workspaces, pnpm is faster and handles phantom deps better than npm.          |

### 4.4 Architectural rethinks: considered and decided

| Option                              | What we considered                                    | Verdict                                                                                         |
| ----------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **SolidJS migration**               | 7 KB, fine-grained reactivity, JSX, growing ecosystem | ✗ Migration cost exceeds benefit. Our signals work. Revisit if community demands JSX.           |
| **React / Vue / Svelte migration**  | Ecosystem, hiring, component libraries                | ✗ Bundle 2–3× larger. Our 158 KB IS the differentiator. Cannot sacrifice it.                    |
| **Next.js / Astro for SSR**         | SEO, first paint, server components                   | △ SSG for ticker pages (Phase R). Full SSR is overkill for a dashboard SPA.                     |
| **D3.js for charts**                | More chart types, SVG control                         | ✗ 60 KB; performance inferior to LWC Canvas; custom series API is sufficient.                   |
| **Apache ECharts**                  | 100+ chart types, good defaults                       | ✗ 700 KB unminified. Too heavy. LWC plugin API achieves new types at 2–5 KB.                    |
| **tRPC for Worker API**             | End-to-end type safety, automatic client inference    | ✗ Hono + OpenAPI codegen achieves same result with less overhead and framework lock-in.         |
| **GraphQL for API**                 | Flexible queries, client-driven data shape            | ✗ Over-engineering for 37 routes. REST + OpenAPI codegen is simpler and debuggable.             |
| **PostgreSQL / Supabase**           | Rich SQL, ecosystem, realtime subscriptions           | ✗ D1 handles our schema at $0/mo. Supabase adds hosting cost and vendor dependency.             |
| **Tailwind CSS**                    | Utility classes, consistent design tokens             | ✗ CSS Layers + custom properties achieves same goals without 50 KB utility output.              |
| **Biome replacing ESLint+Prettier** | Single tool, Rust-based, 100× faster                  | △ Promising. Evaluate after Phase P. Currently ESLint + Prettier work fine.                     |
| **Bun replacing Node**              | Faster runtime, built-in test runner                  | ✗ Vitest + Vite are mature. Bun compat gaps. No compelling benefit for this project.            |
| **Deno for Worker**                 | Built-in TS, web standards, Deno Deploy               | ✗ Hono already runs on Deno. Cloudflare Workers is our target platform. Keep portable.          |
| **Rust compiled to WASM**           | Fastest WASM, large ecosystem (ndarray, statrs)       | △ High barrier. AssemblyScript (TS-like) is sufficient and accessible. Revisit post Phase S.    |
| **Electron desktop app**            | File system, native menus, no browser restrictions    | ✗ PWA covers 95% of use cases. Capacitor covers mobile. Tauri v2 only if desktop market exists. |
| **Kubernetes**                      | Container orchestration, scaling                      | ✗ CF Workers scales automatically at $0/mo. K8s is massive operational overhead.                |
| **WebTransport for real-time**      | Lower latency than WebSocket, QUIC multiplexing       | △ No provider supports it yet. Plan when Finnhub/Alpaca adopt WebTransport.                     |
| **MongoDB / DynamoDB**              | Flexible schema, document model                       | ✗ D1 SQLite is simpler, free, edge-native. Financial data is structured, not document-shaped.   |
| **Redis for caching**               | Industry standard, pub/sub, streams                   | ✗ KV is free, edge-native, sufficient for TTL-based quote caching. Redis adds cost + latency.   |

---

## 5. Frontend Strategy v8

### 5.1 Rendering model — evolution path

```text
v1-v7:    innerHTML (full re-render)
v8-v11:   morphdom (incremental DOM patching)               ← CURRENT
v12:      morphdom + Web Components (shared primitives)     ← DONE (P18–P19)
v13:      morphdom + Web Components + lit-html (complex)    ← NEXT
v13+:     View Transitions API on all navigation            ← DONE (P24)
v15+:     WASM computation + WebGPU acceleration
```

morphdom is NOT being replaced. lit-html (~2 KB) complements it for cards with complex
conditional logic, loops, and event binding. Simple cards continue with morphdom only.

### 5.2 Web Components — completed base primitives

These 4 Web Components are done (Phase P) and shared across all 52 cards:

```ts
// <ct-data-table>  — virtual scrolling, sort, keyboard nav, ARIA, copy-cell   ✅
// <ct-stat-grid>   — responsive grid of key metrics (P/E, volume, 52-week)    ✅
// <ct-chart-frame> — LWC wrapper: loading skeleton, error fallback, resize    ✅
// <ct-empty-state> — consistent loading/error/no-data states with actions     ✅
```

**Next Web Components (Phase Q):**

```ts
// <ct-filter-bar>  — preset buttons + text/range inputs + active filter count ✅ DONE
// <ct-news-feed>   — scrollable news list with sentiment badges               ⬜
// <ct-ticker-chip> — compact ticker display with sparkline + change%          ⬜
```

### 5.3 Signal stores — done, needs expansion

Signal stores are implemented (P15). Current stores:

```ts
// src/stores/watchlist.store.ts   ✅
// src/stores/portfolio.store.ts   ✅
// src/stores/settings.store.ts    ✅
```

**Needed:** `alerts.store.ts`, `screener.store.ts` — migrate remaining cards.

### 5.4 Router — done, query strings + loaders

Route loaders with AbortController are implemented (P16). All 52 cards have error
boundaries (P17). View Transitions are active (P24).

### 5.5 Chart type expansion (updated status)

| Type                 | Priority | Status       | Implementation                                          |
| -------------------- | -------- | ------------ | ------------------------------------------------------- |
| Candlestick          | P0       | ✅ Done      | LWC native                                              |
| Line / Area          | P0       | ✅ Done      | LWC native                                              |
| Heikin-Ashi          | P1       | ✅ Done      | `domain/heikin-ashi.ts` → candlestick renderer          |
| Renko                | P1       | ✅ Done      | `domain/renko.ts` → LWC custom series                   |
| Range bars           | P1       | ✅ Done      | `domain/range-bars.ts` → LWC custom series              |
| Point & Figure       | P1       | ✅ Done      | `domain/point-and-figure.ts` → SVG renderer             |
| Volume Profile       | P2       | ✅ Done (Q5) | LWC custom series: horizontal histogram at price levels |
| Bar Replay           | P2       | ✅ Done      | `domain/bar-replay.ts` domain model exists              |
| Multi-timeframe sync | P2       | ✅ Done      | `domain/multi-timeframe.ts` domain model exists         |
| Fundamental overlay  | P2       | ✅ Done      | `domain/fundamental-data.ts` + secondary axis           |
| Kagi                 | P2       | ⬜ Phase Q   | `domain/` pure logic → LWC custom series                |
| Footprint chart      | P3       | ⬜ Phase S   | Bid/ask volume at each price level; requires L2 data    |

### 5.6 Accessibility — WCAG 2.2 AAA target (Phase R)

| Criterion           | Current | Target | Action                                               |
| ------------------- | ------- | ------ | ---------------------------------------------------- |
| Color contrast      | AA 4.5  | AAA 7  | Audit tokens; darken chart grid lines only           |
| Text resize to 200% | AA      | AAA    | Validate chart labels reflow at 200%                 |
| No timing limits    | AA      | AAA    | All time-sensitive alerts dismissable; no auto-close |
| Error suggestion    | AA      | AAA    | Screener filter errors suggest valid values          |
| Context on focus    | AA      | AAA    | Focus indicators are 3:1 contrast minimum            |

### 5.7 CSS — modern API adoption (updated status)

| API                     | Status     | Plan                                                     |
| ----------------------- | ---------- | -------------------------------------------------------- |
| CSS `@layer`            | ✅ Done    | —                                                        |
| CSS `@scope`            | ✅ Done    | —                                                        |
| Container queries       | ✅ Done    | —                                                        |
| CSS custom properties   | ✅ Done    | —                                                        |
| CSS Anchor Positioning  | ✅ Done    | Chrome 125+ / Safari 18.2+ (Q11)                         |
| CSS `popover` attribute | ✅ Done    | All major browsers 2024+ (Q12)                           |
| CSS `if()` function     | ⬜ Phase T | Conditional styling without class toggles; landing 2025+ |
| CSS Houdini paint       | △ Future   | Custom chart backgrounds via Paint Worklet; low priority |

### 5.8 Template strategy — when to use what

| Template approach         | Use case                                              | Size  |
| ------------------------- | ----------------------------------------------------- | ----- |
| `morphdom` + string HTML  | Simple cards (< 50 lines template)                    | 0 KB  |
| `lit-html` tagged literal | Complex cards with loops, conditionals, event binding | ~2 KB |
| Web Components            | Reusable primitives shared across cards               | 0 KB  |
| `document.createElement`  | Performance-critical paths (virtual scroller)         | 0 KB  |

---

## 6. Backend & Data Strategy v8

### 6.1 GATE #1: Provision real Cloudflare resources (Phase P — week 1)

**Current state:** `worker/wrangler.toml` has correct binding declarations but every ID is
`PLACEHOLDER_*`. The Worker has never connected to a real Cloudflare resource.

**Provisioning checklist:**

```bash
# 1. Create KV namespace
wrangler kv namespace create QUOTE_CACHE
wrangler kv namespace create QUOTE_CACHE --preview

# 2. Create D1 database
wrangler d1 create crosstide-db

# 3. Apply D1 migrations
wrangler d1 migrations apply crosstide-db

# 4. Deploy Worker
wrangler deploy

# 5. Verify
curl https://crosstide-api.<subdomain>.workers.dev/api/health
```

**Then:** Replace all `PLACEHOLDER_*` values in `worker/wrangler.toml` with real IDs.
Full instructions in `docs/CLOUDFLARE_SETUP.md`.

**This is a 1-day task. It must happen first. Everything else is blocked on this.**

### 6.2 GATE #2: Wire remaining Worker providers (Phase P — weeks 2-3)

**Current:** Only `worker/providers/yahoo.ts` exists.
**Target:** 4 Worker providers covering all asset classes:

| Provider      | File                            | Purpose                              | Priority |
| ------------- | ------------------------------- | ------------------------------------ | -------- |
| Yahoo Finance | `worker/providers/yahoo.ts`     | Quotes, OHLCV, search, fundamentals  | ✅ Done  |
| Finnhub       | `worker/providers/finnhub.ts`   | Real-time WS, news, alternative data | P0       |
| CoinGecko     | `worker/providers/coingecko.ts` | Crypto OHLCV, market cap, ranking    | P0       |
| FRED          | `worker/providers/fred.ts`      | Macro (VIX, rates, M2, unemployment) | P1       |
| Stooq         | `worker/providers/stooq.ts`     | Fallback daily OHLCV CSV             | P2       |

Each provider follows the same pattern as `yahoo.ts`: typed fetch, Valibot validation,
error handling, and KV cache integration.

### 6.3 Real data flow — the critical path that must work

```text
Client → Worker /api/chart?ticker=AAPL&range=1y
  → CORS + Rate Limit + Request ID middleware
  → Check KV cache (key: "chart:AAPL:1y:v1", TTL: market-hours ? 5min : 24h)
  → Cache hit  → Return immediately (X-Cache: HIT)
  → Cache miss → Provider chain: Yahoo → Finnhub → Stooq
                → Validate with Valibot schema
                → Normalize to CrossTide OHLCV format
                → Apply corporate action adjustments
                → Store in KV with TTL
                → Return to client (X-Cache: MISS)
```

**This path must work end-to-end before any other Phase P task starts.**

### 6.4 D1 schema (production)

```sql
CREATE TABLE user_sync (
  credential_id TEXT PRIMARY KEY,
  encrypted_blob BLOB NOT NULL,
  updated_at     INTEGER NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE alert_rules (
  id             TEXT PRIMARY KEY,
  credential_id  TEXT NOT NULL,
  expression     TEXT NOT NULL,
  symbols        TEXT NOT NULL,
  active         INTEGER NOT NULL DEFAULT 1,
  last_triggered INTEGER,
  FOREIGN KEY (credential_id) REFERENCES user_sync(credential_id)
);

CREATE TABLE csp_reports (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  violated_directive  TEXT NOT NULL,
  blocked_uri         TEXT,
  source_file         TEXT,
  count               INTEGER NOT NULL DEFAULT 1,
  first_seen          INTEGER NOT NULL,
  last_seen           INTEGER NOT NULL
);

CREATE TABLE provider_health (
  provider    TEXT PRIMARY KEY,
  state       TEXT NOT NULL,
  failures    INTEGER NOT NULL DEFAULT 0,
  last_check  INTEGER NOT NULL
);
```

### 6.5 WebSocket fan-out (Durable Objects — Phase Q)

```text
Client WSS → Worker → TickerFanout DO (per-symbol)
                            ↓
                       Fan out to N clients
                       Buffer last tick (late joiners)
                       Reconnect upstream (exp. backoff + jitter)
                       Free at 0 subscribers
```

**Deferred to Phase Q.** Phase P must ship with polling-based data refresh. WebSocket
fan-out is a latency optimization, not a correctness requirement.

### 6.6 Worker middleware stack

```text
1. CORS                (allowOrigin from CF_ALLOWED_ORIGINS env)
2. Request ID          (X-Request-ID: crypto.randomUUID())
3. Rate limiting       (CF Rate Limiting API, 60 req/min/IP)
4. Security headers    (CSP, HSTS, X-Frame-Options, Permissions-Policy)
5. Hono router
6. Response transform  (strip provider headers, add cache-control)
7. Structured logging  (JSON → Logpush → R2, includes request ID + latency)
```

### 6.7 R2 cold storage for OHLCV (Phase Q — NEW in v8)

**Problem:** Relying on Yahoo Finance for 20 years of daily OHLCV is fragile. Yahoo
rate-limits aggressively and changes their API without notice.

**Solution:** Store top 500 tickers' 20-year daily OHLCV as Parquet files in R2. Update
daily via scheduled Worker (cron trigger). Serve from R2 when Yahoo is down or rate-limited.

```text
Daily cron (3 AM UTC) → Worker → Fetch new candles from Yahoo
                                → Append to R2 Parquet file
                                → Update KV "last-archived" timestamp
Client request for 5Y AAPL → KV cache miss → Try Yahoo first
                                             → Yahoo rate-limited?
                                             → Fallback to R2 archive
                                             → Return merged data
```

**Cost:** R2 free tier = 10 GB/month storage + 1M reads. 500 tickers × 5 KB Parquet ≈
2.5 MB. Well within free tier.

---

## 7. AI/ML & Intelligence Strategy

### 7.1 Existing domain capabilities (underutilized)

| Module                      | Status    | v8 Decision                                         |
| --------------------------- | --------- | --------------------------------------------------- |
| `domain/onnx-patterns.ts`   | Dead code | Move to `_experimental/`; wire in Phase S or remove |
| `domain/onnx-pipeline.ts`   | Dead code | Move to `_experimental/`; wire in Phase S or remove |
| `domain/market-regime.ts`   | Working   | Add card UI in Phase Q (regime indicator on chart)  |
| `domain/anomaly-detection/` | Working   | Add chart annotations in Phase Q                    |
| `domain/fourier-cycles.ts`  | Working   | Add visualization in Phase S (WASM accelerated)     |
| `domain/wavelet.ts`         | Working   | Expose via plugin system in Phase T                 |

### 7.2 On-device LLM: natural language interface (Phase S)

**Deferred from v7.** This is a genuine differentiator but must wait until the app serves
real data. The architecture is planned:

```ts
// Usage: "find tech stocks with RSI below 30 and rising volume"
// → 'sector === "Technology" && rsi(14) < 30 && volume > volume_sma(20)'
```

**Model options (2026 landscape):**

| Model           | Size  | WebGPU Required | Quality   | Availability  |
| --------------- | ----- | :-------------: | --------- | ------------- |
| Phi-4-mini q4   | 2.8GB |       ✅        | Excellent | Available now |
| Llama-3.3-3B q4 | 2.0GB |       ✅        | Good      | Available now |
| Gemma-3-2B q4   | 1.5GB |       ✅        | Adequate  | Available now |
| Mistral-Nemo q4 | 4.5GB |       ✅        | Best      | Heavyweight   |

**Fallback:** Rule-based NL parser for common query patterns when WebGPU is unavailable.

### 7.3 MCP server for AI agents (Phase T)

Expose CrossTide's API as a Model Context Protocol server. Enables Claude Desktop, GPT,
and other LLM agents to query market data through CrossTide as a tool.

```json
{
  "tools": [
    { "name": "get_stock_quote", "description": "Get real-time quote for a ticker" },
    { "name": "get_consensus", "description": "Get 12-method consensus signal" },
    { "name": "run_screener", "description": "Run technical/fundamental screener" },
    { "name": "get_chart_data", "description": "Get OHLCV candles for charting" }
  ]
}
```

### 7.4 AI disclaimer and ethics

All AI-generated content must include clear disclaimer: educational only, not financial
advice. Model runs entirely on-device. No data transmitted to external servers.

---

## 8. WebAssembly & Performance Architecture

### 8.1 WASM targets (Phase S — deferred until data flows)

| Module                  | Expected speedup | Effort | Prerequisite              |
| ----------------------- | :--------------: | :----: | ------------------------- |
| `correlation-matrix.ts` |      20–50×      | Medium | Real portfolio data       |
| `monte-carlo.ts`        |     50–100×      | Medium | Real OHLCV history        |
| `efficient-frontier.ts` |      30–80×      |  High  | Real portfolio data       |
| `fourier-cycles.ts`     |      5–20×       |  Low   | Domain visualization card |
| `garch.ts`              |      10–30×      | Medium | Volatility model card     |
| `rsi-calculator.ts`     |       2–5×       |  Low   | Already fast enough       |
| `ema-calculator.ts`     |       2–5×       |  Low   | Already fast enough       |

### 8.2 Implementation: AssemblyScript (Phase S)

AssemblyScript compiles TS-like syntax to WASM. Domain modules use only primitives
(numbers, arrays), making the port mechanical. Automatic fallback to TS when WASM is
unavailable.

**v8 note:** RSI/EMA WASM ports have low ROI (2–5× for already-fast functions). Focus
WASM effort on matrix operations and Monte Carlo where the speedup is 20–100×.

### 8.3 WebGPU (Phase S)

Monte Carlo and correlation heatmap are GPU-ideal. Progressive enhancement: WebGPU when
available; WASM fallback; TS fallback.

### 8.4 SharedArrayBuffer

Zero-copy OHLCV transfer between main thread and compute Worker. Requires COOP + COEP
headers (already in `public/_headers`).

---

## 9. Plugin & Extension System

### 9.1 Plugin types (Phase T)

| Type                   | Capability                                 | Examples                                 |
| ---------------------- | ------------------------------------------ | ---------------------------------------- |
| **Indicator plugin**   | Custom calculation on candle data → series | Custom RSI variant, ML-based indicator   |
| **Chart type plugin**  | New LWC custom series renderer             | Volume footprint, Kagi charts            |
| **Data source plugin** | New API endpoints with user-provided keys  | Alpaca, Tiingo, Bloomberg (paid)         |
| **Theme plugin**       | CSS custom property bundle                 | Bloomberg dark, Solarized, high-contrast |
| **Screener plugin**    | Additional filter criteria                 | Insider buying filter, SEC filing alert  |
| **Widget plugin**      | Embeddable chart widget for external sites | Blog embed, social media preview         |

### 9.2 Security model

Plugins run in isolated Worker context. No DOM, no credentials, no LocalStorage access.
SHA-256 integrity check before loading. Curated registry at `plugins.crosstide.dev`.

### 9.3 Embeddable widget (NEW in v8 — Phase T)

```html
<!-- Blog/website embed — like TradingView widgets -->
<script src="https://crosstide.pages.dev/widget.js" data-ticker="AAPL" data-theme="dark" data-height="400"></script>
```

This drives organic adoption. TradingView's widget strategy is their #1 growth channel.

---

## 10. External APIs & Vendor Strategy v8

### 10.1 Provider tiers (updated for v8 — honest "wired" status)

| Provider            | Tier         | Free Limit     | Key Data Types                     | Worker wired? | Client wired? |
| ------------------- | ------------ | -------------- | ---------------------------------- | :-----------: | :-----------: |
| Yahoo Finance v8    | Primary      | ~2K req/hr     | Quote, OHLCV, search, fundamentals |    ✅ Yes     |    ✅ Yes     |
| Finnhub             | Secondary    | 60/min + WSS   | Quote, OHLCV, news, streaming      |     ⬜ No     |    ✅ Yes     |
| Stooq               | Tertiary     | Unlimited      | Daily OHLCV CSV                    |     ⬜ No     |    ✅ Yes     |
| CoinGecko           | Crypto       | 50/min         | Crypto OHLCV, market cap           |     ⬜ No     |    ✅ Yes     |
| FRED                | Macro        | 120/min        | VIX, rates, employment, M2         | △ Route only  |     ✗ No      |
| Alpha Vantage       | Last resort  | 25/day         | OHLCV, indicators                  |     ⬜ No     |    ✅ Yes     |
| Twelve Data         | Alt primary  | 800 req/day    | Global stocks, forex, crypto       |     ⬜ No     |     ⬜ No     |
| Alpaca Markets      | Broker/Data  | Free real-time | US stocks, ETFs (real-time)        |     ⬜ No     |     ⬜ No     |
| Tiingo              | Premium alt  | 500/hr         | OHLCV, news, fundamentals          |     ⬜ No     |    ✅ Yes     |
| Intrinio            | Fundamentals | 500/mo free    | 200+ fundamental metrics           |     ⬜ No     |     ⬜ No     |
| Polygon             | Premium      | 5/min free     | Real-time, options, forex          |     ⬜ No     |    ✅ Yes     |
| EOD Historical Data | Historical   | 20/day free    | 30yr+ adj. history, splits         |     ⬜ No     |     ⬜ No     |
| ECB                 | Forex        | Unlimited      | EUR-based exchange rates           |     ⬜ No     |     ⬜ No     |

### 10.2 Provider failover chains (target state)

```text
Real-time quote:     Yahoo → Finnhub → Twelve Data → Tiingo → Alpha Vantage
OHLCV history:       Yahoo → R2 archive → Stooq → Twelve Data → Alpha Vantage
WebSocket streaming: Finnhub → Alpaca → Polygon (Phase Q+)
Crypto:              CoinGecko → Finnhub → CryptoCompare
Fundamentals:        Yahoo quoteSummary → Intrinio → Tiingo → Polygon
Macro / economic:    FRED → World Bank API
Corporate actions:   Yahoo → Tiingo → EOD Historical Data → Polygon
Forex:               ECB → Yahoo → Twelve Data
News & sentiment:    Finnhub → Alpha Vantage → Yahoo
```

### 10.3 User-provided API keys

Privacy-preserving key storage: encrypted in D1 blob (AES-GCM, credential-derived key).
Never sent to CrossTide servers unencrypted. Users who want higher rate limits or premium
data can supply their own Finnhub/Polygon/Alpaca keys.

---

## 11. Data Quality & Financial Accuracy

### 11.1 Corporate action handling (✅ implemented in P14)

| Action               | Required adjustment                                 | Status  |
| -------------------- | --------------------------------------------------- | ------- |
| Stock split (2:1)    | Multiply all pre-split prices by 0.5; scale volumes | ✅ Done |
| Reverse split (1:10) | Multiply all pre-split prices by 10                 | ✅ Done |
| Cash dividend        | Adjust pre-ex-div prices: `price * (1 - div/price)` | ✅ Done |
| Stock dividend       | Same as split treatment                             | ✅ Done |
| Spinoff              | Separate series; link via corporate action record   | ⬜      |
| Ticker change        | Chain historical data via FIGI or SEDOL             | ⬜      |

### 11.2 OHLCV validation

All data passes through `domain/validate-ohlcv.ts`: High ≥ Low ≥ 0, Close > 0,
no NaN/Infinity, non-negative volume. Applied at every boundary (provider → cache → card).

### 11.3 Data freshness indicators

| Freshness    | Indicator        |
| ------------ | ---------------- |
| < 1 min      | Green "Live"     |
| 1–15 min     | Yellow "X min"   |
| > 15 min     | Red "Delayed"    |
| Cached/stale | Grey with expiry |

### 11.4 Data accuracy verification (NEW in v8)

**Problem:** No mechanism to verify that CrossTide's data matches reality. A user comparing
AAPL's close price to their broker might see a discrepancy and lose trust immediately.

**Solution:** Daily automated comparison of 10 benchmark tickers against a known-accurate
source (Polygon or EOD Historical Data). Log discrepancies. Alert if deviation > 0.5%.
Publish accuracy score on status page.

---

## 12. Infrastructure & Deployment v8

### 12.1 Production stack ($0/mo — unchanged, proven correct)

| Layer             | Technology                 | Purpose                        | Cost                |
| ----------------- | -------------------------- | ------------------------------ | ------------------- |
| Static hosting    | Cloudflare Pages           | SPA + headers + redirects      | Free                |
| Edge compute      | Cloudflare Workers (Hono)  | API proxy, cache, rate limit   | Free (100K req/day) |
| KV store          | Cloudflare KV              | Hot cache (quotes, search)     | Free (100K ops/day) |
| Database          | Cloudflare D1              | User sync, alerts, CSP logs    | Free (5 GB)         |
| Object storage    | Cloudflare R2              | OHLCV archives, logs           | Free (10 GB/mo)     |
| WebSocket fan-out | Cloudflare Durable Objects | Real-time per-symbol broadcast | Free tier           |
| Error tracking    | GlitchTip (Fly.io)         | Source-mapped errors           | Free                |
| Uptime monitoring | Uptime Kuma (Fly.io)       | Status page + alerting         | Free                |
| CI/CD             | GitHub Actions             | Full pipeline                  | Free (public repo)  |
| Docs site         | Cloudflare Pages (Astro)   | User guides, indicator docs    | Free                |

**Cost analysis vs competitors:**

- Ghostfolio: $5–20/mo (VPS + PostgreSQL) or Docker self-hosted
- OpenBB: $0 (local desktop) but no cloud sync
- TradingView: $15–60/mo subscription
- **CrossTide: $0/mo for hosting + $0/mo for users** — unbeatable.

### 12.2 Environment strategy

| Env          | Data source                     | Bindings     | URL                         |
| ------------ | ------------------------------- | ------------ | --------------------------- |
| `dev`        | Vite proxy → real Yahoo/Finnhub | None needed  | localhost:5173              |
| `preview`    | Deterministic fixtures (seeded) | Preview KV   | PR-xxx.crosstide.pages.dev  |
| `staging`    | Real APIs + KV cache            | All bindings | staging.crosstide.pages.dev |
| `production` | Real APIs + KV cache            | All bindings | crosstide.pages.dev         |

### 12.3 Docker self-hosting (Phase R)

```yaml
# docker-compose.yml (target)
services:
  crosstide:
    image: ghcr.io/rajwanyair/crosstide:latest
    ports:
      - "8787:8787" # Worker API (miniflare)
      - "5173:5173" # Frontend (static)
    environment:
      - ENVIRONMENT=self-hosted
      - FINNHUB_API_KEY=${FINNHUB_API_KEY:-}
    volumes:
      - crosstide-data:/data
volumes:
  crosstide-data:
```

**Self-hosting story:** miniflare provides local KV + D1 + R2 emulation. Users run one
command and have a fully functional local CrossTide with real data.

### 12.4 Monitoring targets

| Metric                 | Target  | Alert threshold |
| ---------------------- | ------- | --------------- |
| Worker p50 latency     | < 100ms | > 500ms         |
| Worker p99 latency     | < 500ms | > 2000ms        |
| KV cache hit rate      | > 85%   | < 60%           |
| Provider failover rate | < 5%/hr | > 20%/hr        |
| Error rate             | < 0.1%  | > 1%            |
| Uptime                 | > 99.9% | Any downtime    |
| LCP (p75)              | < 1.8s  | > 2.5s          |
| INP (p75)              | < 200ms | > 500ms         |
| Data accuracy (vs ref) | > 99.5% | < 99.0%         |

---

## 13. Documentation Strategy v8

### 13.1 Ship-first documentation approach

**Principle:** Only maintain docs that are (a) user-facing and essential, or (b)
contributor-critical. Kill everything else until Phase R.

| Document                       | Purpose                             | Status     | Phase |
| ------------------------------ | ----------------------------------- | ---------- | ----- |
| `README.md`                    | Quick start, feature matrix, badges | ✅ Current | —     |
| `CHANGELOG.md`                 | Per-release changes                 | ✅ Current | —     |
| `docs/ARCHITECTURE.md`         | System design, layers, data flow    | ✅ Current | —     |
| `docs/ROADMAP.md`              | Strategic direction (this document) | ✅ v8      | —     |
| `docs/CLOUDFLARE_SETUP.md`     | CF provisioning walkthrough         | ✅ Current | —     |
| `docs/adr/` (11 ADRs)          | Decision rationale and consequences | ✅ Current | —     |
| `CONTRIBUTING.md`              | PR process, code standards          | ✅ Current | —     |
| `SECURITY.md`                  | Responsible disclosure policy       | ✅ Current | —     |
| `DEVELOPMENT.md`               | Dev environment setup               | ✅ Current | —     |
| OpenAPI spec `/openapi.json`   | Auto-generated Worker API reference | ✅ Current | —     |
| `docs-site/` (Astro Starlight) | User guides, indicator docs         | ⏸ Paused   | R     |
| `docker-compose.yml` + guide   | Self-hosting instructions           | ⬜         | R     |
| `packages/plugin-api/README`   | Plugin SDK documentation            | ⬜         | T     |

### 13.2 Auto-generated docs (Phase R)

- **Indicator reference:** Auto-generate from JSDoc comments on all 80+ indicator modules.
- **API reference:** Auto-generate from OpenAPI spec (already exists).
- **Component gallery:** Auto-generate from Web Component definitions.

This reduces documentation maintenance burden to near-zero.

---

## 14. Quality, Security & Observability v8

### 14.1 CI gates (unchanged — already excellent)

| Gate              | Tool                         | Threshold                       |
| ----------------- | ---------------------------- | ------------------------------- |
| typecheck         | `tsc --noEmit` (2 configs)   | 0 errors                        |
| lint              | eslint `--max-warnings 0`    | 0 warnings                      |
| lint:css          | stylelint `--max-warnings 0` | 0 CSS warnings                  |
| lint:html         | htmlhint                     | 0 errors                        |
| lint:md           | markdownlint-cli2            | 0 violations                    |
| format            | prettier `--check`           | 0 diffs                         |
| test:coverage     | vitest `--coverage`          | ≥90% stmt/line/fn, ≥80% branch  |
| test:browser      | vitest browser mode          | 0 failures (3 engines)          |
| test:e2e          | playwright                   | 0 failures                      |
| a11y              | axe-core in E2E              | 0 serious/critical              |
| visual-regression | playwright screenshots       | No baseline diffs               |
| build             | vite build                   | 0 errors                        |
| bundle-size       | check-bundle-size.mjs        | < 200 KB gzip initial JS        |
| supply-chain      | npm audit + signatures       | 0 high/critical                 |
| lighthouse        | lhci autorun                 | perf≥90, a11y≥95, bp≥95, seo≥90 |

### 14.2 NEW: Daily smoke test (Phase P — added in v8)

```yaml
# .github/workflows/smoke.yml — runs daily at 7:00 AM UTC (market pre-open)
on:
  schedule:
    - cron: "0 7 * * 1-5" # Weekdays only

jobs:
  smoke:
    steps:
      - run: curl -f https://crosstide.pages.dev/api/health
      - run: curl -f https://crosstide.pages.dev/api/quote?ticker=AAPL
      - run: curl -f https://crosstide.pages.dev/api/chart?ticker=AAPL&range=1mo
      - run: curl -f https://crosstide.pages.dev/api/search?q=Apple
      - run: curl -f https://crosstide.pages.dev/api/fred?series=VIX
```

**Purpose:** Catches upstream API schema changes, rate limit issues, and deployment
regressions before users encounter them.

### 14.3 Security controls (updated status)

| Control                            | Status      |
| ---------------------------------- | ----------- |
| CSP strict (no unsafe-inline/eval) | ✅          |
| HSTS (preload, 1 year)             | ✅          |
| X-Frame-Options: DENY              | ✅          |
| Permissions-Policy (restrictive)   | ✅          |
| Valibot at all boundaries          | ✅          |
| `escapeHtml()` for user data       | ✅          |
| SRI hashes on preloads             | ✅          |
| CF Rate Limiting API               | ✅ Declared |
| gitleaks secret scanning           | ✅          |
| npm audit signatures               | ✅          |
| Signal DSL sandboxing              | ✅          |
| Passkey (WebAuthn) auth            | ✅          |
| AES-GCM cloud sync                 | ✅          |
| Plugin sandbox                     | ⬜ Phase T  |
| Data accuracy monitoring           | ⬜ Phase Q  |

### 14.4 Testing roadmap (updated for v8)

| Test type              | Status  | Target       | Notes                                  |
| ---------------------- | ------- | ------------ | -------------------------------------- |
| Unit (pure domain)     | ✅ 90%+ | Maintain     | 608 files — crown jewel                |
| Integration (Worker)   | ✅      | Expand       | Frozen fixtures; need live API tests   |
| Browser compat         | ✅      | Maintain     | 3 engines                              |
| Visual regression      | ✅      | Commit bases | Baselines must be committed, not regen |
| Contract (providers)   | ✅      | Expand       | 49 tests; add CoinGecko, FRED          |
| Daily live smoke       | ⬜      | Phase P      | NEW: 5 endpoints against production    |
| Mutation testing       | ⬜      | Phase Q ≥75% | Stryker on domain/                     |
| Performance regression | ⬜      | Phase R      | INP/LCP per commit tracked             |
| Fuzz testing (DSL)     | ⬜      | Phase Q      | Signal DSL tokenizer/evaluator         |
| Data accuracy check    | ⬜      | Phase Q      | NEW: compare vs reference source daily |

---

## 15. Performance Budget v8

| Metric                        | Budget         | Current      | Status            |
| ----------------------------- | -------------- | ------------ | ----------------- |
| JS initial (gzip)             | < 200 KB       | 158 KB       | ✅ 42 KB headroom |
| CSS (gzip)                    | < 30 KB        | ~8 KB        | ✅                |
| HTML                          | < 8 KB         | ~4 KB        | ✅                |
| Lazy card chunk               | < 50 KB each   | ~25 KB avg   | ✅                |
| LWC chunk                     | < 50 KB        | ~45 KB       | ✅                |
| lit-html (if adopted)         | < 5 KB         | 0 KB         | ⬜ Budget set     |
| WASM modules (Phase S)        | < 200 KB total | 0 KB         | ⬜                |
| Fonts (Inter Variable)        | < 25 KB        | woff2 subset | ✅                |
| **Total initial JS+CSS+HTML** | **< 200 KB**   | **~170 KB**  | ✅                |
| LCP (4G, mid Android)         | < 1.8s         | ~1.2s        | ✅                |
| INP (p75)                     | < 200ms        | ~80ms        | ✅                |
| CLS                           | < 0.05         | ~0.02        | ✅                |
| Lighthouse Performance        | ≥ 90           | ≥ 90         | ✅                |
| Lighthouse Accessibility      | ≥ 95           | ≥ 95         | ✅                |
| Time to Interactive           | < 2.5s         | ~1.5s        | ✅                |
| SW precache entries           | < 60           | 49           | ✅                |
| Worker p50 response           | < 100ms        | —            | ⬜ Not deployed   |
| Worker p99 response           | < 500ms        | —            | ⬜ Not deployed   |

---

## 16. Phase P — v12.0.0 "Ship It"

**Theme:** Deploy to production. Serve real data. Zero new features. Zero scope creep.
**Duration:** 2–3 weeks (aggressive — this is a deployment task, not a development task)
**Exit gate:** `crosstide.pages.dev` serves live AAPL quote and chart to a real browser.

**v8 change from v7:** Phase P was "Production Backend" with 24 tasks. v8 strips it to the
absolute minimum needed to ship. Completed items (P13–P24) are acknowledged and removed
from the active task list.

| #   | Task                                                                         | Priority | Status | Est.   |
| --- | ---------------------------------------------------------------------------- | -------- | ------ | ------ |
| P1  | Provision real CF resources: KV namespace + D1 database                      | P0       | ⬜     | 1 hour |
| P2  | Replace PLACEHOLDER IDs in `worker/wrangler.toml` with real IDs              | P0       | ⬜     | 30 min |
| P3  | Run D1 migrations: `wrangler d1 migrations apply crosstide-db`               | P0       | ⬜     | 15 min |
| P4  | Deploy Worker to staging: `wrangler deploy`                                  | P0       | ⬜     | 15 min |
| P5  | Verify `/api/health` returns 200 + version in staging                        | P0       | ⬜     | 5 min  |
| P6  | Verify `/api/quote?ticker=AAPL` returns live Yahoo data in staging           | P0       | ⬜     | 15 min |
| P7  | Deploy Pages to production: full end-to-end user flow                        | P0       | ⬜     | 30 min |
| P8  | ~~Port Finnhub provider to `worker/providers/finnhub.ts`~~ (done v11.38)     | P0       | ✅     | —      |
| P9  | ~~Port CoinGecko provider to `worker/providers/coingecko.ts`~~ (done v11.38) | P0       | ✅     | —      |
| P10 | ~~Port FRED provider to `worker/providers/fred.ts`~~ (done v11.38)           | P1       | ✅     | —      |
| P11 | Passkey auth end-to-end: registration → D1 → sync → verify                   | P1       | ✅     | 1 day  |
| P12 | Daily smoke test CI workflow (5 endpoints, weekdays only)                    | P1       | ✅     | 2 hrs  |
| P13 | Remove `packages/` workspace stubs (add complexity, zero value)              | P2       | ✅     | 30 min |
| P14 | Move ONNX modules to `domain/_experimental/`                                 | P2       | ✅     | 30 min |
| P15 | Commit visual regression baselines (stop regenerating each run)              | P2       | ✅     | 1 hr   |

**Completed in v11.38 (this sprint):**
P8✅ Finnhub Worker provider: quote, candle, search with typed errors,
P9✅ CoinGecko Worker provider: quote, OHLC, search — no API key needed,
P10✅ FRED Worker provider: JSON API + CSV fallback, dual-mode,
P10b✅ Stooq Worker provider: EOD CSV history feed for equities,
P10c✅ Wire all providers into routes (crypto → CoinGecko, fred → FRED provider, quote → Finnhub fallback),
P10d✅ Add FINNHUB_KEY + FRED_KEY env bindings to Env interface and wrangler.toml,
P10e✅ Fix fred.ts kvPut bug (was passing object instead of number),
P10f✅ Enhance health endpoint with provider availability and binding status,
P10g✅ 63 new unit tests across provider and route wiring test suites.

**Previously completed (v11.36–v11.37):**
P13✅ Worker `/api/quote` + `/api/chart` with KV TTL cache,
P14✅ Corporate action adjustment,
P15✅ Signal stores,
P16✅ Route loaders + AbortController,
P17✅ Error boundaries for all 52 cards,
P18✅ `<ct-data-table>` Web Component,
P19✅ `<ct-stat-grid>`, `<ct-chart-frame>`, `<ct-empty-state>`,
P20✅ Structured Worker logging,
P21✅ GlitchTip source-map upload,
P22✅ Conditional Temporal polyfill,
P23✅ OpenAPI → TypeScript client codegen,
P24✅ View Transitions API.

**Exit criteria:**

- `crosstide.pages.dev` loads and shows real AAPL data (quote, chart, consensus)
- `/api/quote?ticker=AAPL` returns live Yahoo data with KV caching in production
- `/api/chart?ticker=AAPL&range=1y` returns real OHLCV with corporate actions
- D1 migrations applied; tables exist
- Rate limiting works via CF Rate Limiting API
- Finnhub and CoinGecko providers wired and returning data
- Daily smoke test passes in CI
- `npm run ci` passes on every commit
- **A real person can type a ticker and see real data.** This is the ONLY metric that matters.

---

## 17. Phase Q — v13.0.0 "Real Data Everywhere"

**Theme:** Close the data gaps that make the comparison table embarrassing. Make every
card show real data. Add the data sources users expect.
**Duration:** 4–6 weeks
**Exit gate:** Screener filters work with real fundamental data for S&P 500 tickers.

| #   | Task                                                                     | Priority | Status |
| --- | ------------------------------------------------------------------------ | -------- | ------ |
| Q1  | ~~Fundamental data card: real P/E, EPS, revenue, margins~~ (done v11.37) | —        | ✅     |
| Q2  | ~~`<ct-filter-bar>` Web Component~~ (done v11.37)                        | —        | ✅     |
| Q3  | ~~Screener: fundamental filters~~ (done v11.37)                          | —        | ✅     |
| Q4  | ~~Indicator configuration UI~~ (done v11.37)                             | —        | ✅     |
| Q5  | ~~Volume Profile overlay~~ (done v11.37)                                 | —        | ✅     |
| Q6  | ~~FRED economic data overlay~~ (done v11.37)                             | —        | ✅     |
| Q7  | ~~Backtest: commission + slippage + Kelly~~ (done v11.37)                | —        | ✅     |
| Q8  | ~~Additional drawing tools~~ (done v11.37)                               | —        | ✅     |
| Q9  | ~~Contract tests: Yahoo v8 + Finnhub schemas~~ (done v11.37)             | —        | ✅     |
| Q10 | ~~Visual regression: Playwright baselines~~ (done v11.37)                | —        | ✅     |
| Q11 | ~~CSS Anchor Positioning~~ (done v11.37)                                 | —        | ✅     |
| Q12 | ~~CSS `popover` attribute~~ (done v11.37)                                | —        | ✅     |
| Q13 | ~~fast-check property tests: 80+ indicators~~ (done v11.37)              | —        | ✅     |
| Q14 | Stryker mutation testing: ≥75% mutation score for domain/                | P2       | ✅     |
| Q15 | R2 cold OHLCV archival: 20-year Parquet (top 500 tickers)                | P1       | ✅     |
| Q16 | ~~Temporal polyfill conditional load~~ (done v11.37)                     | —        | ✅     |
| Q17 | Fuzz testing for Signal DSL tokenizer/evaluator                          | P2       | ⬜     |
| Q18 | Multi-asset: crypto (CoinGecko) + forex (ECB) end-to-end with real data  | P0       | ✅     |
| Q19 | **News card with Finnhub news API + sentiment scoring** (NEW in v8)      | P0       | ✅     |
| Q20 | **Stooq provider in Worker** (`worker/providers/stooq.ts`) (NEW in v8)   | P1       | ✅     |
| Q21 | **WebSocket fan-out via Durable Objects** (moved from Phase P)           | P1       | ✅     |
| Q22 | **Market regime indicator on chart** (wire existing domain module)       | P2       | ✅     |
| Q23 | **Anomaly detection annotations on chart** (wire existing domain module) | P2       | ✅     |
| Q24 | **Data accuracy verification** (compare vs reference source daily)       | P1       | ✅     |
| Q25 | **Contract tests for CoinGecko and FRED** (expand from Q9)               | P2       | ✅     |
| Q26 | **Kagi chart type** (LWC custom series)                                  | P3       | ✅     |
| Q27 | **lit-html adoption for 5 most complex cards** (NEW in v8)               | P2       | ✅     |

**Exit criteria:**

- News card shows real news with sentiment badges for any S&P 500 ticker
- Crypto and forex data flow end-to-end through Worker
- R2 archives exist for top 500 tickers (20-year daily)
- WebSocket real-time streaming works for at least 1 provider (Finnhub)
- Market regime and anomaly detection visible on chart
- Mutation testing ≥75% on domain layer
- Data accuracy ≥99.5% vs reference source

---

## 18. Phase R — v14.0.0 "Public Launch"

**Theme:** Production hardening. Public launch. Community bootstrapping.
**Duration:** 4–6 weeks
**Exit gate:** Product Hunt launch post published. 100+ GitHub stars.

| #   | Task                                                                          | Priority | Status |
| --- | ----------------------------------------------------------------------------- | -------- | ------ |
| R1  | DSL expansion: `for` loops, arrays, `plot()` for custom indicators            | P1       | ✅     |
| R2  | Multi-timeframe analysis: sync 2–4 charts at different intervals              | P1       | ✅     |
| R3  | Docker Compose self-hosting with miniflare                                    | P0       | ✅     |
| R4  | WCAG 2.2 AAA for critical paths                                               | P1       | ✅     |
| R5  | Auto-generate indicator docs from JSDoc (80+ modules)                         | P1       | ✅     |
| R6  | README showcase: GIF demos, comparison table, install-size badge              | P0       | ✅     |
| R7  | Load testing: 10K tickers in screener, < 200ms INP                            | P1       | ✅     |
| R8  | Performance regression tracking: INP/LCP per commit in CI                     | P2       | ✅     |
| R9  | **SSG for top 500 ticker pages** (SEO — NEW in v8)                            | P1       | ⬜     |
| R10 | **Mobile-first UX audit** (touch interactions, swipe nav — NEW in v8)         | P1       | ✅     |
| R11 | **Capacitor iOS + Android build** (app store submission — if warranted)       | P2       | ⬜     |
| R12 | **GitHub Discussions + Discord server** (community bootstrapping — NEW in v8) | P0       | ⬜     |
| R13 | Public launch: GitHub Release + Product Hunt + Hacker News + Reddit           | P0       | ⬜     |
| R14 | **Plausible analytics dashboard** (track real usage patterns — NEW in v8)     | P1       | ✅     |

**Exit criteria:**

- Docker self-hosting works with `docker-compose up`
- README has GIF demos and comparison table
- Top 500 ticker pages indexed by Google (SSG)
- Mobile UX passes touch-interaction audit
- Product Hunt launch post published
- GitHub Discussions + Discord active
- 100+ GitHub stars (community validation)

---

## 19. Phase S — v15.0.0 "Intelligence & Compute"

**Theme:** In-browser AI and WASM compute that no competitor offers.
**Duration:** 6–8 weeks
**Exit gate:** NL screener query works in Chromium.

| #   | Task                                                                    | Priority | Status |
| --- | ----------------------------------------------------------------------- | -------- | ------ |
| S1  | WebLLM integration: Phi-4-mini via WebGPU                               | P0       | ⬜     |
| S2  | Natural language → Screener DSL translation                             | P0       | ⬜     |
| S3  | Natural language → Signal DSL translation                               | P1       | ⬜     |
| S4  | Chart pattern explanation via LLM                                       | P1       | ⬜     |
| S5  | AssemblyScript WASM: correlation matrix, covariance, efficient frontier | P0       | ⬜     |
| S6  | AssemblyScript WASM: Monte Carlo (100K paths < 100ms)                   | P1       | ⬜     |
| S7  | WebGPU compute: Monte Carlo acceleration                                | P2       | ⬜     |
| S8  | WebGPU compute: heatmap GPU-acceleration                                | P2       | ⬜     |
| S9  | ONNX pattern recognition on charts (wire `_experimental/` modules)      | P1       | ⬜     |
| S10 | Anomaly detection overlay (enhance from Q23)                            | P2       | ⬜     |
| S11 | SharedArrayBuffer zero-copy Worker transfer                             | P2       | ⬜     |
| S12 | AI disclaimer framework                                                 | P0       | ✅     |
| S13 | WASM build in CI; size budget enforcement (< 200 KB)                    | P0       | ✅     |
| S14 | **Fourier cycle visualization on chart** (wire existing module)         | P2       | ⬜     |

---

## 20. Phase T — v16.0.0 "Ecosystem & Community"

**Theme:** Make CrossTide the platform for financial OSS.
**Duration:** 8–12 weeks
**Exit gate:** 3 community plugins published; `@crosstide/domain` on npm.

| #   | Task                                                                          | Priority | Status |
| --- | ----------------------------------------------------------------------------- | -------- | ------ |
| T1  | Plugin API: indicator, chart-type, data-source contracts                      | P0       | ✅     |
| T2  | Plugin sandbox: Worker-isolated execution                                     | P0       | ⬜     |
| T3  | Plugin registry: `plugins.crosstide.dev`                                      | P1       | ⬜     |
| T4  | Plugin integrity: SHA-256 manifest + SRI                                      | P0       | ✅     |
| T5  | pnpm + Turborepo migration (reintroduce `packages/` properly)                 | P2       | ⬜     |
| T6  | Publish `@crosstide/domain` to npm (MIT)                                      | P1       | ⬜     |
| T7  | Publish `@crosstide/plugin-api` to npm                                        | P1       | ⬜     |
| T8  | MCP server: CrossTide API for LLM agents                                      | P1       | ⬜     |
| T9  | **Embeddable widget** (`<crosstide-chart>` for blogs/websites — NEW in v8)    | P0       | ✅     |
| T10 | Community tutorials: "Build a custom indicator"                               | P1       | ⬜     |
| T11 | Contributor onboarding: dev container + issue templates                       | P1       | ⬜     |
| T12 | i18n expansion: ES, DE, ZH, JA                                                | P2       | ⬜     |
| T13 | Multi-tenant: multiple watchlists/portfolios per passkey                      | P2       | ⬜     |
| T14 | CSV/Excel import for portfolio                                                | P2       | ⬜     |
| T15 | Broker read-only integration (Alpaca, Schwab)                                 | P3       | ⬜     |
| T16 | WebTransport evaluation (when providers support it)                           | P3       | ⬜     |
| T17 | **Biome evaluation** (replace ESLint + Prettier — NEW in v8)                  | P2       | ⬜     |
| T18 | **Expose dormant domain modules** (wavelet, Hawkes, copula) via plugin system | P2       | ⬜     |

---

## 21. Refactor & Rewrite Backlog v8

| #    | Refactor                                                 | Why                                            | Phase | Status |
| ---- | -------------------------------------------------------- | ---------------------------------------------- | ----- | ------ |
| RF1  | Provision real CF resources (KV/D1/DO)                   | Existential — Worker can't do its job          | P     | ⬜     |
| RF2  | Port 4 providers to Worker side                          | Only Yahoo wired; routes fall back to fixtures | P     | ⬜     |
| RF3  | `main.ts` → thin bootstrap (stores handle data)          | Data flow traceability; testability            | P     | ⬜     |
| RF4  | Card data-binding → signal stores (52 cards to migrate)  | Replace scattered wiring                       | P     | ✅     |
| RF5  | Tables → `<ct-data-table>` Web Component                 | Code dedup; consistent keyboard UX; ARIA       | P     | ✅     |
| RF6  | Stat sections → `<ct-stat-grid>`, `<ct-empty-state>`     | 40% card boilerplate eliminated                | P     | ✅     |
| RF7  | Router: loaders + query strings + View Transitions       | Eliminate data waterfalls; smooth navigation   | P     | ✅     |
| RF8  | Backtest: commission + slippage + position sizing        | Realistic results; credibility                 | Q     | ✅     |
| RF9  | Indicator config: JSON schema per method                 | User-tunable RSI period, BB multiplier, etc.   | Q     | ✅     |
| RF10 | Temporal polyfill: conditional dynamic import            | Saves ~8 KB for modern browsers                | Q     | ✅     |
| RF11 | ONNX modules: move to `_experimental/` (NEW v8 decision) | Dead code until Phase S; remove from domain/   | P     | ⬜     |
| RF12 | `packages/` workspace: remove stubs (NEW v8 decision)    | Empty stubs add complexity with zero value     | P     | ⬜     |
| RF13 | CSS tooltips: Anchor Positioning replaces JS             | Eliminates positioning JS entirely             | Q     | ✅     |
| RF14 | Modal system: `popover` API replaces JS overlays         | Native browser API; no accessibility gaps      | Q     | ✅     |
| RF15 | **Visual regression baselines: commit, don't regen**     | Tests must be deterministic                    | P     | ⬜     |
| RF16 | **lit-html for complex card templates**                  | Reduce 50+ LOC createElement chains            | Q     | ⬜     |

---

## 22. Decision Log v8

### Reaffirmed

| Decision                 | First Introduced | Times Reaffirmed |
| ------------------------ | ---------------- | :--------------: |
| Vanilla TS + signals     | v1.0             |        8         |
| Pure domain layer        | v1.0             |        8         |
| Valibot over Zod         | v7.8             |        6         |
| Multi-provider failover  | v3.0             |        7         |
| Cloudflare all-in        | v4.0             |        7         |
| Lightweight Charts v5    | v2.0             |        7         |
| Workbox Service Worker   | v3.0             |        7         |
| Hono for Worker          | v5.0             |        6         |
| morphdom for DOM updates | v8.0             |        5         |
| Passkey-only auth        | v9.0             |        5         |
| CSS Layers + @scope      | v7.0             |        6         |
| TypeScript 6 strict mode | v11.0            |        4         |
| Temporal API             | v9.0             |        5         |
| fast-check               | v11.35           |        3         |

### Decisions Challenged & Upheld (v8)

| Decision challenged | Alternative evaluated   | Verdict                 | Reason                                                  |
| ------------------- | ----------------------- | ----------------------- | ------------------------------------------------------- |
| Vanilla TS          | SolidJS, Preact, Svelte | **Keep vanilla TS**     | 0 KB runtime; signals architecture already equivalent   |
| morphdom            | lit-html                | **Keep + complement**   | morphdom for layout diffing; lit-html for complex cards |
| Astro docs-site     | — (pause)               | **Pause until R**       | No users yet; docs for zero users is wasted effort      |
| ESLint + Prettier   | Biome                   | **Evaluate in Phase T** | Biome not yet mature enough for CSS + HTML linting      |
| No framework        | Web Components only     | **Keep hybrid**         | Custom elements for reuse; vanilla for composition      |

### New Decisions (v8)

| Decision                              | Rationale                                               | Phase |
| ------------------------------------- | ------------------------------------------------------- | ----- |
| Deploy first, features second         | 6 months of features; zero deployment                   | P     |
| Remove `packages/` workspace stubs    | Empty stubs add npm workspace overhead; rebuild in T    | P     |
| Move ONNX to `_experimental/`         | Dead code pollutes domain/; resurrect only if needed    | P     |
| Add R2 cold storage for OHLCV         | 20-year history; failover for Yahoo outages             | Q     |
| Adopt lit-html for complex templates  | 2.7 KB addition; eliminates 50+ LOC createElement       | Q     |
| SSG for top 500 tickers (SEO)         | StockAnalysis proves SEO drives acquisition             | R     |
| News card with Finnhub                | FinViz shows news is table-stakes for retention         | Q     |
| Embeddable `<crosstide-chart>` widget | TradingView's #1 growth channel; organic adoption       | T     |
| Daily smoke test in CI                | Inspired by Netflix/Vercel: verify before users find it | P     |
| Plausible analytics                   | Need real usage data before Phase R decisions           | R     |
| Docker image uses `ghcr.io`           | Self-hosting parity with Ghostfolio                     | R     |

---

## 23. Risks & Mitigations v8

| Risk                                 | Likelihood | Impact   | Mitigation                                                |
| ------------------------------------ | ---------- | -------- | --------------------------------------------------------- |
| **Over-engineering before shipping** | **HIGH**   | Critical | v8 exists to fix this; Phase P has 2–3 week hard deadline |
| **No users after launch**            | High       | High     | SSG for SEO; embeddable widget; Product Hunt/HN launch    |
| Yahoo Finance breaks schema          | High       | High     | 5+ fallback providers; Valibot; contract tests            |
| Solo developer bottleneck            | High       | High     | Plugin SDK enables community contribution; ruthless focus |
| CF free tier limits hit              | Low        | High     | Monitor daily; Hono portable to Deno/Vercel in < 1 day    |
| WebGPU unavailable (older browsers)  | Medium     | Low      | WASM fallback always available; progressive enhancement   |
| WebLLM 2.8 GB download too heavy     | High       | Medium   | Opt-in; progress bar; rule-based NL fallback              |
| KV cache serves stale data           | Medium     | Medium   | Market-hours TTL; manual purge; versioned keys            |
| D1 data loss                         | Low        | High     | User-owned blobs; re-sync from client is canonical        |
| Plugin executes malicious code       | Medium     | Critical | Worker sandbox; SHA-256; curated registry                 |
| npm supply chain attack              | Low        | Critical | npm audit; gitleaks; lockfile-only; audit signatures      |
| WASM bugs (off-by-one)               | Medium     | High     | Tested against TS reference to 1e-10 tolerance            |
| AI model hallucinates DSL syntax     | High       | Medium   | DSL validator rejects invalid syntax before execution     |
| First deployment breaks              | Medium     | Medium   | Staging first; canary deploys; health check in CI         |
| Data accuracy drift (wrong prices)   | Medium     | High     | Daily verification vs reference source; alert on > 0.5%   |

---

## 24. Scope Boundaries v8

### CrossTide IS

- A **quantitative and technical analysis** dashboard
- A **consensus signal generation** engine (unique 12-method approach)
- A **portfolio analytics and risk management** tool
- A **privacy-first, offline-capable** PWA with optional E2EE cloud sync
- **Open source (MIT) and self-hostable** at $0/mo
- A **learning tool** for quantitative finance methods
- An **extensible platform** via plugin system (Phase T)
- An **MCP-compatible data source** for AI agents (Phase T)
- An **embeddable chart widget** for blogs and websites (Phase T)

### CrossTide IS NOT

| Out of Scope                             | Why                                                    |
| ---------------------------------------- | ------------------------------------------------------ |
| Trading platform (order execution)       | Regulatory burden; signals are educational, not advice |
| Full options chain / Greeks              | Massive data complexity; out of core competency        |
| Social network (profiles, chat)          | Privacy-first architecture is incompatible             |
| Robo-advisor (automated recommendations) | Regulatory liability                                   |
| News aggregator (primary function)       | News card is supplementary; not core value proposition |
| Multi-user collaboration / sharing       | User isolation is the privacy model                    |
| Broker integration (order routing)       | Read-only positions only; never order execution        |
| Paid SaaS tier                           | $0/mo is the value prop; premium = BYOK for more data  |

---

## 25. Engineering Non-Negotiables

### 25.1 Code Integrity

1. **No suppressions** — no `eslint-disable`, `@ts-ignore`, `--force`. Fix root causes.
2. **No dead artifacts** — every file, export, dep, and config entry must be referenced.
3. **No `TODO` in code** — open a GitHub Issue instead.
4. **No secrets in source** — `.env` + Cloudflare Secrets only.
5. **Validation at all boundaries** — sanitize every external input.

### 25.2 Architecture Integrity

1. **Layer imports are one-way** — `types ← domain ← core ← providers ← cards ← ui`.
2. **Domain stays pure** — no DOM, no `fetch`, no `Date.now()`, no `Math.random()`.
3. **Worker imports use `.js`** — CF Workers ESM requires explicit extensions.
4. **patchDOM, not innerHTML** — raw innerHTML breaks morphdom diffing.
5. **No floating promises** — `void asyncFn()` or `await`.
6. **WASM modules have TS reference parity** — tested to 1e-10 tolerance.

### 25.3 Quality Gates

| Gate       | Command                 | Requirement                      |
| ---------- | ----------------------- | -------------------------------- |
| Type check | `npm run typecheck`     | Zero errors (both tsconfigs)     |
| ESLint     | `npm run lint`          | Zero warnings                    |
| Stylelint  | `npm run lint:css`      | Zero CSS warnings                |
| HTMLHint   | `npm run lint:html`     | Zero issues                      |
| Prettier   | `npm run format:check`  | Exit 0                           |
| Tests      | `npm run test:coverage` | All pass, ≥90% stmt, ≥80% branch |
| Browser    | `npm run test:browser`  | All pass (3 engines)             |
| Build      | `npm run build`         | Zero errors                      |
| Bundle     | `npm run check:bundle`  | < 200 KB gzip initial JS         |

Run all: `npm run ci`

### 25.4 Roadmap Governance

- **ROADMAP.md is the single source of truth** for scope, priorities, and sequencing.
- **ADR required** for every architectural decision within 24 hours.
- **Phased execution** — one phase at a time; no big-bang scope changes.
- **Each phase has exit criteria** — measure them; don't move on without meeting them.
- **Status must be accurate** — ✅ only when exit criteria are met, not when code is merged.
- **Ship-first** — no phase begins until the previous phase's deployment is verified. (NEW v8)

---

## Appendix A: Completed Phases

| Phase | Version   | Theme              | Key Deliverables                                                |
| ----- | --------- | ------------------ | --------------------------------------------------------------- |
| A–C   | v1–v4     | Foundation         | Signals, router, watchlist, chart, 20 indicators                |
| D–E   | v5–v6     | Data & PWA         | Multi-provider, SW, IDB, OPFS, 50 indicators                    |
| F–G   | v7        | Quality            | Strict TS, 90% coverage, WCAG AA, Lighthouse 90+                |
| H     | v8–v9     | Advanced features  | Passkey sync, ONNX AI, Tauri, D1 design                         |
| I     | v10       | Features           | Signal DSL, backtest, screener, heatmap, earnings               |
| J–K   | v11.0     | Performance        | morphdom, virtual scroll, container queries, event delegation   |
| L     | v11.x     | Data depth         | Fundamental overlay, seasonal charts, multi-condition alerts    |
| M–N   | v11.x     | Polish             | i18n, mobile audit, load testing, UX polish                     |
| O     | v11.28–35 | Compat & Cleanup   | Cross-browser tests, dead-file removal, ESLint                  |
| —     | v11.36    | Phase P Foundation | wrangler.toml bindings, corporate actions, signal stores, WCs   |
| —     | v11.37    | Phase Q Foundation | FRED overlay, contract tests, visual regression, property tests |

---

## Appendix B: Daily Workflow

1. Pick the highest-priority open item in the current phase.
2. Create a branch; implement in a small, reviewable change set.
3. Run validation: `npm run ci`.
4. Record an ADR if an architectural decision was made.
5. Mark the item status accurately (⬜ → ✅ only when exit criteria are met).
6. Git commit with conventional commit format.

| Symbol | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| ✅     | Done — exit criteria verified in staging or CI              |
| ⬜     | Not started                                                 |
| 🔄     | In progress                                                 |
| ⏸      | Blocked / Paused — dependency unmet or intentionally halted |
| ❌     | Deferred — moved to backlog with reason                     |

---

_This roadmap is a living document. Updated on every phase completion._
_Supersedes: ROADMAP v7 (Jun 3, 2026), archived as `docs/ROADMAP-v7-archive.md`._
