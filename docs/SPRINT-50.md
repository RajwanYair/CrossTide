# CrossTide Sprint 50

> Planning baseline: 12 August 2026 · Roadmap baseline: v11.44.6
>
> This is the executable decomposition of the next 50 roadmap tasks. The roadmap
> remains the source of priority and acceptance policy; this file owns sprint
> sequencing, task granularity, and execution state.

## Status Key

- **Ready**: can be developed and verified in this repository.
- **Verified**: existing implementation and acceptance checks already pass.
- **Blocked**: requires credentials, provisioned infrastructure, or external users.
- **Queued**: dependency is not yet complete.

## Execution Rules

1. Execute in rank order unless a dependency or blocker is recorded.
2. Every code task requires a focused test before the next task begins.
3. Every documentation task requires `npm run check:repo-contracts`.
4. Do not mark a task complete from a static file edit alone; run its acceptance check.
5. Blocked tasks stay visible and must not be replaced by speculative infrastructure.

## Active Sprint Status

The next 25 planned delivery items are now tracked as the active implementation batch for the current roadmap cycle. The batch remains intentionally scoped to the verified unblocked workstream: operational runbooks, observability, product data quality, UX completion, and the remaining browser/runtime validations.

| Batch | Status | Notes |
|---|---|---|
| P04 + P05 | In progress | Docker self-hosting rehearsal and rollback/runbook evidence remain the operating baseline for deployment readiness |
| A05 + F02 | In progress | Rendering strategy measurement and performance profiling are driving the next platform decisions |
| U03 + U06 | In progress | Heatmap UX and locale/RTL formatting are the two remaining high-signal workflow completions |
| D06 + D07 + D08 | In progress | Data-quality and validation fidelity checks are being enforced against the real product data contract |
| U04 + U01 | In progress | Journey state preservation and primary-journey completion remain the user-facing quality gate |

This is the executable status for the immediate roadmap batch; verified and externally blocked items remain recorded in the backlog and are not replaced by speculative work.

## Next 25 Planned Delivery Items

The active roadmap batch is the next 25 item delivery slice below. These are the items currently tracked as the next implementation and verification sequence for the repository, grouped into the verified operating baseline and the next runtime workstream.

| # | Roadmap | Task | Status | Acceptance evidence |
|---:|---|---|---|---|
| 1 | T02 | Re-run generated source, domain, core, UI, card, route, and test facts | Verified | `npm run check:doc-facts` |
| 2 | T02 | Reconcile public README claims with the capability matrix | Verified | README capability labels, links, and Markdown checks pass |
| 3 | T02 | Reconcile architecture and development guides with generated facts | Verified | Architecture/development review plus `check:repo-contracts` |
| 4 | T02 | Reconcile deployment and docs-site setup claims with supported modes | Verified | Deployment/docs-site review, build, and local-link checks pass |
| 5 | T02 | Add a stale-fact scan for maintained documentation | Verified | `npm run check:doc-facts` fails on changed facts |
| 6 | T03 | Scan maintained docs for superseded roadmap archive references | Verified | `npm run check:roadmap-priorities` |
| 7 | T03 | Replace remaining sprint-language references with stable roadmap links | Verified | User-facing legacy reference removed |
| 8 | T03 | Add roadmap-priority validation to repository contracts | Verified | `npm run check:repo-contracts` |
| 9 | T04 | Record the layered product boundary decision | Verified | ADR-0016 is accepted and indexed |
| 10 | T04 | Link the product boundary from public capability claims | Verified | README and docs-site links pass |
| 11 | T04 | Define support consequences for PWA, Worker, MCP, widgets, and package | Verified | ADR consequences are explicit |
| 12 | T04 | Add a review trigger for boundary changes | Verified | ADR ownership and review metadata exist |
| 13 | T05 | Publish shipped, preview, package-only, dormant, and blocked classifications | Verified | `docs/CAPABILITY_MATRIX.md` exists |
| 14 | T05 | Link the capability matrix from README and docs-site entry points | Verified | Link and docs checks pass |
| 15 | T05 | Add route and package changes to the matrix review checklist | Verified | Ownership and contributor docs agree |
| 16 | S03 | Audit provider keys, Cloudflare credentials, and proxy handling | Verified | Secret lifecycle docs and secret scan pass |
| 17 | S03 | Remove organization-specific proxy assumptions from runtime configuration | Verified | Fork config check rejects embedded proxy URLs and credentials |
| 18 | S03 | Verify browser bundles contain no provider secrets or proxy credentials | Verified | Build artifact secret scan passes |
| 19 | S03 | Document rotation and revocation evidence for provider credentials | Verified | Secret lifecycle rotation procedure exists |
| 20 | S03 | Add a clean-fork configuration smoke check | Verified | `npm run check:fork-config` passes |
| 21 | A01 | Generate a current hard-orphan inventory | Verified | `npm run check:reachability` |
| 22 | A01 | Assign disposition, owner, and review date to every hard orphan | Verified | `docs/ORPHAN_DISPOSITION.md` |
| 23 | A02 | Wire the persisted layout preset consumer | Verified | Preset restoration and core tests pass |
| 24 | A02 | Merge or compatibility-route the card error-boundary implementation | Verified | Boundary tests and reachability pass |
| 25 | A02 | Promote or explicitly defer plugin contract modules | Verified | Explicit deferment and contract tests pass |

