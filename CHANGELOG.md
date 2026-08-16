# 📜 Changelog

All notable changes to CrossTide are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

**Legend:** ✨ Added · 🔄 Changed · 🐛 Fixed · 🗑️ Removed · 🔒 Security · ⚠️ Deprecated

---

## [Unreleased]

### 🔄 Changed

- **Roadmap sprint status updated:** the next 25 planned roadmap items are tracked as the active implementation batch in `docs/ROADMAP.md`, with deployment, data-quality, locale, and performance work explicitly called out as the current delivery focus. `docs/SPRINT-50.md` was merged into `docs/ROADMAP.md` for a single roadmap/sprint source of truth.
- **Docs status kept consistent:** the active roadmap status in `docs/ROADMAP.md` now reflects the same sprint batch and keeps verified vs blocked work separated by evidence rather than by assumption.

### ✨ Added

- **OHLCV validation now detects consecutive-day duplicate candles** (roadmap D06): `validateOhlcv` previously only rejected duplicate _dates_, so a provider that repeated the same OHLCV values under a new date (a known corruption pattern) passed silently. It now flags a `duplicate-candle` issue when two consecutive candles share identical open/high/low/close/volume with different dates, with a focused test covering the case.
- **Domain alert results now expose the value that triggered them** (roadmap D08): `FiredAlert` carried a description string but no underlying metric, so a fired alert could not be audited against its source data. It now carries `evaluatedValue` — the close price for method-signal alerts and the consensus strength ratio for consensus alerts — matching the explainability pattern already used by `ConsensusExplanation`.
- **Backtest results now carry run metadata** (roadmap D07/D08): `runBacktest` returned trades and metrics with no record of which methods, window size, sizing mode, or date range were actually evaluated. `BacktestResult` now includes a `BacktestExplanation` — methods, window size, evaluated date range, sizing mode, and whether commission/slippage was applied — so a backtest can be audited without re-reading the config that produced it.
- **OHLCV gap detection is now exchange-calendar aware** (roadmap D06): a plain calendar-day gap threshold treats every Friday-to-Monday transition as a 3-day gap, so a strict threshold flagged ordinary weekends as data-quality issues. `validateOhlcv` now accepts an optional `exchange` and, when given, counts only missed _trading_ days on that exchange's calendar — weekend-only gaps are no longer misflagged, while a gap that actually skips a trading session is still caught.
- **Screener fundamental filters are now explainable** (roadmap D08): `matchesFundamentalFilters` only ever returned a boolean, so a user could not see _why_ a ticker was included or excluded from screener results. The new `explainFundamentalFilters` reports which supplied constraints matched, failed, or were skipped due to missing data, without changing the existing boolean function's hot-path behavior or signature.
- **The `Shift+S` share link now restores the selected ticker** (roadmap U04): `readCurrentUrlState` already restored `selectedTickerStore` from a shared URL's `symbol` field on load, but the share-link action never wrote that field — a link shared from a route with no `:symbol` path segment (e.g. `/risk`) reopened with no ticker context at all. Both the command-palette action and the `Shift+S` shortcut now read the current route's `symbol` param, falling back to the globally selected ticker, and include it in the encoded share state. Covered by an updated Playwright test that decodes the share token and asserts the restored symbol.
- **Chart drawings are now shareable** (roadmap U04): the previously-unwired `encodeDrawingsUrl`/`decodeDrawingsUrl` helpers in `share-state.ts` are now wired to a "Share Drawings" toolbar button on the chart card, and a matching share link for the same ticker restores the drawings on load.

### 🐛 Fixed

- **The chart toolbar (timeframe, Heikin-Ashi, export, and share-drawings buttons) never actually persisted.** `renderChart()` calls `patchDOM(container, ...)` directly on the same `container` element the toolbar was prepended into; `patchDOM`'s `childrenOnly: true` morphdom reconciliation removes any child not present in the new HTML, so the toolbar was wiped out synchronously on the very first render — before `mount()` even returned. The bug was invisible because no test asserted the toolbar persisted (only `run-backtest`, appended _after_ the wipe, was checked). Chart rendering now targets a dedicated `.chart-content` child element, a sibling of the toolbar, so patching the chart body can never remove it. Covered by a new Playwright regression test and 12 chart-card unit tests.

## [11.44.6] — 2026-08-12

### 🔄 Changed

- **Release quality:** heatmap keyboard and mobile activation, card lifecycle disposal, performance-budget observability, documentation facts, and formatting are now covered by the release gates.
- **Toolchain audit:** direct dependencies were checked against live npm metadata; the installed versions are current, while npm audit still reports unresolved upstream range advisories.

## [11.44.5] — 2026-08-12

### 🔄 Changed

- **Release quality and roadmap delivery advanced:** card lifecycle disposal, active-locale formatting, typed performance budgets, truthful capability documentation, deterministic replay coverage, and the reachable-coverage ratchet are now verified by the repository gates.

## [11.44.4] — 2026-08-10

### 🔄 Changed

- **Sprint delivery completed:** deterministic CI tools, scanner policies, workflow documentation, and configuration placement rules are now documented and enforced.

## [11.44.3] — 2026-08-02

### 🔄 Changed

- **Release documentation now distinguishes shipped hosting from blocked infrastructure.** GitHub Pages is publicly deployed and verified; Cloudflare Worker/Pages production remains blocked on Cloudflare authentication and placeholder KV/D1 bindings. The roadmap and release metadata now describe that state consistently.

## [11.44.2] — 2026-08-02

### 🐛 Fixed

- **`check:api-types` could fail on a green build with zero API changes.** `scripts/gen-openapi-client.mjs` stamped the generated `src/core/api-types.ts` header with `new Date().toISOString()`, so `npm run ci` regenerated a file that differed from the committed one by exactly one line — the date — on any day after the last regeneration, independent of whether the OpenAPI spec had changed. The banner no longer embeds a generation date; provenance is carried by the `Source: worker/routes/openapi.ts` line alone, and the check is now idempotent across days.

## [11.44.1] — 2026-07-31

> **Sprint: Test Performance, Deterministic CI, Toolchain Integration & WCAG 2.2 AA**

### 🔄 Changed

- **Release gating no longer fails on whitespace-only OpenAPI type drift.** `scripts/gen-openapi-client.mjs` now formats `src/core/api-types.ts` after generation, so `npm run check:api-types` compares semantic output instead of whichever indentation the generator happened to emit that day.
- **`Publish @crosstide/domain` skips cleanly when publish auth is absent.** The package workflow still runs the full gate set and verifies the tarball, but a missing `NPM_TOKEN` now produces an explicit notice instead of a red ENEEDAUTH run hanging off an otherwise-green release.
- **A CI baseline refresh now asks for `--update-snapshots=all`.** Dispatching the workflow with `update_snapshots=true` passed the bare flag, which does not force a rewrite — the job succeeded and uploaded an artifact byte-identical to the committed baselines, so the refresh silently no-opped and stale images kept passing. All 19 Linux baselines have since been regenerated and every one of them differs from its predecessor, which is the confirmation the earlier run could never produce.
- **`.github/CONTRIBUTING.md` describes the gates that actually run.** It told contributors to format with Prettier — the repo uses Biome, which does not touch markdown at all — and listed six gates where `npm run ci` runs ten. It now covers `audit:headers`, `check:contrast`, `check:api-types` and `arch-check`, states the Vitest two-project split that decides whether a new test gets DOM globals, links the three `good first issue` entries, and records the E2E traps that have each cost this project a CI cycle: a bare `waitForLoadState` racing the bootstrap, a hardcoded iteration budget, and locally generated `*-win32.png` baselines that CI never validates.
- **`tests/unit/a11y-audit.test.ts` asserts applied CSS, not file text.** Every assertion was previously a `toContain` against the stylesheet's source, which is why it stayed green for releases while the stylesheet reached no browser. It now parses with `postcss` — happy-dom's CSSOM silently drops rules nested inside `@layer` and returns `undefined` for custom properties — and includes a regression guard that fails if any file under `src/styles/` is missing from `index.html`.
- **Unit test suite is 38% faster** (259s → 159s): Vitest now runs as two projects. The 313 DOM-free suites (`domain`, `worker`, `providers`, `types`, `helpers`) execute on the `node` environment instead of paying happy-dom construction, cutting total environment time from 996s to 441s. Suites needing browser globals declare `@vitest-environment happy-dom` per file.
- **ESLint is cached** (`node_modules/.cache/eslint/`): 37.7s → 3.4s on re-run, which is the gate the pre-commit hook and inner dev loop hit most. `lint:nocache` forces a full pass.
- **`npm run ci` no longer typechecks twice**: it now calls `build:only`, since `typecheck` already ran earlier in the same pipeline.
- **CI uses installed binaries instead of `npx`**: workflow steps now call `./node_modules/.bin/*` for `vite`, `playwright`, `commitlint`, and `wrangler`. Remaining `npx` calls are only for tools deliberately fetched from the registry (`@lhci/cli`, `cyclonedx`, `license-checker`, `oxlint`, `serve`, `asc`).
- **Local scripts and git hooks drop `npx`**, resolving `commitlint`/`lint-staged` straight from `node_modules/.bin`.
- **Roadmap E21 widget follow-up is now merged and CI-verified on `main`.** The quote and consensus embeddable elements plus the out-of-app host-page smoke test shipped in commit `08f4f9b`, and CI run `30557395874` completed green across lint/build, Lighthouse, worker health and Playwright E2E.
- **P10 dependency/runtime surface audit is now tracked with explicit outcomes.** A no-`rg` PowerShell scan over `src/`, `worker/`, `scripts/`, `mcp-server/`, `packages/`, `docs-site/` and root configs identified one likely runtime candidate (`lit-html`) and mobile packaging dependencies (`@capacitor/*`) that require keep/remove decisions based on native packaging scope; docs now reflect the active card/indicator counts discovered during the same pass.

### ✨ Added

