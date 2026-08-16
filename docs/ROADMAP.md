# CrossTide Product And Engineering Roadmap

> **Planning baseline:** 12 August 2026 · **Release:** v11.44.6
>
> This is the single consolidated plan for future work: priorities, phases, active
> sprint tracking, and acceptance policy. Completed work belongs in
> `CHANGELOG.md` and Git history. GitHub Issues and pull requests own execution
> detail, discussion, owners, and acceptance evidence.

CrossTide has substantial analytical depth, but its next quality jump is not more
indicators. It is a coherent, production-verified product: trustworthy data,
reachable features, clear user workflows, portable contracts, measured operations,
and documentation that tells the truth about what is shipped.

## Baseline

Refresh these facts with the commands in `docs/OWNERSHIP.md` before changing a
baseline number.

| Measure | Current value | Source |
|---|---:|---|
| Release | v11.44.6 | `package.json` |
| Source modules | 523 | `npm run check:doc-facts` |
| Domain modules | 222 | `npm run check:doc-facts` |
| Reachable source modules | 263 of 523 | `npm run check:reachability` |
| Unreachable modules | 260 | `npm run check:reachability` |
| Hard orphans | 8 | `npm run check:reachability` |
| Barrel-only modules | 235 | `npm run check:reachability` |
| Registered card routes | 25 | `src/cards/registry.ts` |
| Registered Worker routes | 56 | `worker/index.ts` |
| Documented Worker routes | 56 of 56 | OpenAPI drift test |
| Production JavaScript bundle | 228.3 KB gzip | `npm run check:bundle` |
| Test coverage | 93.09% statements, 83.76% branches | `npm run test:coverage` |

The reachability split is intentional evidence, not a deletion mandate. Domain
modules may be published without being loaded by the SPA. Application modules must
eventually be wired, promoted into a supported package, merged into a canonical
sibling, or explicitly deferred with an owner and review date.

## Planning Rules

- Refactor any implementation, option, configuration, or document when evidence says
  it improves the product. Existing code is not protected by sunk cost.
- Do not remove dead or dormant code as part of this roadmap. First establish its
  intended boundary and disposition; deletion requires a separate, explicit decision.
- Do not call a feature shipped until a real route or consumer uses it, its failure
  states are designed, and its acceptance evidence runs in the target environment.
- Prefer one canonical source of truth. Other documents link to it instead of
  copying counts, routes, versions, or policy.
- Planned claims, comparison tables, and marketing language must be visibly separated
  from verified capabilities.
- Every substantial change gets an issue, owner, risk, acceptance test, rollback
  plan, and documentation review trigger.

## Anti-regression guardrails

The roadmap is clear about the product goal, but it also carries the operational history of
what has already gone wrong. These are the repeated failure modes we actively reject:

- Gates that pass without checking the real artifact.
- Vacuous readiness guards that resolve before the app loads.
- Markdown/CI sequencing issues where an early gate masks later failures.
- `npx`-driven tool drift for lockfile-pinned dev dependencies.
- Unlinked CSS, stale Workbox manifests, and registry/router drift that are invisible until a
  release day.
- Hidden assumptions in browser tests that confuse visibility with clickability or route-focus
  state with page readiness.
- Dormant code paths that never execute in normal CI but accumulate real defects that surface only
  after a previously hidden route is reached.
- Hand-maintained mirrors or allowlists that silently narrow the rule instead of enforcing it.
- Multi-file patches that silently drop neighboring logic because the edit matched too broadly.

This list is intentionally short and actionable. If a proposed check cannot fail under a real,
observable mismatch, it is not a gate and must be fixed before it is trusted.

## Priority And Status

**Priority:** P0 release blocker · P1 product-critical · P2 important · P3 optional

**Effort:** S up to one day · M up to one week · L over one week

**Status:** Planned · In progress · Blocked · Decision needed

## Next Ten Priorities

This is the executable queue for the active development sprint batch and the next
25 planned roadmap items, following the delivery order below while excluding
externally blocked work.

