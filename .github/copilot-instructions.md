# 🤖 CrossTide — Copilot Workspace Instructions

Privacy-first financial analysis PWA. Vanilla TypeScript, no framework, Vite 8, Vitest 4, Hono 4 on Cloudflare Workers, LWC v5 charts, morphdom DOM patching, Cloudflare D1 + KV.

## 🧰 Skills & Agents

| Skill | Path | Use when |
|---|---|---|
| `add-worker-route` | `.github/skills/add-worker-route/SKILL.md` | Adding a new API endpoint |
| `add-card` | `.github/skills/add-card/SKILL.md` | Adding a new route card / view |
| `add-indicator` | `.github/skills/add-indicator/SKILL.md` | Adding a calculator or consensus method |
| `debug-fetch` | `.github/skills/debug-fetch/SKILL.md` | Broken API calls, stale data |
| `release` | `.github/skills/release/SKILL.md` | Version bump, git tag, GH release |
| `update-tests` | `.github/skills/update-tests/SKILL.md` | Add/fix tests, coverage drops |
| `onboard-contributor` | `.github/skills/onboard-contributor/SKILL.md` | New contributor setup, "where do I start" |
| `deploy` | `.github/skills/deploy/SKILL.md` | CF deployment, provisioning |
| `migrate-db` | `.github/skills/migrate-db/SKILL.md` | D1 schema changes |

| Agent | Use when |
|---|---|
| `@domain-specialist` | Indicators, analytics, risk, domain purity |
| `@api-integrator` | Worker routes, KV cache, provider chain |
| `@card-designer` | Card layout, theme, accessibility |
| `@compat-specialist` | Browser APIs, progressive enhancement, cross-browser tests |
| `@quality-reviewer` | Lint, coverage, security, dead code |
| `@deploy-ops` | CF deployment, Docker, CI/CD |
| `@perf-specialist` | Bundle, INP, LCP, WASM, caching |

| MCP server | Use when |
|---|---|
| `github` | Issues, pull requests, repository operations |
| `cloudflare` | Cloudflare account resources and API operations |
| `cloudflare-docs` | Current Cloudflare platform documentation |
| `cloudflare-observability` | Worker logs, errors, and production analytics |
| `playwright` | Interactive browser inspection and E2E debugging |
| `crosstide` | CrossTide quotes, indicators, screener, and portfolio tools |

## 📂 Context Loading Strategy (token efficiency)

Load **only** the instruction file that matches the layer you are modifying:

| Layer                   | Instruction file                                      | `applyTo` glob                     |
| ----------------------- | ----------------------------------------------------- | ---------------------------------- |
| `src/domain/`           | `.github/instructions/domain.instructions.md`         | `src/domain/**`                    |
| `worker/`               | `.github/instructions/worker.instructions.md`         | `worker/**`                        |
| `src/cards/`, `src/ui/` | `.github/instructions/cards.instructions.md`          | `src/cards/**`                     |
| `tests/`                | `.github/instructions/tests.instructions.md`          | `tests/**`                         |
| Browser compat          | `.github/instructions/browser.instructions.md`        | `tests/browser/**`, `tests/e2e/**` |
| CI / CD / workflows     | `.github/instructions/cicd.instructions.md`           | `.github/**`, `**/*.yml`           |
| Pre-release gate        | `.github/instructions/pre-release.instructions.md`    | `CHANGELOG.md`, `package.json`     |
| Security audit          | `.github/instructions/security-audit.instructions.md` | `worker/**`, `src/core/**`         |

**Do NOT speculatively load** `src/domain/` (220 flat modules), `src/cards/` (52 files), or `tests/unit/` for unrelated tasks. Use `grep_search` or `semantic_search` to find specific files.

---

## 🏗️ Layer Architecture (architecture-check enforced import direction)

```text
types ← domain ← core ← providers ← cards ← ui
```

```text
src/types/     — interfaces only, no imports from other src/ layers
src/domain/    — pure functions only: no DOM, fetch, Date.now(), Math.random()
src/core/      — state, config, caching, fetch — no UI
src/providers/ — Yahoo/Finnhub adapters
src/cards/     — route cards (CardModule pattern)
src/ui/        — router, theme, toast — DOM allowed
worker/        — Hono on Cloudflare Workers; imports use .js extension
docs-site/     — Astro Starlight documentation site; isolated from app code
```

