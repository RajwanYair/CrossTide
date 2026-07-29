---
name: onboard-contributor
description: "Get a new CrossTide contributor from clone to merged PR. Use when: setting up the repo for the first time, answering 'where do I start', picking a good first issue, explaining the layer architecture and quality gates, or diagnosing a failing local setup."
argument-hint: "Describe what the contributor wants to work on, or the setup step that is failing"
---

# 🌱 Onboard Contributor — CrossTide

CrossTide is a privacy-first financial analysis PWA: vanilla TypeScript, no UI framework, Vite 8, Vitest 4, Hono 4 on Cloudflare Workers.

## 1️⃣ Step 1 — Setup

```powershell
git clone https://github.com/RajwanYair/CrossTide.git
cd CrossTide
npm install
npm run dev
```

Node 24 is required. `npm install` runs `prepare`, which installs the git hooks — commits are linted by commitlint and staged files by lint-staged.

### Setup troubleshooting

| Symptom                                        | Cause and fix                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `lint-staged: command not found` on commit     | Hooks must call `./node_modules/.bin/<tool>`; git hooks do not inherit npm's PATH. Re-run `npm run prepare`. |
| A CLI resolves to an unexpected version        | Never use `npx` for a devDependency — it may fetch a different version from the registry. Use the bare binary name locally, `./node_modules/.bin/<tool>` in workflows. |
| Playwright cannot find browsers                | `./node_modules/.bin/playwright install`, or point `PLAYWRIGHT_BROWSERS_PATH` at your shared browser directory. |
| Workspace package changes are not picked up    | Build it explicitly: `npm run build --workspace docs-site`.                                 |

## 2️⃣ Step 2 — Learn the Layer Rule

Imports flow in exactly one direction. ESLint and `scripts/arch-check.mjs` enforce it.

```text
types ← domain ← core ← providers ← cards ← ui
```

| Layer           | Contains                          | Hard rule                                                   |
| --------------- | --------------------------------- | ----------------------------------------------------------- |
| `src/types/`    | Interfaces only                   | Imports nothing from other `src/` layers                    |
| `src/domain/`   | Pure calculations                 | No DOM, `fetch`, `Date.now()`, `Math.random()`, no mutable module state |
| `src/core/`     | State, config, caching, fetch     | No UI                                                       |
| `src/providers/`| Yahoo / Finnhub adapters          | Validate everything crossing the boundary                   |
| `src/cards/`    | Route cards (`CardModule`)        | Render via `patchDOM`, never `innerHTML`                    |
| `src/ui/`       | Router, theme, toast              | DOM allowed                                                 |
| `worker/`       | Hono on Cloudflare Workers        | Imports use a `.js` extension                               |

## 3️⃣ Step 3 — Find Something to Work On

Read `.github/CONTRIBUTING.md` first — it holds the canonical setup, PR process and coding standards. Then:

- Filter issues by the **good first issue** label.
- `docs/ROADMAP.md` §5 is the master tracking table; anything marked ⬜ with effort **S** is a reasonable first task.
- Prefer a task in a single layer. Cross-layer changes need more review.

Match the work to a skill:

| Task                        | Skill                              |
| --------------------------- | ---------------------------------- |
| New API endpoint            | `.github/skills/add-worker-route/` |
| New view or page            | `.github/skills/add-card/`         |
| New calculator or signal    | `.github/skills/add-indicator/`    |
| Tests failing or coverage down | `.github/skills/update-tests/`  |
| Data not loading            | `.github/skills/debug-fetch/`      |

## 4️⃣ Step 4 — Know the Non-Negotiables

1. No suppressions — no `eslint-disable`, no `@ts-ignore`, no `--force`. Fix the root cause.
2. No dead artifacts — every file, export and dependency must be referenced.
3. No `TODO` in code — open a GitHub issue instead.
4. No secrets in code — use `.env` (gitignored) or Cloudflare secrets.
5. Validate at boundaries — sanitize all external input.
6. Bundle discipline — CI rejects builds over 250 KB gzip.
7. Every file starts with a `/** … */` docblock — `npm run audit:headers` enforces it.

## 5️⃣ Step 5 — Write the Tests in the Right Project

Vitest runs **two projects**. Putting a test in the wrong one produces confusing "`document` is not defined" or "network blocked" errors.

| Project | Paths                                                        | Environment                          |
| ------- | ------------------------------------------------------------ | ------------------------------------ |
| `node`  | `tests/unit/{domain,worker,providers,types,helpers}/**`      | No DOM; unstubbed `fetch` is blocked |
| `dom`   | Everything else                                              | happy-dom                            |

Two traps worth knowing up front:

- A test under a `node` path that genuinely needs browser globals must declare `@vitest-environment happy-dom` in its file docblock. Config-level `exclude` beats `include`, so this cannot be expressed as a glob.
- In the `dom` project `import.meta.url` is not a `file:` URL, so `fileURLToPath(import.meta.url)` throws. Resolve from the Vitest root instead: `resolve(process.cwd(), "tests/e2e/cards.spec.ts")`.

## 6️⃣ Step 6 — Commit and Open the PR

Commitlint enforces the format:

```text
type(scope): fully lowercase subject, no period, ≤72 chars
```

Types: `feat` `fix` `docs` `refactor` `test` `chore` `perf` `ci`
Scopes: `domain` `worker` `cards` `core` `ui` `ci` `docs` `screener` `portfolio` `alerts` `consensus` `watchlist` `chart`

Body lines must stay under 100 characters — pass multiple `-m` flags rather than one long paragraph.

Run the full gate before pushing:

```powershell
npm run ci
```

That chains typecheck, lint, Stylelint, format check, header audit, coverage, build and bundle size. Coverage must hold at ≥90% statements/lines/functions and ≥80% branches.

## ✅ Definition of Done

- [ ] `npm run dev` serves the app locally
- [ ] The change stays within one layer, or the layer direction is respected
- [ ] New domain logic and new worker routes have tests
- [ ] `npm run ci` passes with zero warnings and zero suppressions
- [ ] Commit messages pass commitlint
- [ ] PR description explains the why, not just the what
