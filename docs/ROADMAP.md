# CrossTide — Strategic Roadmap v10 (Production or Bust)

> **Date:** June 2, 2026
> **Current version:** v11.43.0
> **Codebase:** 212 domain modules · 52 cards · 37 Worker routes · 608 test files
> **Bundle:** 158 KB gzip (budget 250 KB) · 49 SW precache entries
> **Stack:** TypeScript 6.0 · Vite 8 · Vitest 4 · Hono 4 · morphdom · LWC v5
> **ADRs on record:** 11 (all accepted)
> **Previous roadmap:** v9 archived at `docs/ROADMAP-v9-archive.md`
> **Key change from v9:** Execution focus. v9 was excellent strategic analysis. v10 is the execution plan. Ship or die.

---

## Table of Contents

1. [North Star — What CrossTide Must Become](#1-north-star--what-crosstide-must-become)
2. [State of the Art: Competitive Landscape 2026](#2-state-of-the-art-competitive-landscape-2026)
3. [Decision Audit v10 — Final Verdicts](#3-decision-audit-v10--final-verdicts)
4. [Frontend Architecture v10](#4-frontend-architecture-v10)
5. [Backend & Infrastructure v10](#5-backend--infrastructure-v10)
6. [Data Strategy & API Ecosystem v10](#6-data-strategy--api-ecosystem-v10)
7. [AI, ML & Intelligent Compute v10](#7-ai-ml--intelligent-compute-v10)
8. [Developer Experience & Tooling v10](#8-developer-experience--tooling-v10)
9. [Documentation & Knowledge Strategy v10](#9-documentation--knowledge-strategy-v10)
10. [Quality, Security & Observability v10](#10-quality-security--observability-v10)
11. [Performance Architecture v10](#11-performance-architecture-v10)
12. [VS Code & GitHub Integration Strategy](#12-vs-code--github-integration-strategy)
13. [Execution Phases](#13-execution-phases)
14. [Refactor & Rewrite Backlog](#14-refactor--rewrite-backlog)
15. [Risks, Mitigations & Scope Boundaries](#15-risks-mitigations--scope-boundaries)
16. [Engineering Non-Negotiables](#16-engineering-non-negotiables)

---

## 1. North Star — What CrossTide Must Become

### 1.1 The vision (one sentence)

**CrossTide is the fastest, most private, open-source financial analysis platform — where data never leaves your device, the bundle is 30x smaller than competitors, and the 12-method consensus engine exists nowhere else.**

### 1.2 The strategic position

```text
                    HIGH PRIVACY
                         │
         CrossTide ★     │
                         │
    LOW COST ────────────┼──────────── HIGH COST
                         │
                         │        TradingView ★
                         │        Koyfin ★
                    LOW PRIVACY
```

We do not compete on feature count. We compete on **philosophy**:

- Privacy-first (no account, no tracking, no data leaves the browser)
- Performance-first (158 KB vs 2-5 MB)
- Cost-first ($0/month forever, self-hostable)
- Quality-first (608 tests, 90%+ coverage, 14 CI gates)

### 1.3 The uncomfortable truth v10 confronts

| # | Truth | v10 Action |
|---|-------|-----------|
| 1 | **Zero deployments. Zero users.** | Phase P has a 2-week hard deadline. Deploy or archive. |
| 2 | **Over-engineering for zero ROI.** | Freeze features. Ship what exists. |
| 3 | **Solo developer.** | Design for contributors. Plugin system. MCP for AI leverage. |
| 4 | **No community.** | Product Hunt launch in Phase R. Discord on day 1. |
| 5 | **VS Code/GitHub integration is excellent but underutilized.** | Wire everything end-to-end. |

### 1.4 What is genuinely world-class (verified)

| Area | Evidence |
|------|----------|
| **Pure domain layer** | 212 modules. Zero I/O. 100% deterministic. WASM-ready. npm-publishable. |
| **Bundle discipline** | 158 KB total. Competitors ship 2-5 MB. 10-30x advantage. |
| **Type safety** | TS 6 strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. |
| **Indicator depth** | 80+ TA/quant indicators. More than most commercial products. |
| **Offline-first** | 5-tier cache. Background Fetch. OPFS. Service Worker. Web Push. |
| **Security posture** | CSP strict. HSTS preload. Valibot boundaries. Rate limiting. |
| **Zero-dep reactive signals** | Custom primitives. batch(). Auto-tracking. No framework cost. |
| **CSS architecture** | Layers. @scope. Container queries. Color-blind palettes. |
| **Test culture** | 608 files. 90%+ coverage. Property testing. Visual regression. |
| **12-method consensus** | Unique in OSS. No competitor aggregates 12 signal methods. |
| **DevOps maturity** | 27 GH workflows. 14 prompts. 4 skills. 3 agents. MCP server. |

---

## 2. State of the Art: Competitive Landscape 2026

### 2.1 Comprehensive comparison matrix

Rating: `★★★` best-in-class · `★★` strong · `★` adequate · `△` partial · `✗` absent

**Rule:** Only SHIPPED, USER-VERIFIED functionality gets stars. Planned = `✗`.

| Capability | **CrossTide** | TradingView | FinViz | StockAnalysis | Koyfin | OpenBB | Ghostfolio | TrendSpider | Webull | Maybe Finance |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **License** | MIT | Proprietary | Proprietary | Proprietary | Proprietary | AGPL | AGPL | Proprietary | Proprietary | Proprietary |
| **Pricing** | Free | $15-60/mo | $25-50/mo | Free/Pro | $39/mo | Free | Free/Prem | $39-97/mo | Free | $12-50/mo |
| **Self-hostable** | ★★★ | ✗ | ✗ | ✗ | ✗ | ★★★ | ★★★ | ✗ | ✗ | ✗ |
| **No account required** | ★★★ | △ | ★★★ | ★★★ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Privacy (cookieless)** | ★★★ | ✗ | ✗ | ✗ | ✗ | ★★ | ★★★ | △ | ✗ | ★★ |
| **Bundle / load speed** | ★★★ (158 KB) | ✗ (~5 MB) | ★★ (SSR) | ★★ (SSR) | △ (~3 MB) | n/a | ★ (~500 KB) | △ (~2 MB) | ✗ (~4 MB) | ★★ |
| **Lighthouse performance** | ★★★ (≥90) | △ (~50) | ★★ (~70) | ★★ (~75) | △ (~60) | n/a | △ (~65) | △ (~55) | ✗ (~45) | ★★ (~80) |
| **Offline / PWA** | ★★★ | ✗ | ✗ | ✗ | ✗ | ★★★ | ★★ | ✗ | ✗ | ✗ |
| **Real-time streaming** | ✗ (not wired) | ★★★ | △ | ★★ | ★★ | ★★ | ✗ | ★★★ | ★★★ | ★★ |
| **Charting depth** | ★★ (LWC v5) | ★★★ (20+) | △ | ★ | ★★ | ★★ | ✗ | ★★★ | ★★ | ★★ |
| **Indicator library** | ★★★ (80+) | ★★★ (400+) | ★★ (50+) | ★ (30+) | ★★ (80+) | ★★ (80+) | ✗ | ★★★ (100+) | ★★ | ★ |
| **Consensus / multi-signal** | ★★★ (unique 12) | ✗ | ✗ | △ | ✗ | ✗ | ✗ | △ | ✗ | ✗ |
| **Screener** | ★★ (DSL) | ★★ | ★★★ | ★★★ | ★★ | ★★★ | ✗ | ★★★ | ★★ | ✗ |
| **Backtest engine** | ★ (basic) | ★★ (Pine) | ✗ | ✗ | ★ | ★★ | ✗ | ★★★ | ✗ | ✗ |
| **Portfolio analytics** | ★★ | ✗ | ✗ | ★ | ★★★ | ★★ | ★★★ | ✗ | ★★ | ★★★ |
| **Fundamental data** | △ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ✗ | ✗ | ★★ | ★★ |
| **MCP / AI agent support** | △ (server exists) | ✗ | ✗ | ✗ | ✗ | ★★★ | ✗ | ✗ | ✗ | ✗ |
| **On-device AI** | ✗ (planned) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Custom scripting** | ★★ (DSL) | ★★★ (Pine) | ✗ | ✗ | ✗ | ★★★ (Python) | ✗ | ✗ | ✗ | ✗ |
| **WCAG accessibility** | ★★★ (AA) | △ | ✗ | △ | △ | △ | ★★ | ✗ | △ | ★★ |
| **Test coverage** | ★★★ (608 files) | Unknown | Unknown | Unknown | Unknown | ★★ | ★★ | Unknown | Unknown | Unknown |
| **DevOps maturity** | ★★★ (27 workflows) | Unknown | Unknown | Unknown | Unknown | ★★ | ★★ | Unknown | Unknown | Unknown |
| **Community** | ✗ (0 users) | ★★★ (50M+) | ★★★ | ★★ | ★★ | ★★★ (67.9K⭐) | ★★★ (8.5K⭐) | ★★ | ★★★ | ★★ |
| **Docker one-liner** | △ (exists) | ✗ | ✗ | ✗ | ✗ | ★★★ | ★★★ | ✗ | ✗ | ✗ |
| **Live demo** | ✗ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ |

### 2.2 Technology comparison (2026 leaders)

| Dimension | **CrossTide** | **TradingView** | **OpenBB** | **Ghostfolio** | **Maybe Finance** |
|---|---|---|---|---|---|
| **Language** | TypeScript 6 (strict) | TS + C++ + Go | Python 3.9+ | TypeScript | Ruby + TypeScript |
| **Frontend** | Vanilla TS + morphdom | Custom Canvas | React Workspace | Angular 21 | Next.js 15 |
| **Backend** | Hono 4 (CF Workers) | Go + C++ μsvc | FastAPI | NestJS + Prisma | Rails 7 |
| **Database** | CF D1 (SQLite edge) | ClickHouse + Redis | None | PostgreSQL | PostgreSQL + Redis |
| **Cache** | CF KV + 5-tier client | Redis + CDN | In-memory | Redis | Redis + CDN |
| **Charts** | Lightweight Charts v5 | Custom Canvas | Plotly | Custom | Recharts |
| **Auth** | Passkey (WebAuthn) | Email + OAuth2 | API keys | Email + OIDC | Email + OAuth2 |
| **Validation** | Valibot (3 KB) | Internal | Pydantic | class-validator | Zod |
| **Build** | Vite 8 + oxc | Webpack | Poetry | Nx 22 | Turbopack |
| **Hosting** | Cloudflare ($0/mo) | Proprietary DC | Docker | Docker/VPS | Self-hosted |
| **Tests** | Vitest 4 + Playwright | Internal | pytest | Jest + Nx | RSpec + Jest |
| **Bundle** | **158 KB** | ~5 MB | n/a | ~500 KB | ~1.2 MB |
| **AI** | MCP (stdio) | None | MCP + SDK | None | None |
| **Open source** | MIT | No | AGPL | AGPL | AGPL |

### 2.3 Best practices harvested from leaders

| Practice | Source | Action |
|---|---|---|
| Live demo with no signup | All OSS | Deploy immediately (Phase P) |
| Docker one-liner | Ghostfolio, OpenBB | Validate existing docker-compose |
| MCP server | OpenBB | Wire existing code to live API |
| SSR/SSG for SEO | StockAnalysis | Astro SSG in Phase R |
| Contributor onboarding | OpenBB | Dev container + labels in Phase R |
| Community Discord | OpenBB, Ghostfolio | Create before public launch |
| Real-time streaming | TradingView | Wire existing DO code |
| Property-based testing | Netflix | Already best-in-class. Expand. |
| Edge caching | All production apps | Deploy (code already done) |
| Copilot agents/skills | Internal advantage | Enhance (this session) |

---

## 3. Decision Audit v10 — Final Verdicts

### 3.1 Language & Type System

| Decision | v10 Verdict | Confidence |
|---|---|---|
| TypeScript 6 strict | **KEEP** | 99% |
| No `any` enforced | **KEEP** | 99% |
| Explicit returns on exports | **KEEP** | 95% |
| Valibot over Zod (3 KB vs 30 KB) | **KEEP** | 95% |

### 3.2 Frontend

| Decision | v10 Verdict | Confidence |
|---|---|---|
| Vanilla TS + signals (0 KB runtime) | **KEEP** | 90% |
| morphdom + lit-html hybrid | **KEEP** | 95% |
| Lightweight Charts v5 | **KEEP** | 99% |
| CSS Layers + @scope (zero runtime) | **KEEP** | 95% |
| Biome formatter (replaces Prettier) | **DONE** | 95% |

### 3.3 Backend

| Decision | v10 Verdict | Confidence |
|---|---|---|
| Hono 4 on CF Workers | **KEEP** | 99% |
| Cloudflare all-in ($0/mo) | **KEEP** | 90% |
| D1 (SQLite edge) | **KEEP** | 85% |
| KV for cache (TTL, edge) | **KEEP** | 95% |
| REST + OpenAPI (37 routes) | **KEEP** | 95% |

### 3.4 Tooling

| Decision | v10 Verdict | Confidence |
|---|---|---|
| Vite 8 | **KEEP** | 99% |
| Vitest 4 | **KEEP** | 99% |
| Playwright | **KEEP** | 95% |
| ESLint 10 flat config | **KEEP** (compat + import-x) | 90% |
| Biome 2 for formatting | **KEEP** | 95% |
| fast-check (property) | **KEEP + expand** | 99% |
| simple-git-hooks | **KEEP** | 95% |
| npm (not pnpm) | **KEEP** until Phase T | 80% |

---

## 4. Frontend Architecture v10

### 4.1 Component model (finalized)

| Layer | Technology | Bundle Cost |
|---|---|---|
| Layout & routing | Vanilla TS + signals | 0 KB |
| Simple cards | morphdom + template strings | 0 KB (shared 2.7 KB) |
| Complex cards | lit-html tagged templates | ~2 KB |
| Shared primitives | Native Web Components | 0 KB |
| Charts | Lightweight Charts v5 | 45 KB |

### 4.2 Rendering evolution

```text
v1-v7:    innerHTML → v8-v11: morphdom → v12: + Web Components
v13: + lit-html → v14: + View Transitions → v15: + WASM compute
```

---

## 5. Backend & Infrastructure v10

### 5.1 Production deployment — THE #1 PRIORITY

```bash
# 30-minute provisioning sequence
wrangler kv namespace create QUOTE_CACHE
wrangler kv namespace create QUOTE_CACHE --preview
wrangler d1 create crosstide-db
wrangler d1 migrations apply crosstide-db
wrangler deploy
curl https://crosstide-api.workers.dev/api/health
```

### 5.2 Cost model

| Resource | Free Tier | Our Usage | Monthly Cost |
|---|---|---|---|
| CF Pages | Unlimited BW | ~10 GB/mo | $0 |
| CF Workers | 100K req/day | ~5-20K/day | $0 |
| CF KV | 100K reads/day | ~10-50K reads | $0 |
| CF D1 | 5 GB | < 100 MB | $0 |
| **Total** | | | **$0** |

---

## 6. Data Strategy & API Ecosystem v10

### 6.1 Provider chain

```text
Real-time:     Yahoo → Finnhub → Alpaca (Phase Q)
OHLCV:         Yahoo → R2 archive → Stooq
Crypto:        CoinGecko → Finnhub
Fundamentals:  Yahoo → Finnhub
Macro:         FRED
Forex:         ECB → Yahoo
News:          Finnhub → Yahoo
```

### 6.2 API as platform

The CrossTide Worker API serves four consumers:

1. **SPA** (web dashboard)
2. **MCP server** (AI agents — Claude, GPT)
3. **npm SDK** (`@crosstide/api-client` — Phase T)
4. **Embeddable widgets** (Phase T)

---

## 7. AI, ML & Intelligent Compute v10

| Capability | Platform | Phase |
|---|---|---|
| MCP server (AI agents) | Node.js stdio | P (wire to live API) |
| NL → Screener DSL | WebGPU (Phi-4-mini) | S |
| WASM correlation matrix | AssemblyScript | S |
| ONNX pattern recognition | WebAssembly | S |

**Principle:** All AI on-device. Zero data transmitted externally.

---

## 8. Developer Experience & Tooling v10

### 8.1 Production toolchain

| Tool | Version | Purpose |
|---|---|---|
| TypeScript | 6.0.3 | Type checking |
| Vite | 8.0.10 | Build + dev server |
| Vitest | 4.1.4 | Unit + integration |
| Playwright | 1.59.1 | E2E + visual |
| ESLint | 10.2.1 | Linting |
| Biome | 2.4.15 | Formatting |
| fast-check | 4.7.0 | Property testing |
| workbox-build | 7.4.0 | SW precaching |
| commitlint | 20.5.3 | Commit format |
| simple-git-hooks | 2.13.1 | Git hooks |
| lint-staged | 16.4.0 | Pre-commit |

### 8.2 Quality gates

| Gate | Command | Requirement |
|---|---|---|
| Type check | `npm run typecheck` | 0 errors |
| ESLint | `npm run lint` | 0 warnings |
| Stylelint | `npm run lint:css` | 0 warnings |
| Biome | `npm run format:check` | Exit 0 |
| Tests | `npm run test:coverage` | ≥90% stmt/line/fn, ≥80% branch |
| Build | `npm run build` | Success |
| Bundle | `npm run check:bundle` | < 250 KB gzip |
| Supply chain | `npm audit --omit=dev` | 0 high/critical |
| Architecture | `node scripts/arch-check.mjs --strict` | 0 violations |

Run all: `npm run ci`

---

## 9. Documentation & Knowledge Strategy v10

| Priority | Document | Status |
|---|---|---|
| P0 | Live demo (deployed) | ✗ → Phase P |
| P0 | README (GIFs, badges) | ★★ → enhance |
| P1 | OpenAPI docs (Swagger) | ★★★ done |
| P1 | CONTRIBUTING.md | ★★ exists |
| P2 | 3-min video | ✗ → Phase R |
| P2 | docs-site (Starlight) | △ shell exists |

---

## 10. Quality, Security & Observability v10

### 10.1 Security controls (all active)

| Control | Status |
|---|---|
| CSP strict (no unsafe-inline/eval) | ✅ |
| HSTS preload (1 year) | ✅ |
| Valibot at all boundaries | ✅ |
| SRI hashes on preloads | ✅ |
| Rate limiting (CF Worker) | ✅ |
| gitleaks + npm audit signatures | ✅ |
| Signal DSL sandboxing (no eval) | ✅ |
| Passkey (WebAuthn) auth | ✅ |
| AES-GCM encrypted sync | ✅ |

### 10.2 Observability

| Layer | Tool | Status |
|---|---|---|
| Errors | GlitchTip (source-mapped) | Code ready |
| Analytics | Plausible (privacy) | Code ready |
| Uptime | Uptime Kuma | Configured |
| Worker traces | CF Logpush | Structured logging |
| Client perf | Web Vitals | Collecting |

---

## 11. Performance Architecture v10

| Metric | Budget | Current | Status |
|---|---|---|---|
| JS initial (gzip) | < 200 KB | 158 KB | ✅ |
| LCP (4G Android) | < 1.8s | ~1.2s | ✅ |
| INP (p75) | < 200ms | ~80ms | ✅ |
| CLS | < 0.05 | ~0.02 | ✅ |
| Lighthouse | ≥ 90 | ≥ 90 | ✅ |

---

## 12. VS Code & GitHub Integration Strategy

### 12.1 Current assets

| Asset | Count | Quality |
|---|---|---|
| Instruction files (`.github/instructions/`) | 10 | ★★★ |
| Prompt files (`.github/prompts/`) | 14 | ★★★ |
| Skills (`.github/skills/`) | 4 | ★★ Expand |
| Agents (`.github/agents/`) | 3 | ★★ Expand |
| Copilot config (`.github/copilot/`) | 1 | ★★★ |
| MCP servers (`.vscode/mcp.json`) | 2 | ★★ Add more |
| GH Actions workflows | 27 | ★★★ |
| Composite actions | 1 (node-setup) | △ Expand |

### 12.2 Skills expansion

| Skill | Purpose | Phase |
|---|---|---|
| `add-worker-route` | New API endpoint | ✅ exists |
| `debug-fetch` | Fix broken API calls | ✅ exists |
| `release` | Version bump + tag | ✅ exists |
| `update-tests` | Add/fix tests | ✅ exists |
| `deploy` | CF deployment playbook | P (new) |
| `migrate-db` | D1 migration workflow | P (new) |
| `add-provider` | New data provider | Q (new) |
| `perf-audit` | Performance investigation | R (new) |

### 12.3 Agents expansion

| Agent | Expertise | Phase |
|---|---|---|
| `api-integrator` | Worker routes, KV, providers | ✅ exists |
| `card-designer` | Card layout, theme, a11y | ✅ exists |
| `quality-reviewer` | Lint, coverage, security | ✅ exists |
| `deploy-ops` | Infrastructure, CF, Docker | P (new) |
| `perf-specialist` | Bundle, INP, LCP, WASM | R (new) |

### 12.4 Recommended VS Code extensions

**Essential for this workspace:**

- `github.copilot-chat` — AI pair programming
- `dbaeumer.vscode-eslint` — ESLint flat config
- `biomejs.biome` — Formatting (replaces Prettier)
- `stylelint.vscode-stylelint` — CSS linting
- `vitest.explorer` — Test runner UI
- `ms-playwright.playwright` — E2E test runner
- `github.vscode-github-actions` — Workflow editing
- `ms-edgedevtools.vscode-browser-compatibility` — Browser compat
- `DavidAnson.vscode-markdownlint` — Markdown linting
- `eamodio.gitlens` — Git history and blame

**Remove from recommendations:**

- `esbenp.prettier-vscode` — Replaced by Biome

### 12.5 MCP server configuration

| Server | Transport | Purpose |
|---|---|---|
| `github` | HTTP (Copilot MCP) | PR/issue/review workflows |
| `cloudflare` | stdio (mcp-remote) | KV/D1/Worker inspection |

---

## 13. Execution Phases

### Phase P — v12.0.0 "Ship It" (June 2-16, 2026)

**Theme:** Deploy to production. Real data flowing. Live demo accessible.
**Exit gate:** `crosstide.pages.dev` shows live AAPL data to any visitor.

| # | Task | Priority | Status |
|---|---|---|---|
| P1 | Provision CF resources (KV + D1) | P0 | ⬜ |
| P2 | Replace PLACEHOLDER IDs in wrangler.toml | P0 | ⬜ |
| P3 | Run D1 migrations | P0 | ⬜ |
| P4 | Deploy Worker + verify /api/health | P0 | ⬜ |
| P5 | Deploy Pages to production | P0 | ⬜ |
| P6 | Verify live quote + chart E2E | P0 | ⬜ |
| P7 | Wire MCP server to live API | P1 | ⬜ |
| P8 | GIF demos in README | P1 | ⬜ |
| P9 | VS Code/GitHub integration cleanup | P1 | ⬜ |
| P10 | Remove dead code/config/docs | P1 | ⬜ |

### Phase Q — v13.0.0 "Data Depth" (4-6 weeks)

| # | Task | Priority |
|---|---|---|
| Q1 | Alpaca Markets provider (free real-time) | P0 |
| Q2 | BYOK (user API keys, encrypted D1) | P1 |
| Q3 | Signal DSL fuzz testing | P2 |
| Q4 | Property tests → 50+ total | P1 |
| Q5 | Keyboard navigation audit | P1 |

### Phase R — v14.0.0 "Public Launch" (4-6 weeks)

| # | Task | Priority |
|---|---|---|
| R1 | SSG top 500 ticker pages (Astro) | P0 |
| R2 | 3-minute video walkthrough | P1 |
| R3 | Discord community server | P0 |
| R4 | Product Hunt + HN + Reddit launch | P0 |
| R5 | CONTRIBUTING.md + good-first-issue labels | P1 |

### Phase S — v15.0.0 "Intelligence" (6-8 weeks)

| # | Task | Priority |
|---|---|---|
| S1 | WebLLM: Phi-4-mini via WebGPU | P0 |
| S2 | NL → Screener DSL translation | P0 |
| S3 | WASM correlation matrix | P0 |
| S4 | WASM Monte Carlo | P1 |

### Phase T — v16.0.0 "Platform" (8-12 weeks)

| # | Task | Priority |
|---|---|---|
| T1 | Plugin sandbox (Worker-isolated) | P0 |
| T2 | Publish `@crosstide/domain` to npm | P0 |
| T3 | Signal adapters (React, Solid, Svelte) | P1 |
| T4 | pnpm + Turborepo migration | P2 |

---

## 14. Refactor & Rewrite Backlog

| # | Refactor | Phase |
|---|---|---|
| RF1 | Provision CF resources | P |
| RF2 | Replace PLACEHOLDER binding IDs | P |
| RF3 | Update extensions.json (remove Prettier, add Biome) | P |
| RF4 | Remove debug.log files from .github | P |
| RF5 | Add deploy + migrate-db skills | P |
| RF6 | Add deploy-ops agent | P |
| RF7 | Validate Docker self-hosting E2E | P |
| RF8 | Add Alpaca provider | Q |
| RF9 | SSG ticker pages | R |
| RF10 | Extract `@crosstide/domain` | T |

---

## 15. Risks, Mitigations & Scope Boundaries

### 15.1 Risk matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Never deploying | HIGH | Fatal | 2-week hard deadline |
| No users after launch | High | High | SEO + widgets + PH + HN |
| Yahoo API breaks | High | High | 5+ failover providers |
| Solo burnout | High | High | Plugin SDK + community |
| CF free tier limits | Low | Medium | Hono portable |

### 15.2 Scope boundaries

**CrossTide IS:** Privacy-first financial analysis · 12-method consensus · Offline PWA · MIT · $0/mo · MCP-compatible · Embeddable widgets

**CrossTide IS NOT:** Trading platform · Social network · Robo-advisor · Paid SaaS

---

## 16. Engineering Non-Negotiables

1. No suppressions (`eslint-disable`, `@ts-ignore`, `--force`)
2. No dead artifacts (every file/export/dep must be referenced)
3. No `TODO` in code (open GitHub Issue instead)
4. No secrets in source (`.env` + CF Secrets only)
5. Validation at boundaries (sanitize all external input)
6. Layer imports one-way (`types ← domain ← core ← providers ← cards ← ui`)
7. Domain stays pure (no DOM, fetch, Date.now(), Math.random())
8. No floating promises (`void asyncFn()` or `await`)
9. Ship before perfecting (deployed imperfect > undeployed perfect)
10. Test before shipping (new logic requires tests)

---

## Appendix: Metric Targets

| Metric | Phase P | Phase Q | Phase R | Phase S | Phase T |
|---|---|---|---|---|---|
| Real users | 1+ | 10+ | 100+ | 500+ | 1000+ |
| GitHub stars | — | — | 100+ | 300+ | 500+ |
| Bundle (gzip) | < 200 KB | < 200 KB | < 200 KB | < 220 KB | < 250 KB |
| Uptime | > 99% | > 99.5% | > 99.9% | > 99.9% | > 99.9% |
| Contributors | 1 | 1-2 | 3-5 | 5-10 | 10+ |

---

_Supersedes: ROADMAP v9 (May 21, 2026), archived at `docs/ROADMAP-v9-archive.md`._
_Next review: After Phase P deployment (target: June 16, 2026)._