---

## 🚫 Non-Negotiable Rules

1. No suppressions — no `eslint-disable`, `@ts-ignore`, `--force`. Fix root causes.
2. No dead artifacts — every file, export, dep, and config entry must be referenced.
3. No `TODO` in code — open a GitHub Issue instead.
4. No secrets in code — use `.env` (gitignored) or Cloudflare secrets.
5. Validation at boundaries — sanitize all external input (API, user, URL params).
6. Bundle discipline — CI rejects builds >250 KB gzip.
7. Test before shipping — new domain logic and new worker routes require tests.
8. Skills auto-discovery — before acting on any repeatable task (add route, bump version, run tests, debug fetch), read `.github/skills/*/SKILL.md` for the matching playbook.
9. Custom agents — `.github/agents/*.agent.md` are specialist personas; `runSubagent` delegates stateless tasks without polluting the main conversation.
10. Context economy — invoke a skill or agent rather than restating rules inline; use `memory` (three tiers: `/memories/` user, `/memories/session/` session, `/memories/repo/` repo) for cross-session persistence.
11. Pre-release gate — before every `git tag vX.Y.Z`, load `.github/instructions/pre-release.instructions.md` and run every item; canonical version-bump file list is in `.github/skills/release/SKILL.md`.

## 📏 Coding Conventions

- **Explicit return types** on all exported functions
- **No `any`** — use `unknown` + narrow, or define interfaces
- **`const` by default**, `let` only when reassignment required
- **`===` always**; `readonly` on all interface fields
- **No `console.log`** — use `worker/logger.ts` or `console.warn`/`console.error`
- **No floating promises** — `void asyncFn()` or `await`
- **Barrel exports** — each layer exposes a public API via `index.ts`

## 📝 Commit Format (commitlint enforced)

```text
type(scope): fully lowercase subject, no period, ≤72 chars
```

Types: `feat` `fix` `docs` `refactor` `test` `chore` `perf` `ci`
Scopes: `domain` `worker` `cards` `core` `ui` `ci` `docs` `screener` `portfolio` `alerts` `consensus` `watchlist` `chart`

## ✅ Quality Gates (all must pass before merge)

| Gate          | Command                                   | Requirement                    |
| ------------- | ----------------------------------------- | ------------------------------ |
| Type check    | `npm run typecheck`                       | Zero errors                    |
| Oxlint        | `npm run lint`                            | Zero errors                    |
| Stylelint     | `npm run lint:css`                        | Zero warnings                  |
| Format        | `npm run format:check`                    | Exit 0 (Biome, not Prettier)   |
| File headers  | `npm run audit:headers`                   | 100% — every file has a docblock |
| Tests         | `npm run test:coverage`                   | ≥90% stmt/line/fn, ≥80% branch |
| Build         | `npm run build`                           | Successful                     |
| Bundle        | `npm run check:bundle`                    | <250 KB gzip                   |
| Supply chain  | `npm audit --omit=dev --audit-level=high` | Zero high/critical CVEs        |
| Registry sigs | `npm audit signatures`                    | Exit 0                         |
| Architecture  | `node scripts/arch-check.mjs --strict`    | Zero violations                |

Run all: `npm run ci`

> Oxlint uses native parallel execution and TypeScript 7-aware checks.
> Use `lint:nocache` to force a full pass. `ci` calls `build:only` because
> `typecheck` has already run in the same pipeline.

## 🧠 Recent Learnings (must retain)

1. **PWA deploys must inject Workbox manifest**
   - Any deploy workflow that runs Vite build must also run `node scripts/workbox-inject.mjs` (or call `npm run build` if that script already chains it).
   - Without injection, `sw.js` keeps fallback entries with `revision: null`, causing stale clients and broken refresh UX.

2. **Service Worker update UX needs a safe fallback path**
   - If `registration.waiting` is absent at click-time, update handlers must not hang indefinitely.
   - Keep activation logic resilient with explicit no-waiting handling and timeout fallback.