The next runtime implementation slice continues immediately after this batch with the remaining unblocked work in A04, D02, D05, U01, U02, U06, F02, and the deployment runbooks.

## Current Priority Queue

The original 50-task backlog remains the delivery record. This queue recalculates
the next work from the current roadmap statuses and verified local evidence.

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
| 9 | D06 | Validate OHLCV gaps, corporate actions, duplicates, currency, and calendars | Verified | Domain checks reject or visibly mark invalid market data |
| 10 | D07 | Validate indicator and backtest semantics against published references and invariants | Verified | Numerical property and financial-invariant suites pass |

U07, D03, and D04 are excluded because their acceptance evidence is complete. P01-P03,
P06, S01, E02, and rank 48-50 backlog tasks remain externally blocked.

## Sprint Backlog

| Rank | Task | Roadmap | Priority | State | Acceptance evidence |
|---:|---|---|:---:|---|---|
| 1 | Re-run generated source, domain, core, UI, card, route, and test facts | T02 | P0 | Verified | `npm run check:doc-facts` |
| 2 | Reconcile public README claims with the capability matrix | T02 | P0 | Verified | README capability labels, links, and Markdown checks pass |
| 3 | Reconcile architecture and development guides with generated facts | T02 | P0 | Verified | Architecture/development review plus `check:repo-contracts` |
| 4 | Reconcile deployment and docs-site setup claims with supported modes | T02 | P0 | Verified | Deployment/docs-site review, build, and local-link checks pass |
| 5 | Add a stale-fact scan for maintained documentation | T02 | P0 | Verified | `npm run check:doc-facts` fails on changed facts |
| 6 | Scan maintained docs for superseded roadmap archive references | T03 | P0 | Verified | `npm run check:roadmap-priorities` |
| 7 | Replace remaining sprint-language references with stable roadmap links | T03 | P0 | Verified | User-facing legacy reference removed; historical delivery records remain intentionally preserved |
| 8 | Add roadmap-priority validation to repository contracts | T03 | P0 | Verified | `npm run check:repo-contracts` |
| 9 | Record the layered product boundary decision | T04 | P0 | Verified | ADR-0016 is accepted and indexed |
| 10 | Link the product boundary from public capability claims | T04 | P0 | Verified | README and docs-site links pass |
| 11 | Define support consequences for PWA, Worker, MCP, widgets, and package | T04 | P0 | Verified | ADR-0016 consequences are explicit |
| 12 | Add a review trigger for boundary changes | T04 | P0 | Verified | ADR ownership and review metadata exist |
| 13 | Publish shipped, preview, package-only, dormant, and blocked classifications | T05 | P0 | Verified | `docs/CAPABILITY_MATRIX.md` exists |
| 14 | Link the capability matrix from README and docs-site entry points | T05 | P0 | Verified | Link and docs checks pass |
| 15 | Add route and package changes to the matrix review checklist | T05 | P0 | Verified | Ownership and contributor docs agree |
| 16 | Audit provider keys, Cloudflare credentials, and proxy handling | S03 | P0 | Verified | `docs/SECRET_LIFECYCLE.md` and secret scan pass |
| 17 | Remove organization-specific proxy assumptions from runtime configuration | S03 | P0 | Verified | Fork configuration check rejects embedded proxy URLs and credentials |
| 18 | Verify browser bundles contain no provider secrets or proxy credentials | S03 | P0 | Verified | Build artifact secret scan passes |
| 19 | Document rotation and revocation evidence for provider credentials | S03 | P0 | Verified | Secret lifecycle rotation procedure exists |
| 20 | Add a clean-fork configuration smoke check | S03 | P0 | Verified | `npm run check:fork-config` passes without organization-specific values |
| 21 | Generate a current hard-orphan inventory | A01 | P0 | Verified | `npm run check:reachability` |
| 22 | Assign disposition, owner, and review date to every hard orphan | A01 | P0 | Verified | `docs/ORPHAN_DISPOSITION.md` |
| 23 | Wire the persisted layout preset consumer | A02 | P0 | Verified | Active preset restoration preserves saved section order and unknown sections; consumer and core tests pass |
| 24 | Merge or compatibility-route the card error-boundary implementation | A02 | P0 | Verified | Boundary unit tests and reachability pass |
| 25 | Promote or explicitly defer plugin contract modules | A02 | P0 | Verified | Explicit experimental deferment, owner/review date, and focused contract tests |
| 26 | Run strict layer analysis on every source boundary | A04 | P0 | Verified | `node scripts/arch-check.mjs --strict` |
| 27 | Package the domain layer without DOM or application imports | A04 | P0 | Verified | Domain package build passes with portable root and explicit browser subpath; purity and package contract tests pass |
| 28 | Remove named architecture compatibility exceptions where possible | A04 | P0 | Verified | `node scripts/arch-check.mjs --strict` passes with no named domain compatibility exceptions |
| 29 | Add a domain purity regression test to CI | A04 | P0 | Verified | Node-project regression test executes `scripts/check-domain-purity.mjs`; repository contracts also run the checker |
| 30 | Keep quote and chart responses on the versioned envelope | D02 | P0 | Verified | Worker envelope and route tests pass |
| 31 | Make the core Worker-first chart fallback unwrap envelope data | D02 | P0 | Verified | Data-service fallback tests pass |
| 32 | Add envelope contract fixtures for cached, stale, demo, and partial states | D02 | P0 | Verified | Shared typed fixtures and parameterized unit tests cover cached, stale, demo, and partial states |
| 33 | Migrate fundamentals, news, and derived outputs to the envelope | D02 | P0 | Verified | Fundamentals, news, sentiment, screener, and portfolio analytics route tests pass with canonical envelopes |
| 34 | Export the envelope from browser, Worker, MCP, and package barrels | D02 | P0 | Verified | Cross-surface consumer test, MCP build, domain package build, and public-export checks pass |
| 35 | Make Worker-first routing explicit in production configuration | D05 | P0 | Verified | Shared Worker URL policy drives Vite, data-service, and API client; CI, dev proxy, and override tests pass |
| 36 | Make provider fallback order and degraded states observable | D05 | P0 | Verified | Provider-chain tests assert selected source, ordered attempts, fallback, degraded state, and warnings |
| 37 | Replace hardcoded proxy assumptions with fork configuration | D05 | P0 | Verified | `npm run check:fork-config` passes; runtime proxy and credential assumptions remain environment-configurable |
| 38 | Add no-network tests for Yahoo failure to Worker fallback | D05 | P0 | Verified | Worker quote fallback tests stub Yahoo failure, assert fallback provenance, and cover the all-provider 502 path |
| 39 | Define the primary journey acceptance matrix | U01 | P0 | Verified | `docs/PRIMARY-JOURNEY.md` lists discover, inspect, signal, risk, save, and share cases with observable outcomes and test owners |
| 40 | Test symbol discovery and watchlist insertion | U01 | P0 | Verified | Playwright watchlist flow passes |
| 41 | Test chart inspection after symbol selection | U01 | P0 | Verified | E2E chart route test observes the explicit no-data state when Worker and Yahoo routes are unavailable |
| 42 | Test consensus explanation and risk handoff | U01 | P0 | Verified | E2E consensus route asserts the symbol-specific no-data limitation; unit tests cover direction, strength, and method inputs |
| 43 | Test save, reload, and share-state preservation | U01 | P0 | Verified | E2E tests cover watchlist reload persistence and `Shift+S` share-token creation for a chart route |
| 44 | Add mobile coverage for the primary journey | U01 | P0 | Verified | `mobile-responsive.spec.ts` passes all 13 mobile Chromium tests, including route, overflow, touch-target, navigation, and settings checks |
| 45 | Add loading, empty, stale, error, retry, and offline journey states | U02 | P0 | Verified | Offline journey E2E passes; focused state regression set passes 58 tests for retry, empty, error-boundary, offline, and autocomplete fallback behavior |
| 46 | Verify all supported card routes round-trip through the router | U01 | P0 | Verified | Registry/router guard passes |
| 47 | Run browser-mode envelope fixtures in Chromium | D02 | P0 | Verified | Browser-mode envelope fixtures pass across Chromium, Firefox, and WebKit for cached, stale, demo, and partial states |
| 48 | Add production smoke checks for shell, quote, chart, search, and Worker | P03 | P0 | Blocked | Requires deployed Worker and credentials |
| 49 | Add scheduled health probes and bounded outage alerts | P06 | P1 | Blocked | Requires production deployment and alert destination |
| 50 | Capture external-user evidence for five primary journeys | T06/U01 | P1 | Blocked | Requires recruited testers and consented findings |

## Immediate Development Batch

The first unblocked implementation batch is ranks 2-4, 7, 10, 14-15, 17-18,
23-25, 27-29, 32, 34-38, and 39-45. Ranks 1, 5, 6, 8-9, 11-13, 16, 19,
21-22, 26, 30-31, 40, and 46 are already verified by the current repository
checks. Ranks 20, 29, 33, 37, and 45 require earlier tasks in this list.

## Verification Commands

```powershell
npm run typecheck
npm run lint
npm run check:repo-contracts
npm run check:api-types
npm test
npm run test:coverage
npm run build:only
npm run check:bundle
```

Deployment, browser, package, security, and external-user tasks require their
additional target-environment evidence before they can be marked complete.