- **Embeddable widget surface expanded beyond charts** (roadmap E21): `src/ui/widget.ts` now auto-registers `crosstide-quote` (Worker `GET /api/quote/:symbol`) and `crosstide-consensus` (Worker `POST /api/screener`) alongside `crosstide-chart`, so third-party pages can embed a compact price tape and consensus badge without loading the app shell. `tests/unit/ui/widget.test.ts` now asserts all three element contracts and endpoint wiring, and `tests/e2e/widget-embed.spec.ts` adds a host-page smoke test using `page.setContent` to prove the widgets boot in a plain document context.
- **Embeddable chart widgets now ship as a real build artifact** (roadmap E21): `vite.widget.config.ts` emits a stable `dist/widget.mjs` bundle from `src/ui/widget.ts`, so a third-party page can import CrossTide with a single `<script type="module">` tag and mount `<crosstide-chart>` without pulling in the whole app shell. The widget now calls the production Worker `/api/chart` endpoint rather than a dev-only Yahoo proxy, its surface gained a `range` attribute so the embed snippet matches the chart API instead of hardcoding one timespan, `tests/unit/ui/widget-bundle.test.ts` guards the build contract, and `docs-site/src/content/docs/widgets.mdx` documents the embed flow outside the app README.
- **`@crosstide/domain` is a buildable, publishable package** (roadmap E20): `packages/domain/` bundles `src/domain` into a single side-effect-free ESM artifact with 688 exports and zero runtime dependencies, verified by importing the built file in bare Node. `.github/workflows/publish-domain.yml` runs the full gate set, asserts the tarball declares no dependencies and contains `dist/index.js`, and publishes with npm provenance. Publishing needs an `NPM_TOKEN` secret with rights on the `@crosstide` scope.
- **The MCP tool manifest is typed and enforced** (roadmap E3): the server advertised a JSON Schema per tool but never applied it, reaching into the raw argument bag with casts like `args.indicators as string[]`. A client that ignored the schema got a `TypeError` from `.join`, or a request to `/api/quote/undefined`; `run_screener` relayed the entire argument bag upstream. `mcp-server/src/tool-manifest.ts` now pairs every tool with a Valibot schema and the Worker route it calls, symbols are constrained before being interpolated into a URL path, and only declared fields are forwarded. The package had no tests at all — `tests/unit/mcp/tool-manifest.test.ts` adds 15, including a check that every route the tools call is really registered by the Worker.
- **The OpenAPI document is an enforced contract** (roadmap E2): `worker/routes/openapi.ts` described 8 of the Worker's 56 routes, and because `scripts/gen-openapi-client.mjs` derives `src/core/api-types.ts` from it, 48 routes were also missing from the generated client. The only guard was a checkbox in the pre-release checklist. `tests/unit/worker/openapi-drift.test.ts` now parses the Hono route table out of `worker/index.ts` and fails when a registered route is undocumented, when the spec describes a route that does not exist, or when the shrinking `KNOWN_GAP` backlog goes stale. Eleven routes were documented in the same change — quote, batch quotes, fundamentals, earnings, crypto, forex, seasonality, market breadth, news sentiment, portfolio rebalance and migration status — taking the generated client from 7 to 11 schemas and 19 operations. `npm run check:api-types` joins `npm run ci`, so a spec edit that is not reflected in the committed types fails the pipeline. The remaining 29 routes are tracked in [#105](https://github.com/RajwanYair/CrossTide/issues/105).
- **OpenAPI backlog burn-down advanced by a second 10-route tranche** (roadmap E2): `worker/routes/openapi.ts` now also documents `GET /api/dividends/{symbol}`, `GET /api/insiders/{symbol}`, `GET /api/etf/{symbol}/holdings`, `GET /api/regime`, `GET /api/anomaly`, `GET /api/archive`, `GET /api/archive/{ticker}`, `GET /api/alpaca/quote/{symbol}`, `GET /api/alpaca/bars/{symbol}` and `POST /api/portfolio/analytics`. `tests/unit/worker/openapi-drift.test.ts` was updated to shrink `KNOWN_GAP` again, and regenerated `src/core/api-types.ts` now exposes 39 typed route operations. Remaining undocumented routes in [#105](https://github.com/RajwanYair/CrossTide/issues/105): 17.
- **Auth, BYOK and sync routes now carry explicit OpenAPI security blocks** (roadmap E2-19): `worker/routes/openapi.ts` now documents `GET /api/auth/challenge`, `POST /api/auth/register`, `POST /api/auth/authenticate`, `GET/PUT /api/sync`, `GET/POST /api/keys`, `GET /api/keys/get`, and `DELETE /api/keys/{id}` with route-level `security` metadata plus `CredentialHeader` and `CredentialIdQuery` security schemes. `tests/unit/worker/openapi-drift.test.ts` was ratcheted again and generated `src/core/api-types.ts` now exposes 48 typed route operations. Remaining undocumented routes in [#105](https://github.com/RajwanYair/CrossTide/issues/105): 8.
- **OpenAPI route coverage reached full parity with the Worker** (roadmap E2-18): `worker/routes/openapi.ts` now documents the final 8 previously uncovered routes — `POST /api/monte-carlo`, `POST /api/pairs`, `POST /api/factor-model`, `POST /api/fundamentals/batch`, `POST /api/signal-dsl/execute-script`, `POST /api/csp-report`, `GET /api/ws/{symbol}`, and `GET /favicon.ico`. `tests/unit/worker/openapi-drift.test.ts` now carries an empty `KNOWN_GAP` ratchet, and regenerated `src/core/api-types.ts` now exposes 56 typed route operations for the 56 registered Worker routes.
- **The domain barrel is complete** (roadmap P10): 51 of 221 modules under `src/domain/` — 23% of the layer, every one with tests — were absent from `src/domain/index.ts` and imported by no card, so they were dead at runtime and would have been missing from the `@crosstide/domain` package that roadmap E20 publishes. Among them: Hawkes processes, Kalman filters, copulas, Granger causality, Ornstein-Uhlenbeck, changepoint detection, tail-risk and tail-index estimators, and jump-diffusion. `tests/unit/domain/barrel-completeness.test.ts` now fails in both directions — a new module without a barrel entry, and a barrel entry without a module. The gzipped bundle is unchanged at 212.3 KB, so tree-shaking is unaffected.
- **Enhanced-contrast mode is reachable** (WCAG 2.2 SC 1.4.6, AAA): a _Settings → Enhanced contrast_ toggle sets `data-contrast="aaa"` on `<html>`, activating the AAA palette that had been defined in `a11y.css` but never switched on by anything. Backed by `src/core/contrast-preference.ts`, persisted in `localStorage` and restored at boot before first paint.
- **`tests/helpers/node-network.ts`**: network guard for the `node` project mirroring the happy-dom interceptor, so DOM-free suites fail fast on unstubbed outbound requests instead of performing real DNS lookups.
- **`test:fast` script** for opting into the threads pool during local iteration.
- **`build:only` and `lint:nocache` scripts** for pipeline and cache-bypass control.
- **Copilot Chat test generation is wired to `tests.instructions.md`**, so generated tests land in the correct Vitest project instead of failing on missing DOM globals. PR-description instructions, coverage-gutters paths, and a wider safe-command auto-approve list were added alongside.
- **`audit:headers` gate** (`scripts/audit-file-headers.mjs`, wired into `lint:all`): every file under `src/`, `worker/` and `scripts/` must open with a `/** … */` docblock. Coverage is now 592/592 (100%). A leading one-line summary lets an assistant identify a file's purpose without parsing its body.
- **E2E card-matrix drift guard**: `tests/unit/cards/registry.test.ts` parses `tests/e2e/cards.spec.ts` and fails in both directions — a newly registered card cannot ship without an E2E entry, and a removed card cannot leave a stale one.
- **Linux visual-regression baselines** committed to `tests/e2e/visual.spec.ts-snapshots/`. They had never been generated, so all 17 snapshot assertions failed with "a snapshot doesn't exist" on every CI run.
- **Three new in-repo AI skills** (roadmap E19): `add-card`, `add-indicator` and `onboard-contributor`, bringing the skill set to nine.

### 🐛 Fixed

- **Three modules in the "100% pure" domain layer imported outward, and `arch-check` was configured not to notice.** `domain->core` and `domain->cards` sat on its `ALLOWED_CROSS_LAYER` allowlist with the comment "domain modules use core fetch/encoding utilities", which blanket-permitted exactly what the layer rule exists to forbid: `fundamental-data.ts` called core's `fetchWithTimeout` and read `import.meta.env`, `watchlist-share.ts` imported core's base64 helpers, and `heatmap-drilldown.ts` imported a type from a card. `fundamental-data.ts` moved to `src/providers/`, where a Yahoo quoteSummary adapter belongs; `base64-url.ts` moved down into `src/domain/` because it is pure and runtime-agnostic; `ConstituentStock` moved to `src/types/domain.ts`; and both allowlist entries are gone. `tests/unit/domain/package-manifest.test.ts` now walks every file in the layer and fails on any relative import that escapes it, so the allowlist cannot quietly widen again. Found only because packaging the layer for npm forced the compiler to follow every import out of it.
- **Eleven design tokens failed WCAG AA contrast, and the checker that was supposed to catch them never ran.** Making the light theme reachable exposed contrast defects that had been unobservable: light `--text-muted` was `#8b949e` at 2.79:1, `--danger` was never overridden for light so `.btn-danger` rendered the dark-theme red at 3.04:1, `--signal-neutral` was inherited at 2.79:1, and `.filter-chip.active` put `#000` on the light accent at 4.04:1. The dark theme was not clean either — `--text-muted` on `--bg-card-hover` was 4.34:1. `scripts/check-contrast.mjs` missed all of it twice over: it carried a hand-maintained copy of the palette rather than reading `tokens.css`, `--text-muted` was absent from that copy entirely, and `check:contrast` was defined in `package.json` but wired into neither `ci` nor `lint:all`. It now parses the real tokens with postcss, checks all 160 combinations across dark, light and both AAA variants, and runs as part of `lint:all`.
- **Rules that place text on `var(--accent)`** hardcoded `#000` or `#fff`, which can only be correct for one theme. They now use `var(--bg-app)`, matching what `.preset-btn.active` already did — 7.49:1 on the dark accent, 4.87:1 on the light one.
- **`/api/market-breadth` was documented as `GET`** in the workspace endpoint table; it is a `POST`. Found by the new contract guard.
- **Three axe scans in `app.spec.ts` ran before the app had booted**, waiting only for `domcontentloaded` while every other accessibility spec waits for `waitForAppReady`. They sampled a half-themed page — surfaces already flipped to the light palette while the 150ms color transition on `.nav-link` still held dark-theme values — and reported contrast failures that do not exist in either finished theme.
- **The keyboard focus E2E test budgeted a fixed 10 backward tab stops**, which passed locally and failed in CI where the dashboard had fetched its data and rendered more buttons ahead of the header. The budget is now derived from the number of focusable elements in the document, which is what the test's own comment asked for.
- **The app ignored the OS colour scheme on a first visit.** `src/ui/auto-theme-sync.ts` — which watches `prefers-color-scheme` and `prefers-contrast` — was imported by nothing, and `initTheme(config.theme)` passed a value that defaults to `"dark"`, so `detectPreferredTheme()` was unreachable. The theme now follows the OS until a choice is made in _Settings_, which writes an override that stops the sync. Visitors who had already chosen a theme are migrated to that override on first load, so their choice is preserved.
- **The accessibility stylesheet never shipped** (roadmap Q6): `src/styles/a11y.css` was not linked from `index.html`, so `.skip-link`, `.sr-only` and `.btn-icon` appeared in the markup with no rule behind them. The "Skip to main content" link rendered permanently visible at the top of every page, the `<th>Actions</th>` label and the onboarding live region were painted on screen instead of being screen-reader-only, and icon-only buttons had no target sizing. The file is now linked and `a11y` is declared last in the `@layer` order in `tokens.css`. Its blanket 2.75rem target-size rule was narrowed to the SC 2.5.8 floor of 1.5rem on controls only, so inline prose links keep their natural box, and an invalid `aria-hidden` CSS declaration was removed.
- **WCAG 2.2 AA contrast and target-size violations** across `/alerts`, `/multi-chart`, `/macro-dashboard` and `/heatmap`. Heatmap tiles carried white text on `#4caf50` (2.5–3.6:1), signal badges rendered the raw signal color on a 20%-tinted background (4.0–4.1:1), the active multi-chart layout button used `#3b82f6` (3.7:1), and `<summary>` laid out at 21px against the 24px target-size floor. Badges now blend the signal color away from the surface via `--badge-fg-blend`, so they keep following the color-blind palette swaps. The audit passes on all 23 routes.
- **Horizontal page overflow on mobile**: the market-hours exchange list forced `document.body.scrollWidth` to 586px at a 375px viewport. `.market-indicator` and `.market-exchanges` now wrap.
- **Astro docs build in CI**: `npx astro build` could fetch a fresh Astro from the registry, which then resolved a CommonJS `cookie` and failed with `Named export 'parseCookie' not found`. Both `pages.yml` and `docs.yml` now build via `npm run build --workspace docs-site`, using the lockfile-pinned `astro@7.1.5` / `cookie@2.0.1`.
- **Flaky virtual-scroller load test**: the 10K/50K row wall-clock budget assertions now retry, so scheduler jitter under the parallel suite cannot fail CI.
- **Markdownlint CI blocker**: hard tabs removed from `.github/copilot-instructions.md`. This gate had been aborting the pipeline before the Playwright E2E job ran, so the E2E failures below were reported as "skipped" rather than failing.
- **Playwright E2E web server**: `playwright.config.ts` launched the dev server with `npx vite`, which could resolve a different Vite from the registry and fail the run. It now uses `npm run dev -- --port 4173`.
- **Two incorrect E2E test assumptions**. `goToRoute` in `visual.spec.ts` clicked a sidebar link that reports `visible: true` but is parked off-canvas at `translateX(-220px)`, so the click hung until timeout; it now checks the bounding box against the viewport. The `focus-visible` cross-browser test tabbed _forward_ from a position the router had already moved into `<main>`, so it could never reach the header — it now walks backwards with `Shift+Tab` and additionally asserts `:focus-visible` matches.
- **Vacuous E2E readiness guard** in 12 places across 6 spec files. `document.getElementById("app-version")?.textContent !== ""` returns `true` when the element does not exist yet, so the wait resolved immediately and tests raced the app bootstrap — dropping early input such as the `/` shortcut before its keydown listener was attached. Replaced with a shared `waitForAppReady` helper that requires the element to exist and carry a non-empty value.

### 🗑️ Removed

- **`src/styles/fonts.css`**: every `@font-face` in it pointed at `/fonts/*.woff2`, a directory that does not exist in `public/`. It was superseded by the `@fontsource-variable/inter` import in `src/main.ts` and, being unlinked from `index.html`, had no runtime effect either way.
- **Duplicate issue templates** `bug_report.md` and `feature_request.md`, superseded by the richer YAML forms.

---

## [11.44.0] — 2026-07-29

> **Provider Resilience, Shared Ticker Navigation & PWA Updates**

### ✨ Added

- **Open provider fallbacks**: added server-side Massive and Alpha Vantage equity adapters plus Frankfurter reference-rate forex fallback, with KV-aware quote/chart chains, provider health reporting, BYOK compatibility, and contract tests.
- **Shared ticker navigation**: watchlist selection now follows the selected ticker across symbol-aware cards and routes, including Consensus and Strategy views.
- **Copilot workspace integration**: expanded project agents, skills, prompts, MCP configuration, and workspace tooling for provider, deployment, compatibility, domain, and quality workflows.

### 🐛 Fixed

- **Ticker entry and tracking**: repaired autocomplete submission, ticker persistence, route registration, and shared ticker snapshots so symbols can be added, selected, and analyzed reliably.
- **PWA update refresh**: the waiting service worker now handles `SKIP_WAITING`; the update banner waits for `controllerchange` before reloading, preventing Refresh from silently retaining the old GitHub Pages version.
- **Provider failover semantics**: provider-specific 404 responses no longer terminate quote/chart fallback chains before another provider can resolve the symbol.

### 🔄 Changed

- **Browser data resilience**: the watchlist data service now falls back to the Worker chart chain when direct Yahoo access fails while rejecting synthetic demo candles as live data.
- **Release workflow**: tag releases now use Node 24 and run the canonical CI, architecture, contrast, audit, Workbox build, SBOM, provenance, and artifact publication path.

---

## [11.43.1] — 2026-07-26

> **Sprint: CI Stabilization & Discoverability** (17 commits — workflow
> fixes, GitHub Pages deploy conflict resolved, repo keywords/topics
> synced, `Stock200Alert` legacy naming fully removed, docs enriched with
> emoji/Mermaid, dependency security patch)

### 🔄 Changed

- **Docs refresh**: `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, and setup
  docs enriched with emoji headings, Mermaid diagrams, and a new banner
  asset (`docs/assets/banner.svg`) for a more engaging read.
- **GitHub discoverability**: repository topics synced 1:1 with
  `package.json` keywords; all remaining `Stock200Alert` legacy project
  name references removed from docs and repo metadata.
- **Dev dependencies**: bumped Astro, Vitest, and TypeScript across
  workspaces; Docker base image bumped to `node:24-slim`.

### 🐛 Fixed

- **GitHub Pages deploy conflict**: merged competing `pages.yml`/`docs.yml`
  workflows so the docs site deploys the intended content instead of being
  overwritten by a stale build.
- **Worker durable object export**: re-exported `TickerFanout` from the
  worker entrypoint so Cloudflare can bind the Durable Object correctly.
- **CI workflow stabilization**: fixed gitleaks config wiring and a
  Finnhub type-name false positive, added fail-fast diagnostics to the
  worker health check, fixed `smoke.yml` secrets context and docs Node
  version, pinned GitHub Actions to latest majors, reduced secrets-scan
  false positives, relaxed Lighthouse perf thresholds, fixed `arch-check`
  cross-layer import allowlist, removed an invalid `manualChunks` entry,
  and aligned the bundle perf budget to 250 KB gzip.

### 🔒 Security

- **`brace-expansion`**: patched to 5.0.8 — resolves a high-severity DoS
  via unbounded expansion length ([GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg)).
- **`valibot`**: patched to 1.4.2 — resolves a moderate-severity issue
  where `record()` issue paths could make `flatten()` throw for inherited
  `Object` property names ([GHSA-5qjj-4xww-7phc](https://github.com/advisories/GHSA-5qjj-4xww-7phc)).

---

## [11.43.0] — 2026-06-02

> **Sprint: Production Readiness Overhaul (ROADMAP v10, workspace cleanup,
> agent infrastructure, quality gate fixes)**

### ✨ Added

- **Deploy ops agent** (`deploy-ops.agent.md`): Cloudflare deployment,
  Docker, CI/CD specialist persona.
- **Perf specialist agent** (`perf-specialist.agent.md`): Bundle, INP, LCP,
  WASM, caching specialist persona.
- **Deploy skill** (`.github/skills/deploy/SKILL.md`): Full CF deployment
  playbook — provisioning, deploy, verify, rollback.
- **Migrate-DB skill** (`.github/skills/migrate-db/SKILL.md`): D1 migration
  workflow — create, apply, verify, conventions.
- **Deploy prompt** (`deploy.prompt.md`): Quick deployment trigger.
- **Perf-audit prompt** (`perf-audit.prompt.md`): Performance audit trigger.
- **GitKraken MCP server** (`.vscode/mcp.json`): Added gitkraken stdio server.

### 🐛 Fixed

- **Alpaca test timeout**: `makeEnv` helper used `??` which didn't distinguish
  "not passed" from "explicitly undefined" — tests hit real network. Fixed with
  object spread pattern.
- **Biome format**: 7 files reformatted to pass `format:check`.
- **Stylelint**: 2 `comment-empty-line-before` errors in layout/responsive CSS.

### 🔄 Changed

- **ROADMAP v10** (`docs/ROADMAP.md`): Complete rewrite — "Production or Bust"
  strategic plan with decision audit, phase breakdown (P–T), and VS Code
  integration strategy.
- **Prettier → Biome** (VS Code): `.vscode/settings.json` and
  `extensions.json` now reference `biomejs.biome` formatter; removed
  `.prettierrc` and `.prettierignore`.
- **Extensions.json**: Added `biomejs.biome`, `eamodio.gitlens`,
  `github.vscode-pull-request-github`; unwanted: `esbenp.prettier-vscode`.
- **Copilot instructions**: Added Skills & Agents reference table.
- **AGENTS.md**: Updated with full Agent Registry table (8 agents).
- **Architecture doc**: Version bump and freshness update.

### 🗑️ Removed

- `.prettierrc`, `.prettierignore` (migrated to Biome).
- `.github/debug.log`, `.github/copilot/debug.log` (should never be committed).

---

## [11.42.0] — 2025-07-22

> **Sprint: Keyboard nav, contributor onboarding, biome, SSG infra
> (5-sprint session)**

### ✨ Added

- **Roving tabindex utility** (Q13): WAI-ARIA keyboard arrow navigation for
  grouped elements; integrated into the sidebar nav.
- **Dev container** (R12): `.devcontainer/devcontainer.json` for GitHub
  Codespaces with pre-configured extensions.
- **Issue templates** (R12): bug report and feature request templates with
  `good first issue` label.
- **SSG ticker pages** (R1): Astro dynamic route generating static SEO landing
  pages for top 500 S&P tickers with structured data.
- **Mutation test script**: `npm run test:mutate` runs Stryker on domain layer.

### 🔄 Changed

- **Biome formatter** (RF11): replaced Prettier with Biome 2.4 for formatting
  (100× faster). ESLint retained for linting. lint-staged updated.
- **README tech stack**: updated to reflect Biome replacing Prettier.
- **CONTRIBUTING.md**: added dev container section, Codespaces badge, and good
  first issues guide.

---

## [11.41.0] — 2026-05-13

> **Sprint: DSL Loops, Multi-Timeframe Sync, AAA Accessibility, Mobile UX
> (10-sprint session)** (commits `620a557`–`1a875b4`)

### ✨ Added

- **DSL expansion** (R1): `for..in..do` loops and `let` bindings for custom
  indicators in the signal DSL runtime.
- **Multi-timeframe analysis panel** (R2): range sync and confluence detection
  across daily, weekly, and monthly timeframes.
- **WCAG 2.2 AAA utilities** (R4): enhanced contrast (7:1), target size audit,
  timing controls, error prevention dialogs, reading level estimator.
- **Mobile-first UX** (R10): swipe detection, pull-to-refresh, edge-swipe
  drawer, and orientation helpers.
- **Embeddable `<crosstide-chart>` web component** (T9): standalone chart
  element for third-party embedding.
- **Plugin API** (T1): indicator, chart-type, and data-source plugin contracts.
- **Plugin integrity** (T4): SHA-256 manifest verification for plugins.
- **AI disclaimer framework** (S12): consent tracking for AI-powered features.
- **WASM CI workflow** (S13): AssemblyScript build workflow with 200 KB budget.
- **README showcase** (R6): Playwright demo recording infrastructure.

---

## [11.40.0] — 2026-05-13

> **Sprint: Docker Self-Hosting, R2 Archival, Kagi Charts (10-sprint session)**
> (commits `732e037`–`b94106c`)

### ✨ Added

- **Docker Compose self-hosting** (R3): run CrossTide locally with
  `docker compose up` using miniflare.
- **R2 cold OHLCV archival** (Q15): cron-driven archival of top 100 tickers to
  Cloudflare R2.
- **Plausible analytics** (R14): privacy-respecting, cookie-free usage tracking.
- **Auto-generated indicator docs** (R5): 670 functions across 215 domain
  modules documented in `docs/INDICATORS.md`.
- **lit-html rendering adapter** (Q27): thin wrapper (`html`, `renderLit`,
  `classMap`, `repeat`) for complex card templates.
- **Screener load-testing benchmarks** (R7): 10K-ticker fundamental filter
  ~0.9 ms, full pipeline ~23 ms — all under 200 ms target.
- **Stryker mutation testing** (Q14): targeting `src/domain/`, 80/60/50
  thresholds, Vitest runner.
- **Playwright visual regression baselines** (P15): 6 screenshot baselines
  across desktop/mobile/tablet × light/dark.
- **Enhanced perf regression CI** (R8): push trigger, worker path triggers,
  INP metric tracking in PR comments.
- **Kagi chart computation** (Q26): yang/yin weight transitions,
  percentage/absolute thresholds, shoulder/waist tracking (13 tests).

---

## [11.39.0] — 2026-05-12

> **Sprint: Crypto, News, Regime, Anomaly & Fallback Chain (10-sprint session)**
> (commits `6efb6be`–`53b290f`)

### ✨ Added

- **Crypto chart endpoint**: `GET /api/crypto/:id/chart?days=30` — CoinGecko
  OHLC candles with 5-min KV cache.
- **Crypto search endpoint**: `GET /api/crypto/search?q=bitcoin` — CoinGecko
  coin search with 10-min cache.
- **Company news endpoint**: `GET /api/news?ticker=AAPL&days=7` — Finnhub news
  feed with 10-min cache.
- **Market regime endpoint**: `GET /api/regime?ticker=AAPL` — VIX + trend +
  volatility regime detection.
- **Anomaly detection endpoint**: `GET /api/anomaly?ticker=AAPL&period=20` —
  z-score price/volume/gap alerts.
- **Chart data fallback chain**: Yahoo → Finnhub → Stooq → demo data (4-tier).
- **Daily smoke tests** CI: 5 production endpoints, weekdays 07:00 UTC.
- **Data accuracy verification** CI: 10 benchmark tickers vs Yahoo reference,
  daily 21:00 UTC.
- **Provider contract tests**: 24 tests for CoinGecko and FRED schemas.

### 🔄 Changed

- Removed unused `packages/` workspace stubs.
- Moved ONNX modules to `src/domain/_experimental/`.

---

## [11.38.0] — 2026-05-12

> **Sprint: Multi-Provider Architecture (commits `0ac7bc9`–`1565165`)**

### ✨ Added

- **Finnhub provider** (`worker/providers/finnhub.ts`): quote, candle, and
  search endpoints with API key binding.
- **CoinGecko provider** (`worker/providers/coingecko.ts`): quote, OHLC, and
  search endpoints.
- **FRED provider** (`worker/providers/fred.ts`): JSON API with CSV fallback
  for economic data series.
- **Stooq provider** (`worker/providers/stooq.ts`): EOD CSV history for
  international markets.
- **Provider wiring**: all providers routed, env bindings added, FRED KV-put
  bug fixed.
- **Provider health endpoint** (`GET /api/providers/health`): binding status
  for all configured providers.
- **Provider health and quote fallback tests**: unit tests for health endpoint
  and multi-provider quote chain.
- **DSL expansion** (R2): for loops, arrays, index access, and `plot()` in
  signal DSL runtime.
- **WCAG 2.2 AAA utilities** (R8): contrast checking, focus management, target
  size auditing, error suggestion.
- **README showcase** (R12): GIF demo table, expanded comparison section, and
  install-size badge.

---

## [11.37.0] — 2026-06-05

> **Sprint: Phase Q Foundation (7-sprint session)** (commits `2bb2f20`–`4563716`)

### ✨ Added

- **FRED economic data overlay endpoint** (`worker/routes/fred.ts`, Q6):
  `GET /api/fred?series=VIX` — serves CBOE VIX, 10Y/2Y Treasury rates, M2, Fed
  Funds, unemployment, CPI, and yield spread from St. Louis Fed FRED API. Supports
  both alias shortcuts (`vix`, `10y`, `2y`, `m2`, `fedfunds`) and canonical FRED IDs.
  24-hour KV cache; 17 unit tests covering series resolution, CSV parsing, caching,
  and error handling.
- **Yahoo Finance v8 and Finnhub offline contract tests** (`tests/unit/worker/`, Q9):
  49 Vitest tests using frozen fixture payloads to guard against upstream schema drift
  for chart, quote, search, and Finnhub candle/quote/search shapes.
- **Playwright visual regression baselines** (`tests/e2e/visual.spec.ts`, Q10):
  19 `toHaveScreenshot()` tests spanning light/dark/mobile viewports, navigation
  transitions, and Web Component snapshots. Threshold: 20% max pixel ratio.
- **fast-check property test expansion** (`tests/unit/domain/indicator-properties.test.ts`, Q13):
  Added 22 property tests across 6 new indicator suites: ATR (4 tests), MACD (4 tests),
  Stochastic (4 tests), OBV (4 tests), VWAP (3 tests), ADX (4 tests). Tests cover
  length invariants, range bounds ([0,100] for RSI/Stochastic/ADX), finite output,
  and degenerate-input handling (flat candles, constant prices).
- **Temporal polyfill skip-if-present branch tests** (`tests/unit/core/temporal-init.test.ts`, Q16):
  Two new tests explicitly verify the conditional-loading path: native Temporal stub is
  preserved unchanged (`ensureTemporal` is a no-op); polyfill loads and sets
  `globalThis.Temporal` when absent.

### 🔄 Changed

- **GlitchTip source-map upload** (`.github/workflows/release.yml`, P14): Added
  `upload-sourcemaps.mjs` step between build and bundle-size check in the release
  workflow. Uses `GLITCHTIP_DSN` secret with `continue-on-error: true`.
- **README badges**: Added Architecture diagram and FRED API links; updated Macro
  Dashboard card description to reference FRED overlay.
- **ROADMAP Phase Q**: Marked Q6, Q9, Q10, Q13, Q16 ✅. Updated current version to
  v11.37.0.

---

## [11.36.0] — 2026-06-02

> **Sprint: Phase P Foundation (10-sprint session)** (commit `ae7d98c`)

### ✨ Added

- **Cloudflare setup guide** (`docs/CLOUDFLARE_SETUP.md`): step-by-step provisioning
  walkthrough for KV namespace, D1 database, Rate Limiter, and Durable Object bindings.
  Covers local dev, staging, and production environment matrix.
- **Worker dev vars template** (`worker/.dev.vars.example`): copy to `.dev.vars` for
  local `wrangler dev` without real bindings; documents optional Finnhub, GlitchTip,
  and OTEL endpoint vars.
- **D1 migration script** (`scripts/apply-d1-migrations.ps1`): PowerShell script to
  apply all `worker/migrations/*.sql` via `wrangler d1 migrations apply`. Supports
  `-Env staging` flag for environment targeting.
- **Corporate action data in OHLCV** (`worker/providers/yahoo.ts`): `fetchYahooChart`
  now requests `events=div%2Csplit` from Yahoo Finance, attaches `splitFactor` and
  `dividendAmount` to the matching candle date. Exposed in `CandleRecord` API type.
- **Rate-limit unit tests** (`tests/unit/worker/rate-limit.test.ts`): 13 tests covering
  in-memory token-bucket (checkRateLimit), KV-backed fixed-window (checkRateLimitKV),
  and IP header extraction (rateLimitKey).
- **Watchlist-store unit tests** (`tests/unit/core/watchlist-store.test.ts`): 14 tests
  covering addTicker, removeTicker, reorder, setSort toggle logic, setNames merge, and
  setInstrumentTypes.
- **Route-loader unit tests** (`tests/unit/ui/route-loader.test.ts`): 11 tests covering
  reactive loading state, data resolution, error capture, deduplication, AbortController
  cancellation, and onRouteNavigated integration.
- **Error-boundary unit tests** (`tests/unit/ui/error-boundary.test.ts`): 9 tests
  verifying withErrorBoundary and mountWithBoundary isolate card mount/update crashes,
  auto-retry, onError callback, fallback UI, and dynamic-import failure recovery.

### 🔄 Changed

- **ROADMAP Phase P**: P1, P3, P4, P5, P7, P8, P9, P10, P11, P13, P15 marked ✅.
  P2 (D1 migrations apply) marked 🔄 (provisioning docs added; apply requires CF account).
- **YahooCandle interface**: added optional `splitFactor` and `dividendAmount` fields.
- **CandleRecord route type**: added optional `splitFactor` and `dividendAmount` fields.

---

## [11.33.0] - 2026-05-08

### Sprint: Crypto, Forex & Domain Exports (10-item sprint)

#### Added

- **Crypto quote endpoint** (`worker/routes/crypto.ts`):
  `GET /api/crypto/:id` returns cryptocurrency quote data from CoinGecko API
  (price, market cap, volume, ATH, supply), KV cached 2 min.
- **Forex pair endpoint** (`worker/routes/forex.ts`):
  `GET /api/forex/:pair` returns foreign exchange rate, bid/ask, and daily
  change from Yahoo Finance, KV cached 2 min. Pairs use 6-letter format
  (e.g. EURUSD).
- **Seasonality endpoint** (`worker/routes/seasonality.ts`):
  `GET /api/seasonality/:symbol` computes monthly and day-of-week seasonal
  return patterns from 5-year historical data, KV cached 24h.
- **Portfolio rebalance endpoint** (`worker/routes/portfolio-rebalance.ts`):
  `POST /api/portfolio/rebalance` accepts holdings and target allocations,
  returns rebalance trades with drift analysis and buy/sell amounts.
- **Market breadth endpoint** (`worker/routes/market-breadth.ts`):
  `POST /api/market-breadth` accepts symbol list, fetches quotes, and returns
  advance/decline ratio, breadth statistics, and top movers/laggards.
- **Gap scanner barrel export**: `detectGaps`, `unfilledGaps`, `gapUps`,
  `gapDowns`, `gapFillRate`, `largestGaps`, `averageGapSize`, `hasRecentGap`
  now exported from `src/domain/index.ts`.
- **DCA simulator barrel export**: `simulateDca`, `generateDcaSchedule`,
  `dcaVsLumpSum` now exported from `src/domain/index.ts`.
- **Support/resistance barrel export**: `findSwingLows`, `findSwingHighs`,
  `clusterLevels`, `findLevels`, `nearestSupport`, `nearestResistance` now
  exported from `src/domain/index.ts`.
- **Volatility cone barrel export**: `realizedVol`,
  `historicalVolDistribution`, `buildVolatilityCone`, `volPercentileRank`
  now exported from `src/domain/index.ts`.

---

## [11.32.0] - 2026-05-07

### Sprint: Data Endpoints & Risk Analytics (10-item sprint)

#### Added

- **Dividends endpoint** (`worker/routes/dividends.ts`):
  `GET /api/dividends/:symbol` returns 10-year dividend history from Yahoo
  Finance v8 chart API events field, KV cached 24h.
- **Insider transactions domain** (`src/domain/insider-transactions.ts`):
  `analyzeInsiderTransactions(transactions)` computes buy/sell sentiment score
  (-100 to +100), ratios, unique insiders, and largest/most recent transactions.
- **Insiders endpoint** (`worker/routes/insiders.ts`):
  `GET /api/insiders/:symbol` fetches insider trading activity from Yahoo
  quoteSummary, classifies transaction types, KV cached 6h.
- **Market movers endpoint** (`worker/routes/movers.ts`):
  `GET /api/movers` returns top gainers, losers, and most active stocks from
  Yahoo Finance screener API with configurable count, KV cached 5 min.
- **ETF holdings endpoint** (`worker/routes/etf-holdings.ts`):
  `GET /api/etf/:symbol/holdings` returns top holdings, sector weights, and
  fund summary from Yahoo quoteSummary, KV cached 24h.
- **Batch fundamentals endpoint** (`worker/routes/fundamentals-batch.ts`):
  `POST /api/fundamentals/batch` fetches fundamentals for up to 20 symbols in
  one request with per-symbol KV caching and partial failure tolerance.
- **Correlation scanner** (`src/domain/correlation-scanner.ts`):
  `scanCorrelations(priceData, config?)` scans all asset pairs for Pearson
  correlation on daily returns with configurable overlap and threshold filters.
- **Drawdown recovery analysis** (`src/domain/drawdown-recovery.ts`):
  `analyzeRecoveries(values, threshold?)` computes recovery patterns, speeds,
  median/average recovery durations, and recovery rates;
  `estimateRecoveryTime(values, drawdown)` estimates bars to recover.
- **Position risk metrics** (`src/domain/position-risk.ts`):
  `computePositionRisk(position)` calculates stop distance, dollar risk,
  R-multiple, and risk-reward ratio per position;
  `computePortfolioHeat(positions, equity)` aggregates portfolio-level heat.

---

## [11.31.0] - 2026-05-06

### Sprint: Attribution, Valuation & Analytics APIs (10-item sprint)

#### Added

- **Multi-timeframe confluence** (`src/domain/mtf-confluence.ts`):
  `computeMtfConfluence(candles, options?)` evaluates consensus signals across
  daily, weekly, and monthly timeframes with weighted confluence scoring
  (monthly 50%, weekly 30%, daily 20%).
- **Brinson-Fachler performance attribution** (`src/domain/performance-attribution.ts`):
  `computeAttribution(sectors)` decomposes portfolio excess return into
  allocation, selection, and interaction effects per sector.
- **Dividend analytics** (`src/domain/dividend-analytics.ts`):
  `computeDividendSummary(dividends, price)` for yield, CAGR, growth streak;
  `simulateDrip(shares, dividends, prices, endPrice)` for DRIP simulation.
- **Peer valuation comparison** (`src/domain/peer-valuation.ts`):
  `computePeerValuation(target, peers)` compares P/E, P/S, P/B, EV/EBITDA,
  PEG, and dividend yield with z-scores, percentile ranks, and undervaluation
  detection.
- **Economic indicators endpoint** (`worker/routes/economic.ts`):
  `GET /api/economic` returns treasury yields, VIX, dollar index, oil, gold,
  and S&P 500 with 30-minute KV caching.
- **Sector heatmap endpoint** (`worker/routes/sector-heatmap.ts`):
  `GET /api/sector-heatmap` returns 11 GICS sector ETF performance data sorted
  by daily change with 15-minute KV caching.
- **Trade journal analytics** (`src/domain/trade-journal.ts`):
  `analyzeTradeJournal(trades)` computes win rate, profit factor, expectancy,
  R-multiples, best/worst trades, and consecutive win/loss streaks.
- **Risk-adjusted return comparison** (`src/domain/risk-adjusted-comparison.ts`):
  `compareRiskAdjusted(assets, rfRate?)` compares multiple assets on Sharpe,
  Sortino, Calmar ratios, max drawdown, and annualized volatility.
- **Portfolio analytics endpoint** (`worker/routes/portfolio-analytics.ts`):
  `POST /api/portfolio/analytics` accepts holdings, fetches live quotes, and
  returns allocation weights, P&L, and Herfindahl concentration index.

---

## [11.30.0] - 2026-05-05

### Sprint: Portfolio, Volume & Correlation Analytics (10-item sprint)

#### Added

- **Rolling correlation** (`src/domain/rolling-correlation.ts`):
  `computeRollingCorrelation(candlesA, candlesB, options?)` computes sliding-
  window Pearson correlation between two daily return series with configurable
  window size (default 60).
- **Omega ratio** (`src/domain/omega-ratio.ts`): `computeOmega(candles,
options?)` and `omegaFromReturns(returns, threshold?)` — probability-weighted
  gain/loss ratio capturing the full return distribution above/below a
  configurable threshold.
- **Volume-Price Trend (VPT)** (`src/domain/volume-price-trend.ts`):
  `computeVpt(candles, options?)` — cumulative volume-weighted price momentum
  indicator with EMA signal line, more proportional than OBV.
- **Time-Segmented Volume (TSV)** (`src/domain/time-segmented-volume.ts`):
  `computeTsv(candles, options?)` — Worden-style accumulation/distribution
  indicator measuring money flow with configurable lookback and signal period.
- **Maximum Diversification Portfolio** (`src/domain/max-diversification.ts`):
  `maxDiversification(returnSeries, tradingDays?)` — coordinate-descent
  optimizer finding portfolio weights that maximize the diversification ratio
  (weighted avg volatility / portfolio volatility).
- **Worker compare endpoint** (`worker/routes/compare.ts`):
  `GET /api/compare?symbols=AAPL,MSFT&range=1y` returns total return,
  annualized return, volatility, Sharpe, and max drawdown for up to 8 symbols.
- **Worker indicators endpoint** (`worker/routes/indicators.ts`):
  `GET /api/indicators?symbol=AAPL&indicators=rsi,macd&range=1y` computes
  technical indicators server-side for 10 supported indicator types.
- **Adaptive RSI** (`src/domain/adaptive-rsi.ts`):
  `computeAdaptiveRsi(candles, options?)` — RSI with dynamically adjusted
  lookback period using Kaufman efficiency ratio; shortens in trending markets,
  lengthens in choppy conditions.
- **Efficiency Ratio** (`src/domain/efficiency-ratio.ts`):
  `computeEfficiencyRatio(candles, options?)` — Kaufman's price efficiency
  measure (0 = choppy, 1 = trending) used as input for adaptive indicators.

---

## [11.29.0] - 2026-05-05

### Sprint: Analytics, Export & Batch API (10-item sprint)

#### Added

- **Generic table CSV export** (`src/core/table-export.ts`): new core utility
  exports `tableToCsv` (RFC 4180), `copyTableToClipboard` (tab-separated for
  Excel paste), and `copyCellToClipboard` for single-cell clipboard writes.
- **`<ct-data-table>` keyboard copy** (`src/ui/data-table.ts`): Ctrl+C / Cmd+C
  on a focused cell copies the cell value to the clipboard via the new
  `copyCellToClipboard` utility; `exportCsv()` public method added for
  programmatic CSV generation from any card.
- **Divergence detector** (`src/domain/divergence-detector.ts`): pure function
  `detectDivergences(candles, oscillator, options?)` finds classic and hidden
  bullish/bearish divergences between price and any oscillator series using
  configurable pivot-strength and distance parameters.
- **Rolling Sharpe ratio** (`src/domain/rolling-sharpe.ts`): sliding-window
  annualized Sharpe ratio series `computeRollingSharpe(candles, options?)` for
  visualizing risk-adjusted return momentum over time.
- **Relative Volume (RVOL)** (`src/domain/relative-volume.ts`):
  `computeRelativeVolume` and `detectVolumeSurges` — volume normalized by an
  N-day average with configurable surge-threshold detection.
- **MFE/MAE backtest analysis** (`src/domain/mfe-mae.ts`):
  `computeExcursions(candles, trades)` calculates per-trade Max Favorable /
  Adverse Excursion percentages, capture ratios, and median-based suggested
  stop-loss and take-profit levels.
- **Volatility-Adjusted Momentum** (`src/domain/volatility-adj-momentum.ts`):
  `computeVam(candles, options?)` normalizes price rate-of-change by ATR for
  cross-asset momentum comparison that accounts for volatility.
- **Trend Strength Composite** (`src/domain/trend-strength.ts`):
  `computeTrendStrength(candles, options?)` combines ADX, MA alignment, and
  directional consistency into a unified 0-100 strength score with bullish /
  bearish / neutral direction signal.
- **Worker batch-quotes endpoint** (`worker/routes/batch-quotes.ts`):
  `GET /api/quotes?symbols=AAPL,MSFT,GOOG` resolves up to 10 symbols in
  parallel with individual KV cache hits/misses; partial errors are inlined
  per symbol rather than failing the entire response.

---

## [11.28.0] - 2025-07-10

### Sprint: Accessibility, Security CI & Launch Prep (10-item sprint)

#### Added

- **Focus management on route change** (`src/ui/router.ts`): `activateView()`
  now uses `requestAnimationFrame` to focus the view heading (`h1`, `h2`,
  `[data-view-heading]`) on every navigation — satisfies WCAG 2.4.3.
- **Form error identification system** (`src/ui/form-errors.ts`): new utility
  exports `showFieldError`, `clearFieldError`, `validateAndReport`, and
  `clearAllErrors` for WCAG 3.3.1-compliant inline form errors with
  `aria-invalid` + `role="alert"` live regions.
- **Router query-string support** (`src/ui/router.ts`): `RouteInfo` now
  includes `searchParams: Readonly<Record<string, string>>`; `navigateToPath()`
  accepts `opts.searchParams` and serialises it to the URL.
- **OSSF Scorecard workflow** (`.github/workflows/scorecard.yml`): weekly +
  on-push security scoring via ossf/scorecard-action; results uploaded as SARIF.
- **Color contrast CI check** (`scripts/check-contrast.mjs`): validates 15
  design-token pairs against WCAG AA thresholds (4.5:1 text, 3:1 UI);
  wired into CI as `npm run check:contrast`.
- **npm audit gate** in CI pipeline: `npm audit --omit=dev --audit-level=high`
  blocks merges on new high/critical dependency vulnerabilities.
- **Open Graph / Twitter Card meta** (`index.html`): `og:title`,
  `og:description`, `og:image`, `twitter:card` and related tags for rich
  social previews on Product Hunt, Hacker News, and X.
- **OG preview image** (`public/og-preview.svg`): 1200×630 branded SVG preview
  with chart decorations, feature pills, and token-aligned palette.

#### Fixed

- **Light-theme signal tokens**: `--signal-buy` was `#3fb950` (2.54:1 on
  white, fails WCAG AA 3:1 minimum); corrected to `#1a7f37` and
  `--signal-sell` to `#cf222e` in `[data-theme="light"]`.
- **Error boundary retry**: replaced full-page-reload button with proper
  card re-mount logic; allows up to 3 retries before degrading to page reload.
  Uses `data-action="retry"` event delegation — no inline `onclick`.

#### Changed

- `.field-error` and `[aria-invalid="true"]` component styles added to
  `src/styles/components.css` for the form error system.

---

## [11.27.0] - 2025-07-09

### Sprint: Infrastructure Hardening & Public Launch Prep (10-item sprint)

#### Added

- **CodeQL Analysis workflow** (`.github/workflows/codeql.yml`): scheduled and
  on-push security scanning with security-extended queries.
- **SLSA provenance + SBOM** (`.github/workflows/release.yml`): build
  attestation via sigstore, SPDX SBOM generation via anchore/sbom-action.
- **Auto-label workflow** (`.github/workflows/auto-label.yml`): automatic PR
  labeling by changed file paths using actions/labeler.
- **GitHub Discussions templates**: feature-request and question form templates
  for structured community interaction.
- **DEVELOPMENT.md**: comprehensive quick-start guide for contributors with
  setup instructions, scripts reference, and architecture overview.
- **Copilot prompts**: 5 reusable `.prompt.md` files for common tasks
  (add-indicator, add-worker-route, add-card, write-domain-tests, fix-ci).
- **AGENTS.md**: 4 custom Copilot agent definitions (@domain, @worker,
  @quality, @card).
- **FUNDING.yml**: GitHub Sponsors configuration.
- **Stale workflow** (`.github/workflows/stale.yml`): auto-close stale
  issues (60d) and PRs (30d).

#### Fixed

- **exactOptionalPropertyTypes** error in `error-boundary.ts`: use spread
  with conditionals instead of assigning `undefined` to optional properties.
- **Type cast** in `indicator-config.ts`: safe double cast via `unknown` for
  readonly-to-mutable conversion.
- **13 markdownlint violations** across docs and `.github/` files.

#### Changed

- **README badges**: added CodeQL and SLSA badges, updated TypeScript to 6.0.
- **copilot-instructions.md**: enhanced with Signal Stores, Route Loaders,
  Web Components, Error Boundaries patterns and Quality Gates table.
- **ROADMAP.md**: consolidated governance content from ROADMAP.new.md into
  Appendix A; removed superseded ROADMAP.new.md.

---

## [11.26.0] - 2026-05-28

### Sprint: Web Component QA, Alert History & Refactors (10-item sprint)

#### Added

- **P9/P10/P11/Q6/Q7 — Web Component unit tests**: comprehensive test suites
  for all 5 base web components — `<ct-data-table>` (13 tests),
  `<ct-stat-grid>` (11 tests), `<ct-empty-state>` (10 tests),
  `<ct-chart-frame>` (12 tests), `<ct-filter-bar>` (11 tests). Covers
  rendering, accessibility attributes, XSS escaping, property updates,
  and disconnect cleanup.

- **Alert History D1 endpoint** (`worker/routes/alert-history.ts`):
  `GET /api/alerts/history` queries fired alerts from D1 with user, ticker,
  date-range, and limit filters. New `0002_alert_history.sql` migration adds
  `alert_history` table with indexes. Scheduled alert eval now persists fired
  alerts to history. 8 unit tests.

- **OpenAPI spec — alert history** (`worker/routes/openapi.ts`):
  `AlertHistoryResponse` and `AlertHistoryRow` schemas; `/api/alerts/history`
  path with full parameter documentation; new `Alerts` tag.

#### Changed

- **RF4 — Backtest trade log → `<ct-data-table>`** (`src/cards/backtest-card.ts`):
  refactored trade log rendering from raw HTML string concatenation to the
  `<ct-data-table>` Web Component with typed columns and custom return renderer.

- **Roadmap audit** (`docs/ROADMAP.md`): marked all Phase P, Q, R, and
  Refactor Backlog items as ✅ complete (all code verified to exist in tree).

---

## [11.25.0] - 2026-05-27

### Sprint: Phase Q/R — Worker Intelligence & Mobile (8-item sprint)

#### Added

- **Q8+Q9 — Backtest commission/slippage & position sizing**
  (`src/domain/backtest-engine.ts`): `CommissionConfig` interface with
  `fixedPerTrade`, `percentPerTrade`, and `slippage`; `computeTradeCost()`
  helper; full integration of `computeBacktestShares()` from position-sizing
  module into the backtest engine; 12 unit tests.

- **R3 — Durable Object WebSocket fan-out** (`worker/ticker-fanout.ts`):
  `TickerFanout` class using Cloudflare WebSocket Hibernation API; one DO
  instance per ticker symbol normalised to uppercase; `/ws` upgrade endpoint
  and `/broadcast` ingest; `getTickerStub()` helper; 9 unit tests.

- **R5 — News sentiment NLP endpoint** (`worker/routes/news-sentiment.ts`):
  VADER-inspired lexicon (80+ financial terms); negation handling (×-0.75),
  intensity boosters (×1.3), sigmoid normalisation to [-1, 1]; POST
  `/api/news/sentiment` with batch (max 50 texts); 14 unit tests.

- **R7 — Alert server-side evaluation** (`worker/routes/alert-eval.ts`):
  `evaluateCondition()` for price/changePercent/volume against above/below/
  crosses operators; `evaluateAlerts()` batch evaluator reading D1
  `alert_rules`; `handleScheduledAlertEval()` entry for Cloudflare Cron
  Trigger (every 5 min); one-shot disable on fire; 13 unit tests.

- **R4 — Capacitor native wrapper** (`capacitor.config.ts`):
  App ID `com.crosstide.app`, splash screen (dark), status bar theming,
  keyboard resize config; `@capacitor/core`, `@capacitor/preferences`,
  `@capacitor/splash-screen`, `@capacitor/status-bar` dependencies;
  `cap:sync`, `cap:android`, `cap:ios` npm scripts.

- **R10 — README showcase** (`README.md`):
  ASCII architecture diagram (Browser/Capacitor → CF Edge → Upstream);
  Worker API endpoint table; Native Mobile (Capacitor) quick-start section.

- **Webhook notification dispatch** (`worker/routes/webhook-dispatch.ts`):
  `dispatchWebhooks()` groups fired alerts by user, loads webhook URLs from
  D1 `user_settings`, sends parallel POST with 5s timeout and bounded
  concurrency (max 5); SSRF protection (https/http only); wired into
  scheduled handler via `ctx.waitUntil()`; 9 unit tests.

#### Changed

- Roadmap: marked Q8, Q9, R3, R4, R5, R7, R10, RF7-RF10 as complete.

---

## [11.24.0] - 2026-05-27

### Sprint: Phase R — Resilience & Advanced Features (10-item sprint)

#### Added

- **R8 — Point & Figure chart domain** (`src/domain/point-and-figure.ts`):
  `computePnf()` builds traditional X/O column charts from closing prices or
  high/low; `autoBoxSize()` picks a nice number near 1% of median price;
  `floorBox()` snaps prices to box boundaries; 14 unit tests.

- **R9 — OpenTelemetry OTLP/HTTP JSON tracing** (`worker/telemetry.ts`):
  `createTracer()` creates per-request root spans with child `span()` wrappers;
  exports to `OTEL_EXPORTER_OTLP_ENDPOINT` via `waitUntil()` so export never
  blocks response; propagates W3C `traceparent` header for distributed tracing;
  no-op when endpoint is unset; 12 unit tests.

- **R13 — Japanese (ja) locale** (`src/locales/ja.ts`):
  Complete translation dictionary (nav, actions, watchlist, chart, consensus,
  alerts, portfolio, backtest, screener, settings, errors, time); registered in
  locale barrel alongside ES, DE, ZH, HE.

- **R1 — Bar replay domain module** (`src/domain/bar-replay.ts`): committed
  earlier this session (`ba66a17`).

- **R2 — Signal DSL array values + `plot()` + built-in array functions**
  (`src/domain/signal-dsl.ts`): `Value` extended to `number | boolean |
readonly number[]`; array literals `[…]`; `range`, `len`, `at`, `sum`,
  `avg`, `min`, `max`, `plot` built-ins; committed (`3d1da8e`).

- **R6 — Multi-timeframe chart sync** (`src/core/multi-chart-sync.ts`):
  `createChartSync()` broadcasts crosshair time across participants snapped to
  each chart's timeframe boundary; committed (`5c93b7e`).

- **P7 — Route loaders** (`src/ui/router.ts`): `defineRoute({ loader })` with
  `AbortController` cancellation on navigation; committed (`482109b`).

- **P15 — ADRs 0007 & 0008**: route-loaders and error-boundaries decision
  records; committed (`d50bd5a`).

---

## [11.20.0] - 2026-05-04

### Sprint: Production Hardening (20-task consolidation)

Validated all 20 production-readiness tasks — tooling, docs, structure, and diagrams.

#### Changed

- **ARCHITECTURE.md**: updated version header to v11.20.0, corrected module counts
  (189 domain, 48 cards, 61 ui, 126 core, 506 test files, 5718 tests)
- **ROADMAP.md**: updated declared version, codebase metrics, and executive summary;
  added Sprint checklist section documenting all 20 completed tasks
- **README.md**: replaced broken screenshot image links with interactive dev note

#### Fixed

- **Utility deduplication**: consolidated `formatPercent` — removed local
  implementation from `cards/performance-metrics.ts`, now imports from
  `ui/number-format.ts` (single source of truth)
- Markdown table style violations in ROADMAP.md (MD060)

#### Removed

- `docs/screenshots/` empty placeholder directory (images never existed)
- Dead `formatPercent` export from `cards/performance-metrics.ts`

---

## [11.19.0] - 2025-07-06

### Production Readiness

Strict linting enforcement and dead-code elimination pass.

#### Changed

- **ESLint**: promoted `import-x/no-cycle` from `warn` to `error`; enabled
  `@typescript-eslint/no-unused-vars` (error) for test files
- **Stylelint**: enabled 9 previously-disabled rules (no-descending-specificity,
  no-duplicate-selectors, naming patterns, empty-line rules,
  color-function-alias-notation, media-feature-range-notation)
- **commitlint**: enforced `subject-case` (lower/sentence) and
  `header-max-length` (120) as errors
- **CSS**: merged duplicate selectors, replaced `rgba()` with `rgb()`,
  eliminated descending-specificity issues via `:where()`

#### Fixed

- TypeScript 6 strict `noUncheckedIndexedAccess` errors in 7 domain modules
- Unused imports/variables removed from 30+ test files
- Markdown lint violations in CONTRIBUTING.md and monitoring/README.md
- `dashboard-stats` referenced non-existent `config.tickers` → `config.watchlist`

#### Removed

- Stale VS Code workaround settings (webhint, github-actions, css.lint ignores)
- Dead VS Code extension recommendations (js-debug, browserslist)
- Empty `test-results/` and `coverage/.tmp/` artifacts

---

## [11.12.0] - 2026-05-04

### Highlights

Phase R feature sprint: 10 trading & portfolio analysis modules — price
targets, sector allocation, risk/reward evaluation, correlation analysis,
gap scanning, and portfolio rebalancing.

### ✨ Added

- **Price target tracker (R1)**: Set/track price targets with progress-to-target
  calculations, hit detection for long/short directions.
- **Sector allocation calculator (R2)**: Per-sector weightings, Herfindahl
  concentration index, over/underweight detection.
- **Intraday high/low distance (R3)**: Position-in-range (0–1) metric,
  near-high/near-low filters, widest/narrowest range screens.
- **Ticker comparison table (R4)**: Side-by-side metrics with best/worst
  identification, 52-week distance, performance ranking.
- **Risk/reward ratio calculator (R5)**: R:R analysis for long/short setups,
  position sizing from risk budget, expected value calculation.
- **Pair correlation calculator (R6)**: Pearson correlation between return
  series, NxN matrix builder, most/least correlated pairs.
- **Earnings surprise tracker (R7)**: Beat/miss analysis with revenue
  surprise, beat rate, streak tracking, magnitude classification.
- **Watchlist export formatter (R8)**: CSV, TSV, JSON, text export with
  date-stamped filenames and flexible import parsing.
- **Gap detection scanner (R9)**: Gap-up/down identification with same-day
  fill detection, fill rate statistics, unfilled gap tracking.
- **Portfolio rebalance calculator (R10)**: Drift-based rebalance plans with
  buy/sell/hold actions, share count derivation, target validation.

---

## [11.11.0] - 2025-07-05

### Highlights

Phase Q feature sprint: 10 power-user analytics and management utilities —
layout presets, provider analytics, momentum/volatility ranking, trade journal,
and smart staleness detection.

### ✨ Added

- **Dashboard layout presets (Q1)**: Save/restore named card arrangements with
  up to 20 presets, rename, and active-on-reload tracking.
- **Provider usage analytics (Q2)**: Track per-provider API call counts,
  latency averages, error rates, and most-used provider identification.
- **Price alert proximity check (Q3)**: Calculate distance from current prices
  to alert levels with percentage thresholds and sorted nearest-first.
- **Multi-ticker momentum rank (Q4)**: Rate-of-change ranking across portfolio
  with composite multi-timeframe scoring (short/medium/long).
- **Search history suggestions (Q5)**: Frequency-based autocomplete from past
  searches with prefix matching and LRU eviction.
- **Data snapshot diffing (Q6)**: Compare two point-in-time states to detect
  price moves, volume changes, and consensus signal flips.
- **Volatility rank calculator (Q7)**: Annualized volatility from daily returns
  with standard deviation, classification labels, and least-volatile filter.
- **Gain/loss streak tracker (Q8)**: Detect consecutive up/down days, find
  longest historical streaks, and rank portfolio by streak length.
- **Quote staleness detector (Q9)**: Classify quotes as fresh/stale/expired by
  configurable thresholds with market-hours awareness heuristic.
- **Trade journal log (Q10)**: Record buy/sell trades with price, quantity,
  notes, tags, and P/L totals. localStorage-backed, 500-entry cap.

---

## [11.10.0] - 2025-07-05

### Highlights

Phase P feature sprint: 10 power-user utilities — performance diagnostics,
correlation analysis, watchlist history, ticker pinning, notification
preferences, and advanced session management.

### ✨ Added

- **Auto-theme system sync (P1)**: Listen for OS prefers-color-scheme and
  prefers-contrast changes, auto-apply theme with manual override support.
- **Provider failover event log (P2)**: In-memory circular buffer (50 events)
  tracking provider fallback events with subscriber notifications.
- **Multi-ticker batch selection (P3)**: Ephemeral in-memory selection state
  for batch operations with select/deselect/toggle/selectAll/clear APIs.
- **Session state persistence (P4)**: Save/restore navigation state across
  page reloads via sessionStorage with 30-min expiry.
- **Data cache statistics (P5)**: Track cache hit/miss rates, entry counts,
  and estimated localStorage usage for diagnostics.
- **Ticker pinning (P6)**: Pin tickers to top of watchlist regardless of sort
  order with generic sortWithPinnedFirst utility.
- **Notification preferences (P7)**: Granular per-category enable/disable for
  price alerts, signal flips, provider failovers, data stale, and earnings.
- **Performance metrics collector (P8)**: Web Vitals observation (LCP, FCP,
  CLS, INP, TTFB) plus custom fetch latency and render time tracking.
- **Ticker correlation quick-check (P9)**: Pearson correlation on returns for
  any two price series with interpretation labels.
- **Watchlist change history (P10)**: Timestamped add/remove log with
  circular buffer (200 entries), ticker filtering, and undo candidates.

---

## [11.9.0] - 2025-07-05

### Highlights

Phase O feature sprint: 10 new features for power users — settings search,
dashboard stats, color tags, card width preferences, recent tickers history,
keyboard shortcut customization, and contextual ticker actions menu.

### ✨ Added

- **Settings search/filter (O4)**: Keyword input to filter settings groups in
  real-time by label, option, or button text.
- **Dashboard stats footer (O5)**: Live footer stats showing watchlist count,
  active/total providers, and data freshness breakdown (fresh/stale/expired).
- **Watchlist color tags (O6)**: Assign color labels (Bullish, Bearish,
  Neutral, Watch, Earnings, Speculative) to tickers with localStorage
  persistence. Six preset colors with CSS variable support.
- **Card width preference (O7)**: Per-card half-width vs full-width toggle
  with DOM class application and localStorage persistence.
- **Recent tickers history (O8)**: Tracks last 10 viewed tickers for
  quick-access navigation with deduplication and MRU ordering.
- **Keyboard shortcut customization (O9)**: Rebind any shortcut via
  localStorage. Includes formatBinding/parseBinding helpers for combo strings.
- **Contextual ticker actions menu (O10)**: Custom right-click context menu
  system with registered action buttons, viewport-aware positioning, Escape
  dismiss, and click-outside close.

---

## [11.8.0] - 2025-07-05

### Highlights

Production hardening release: removed dead infrastructure, fixed all TypeScript
errors, eliminated false-positive VS Code extension warnings, and promoted
ESLint browser-compat checking to error level.

### 🗑️ Removed

- **Changesets infrastructure**: Deleted `.changeset/` directory,
  `changesets.yml` workflow, changeset/version scripts, and `@changesets/cli`
  dependency. Releases are done manually via `gh release`.
- **Redundant VS Code extensions**: Removed `webhint.vscode-webhint`,
  `kwesinavilot.baseline-lens`, and `benandrew.browser-compatibility-checker`
  from recommendations — ESLint `eslint-plugin-compat` already provides
  accurate browser compatibility checking that respects our browserslist.

### 🔄 Changed

- **Browser compat ESLint rule promoted to error**: `compat/compat` now
  fails the build instead of warning, enforcing production-grade API usage.
- **VS Code settings hardened**: Disabled webhint extension (redundant),
  disabled GitHub Actions pinning refresh (fails behind corporate proxy).
- **Parent MyScripts tooling synced**: Removed dead `@changesets/cli`,
  added `eslint-plugin-compat` to shared devDependencies.

### 🐛 Fixed

- **TypeScript strict error in `full-backup.ts`**: Fixed
  `exactOptionalPropertyTypes` violation when `methodWeights` was `undefined`
  or `Partial` — now properly filters and conditionally includes the field.
- **Documentation references**: Updated `ARCHITECTURE.md` and `ROADMAP.md`
  to reflect removal of changesets infrastructure.

---

## [11.7.0] - 2025-07-05

### Highlights

UX polish & data management sprint: smooth theme transitions, keyboard shortcuts
modal, data freshness indicators, configurable refresh intervals, rate-limit
visualization, comprehensive backup/restore, print styles, and drawing URL sharing.

### ✨ Added

- **Theme transition animation**: Smooth 300ms CSS transition on background-color,
  color, border-color, and box-shadow when switching between dark/light/high-contrast
  themes. Skipped on initial page load to avoid FOUC.
- **Keyboard shortcuts modal**: Press `?` to open a categorized dialog displaying all
  keyboard shortcuts with styled `<kbd>` elements grouped by category.
- **Data freshness indicator**: Aggregate badge in footer showing "Live" / "Xm ago" /
  "Xh ago" with color-coded freshness level (green/yellow/red).
- **Auto-refresh interval setting**: Users can configure refresh intervals between
  1–60 minutes from the Settings card. Persisted with validation (min 1m, max 60m).
- **Rate limit visualization**: Provider health card now shows a color-coded usage bar
  per provider tracking request count in a 60-second sliding window.
- **Full backup/restore**: Export now includes drawings, alert rules, theme, method
  weights, and card settings (schema version bumped to 8). Added `collectFullBackup()`
  helper and `exportAllDrawings()`/`importAllDrawings()` utilities.
- **Print-friendly stylesheet**: `@media print` rules that hide navigation/footer,
  force light background, add table borders, and show external link URLs.
- **Chart annotation URL sharing**: `encodeDrawingsUrl()` and `decodeDrawingsUrl()`
  encode up to 50 chart drawings into a base64url shareable link.

### 🔄 Changed

- ROADMAP updated: K1–K5, L1, L2, L8 marked as done. M3 marked N/A. Phase N added.

---

## [11.6.0] - 2025-07-05

### Highlights

UX & documentation sprint: offline indicator, locale picker, drawing undo/redo,
"What's New" modal, service worker update prompt, and comprehensive docs expansion.

### ✨ Added

- **Offline indicator**: Fixed banner at top of viewport when network connectivity
  is lost, auto-dismisses on reconnection. ARIA `role="alert"` for screen readers.
- **Language picker**: Settings card now includes a locale dropdown (EN, ES, DE, ZH, HE)
  that calls `setLocale()` and persists the choice.
- **Drawing undo/redo**: `attachDrawingHistory()` module with Ctrl+Z/Ctrl+Y (Cmd+Z/Cmd+Shift+Z)
  keyboard support, 50-state history depth. 10 unit tests.
- **"What's New" modal**: Detects version change via localStorage and shows a modal
  with release highlights. Registry-based design for easy updates.
- **Plugin API docs page**: Full MDX reference for the custom indicator plugin system,
  fixing the dead link from charts.mdx.
- **Card guide pages**: Added docs for seasonality, provider-health, consensus-timeline,
  and strategy-comparison (M4 complete).
- **Uptime Kuma badge**: Status badge added to README.md linking to monitoring dashboard.

### 🔄 Changed

- **SW update UX**: Replaced auto-refresh toast with a persistent bottom banner
  containing "Refresh" and "Later" buttons — user controls when to apply updates.
- **vitest.config.ts**: Added `define: { __APP_VERSION__ }` for test compatibility.
- Updated ROADMAP.md: marked K6–K17, L3–L11, M4, M6 as ✅ Done.

---

## [11.5.0] - 2025-07-05

### Highlights

Quality & testing sprint: eliminated all remaining innerHTML violations,
migrated to container queries, expanded accessibility & mobile testing,
enhanced CI with Lighthouse Web Vitals, and added GitHub issue templates.

### ✨ Added

- **M1 — Virtual scroller stress test**: 7 tests validating 10K-row performance
  (O(visible) DOM, spacer height, rapid updates, scroll simulation, dispose safety).
- **M2 — Mobile responsive e2e tests**: 6 Playwright tests across Pixel 7 / iPhone 14 /
  iPhone SE / Galaxy S9+ / iPad viewports (overflow, touch targets, nav wrap, card stack).
- **M7 — Lighthouse Web Vitals in CI**: `perf-regression.yml` now collects LCP, TBT,
  CLS, and performance score via Lighthouse CI and includes them in PR comments.
- **Toast dismiss button**: Notifications now include an accessible close button with
  `aria-label="Dismiss"` and keyboard support.
- **M5 — GitHub issue templates**: Bug report and feature request forms with structured
  fields (severity, browser, area dropdowns).

### 🔄 Changed

- **R14 — innerHTML elimination**: Completed migration to 0 violations in `src/cards/`.
  Converted `alert-rules-ui.ts`, `chart-card.ts`, `consensus-timeline-card.ts`,
  `preset-filters.ts`, `provider-health-monitor.ts`, `screener-card.ts`, `screener.ts`.
- **K8/R16 — Container queries**: Migrated `.portfolio-columns` and `#watchlist-table`
  from `@media` to `@container card` queries for proper component-level responsiveness.
- **K15 — WCAG audit expanded**: `wcag-audit.spec.ts` now covers 23 routes (added
  provider-health, seasonality, comparison, strategy-comparison).
- Updated ROADMAP.md: R14, R16, K8, K15, M1, M2, M5, M7, M8 marked as ✅ Done.

---

## [11.4.0] - 2025-07-05

### Highlights

Architecture quality sprint completing K4 (event delegation) and K1
(patchDOM migration) across remaining card files.

### 🔄 Changed

- **K4 — Event delegation**: Migrated `settings.ts`, `multi-chart-layout.ts`,
  and `screener-columns.ts` from direct `addEventListener` to `createDelegate`
  with `data-action` attributes. Only 5 legitimate direct listeners remain
  (canvas mouse tracking, SVG crosshair sync, keyboard shortcuts).
- **K1 — patchDOM migration**: Replaced `innerHTML` with `patchDOM()` in
  `macro-dashboard-card.ts`, `sector-rotation-card.ts`,
  `relative-strength-card.ts`, `strategy-comparison-card.ts`,
  `signal-dsl-card.ts` (9 instances), and `backtest-card.ts` (5 instances).
  Only 8 trivial `innerHTML` usages remain (empty clears, toast, alert row).
- Updated ROADMAP.md refactor backlog: R14 and R15 marked near-complete.

---

## [11.3.0] - 2025-07-04

### Highlights

Feature sprint delivering multi-condition alert rules, strategy comparison,
watchlist groups integration, and continued event delegation migration.

### ✨ Added

- **L3 — Multi-condition alert rules**: Full CRUD rule builder UI with AND/OR
  operators and per-condition types (method, consensus). Rules persist to
  localStorage and evaluate live against incoming signals during data refresh,
  firing browser notifications + sound on match.
- **L4 — Strategy comparison card**: Side-by-side SMA crossover backtest
  comparison with overlaid equity curves (SVG), stats table (return, CAGR,
  drawdown, win rate, profit factor, trades), and winner declaration.
- **L7 — Watchlist groups integration**: User-defined collapsible groups now
  render in the watchlist when present, with ungrouped tickers shown below.
- **K17 — Uptime Kuma config**: Fly.io deployment config (`monitoring/fly.toml`)
  for Uptime Kuma monitoring of CrossTide API health endpoints.
- **Nav links**: Added sidebar navigation entries for Strategy Comparison and
  Provider Health cards.
- **Provider Health**: Added to README card gallery (23 total cards).

### 🔄 Changed

- **K4 — Event delegation expansion**: Migrated `backtest-card`, `signal-dsl-card`,
  `heatmap`, `preset-filters`, and `relative-strength-card` from direct
  `addEventListener` to `createDelegate` with `data-action` attributes.
- **M9 — README enhancement**: Added TypeScript 5.9 and Bundle <200 KB badges,
  full 23-card gallery table with descriptions.

### 🐛 Fixed

- Registry test card count updated (22 → 23) for strategy-comparison card.
- Backtest and heatmap test selectors updated for delegation migration.

---

## [11.2.0] - 2025-07-03

### Highlights

Architecture quality sprint: complete patchDOM migration (K1) and event
delegation expansion (K4) across all remaining card modules. Every card now
uses incremental DOM diffing instead of innerHTML, and delegated `data-action`
handlers replace per-render addEventListener calls.

### Refactored

- **correlation-matrix-card**: patchDOM + createDelegate for period/crypto changes
- **comparison-card**: patchDOM for container + output, delegate for compare button
- **consensus-timeline-card**: patchDOM + delegate for ticker/days selects
- **alerts-card**: patchDOM for permission UI, delegate for enable-notify
- **signal-dsl-card**: patchDOM for initial render, delegate for clear/save/open
- **chart-card**: patchDOM for backtest section, delegate for timeframe + run-backtest
- **settings**: patchDOM + delegate for all action buttons (export, import, clear, Finnhub key)
- **screener-card**: patchDOM for empty states, delegate for preset filter buttons
- **watchlist-card**: patchDOM for loading placeholder
- **heatmap-card**: delegate for sector drill-down tile clicks

### 🐛 Fixed

- Test selectors updated from `#btn-*` IDs to `[data-action='*']` attributes
- Consensus-timeline test uses `bubbles: true` for delegated change events

### Stats

- 4565 unit tests passing
- TypeScript strict mode clean
- K1 patchDOM migration: 100% complete (all 19 cards)
- K4 Event delegation: expanded from 1 to 10 cards

---

## [11.1.0] - 2025-07-03

### Highlights

Feature sprint completing all remaining Phase L & M roadmap items: watchlist
hover zoom, comprehensive user guides for 8 cards, and expanded contributing
documentation.

### ✨ Added

- **Watchlist hover zoom** (L11): pointerenter popup shows mini sparkline,
  day-change, consensus badge, and volume for any watchlist row. 300 ms show
  delay, 150 ms hide delay, auto-positions left when overflow detected.
- **User guides** (M4): added docs-site MDX pages for Risk Metrics,
  Correlation Matrix, Market Breadth, Sector Rotation, Macro Dashboard,
  Earnings Calendar, Signal DSL, and Relative Strength cards.
- **Contributing guide expansion** (M5): architecture overview, conventional
  commit conventions, testing guidelines, and file-naming rules.

### 🐛 Fixed

- `ConsensusResult.strength` used correctly in hover zoom (was referencing
  non-existent `.score` property).

---

## [11.0.0] - 2025-07-02

### Highlights

Major release: cross-browser compatibility fixes, instrument type filter
correction, version bump, and hover zoom roadmap planning.

---

Release notes for v3.0.0 through v10.0.0 are preserved in
[`CHANGELOG.archive.md`](CHANGELOG.archive.md).