3. **Static-host production data flow is Worker-first**
   - On GitHub Pages, direct Yahoo requests can fail via CSP + CORS.
   - Search/quote/chart flows in production should route through allowed Worker origins.

4. **UI async flows must surface provider failures**
   - Event-handler promise chains require `.catch()` and explicit empty/error states.
   - Never allow silent rejection paths that leave empty UI with no feedback.

5. **Router route table completeness must be tested**
   - Every registered card route must round-trip through router parse/build mappings.
   - Keep a unit guard that compares card registry routes against router parsing behavior.

6. **Vitest runs as two projects — put new tests in the right one**
   - `node` project: `tests/unit/{domain,worker,providers,types,helpers}/**` — no DOM globals available, `tests/helpers/node-network.ts` blocks unstubbed `fetch`.
   - `dom` project: everything else, happy-dom + `tests/helpers/happy-dom-network.ts`.
   - A DOM-free-by-path test that still needs browser globals (`self`, `WebAssembly`) must declare `@vitest-environment happy-dom` in its file docblock — config-level `exclude` beats `include`, so exceptions cannot be expressed as globs.

7. **Never call `npx` for a devDependency**
   - Locally use the bare binary name (npm puts `node_modules/.bin` on PATH); in workflows use `./node_modules/.bin/<tool>`.
   - `npx` may silently fetch a *different* version from the registry. This caused the Astro Pages deploy failure (`Named export 'parseCookie' not found`) because a registry-fetched Astro resolved a CommonJS `cookie`.
   - Build workspace packages with `npm run build --workspace <name>`.
   - This applies to config files too: Playwright's `webServer.command` uses `npm run dev --`, not `npx vite`.

8. **Wall-clock assertions in unit tests must tolerate scheduler jitter**
   - Budget assertions (`expect(elapsed).toBeLessThan(n)`) flake under the parallel suite; add `{ retry: 2 }` or move them to `tests/bench/`.

9. **`import.meta.url` is not a `file:` URL in the `dom` project**
   - happy-dom rewrites it, so `fileURLToPath(import.meta.url)` throws `ERR_INVALID_URL_SCHEME`.
   - To read a repo file from a test, resolve from the Vitest root: `resolve(process.cwd(), "tests/e2e/cards.spec.ts")`.

10. **Every file needs a leading docblock — it is a CI gate**
    - `npm run audit:headers` (inside `lint:all`) fails if any file in `src/`, `worker/`, or `scripts/` lacks a `/** … */` header.
    - A one-line summary at the top of a file lets an assistant identify its purpose without parsing the body, which is the cheapest available context saving.

11. **Machine-scope toolchain**
    - Shared CLIs live in `C:\ProgramData\npm` (`NPM_CONFIG_GLOBALCONFIG` → `C:\ProgramData\npm\etc\npmrc`); Playwright browsers in `C:\ProgramData\ms-playwright`.
    - Machine env vars only reach *new* processes — a VS Code restart is required after changing them, otherwise `tsx`/`wrangler` appear missing on PATH.

12. **A gate that fails early hides every gate behind it**
    - Markdownlint failing in CI caused the Playwright E2E job to be *skipped*, which read as "not failing" for several runs. When a pipeline turns green after fixing an early gate, re-check the jobs that were previously skipped.
    - Order of discovery, not order of severity, determines what you see first.

13. **Playwright visual baselines are platform-specific and must be committed**
    - Baselines are named `<name>-<project>-<platform>.png`; a linux baseline cannot be generated on Windows.
    - Regenerate via `gh workflow run ci.yml --ref main -f update_snapshots=true`, then `gh run download <id> -n visual-snapshots` and commit into `tests/e2e/visual.spec.ts-snapshots/`.
    - Never commit locally generated `*-win32.png` files — CI never validates them.

14. **`isVisible()` does not mean clickable**
    - The mobile sidebar is parked off-canvas with `translateX(-220px)`. Its links report `visible: true` (non-empty box, `visibility: visible`) but sit at negative x, so `click()` hangs until the test times out.
    - Check the bounding box against `page.viewportSize()` before clicking, or navigate directly.