| Rank | ID | Reason to execute next |
|---:|---|---|
| 1 | D03 | Add provider licensing, attribution, timezone, market-status, stale-data, and adjustment metadata |
| 2 | P04 | Validate the Docker self-hosting path on a clean machine |
| 3 | P05 | Add rollback, backup, restore, migration, incident, and provider-outage runbooks |
| 4 | A05 | Measure rendering strategies before choosing a canonical approach |
| 5 | A06 | Standardize card lifecycle, loading, error, and disposal contracts |
| 6 | U06 | Complete RTL, locale, number, date, and timezone support |
| 7 | U07 | Replace aspirational comparison claims with verified capability labels |
| 8 | F01 | Establish performance budgets and representative measurement profiles |
| 9 | F02 | Measure and optimize startup, lazy loading, charts, workers, and service-worker updates |
| 10 | D04 | Build deterministic replay fixtures for provider success and failure states |

## Active Sprint Tracking

Sprint execution rules, the current implementation batch, and the acceptance
queue that recalculates from verified local evidence. This section is the
single source for "what is being worked on right now" — phase tables below
record the full backlog; this section records live status.

### Execution Rules

1. Execute in rank order unless a dependency or blocker is recorded.
2. Every code task requires a focused test before the next task begins.
3. Every documentation task requires `npm run check:repo-contracts`.
4. Do not mark a task complete from a static file edit alone; run its acceptance check.
5. Blocked tasks stay visible and must not be replaced by speculative infrastructure.

### Current Priority Queue

This queue recalculates the next work from the current roadmap statuses and
verified local evidence.

| Rank | Roadmap | Task | State | Next acceptance check |
|---:|---|---|---|---|
| 1 | P04 | Rehearse the Docker self-hosting path on a clean machine | Blocked locally | Docker build, health, restart, persistence, and shutdown report |
| 2 | P05 | Rehearse rollback, backup, restore, migration, incident, and provider-outage runbooks | In progress | Fresh-machine rehearsal records evidence for each procedure |
| 3 | A05 | Validate the hybrid rendering decision with representative workflow measurements | Verified | ADR records repeatable LCP, INP, CLS, scripting, memory, and accessibility evidence |
| 4 | A06 | Standardize card lifecycle and disposal behavior | Verified | Registry lifecycle tests cover mount, inactive disposal, shutdown, failed loads, and disposal-error isolation |
| 5 | U06 | Complete locale, RTL, number, date, and timezone support | Verified | Locale catalog, RTL, and formatter tests pass for all supported locales |
| 6 | F01 | Make performance budgets observable in CI and probes | Verified | Shared LCP budget matches the measured 2.7s real-world signal and the Lighthouse gate plus browser benchmark pass with matching evidence |
| 7 | F02 | Capture startup, lazy-load, chart, worker, and service-worker measurements | In progress | `npm run test:e2e:performance:profiles` attaches profile-labeled startup, card-load, chart-render, Worker-transfer, and service-worker measurements for Chromium, mobile Chrome, and Android Galaxy; optimization and broader comparison remain |
| 8 | U03 | Complete heatmap keyboard, accessibility, resize, and touch behavior | Verified | Full supported Playwright matrix passes: 155 heatmap-focused keyboard, accessibility, resize, navigation, and touch tests across desktop, mobile, tablet, and Android projects |
| 9 | D06 | Validate OHLCV gaps, corporate actions, duplicates, currency, and calendars | Verified | Domain checks reject or visibly mark invalid market data, including consecutive-day duplicate-candle and exchange-calendar-aware gap detection |
| 10 | D07 | Validate indicator and backtest semantics against published references and invariants | Verified | Numerical property and financial-invariant suites pass; `BacktestResult` carries run explanation metadata |

U07, D03, and D04 are excluded because their acceptance evidence is complete. P01-P03,
P06, E02, and the external-user validation task remain externally blocked.

### Active Implementation Batch

| Batch | Status | Notes |
|---|---|---|
| P04 + P05 | In progress | Docker self-hosting rehearsal and rollback/runbook evidence remain the operating baseline for deployment readiness |
| A05 + F02 | In progress | Rendering strategy measurement and performance profiling are driving the next platform decisions |
| U03 + U06 | In progress | Heatmap UX and locale/RTL formatting are the two remaining high-signal workflow completions |
| D06 + D07 + D08 | In progress | Data-quality, backtest, alert, and screener explainability are being hardened against the real product data contract |
| U04 + U01 | In progress | Journey state preservation (share-link ticker restore, chart drawing sharing, toolbar-render fix) and primary-journey completion remain the user-facing quality gate |

## Phase 0: Establish Truth And Scope

The project cannot be best in class while the docs, route graph, and product promise
disagree.

