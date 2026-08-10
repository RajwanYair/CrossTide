# 🤝 Contributing to CrossTide

Thank you for your interest in contributing!

## 🛠️ Development Setup

### 📦 Option A: Dev Container (recommended)

Open in GitHub Codespaces or VS Code Dev Containers — everything is pre-configured:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/RajwanYair/CrossTide)

### 💻 Option B: Local

```bash
node --version   # Must be >=20.19.0
npm install
npm run dev      # http://localhost:5173
```

> Never invoke a devDependency through `npx` — it may silently fetch a different version
> from the registry. Use the bare binary name locally (npm puts `node_modules/.bin` on
> PATH) or `./node_modules/.bin/<tool>` in a workflow.

## 📋 Code Standards

- Follow TypeScript strict mode — `tsc --noEmit` must pass with zero errors
- Run `npm run lint:all` before committing (ESLint + Stylelint + HTMLHint + markdownlint +
  Biome format + file-header audit + WCAG contrast)
- Run `npm run format` to auto-format with Biome (Biome does not format markdown —
  `npm run lint:md` owns that)
- Every file in `src/`, `worker/` and `scripts/` needs a leading `/** … */` docblock
- Domain logic (`src/domain/`) must be pure functions — no DOM, no fetch, no side effects
- Write tests for all domain logic changes
- Never commit API keys, tokens, or secrets

## ✅ Quality Gates

All of the following must pass before merging:

| Gate         | Command                                | Requirement                    |
| ------------ | -------------------------------------- | ------------------------------ |
| Type check   | `npm run typecheck`                    | Zero errors                    |
| Lint         | `npm run lint:all`                     | Zero warnings                  |
| Format       | `npm run format:check`                 | Exit 0 (Biome, not Prettier)   |
| File headers | `npm run audit:headers`                | Every file has a docblock      |
| Contrast     | `npm run check:contrast`               | Every token pair meets WCAG    |
| API types    | `npm run check:api-types`              | No drift from `openapi.ts`     |
| Tests        | `npm run test:coverage`                | ≥90% stmt/line/fn, ≥80% branch |
| Build        | `npm run build`                        | Successful                     |
| Bundle       | `npm run check:bundle`                 | Under 250 KB gzip              |
| Architecture | `node scripts/arch-check.mjs --strict` | Zero layer violations          |

Or run everything at once: `npm run ci`

A gate is only worth having if it can fail. When you add one, ask what edit would break
it — if there is no clear answer, the gate is decorative. Derive assertions from the
artifact (parse the CSS, parse the route table, walk the directory) rather than restating
it in the test.

## 🔀 Pull Request Process

1. Start from an existing GitHub Issue, or open one before coding. The issue owns scope,
  acceptance criteria, discussion, and the final closure record.
2. Create a feature branch from `main` named after the issue, for example `fix/123-cache-ui`.
3. Make changes with clear, atomic Conventional Commits. Include `Refs #123` in interim
  commit bodies when useful for traceability.
4. Open a PR linked to the issue and include `Closes #123` in the PR body. One cohesive
  issue should normally map to one PR; split only when the issue explicitly says so.
5. Ensure all quality gates pass: `npm run ci`, then request review in the PR.
6. Update the roadmap index only after the issue/PR status changes; do not use it as a
  substitute for an issue or PR.

## 🐞 Reporting Issues