15. **Forward `Tab` does not start at the top of the document**
    - After a route change the router moves focus into `<main>` for the WCAG 2.4.3 announcement, which also sets the sequential focus navigation starting point. Calling `.blur()` does not reset it.
    - To reach header/nav elements from that position, walk backwards with `Shift+Tab`.

16. **A stylesheet is only real once `index.html` links it**
    - `src/styles/a11y.css` shipped nothing for several releases: `.skip-link`, `.sr-only` and `.btn-icon` were in the markup with no rule behind them, so screen-reader-only text rendered visibly.
    - Fixed in Q6 — `a11y.css` is now linked and declared last in the `@layer` order; `fonts.css` was deleted (superseded by the `@fontsource-variable/inter` import in `src/main.ts`).
    - `tests/unit/a11y-audit.test.ts` now fails if any file in `src/styles/` is not referenced by `index.html`.

17. **A readiness guard built on optional chaining is vacuous**
    - `document.getElementById(id)?.textContent !== ""` evaluates to `undefined !== ""` → `true` when the element is absent, so `waitForFunction` resolves *immediately* and the test races the bootstrap.
    - This produced an intermittent (not deterministic) E2E failure, which is the hardest class to attribute. Always use `waitForAppReady` from `tests/e2e/app-ready.ts`.
    - Generalisation: a guard that can only ever return `true` is worse than no guard — it buys false confidence. `tests/unit/a11y-audit.test.ts` had the same shape (asserting file *text*) and was rewritten in Q6 to parse the CSS with postcss instead.

18. **Markdown formatting is owned by markdownlint alone**
    - Biome 2.5 does **not** format markdown; `biome format <file>.md` reports "paths were provided but ignored". There is no Biome/markdownlint conflict to resolve.
    - `MD049` (emphasis-style) runs in **consistent** mode: the *first* emphasis marker in a file sets the expected style for that file. Introducing one `*asterisk*` into a file that uses `_underscore_` errors on every pre-existing underscore.
    - CHANGELOG.md and docs/ROADMAP.md use `_underscore_`; this file uses `*asterisk*`. Match the file you are editing.

19. **PowerShell escaped quotes break `git commit -m`**
    - A `\"` inside a `-m "…"` argument makes git re-parse the remainder as pathspecs (`fatal: … is outside repository`).
    - Write quote-free commit bodies, one `-m` per paragraph, each line under 100 chars (commitlint `body-max-line-length`).

20. **The edit tool can fuzzy-match and silently drop a neighbouring line**
    - During a 12-site replacement it matched on indentation alone and deleted three adjacent statements.
    - After any multi-site edit to source or tests, run `git diff -U0` and read every hunk. Recover a damaged region with `git show HEAD:<path>`.

21. **happy-dom's CSSOM cannot parse this project's stylesheets**
    - Rules nested inside `@layer` blocks are dropped and custom properties return `undefined` from `getPropertyValue`, so a CSSOM-based CSS test fails for reasons unrelated to the CSS.
    - Parse with `postcss` (an explicit devDependency) instead: `postcss.parse(css).walkRules(...)`. See `tests/unit/a11y-audit.test.ts`.

22. **`--reporter=basic` does not exist in Vitest 4**
    - It fails at startup with `Failed to load url basic`. Use the default reporter and pipe through `Select-Object -Last n` to trim output.

23. **The dominant failure mode in this repo is a gate that passes without checking anything**
    - Five instances so far: a readiness guard built on optional chaining that could only return `true`; `a11y-audit` asserting *file text* instead of applied CSS; a bare `--update-snapshots` that rewrote no baseline; `check-contrast.mjs` validating a hand-maintained copy of the palette instead of `tokens.css`; and `check:contrast` being defined in `package.json` but wired into neither `ci` nor `lint:all`.
    - The tell is always the same: a check that cannot observe the thing it names. Ask of any gate — *what edit would make this fail?* If there isn't a clear answer, it is decorative.
    - Derive assertions from the artifact (parse the CSS, parse the route table, walk the directory). Never restate the artifact in the test.
    - A green gate that was never wired into `ci` is indistinguishable from no gate. Grep `package.json` for scripts that nothing calls.