| ID | Work | Priority | Effort | Acceptance evidence | Status |
|---|---|:---:|:---:|---|---|
| T01 | Make `docs/OWNERSHIP.md` cover every maintained Markdown file, including docs-site pages, ADRs, skills, prompts, and operational guides | P0 | M | Every document has one owner, purpose, canonical source, and review trigger | Complete |
| T02 | Reconcile README, architecture, development, deployment, docs-site, and agent guidance with generated facts | P0 | M | Doc facts, links, Markdown lint, and stale-reference scans pass | Complete |
| T03 | Replace legacy roadmap IDs and sprint language in maintained docs with stable workstream links | P0 | S | No maintained document points to a superseded roadmap or closed backlog ID | Complete |
| T04 | Decide the product boundary: analysis application, open financial data platform, or explicitly layered product with both contracts | P0 | M | `docs/adr/0016-product-boundary.md` is accepted and linked from public capability claims | Complete |
| T05 | Define the supported feature matrix: shipped, preview, fixture-only, package-only, dormant, and blocked | P0 | M | `docs/CAPABILITY_MATRIX.md` is linked by public documentation and reviewed with route/package changes | Complete |
| T06 | Define a narrow first-class user journey and a feedback plan with real users | P1 | M | Five end-to-end journeys have usability evidence from external users | Planned |

## Phase 1: Production Foundation

The application needs a verified deployment path before more surface area is added.

| ID | Work | Priority | Effort | Acceptance evidence | Status |
|---|---|:---:|:---:|---|---|
| P01 | Provision Cloudflare KV, D1, Durable Objects, Pages, and environment-specific bindings | P0 | S | Staging resources exist with no placeholders | Blocked |
| P02 | Apply and verify D1 migrations in staging and production | P0 | S | Migration status is clean and rollback is documented | Blocked |
| P03 | Deploy Worker and frontend together with health, header, service-worker, and API smoke tests | P0 | M | A reproducible production smoke report is stored with the release | Blocked |
| P04 | Validate the Docker self-hosting path on a clean machine | P1 | M | Build, serve, health, persistence, and shutdown are documented and tested | In progress |
| P05 | Add rollback, backup, restore, migration, incident, and provider-outage runbooks | P1 | M | Fresh-machine rehearsal produces evidence for each operation | In progress |
| P06 | Establish scheduled health probes for shell, quote, chart, search, Worker, WebSocket, and MCP journeys | P1 | M | Degraded states alert with bounded noise and recovery evidence | Planned |
| P07 | Define supported hosting targets and portability boundaries for forks without Cloudflare credentials | P1 | M | Local, Docker, GitHub Pages, and Cloudflare modes each have truthful capability matrices | Complete |

## Phase 2: Architecture And Reachability

This phase stitches the existing work together without deleting dormant code.

| ID | Work | Priority | Effort | Acceptance evidence | Status |
|---|---|:---:|:---:|---|---|
| A01 | Classify all unreachable modules by app wiring, package API, shared primitive, experiment, or explicit deferment | P0 | L | `docs/ARCHITECTURE.md` classifies all seven hard orphans with owner and review date | Complete |
| A02 | Resolve the seven hard orphans through wiring, promotion, merger, or documented deferment | P0 | L | Reachability report has no unexplained hard orphan; no module is deleted by default | Complete |
| A03 | Separate public barrels from runtime entry points and test that each exported contract is consumable | P1 | M | `docs/PACKAGE_CONTRACTS.md` classifies package, Worker, browser, and SPA entry points | Complete |
| A04 | Reconcile `types`, `domain`, `core`, `providers`, `cards`, and `ui` boundaries; remove compatibility exceptions rather than widening them | P0 | L | Strict architecture and domain package purity checks pass | Complete |
| A05 | Measure DOM, Web Components, canvas, and hybrid rendering before choosing a canonical rendering strategy | P1 | M | ADR records performance, accessibility, contributor, and migration evidence | In progress |
| A06 | Refactor shared card primitives, lifecycle, state, loading, error, and disposal contracts | P1 | L | All supported cards use the same lifecycle contract and leak test | Complete |
| A07 | Review every public export and package subpath for stability, naming, and consumer value | P1 | M | Export inventory has compatibility policy and examples | Complete |

A speculative 1000-line presentation-layer refactor proposal (tokens, density modes,
z-index scale, mobile navigation) was drafted against an earlier snapshot of the
codebase, never started, and had no remaining consumer or cross-reference. It is
superseded by the evidence-driven A05 rendering-strategy measurement above; full
detail is preserved in Git history rather than a stale unexecuted spec.