Use [GitHub Issues](https://github.com/RajwanYair/CrossTide/issues). Do not create a
roadmap-only task for work that needs implementation history. Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
- Console errors (if any)
- Screenshots (if applicable)
- A concise acceptance checklist for feature and refactor requests

## 📝 Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(scope): add new feature
fix(scope): fix specific bug
docs(scope): documentation only
refactor(scope): code change without feature/fix
test(scope): add or update tests
chore(scope): maintenance (deps, CI, config)
perf(scope): performance improvement
```

Common scopes: `watchlist` · `chart` · `screener` · `portfolio` · `rebalance` · `alerts` ·
`consensus` · `core` · `worker` · `domain` · `ui` · `ci` · `docs`

Subjects must be **fully lowercase** — `feat(worker): add earnings calendar api endpoint` ✅

## 🏗️ Architecture Overview

```text
src/
├── types/       ← shared interfaces (no imports from other layers)
├── domain/      ← pure functions (no DOM, no fetch, no side effects)
├── core/        ← state, config, caching, network (no UI code)
├── providers/   ← data provider adapters (Yahoo, Finnhub, etc.)
├── cards/       ← route cards (CardModule pattern: mount/update/dispose)
├── ui/          ← reusable UI utilities (theme, router, toast, etc.)
├── styles/      ← CSS layers (tokens, base, components, responsive)
└── locales/     ← i18n translation dictionaries
```

**Key principles:**

- Domain layer is 100% pure — no DOM, no I/O, no `Date.now()`
- Cards follow `CardModule` interface: `mount(container, ctx) → CardHandle`
- Use `patchDOM()` for incremental rendering (not raw `innerHTML`)
- Use `data-action` event delegation at card roots

## 🧪 Testing Guidelines

| Test type     | Location         | Framework        | Run command            |
| ------------- | ---------------- | ---------------- | ---------------------- |
| Unit tests    | `tests/unit/`    | Vitest           | `npm test`             |
| Browser tests | `tests/browser/` | Vitest + browser | `npm run test:browser` |
| E2E tests     | `tests/e2e/`     | Playwright       | `npm run test:e2e`     |

**Vitest runs as two projects — put your test in the right one:**

| Project | Paths                                                                                       | Environment                    |
| ------- | ------------------------------------------------------------------------------------------- | ------------------------------ |
| `node`  | `tests/unit/{domain,worker,providers,types,helpers,mcp}/**`                                  | No DOM globals; `fetch` blocked |
| `dom`   | everything else under `tests/`                                                                 | happy-dom                      |

A test whose path puts it in the `node` project but which still needs browser globals
(`self`, `WebAssembly`) must declare `@vitest-environment happy-dom` in its file docblock —
the config-level `exclude` beats `include`, so the exception cannot be written as a glob.

**Rules:**

- Domain tests are pure — no mocks needed
- Use `makeCandles(prices)` from `tests/helpers/candle-factory.ts` for test data
- Worker tests must mock `globalThis.fetch` — never make real network calls
- Core/card tests mock `localStorage` via `vi.stubGlobal`
- Coverage thresholds: 90% statements/lines/functions, 80% branches
- Use `it.each` for parameterized tests over repeated `it` blocks
- E2E specs must await `waitForAppReady(page)` from `tests/e2e/app-ready.ts`, never a bare
  `waitForLoadState("domcontentloaded")` — the latter races the bootstrap
- Never derive an E2E budget from a hardcoded count ("press Tab up to 10 times"); read the
  bound off the document instead, or it will pass locally and fail in CI
- Playwright visual baselines are platform-specific. Regenerate them with
  `gh workflow run ci.yml --ref main -f update_snapshots=true`, then download and commit the
  `*-linux.png` files. Never commit locally generated `*-win32.png` baselines — CI never
  validates them.

## 🚫 Non-Negotiable Rules

- **No `eslint-disable`** — fix the root cause
- **No `@ts-ignore`** — fix the type, not the error
- **No `TODO` in code** — open a GitHub Issue instead
- **No dead code** — every export must be used
- **No `console.log`** — use `console.warn`/`console.error` only
- **No floating promises** — use `void asyncFn()` or `await`
- **No raw `innerHTML =`** — use `patchDOM()` from `core/patch-dom`
- **No hardcoded foreground on a themed background** — `color: #fff` on `var(--accent)` is
  only correct for one theme. Use `var(--bg-app)` so it flips with the theme.

## 🏷️ File Naming

- TypeScript: `kebab-case.ts` (e.g., `signal-dsl.ts`)
- Tests: `<module-name>.test.ts` (e.g., `signal-dsl.test.ts`)
- CSS: layer-based in `src/styles/`
- Docs: `kebab-case.mdx` in `docs-site/src/content/docs/`

## 🆘 Getting Help

- Read `docs/ARCHITECTURE.md` for the full system design
- Read `.github/copilot-instructions.md` for AI-assisted development conventions
- Browse the [Astro docs-site](https://crosstide.pages.dev/docs) for user guides

## 🌱 Good First Issues

Look for the `good first issue` label on GitHub Issues. These are scoped tasks suitable for
newcomers:

- [#104](https://github.com/RajwanYair/CrossTide/issues/104) — disambiguate one of the 12
  duplicate-named domain modules.
- [#103](https://github.com/RajwanYair/CrossTide/issues/103) — wire up one of the 57 orphaned
  modules in `core`, `ui`, and `cards`. They are tested but imported by nothing, so they never
  execute in the running app. Per `docs/ROADMAP.md` §3.4 these are wired, promoted, or merged —
  never deleted.
- [#105](https://github.com/RajwanYair/CrossTide/issues/105) — complete: all 56 registered
  Worker routes are documented and `KNOWN_GAP` is empty. Close this issue rather than starting
  another documentation tranche.
- Adding a new domain indicator (pure function + tests) — see
  `.github/skills/add-indicator/SKILL.md`
- Adding missing unit tests to reach the coverage threshold
- Documentation improvements and typo fixes