24. **A code path that never executes accumulates defects silently**
    - `initTheme(config.theme)` pinned dark, so the light theme never rendered — in the app *or* in CI. The moment it became reachable, 29 E2E tests failed on contrast bugs that had been shipping for releases.
    - The same shape produced the orphaned `a11y.css` and ~100 unreachable domain modules.
    - When you make a dormant path reachable, expect a burst of failures and treat them as pre-existing debt, not as a regression from your change.

25. **Foreground literals on a themed background are wrong by construction**
    - `color: #fff` on `background: var(--accent)` is only correct for one theme. Use `var(--bg-app)` — the surface the accent is designed to contrast against — so it flips automatically.

26. **A fixed iteration budget in an E2E test is an implementation detail in disguise**
    - "Press Shift+Tab up to 10 times" passed locally and failed in CI, where more data had loaded and more buttons sat ahead of the header. Derive the bound from the document (`querySelectorAll(...).length`).

27. **An allowlist is how a real gate becomes a decorative one**
    - `scripts/arch-check.mjs` enforced the layer direction correctly, then carried `domain->core` and `domain->cards` in `ALLOWED_CROSS_LAYER` with the comment "domain modules use core fetch/encoding utilities" — blanket-permitting the exact thing the rule exists to forbid. Three modules had drifted out of the layer behind it.
    - This is learning 23 with a twist: the gate *could* observe the violation, but had been told not to. When you read a gate, read its exceptions first — an entry that describes a category rather than a named file is a rule repeal, not an exception.
    - The fix is almost always that the *module* is in the wrong layer, not that the rule is too strict.

28. **Packaging a layer is the strongest purity test available**
    - `src/domain` claimed purity for releases. Pointing a Vite lib build at it forced the compiler to follow every import outward, and `src/core/fetch.ts`, `src/cards/heatmap.ts` and `src/ui/delegate.ts` appeared in the program immediately.
    - Dropping `DOM` from `lib` is a cheap second signal: it separates genuinely portable Web APIs (`URL`, `crypto`, `AbortSignal`, `TextEncoder` — present in Node, Workers and browsers) from real DOM dependencies.

## 🔌 Worker API

The Worker registers **56 routes**. `worker/routes/openapi.ts` is the contract —
`scripts/gen-openapi-client.mjs` derives `src/core/api-types.ts` from it, and
`tests/unit/worker/openapi-drift.test.ts` fails if a newly registered route is
not documented there. Adding a route means editing the spec in the same commit.

The most-used endpoints:

| Method | Path                        | Description                     |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/api/health`               | Worker + provider status        |
| GET    | `/api/quote/:symbol`        | Real-time quote                 |
| GET    | `/api/quotes`               | Batch quotes — one upstream hit |
| GET    | `/api/chart`                | OHLCV candles with KV cache     |
| GET    | `/api/search`               | Ticker fuzzy search             |
| GET    | `/api/fundamentals/:symbol` | P/E, EPS, revenue metrics       |
| GET    | `/api/earnings/:symbol`     | Earnings calendar + history     |
| GET    | `/api/crypto/:id`           | Crypto quote (CoinGecko id)     |
| GET    | `/api/forex/:pair`          | Forex rate (ECB/Yahoo)          |
| GET    | `/api/seasonality/:symbol`  | Monthly return seasonality      |
| GET    | `/api/alerts/history`       | Alert fire history (D1)         |
| GET    | `/api/migrations/status`    | D1 migration status             |
| POST   | `/api/market-breadth`       | NYSE/NASDAQ breadth indicators  |
| POST   | `/api/screener`             | Technical screener              |
| POST   | `/api/signal-dsl/execute`   | Signal DSL expression evaluator |
| POST   | `/api/news/sentiment`       | NLP sentiment scoring           |
| POST   | `/api/portfolio/rebalance`  | Rebalancing trade calculations  |
| GET    | `/api/og/:symbol`           | OG social preview image         |
| GET    | `/api/ws/:symbol`           | WebSocket ticker fan-out (DO)   |
| GET    | `/openapi.json`             | OpenAPI spec                    |

All 56 registered routes are documented. `KNOWN_GAP` in
`tests/unit/worker/openapi-drift.test.ts` is now an empty ratchet — it may only
stay empty, so a newly registered undocumented route fails immediately.