## Phase 3: Data Trust And Financial Correctness

Market data is the product boundary. Every value needs provenance, freshness, and
failure semantics.

| ID | Work | Priority | Effort | Acceptance evidence | Status |
|---|---|:---:|:---:|---|---|
| D01 | Replace fixture-only heatmap paths with validated Worker-backed Stocks, FX, Futures, and Crypto datasets | P0 | L | Each asset class has schema, cache, freshness, attribution, and outage tests | Planned |
| D02 | Define a canonical market-data envelope for quote, chart, fundamentals, news, and derived outputs | P0 | M | Client, Worker, MCP, widget, and package contracts share versioned types | Complete |
| D03 | Add provider licensing, attribution, timezone, market-status, stale-data, and adjustment metadata to views | P0 | M | A customer can identify source, timestamp, coverage, and limitations for every dataset | Complete |
| D04 | Build deterministic replay fixtures for success, stale, malformed, timeout, quota, partial, and disagreement cases | P1 | M | Unit and browser tests reproduce all provider states without network access | Complete |
| D05 | Reconcile provider chains, direct browser fallbacks, Worker-first production routing, and fork-configurable proxy URLs | P0 | M | No environment relies on a hardcoded corporate proxy or dev-only route | Complete |
| D06 | Add data-quality checks for OHLCV gaps, splits, dividends, duplicate candles, currency, and trading calendars | P1 | L | Invalid data is rejected or visibly marked before calculation, including consecutive-day duplicate-candle detection and exchange-calendar-aware gap detection | Verified |
| D07 | Validate indicator and backtest semantics against published references and property-based invariants | P1 | L | Numerical review records tolerances, edge cases, and known limitations; `BacktestResult` carries run explanation metadata (methods, window, sizing, date range) | Verified |
| D08 | Add explainability to consensus, alerts, screener, portfolio, and risk outputs | P1 | M | Consensus, alerts (`evaluatedValue`), backtests (`BacktestExplanation`), and screener (`explainFundamentalFilters`) expose inputs, weights, timestamps, and limitations; portfolio and risk explainability remain | In progress |

## Phase 4: Product Workflows And UX

Depth only matters when a customer can move through a coherent workflow.

| ID | Work | Priority | Effort | Acceptance evidence | Status |
|---|---|:---:|:---:|---|---|
| U01 | Define and polish the primary journey: discover symbol -> inspect data -> understand signal -> test risk -> save/share | P0 | L | Journey is usable on desktop/mobile and covered by browser tests | Complete |
| U02 | Give every supported card consistent loading, empty, stale, error, retry, offline, and permission states | P0 | L | State matrix is complete and no async path leaves silent empty UI | Complete |
| U03 | Finish heatmap interaction across asset classes, drill-down, keyboard, screen reader, resize, and mobile touch | P1 | M | Browser and accessibility tests cover the full interaction model | In progress |
| U04 | Make watchlist, chart, consensus, portfolio, alerts, screener, and backtest state transitions explicit and reversible | P1 | L | Route changes, reloads, offline recovery, and share links preserve supported state | In progress |
| U05 | Complete accessibility verification to WCAG 2.2 AA, then document the supported AAA enhancements and limitations | P0 | M | Automated and manual audits cover all supported routes and themes | Complete |
| U06 | Complete RTL, locale expansion, number/date/timezone formatting, and translation completeness | P1 | M | EN/HE and added locales pass visual, semantic, and formatting tests | In progress |
| U07 | Replace aspirational comparison claims with verified capability labels and user-facing limitations | P1 | S | README and docs-site distinguish shipped, preview, and planned capabilities | Complete |

### Primary Journey Acceptance Matrix

This matrix defines the minimum acceptance path for discovering an instrument,
inspecting its market data, understanding signals and risk, and preserving or
sharing the resulting view (U01). A case is accepted only when the listed outcome
is observable in the UI or URL; a successful HTTP response alone is insufficient.

| Journey | Entry point | User action | Observable acceptance | Required state variants | Test owner |
|---|---|---|---|---|---|
| Discover | `/watchlist` | Search for a ticker and add it | A matching suggestion is shown; submitting a valid symbol creates one watchlist row | Stock, ETF, crypto, forex, index; malformed symbol | `tests/e2e/cards.spec.ts` |
| Inspect | Watchlist row and `/chart` | Select the symbol and open its chart | The selected ticker is visible, the chart or its explicit empty/error state is rendered, and no uncaught app error occurs | Live, cached/stale, empty, upstream error | `tests/e2e/` chart coverage |
| Signal | `/consensus` | Open the symbol's consensus view | The signal summary identifies the symbol, exposes contributing inputs, and labels unavailable inputs instead of presenting them as values | Positive, negative, neutral, unavailable | `tests/e2e/` consensus coverage |
| Risk | `/risk` | Review risk for the selected symbol or portfolio | Risk metrics render with units and a visible limitation or empty state when history is insufficient | Complete history, insufficient history, calculation error | `tests/e2e/` risk coverage |
| Save | Watchlist and route state | Reload after adding a symbol | The saved symbol and active route survive reload, or the UI shows a deterministic empty state when persistence is unavailable | First visit, reload, malformed stored data, offline | `tests/e2e/` persistence coverage |
| Share | Active analysis route | Copy or open the shareable URL | The URL contains the required symbol and route; opening it directly restores the same analysis context | Symbol with punctuation, missing symbol, unknown route | `tests/e2e/` share coverage |

Execution rules: run the discovery case before inspect, signal, and risk cases when
they share a symbol; assertions must target rendered state, route state, or
accessible names rather than provider-specific response fields; every non-live
result must show loading, empty, stale, error, retry, or offline state as
applicable; browser tests use `waitForAppReady` and fixture/intercept network
responses for deterministic runs.

## Phase 5: Performance, Offline, And Compatibility

The current bundle budget is strong; best in class also requires predictable runtime
behavior under weak devices, networks, and browsers.

| ID | Work | Priority | Effort | Acceptance evidence | Status |
|---|---|:---:|:---:|---|---|
| F01 | Establish budgets for LCP, INP, CLS, memory, long tasks, route transition, Worker p95, cache hit, and WebSocket recovery | P1 | M | CI and production probes fail with metric-specific evidence | Verified |
| F02 | Measure and optimize startup, card lazy loading, chart rendering, Web Worker transfer, and service-worker update behavior | P1 | L | Budgets hold on representative desktop, mobile, and low-end profiles | In progress |
| F03 | Define offline guarantees per workflow instead of treating the whole app as equally offline-capable | P1 | M | Each route documents cached, stale, read-only, and unavailable behavior | Complete |
| F04 | Test browser compatibility, reduced motion, reduced data, battery, storage pressure, and private browsing modes | P1 | M | Compatibility matrix and progressive-enhancement tests are current | Complete |
| F05 | Validate native Capacitor packaging or explicitly mark it experimental and isolate its support contract | P2 | M | iOS/Android smoke evidence or a documented non-support decision exists | Planned |

## Phase 6: Security, Privacy, And Operations

| ID | Work | Priority | Effort | Acceptance evidence | Status |
|---|---|:---:|:---:|---|---|
| S01 | Resolve high/critical dependency advisories or create time-bounded, owner-approved exceptions | P0 | M | Production audit passes or every exception has mitigation and expiry | Complete |
| S02 | Complete threat modeling for browser, Worker, D1, KV, Durable Objects, MCP, widgets, BYOK, and self-hosting | P0 | M | `docs/adr/0017-threat-model.md` is reviewed and open decisions have owners | Complete |
| S03 | Audit secret lifecycle, proxy configuration, CORS, CSP, Trusted Types, SRI, headers, and logging for fork portability | P0 | M | `docs/SECRET_LIFECYCLE.md` defines storage, rotation, fork setup, and audit scope | Complete |
| S04 | Define D1 retention, deletion, export, consent, telemetry, and privacy-policy behavior | P1 | M | Privacy controls and documentation match implementation | Planned |
| S05 | Add abuse controls for expensive calculations, WebSockets, MCP tools, exports, and provider fan-out | P1 | M | Rate, quota, timeout, and cost limits are enforced and tested | Planned |
| S06 | Produce SBOM, provenance, signatures, dependency review, and reproducible clean-install evidence for every release | P1 | S | Release artifact contains verifiable supply-chain evidence | Planned |

## Phase 7: Contracts And Ecosystem

| ID | Work | Priority | Effort | Acceptance evidence | Status |
|---|---|:---:|:---:|---|---|
| E01 | Version OpenAPI, Worker envelopes, MCP tools, widgets, and domain package APIs independently | P1 | M | Additive, deprecated, and breaking changes are classified by contract tests | Planned |
| E02 | Publish `@crosstide/domain` with provenance, examples, compatibility policy, and consumer fixtures | P1 | M | Node, browser, Worker, and Web Worker consumers build from the published tarball | Blocked |
| E03 | Complete widget documentation, versioning, theming, accessibility, error, and self-hosted endpoint contracts | P1 | M | External host-page smoke tests cover all supported elements | Planned |
| E04 | Make MCP discovery, schema validation, authorization, rate limits, errors, and route mapping production-grade | P1 | M | Independent MCP clients pass contract and abuse tests | Planned |
| E05 | Generate user-facing indicator/API documentation from source metadata without duplicating implementation facts | P1 | M | Generated docs are linked, searchable, and drift-checked | Planned |
| E06 | Establish deprecation and migration policy for routes, providers, indicators, packages, widgets, and config | P1 | S | Every breaking change has a notice, migration path, and removal horizon | Planned |

## Phase 8: Community And Sustainable Delivery

| ID | Work | Priority | Effort | Acceptance evidence | Status |
|---|---|:---:|:---:|---|---|
| G01 | Add a public demo, screenshots, honest capability matrix, tutorials, and a five-minute contributor path | P1 | M | A new user and contributor can complete both journeys from the docs | Planned |
| G02 | Create issue templates for bugs, data quality, security, feature proposals, provider outages, and ADRs | P1 | S | Each template captures owner, impact, reproduction, acceptance, and rollback needs | Planned |
| G03 | Establish release cadence, support horizon, changelog discipline, and security disclosure process | P1 | S | Maintainers can explain what is supported and how fixes are delivered | Planned |
| G04 | Add community health files, code ownership, review expectations, and newcomer-sized issues | P2 | S | External contribution can proceed without private project knowledge | Planned |
| G05 | Measure adoption, reliability, documentation success, and user feedback without compromising privacy | P2 | M | Metrics have purpose, retention limits, and opt-out behavior | Planned |

## Phase 9: Research And Optional Expansion

These items remain behind production trust and user evidence.

| ID | Work | Priority | Effort | Acceptance evidence | Status |
|---|---|:---:|:---:|---|---|
| R01 | Evaluate WebLLM, local embeddings, and Signal DSL assistance for privacy, model size, safety, and fallback | P2 | L | ADR records capability and browser evidence before implementation | Planned |
| R02 | Evaluate WASM acceleration only where benchmark evidence beats the current TypeScript path | P2 | M | Benchmark-gated ADR and size budget pass | Planned |
| R03 | Evaluate advanced research indicators, ML, causal analysis, and alternative data only against user needs | P3 | L | Each proposal has validation data, explainability, and maintenance cost | Planned |
| R04 | Reassess framework, rendering, storage, and hosting choices after user and performance evidence | P2 | M | Architecture review compares migration cost with measured benefit | Planned |

## Delivery Order

1. Truth and scope: T01-T05.
2. Production foundation and security blockers: P01-P03, S01-S03.
3. Reachability and boundary taxonomy: A01-A04.
4. Data contracts and provider trust: D01-D08.
5. One polished primary workflow: U01-U04.
6. Accessibility, performance, offline, and compatibility: U05-U07, F01-F05.
7. Contracts, packaging, widgets, MCP, and generated docs: E01-E06.
8. Operations, community, and optional research: P04-P07, S04-S06, G01-G05, R01-R04.

## External Blockers

| Blocker | Affected work | Required action |
|---|---|---|
| Cloudflare authentication and production bindings unavailable | P01-P03, D01, E01 | Provision target resources and provide environment credentials |
| npm publish credentials unavailable | E02 | Provide an `NPM_TOKEN` with `@crosstide` publish rights |
| No validated external-user feedback loop | T06, U01, G01 | Recruit testers and record consented, reproducible findings |

## Completion Gate

An item is complete only when its implementation, tests, documentation, observability,
rollback path, and target-environment evidence agree. The applicable checks are:

```powershell
npm run typecheck
npm run lint:all
npm run check:repo-contracts
npm run check:api-types
npm run test:coverage
npm run check:reachable-coverage
npm run build:only
npm run check:bundle
npm run ci
```

Deployment, browser, Lighthouse, security, package, and user-validation evidence is
also required when the workstream changes those surfaces.

---

_Future roadmap · v11.44.6 baseline · refresh after each release, blocker change, or architecture decision._
