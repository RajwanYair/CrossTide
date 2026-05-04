# Contributing to CrossTide

Thank you for your interest in contributing!

## Development Setup

```bash
node --version   # Must be >=20.0.0
npm install
npm run dev      # http://localhost:5173
```

## Code Standards

- Follow TypeScript strict mode — `tsc --noEmit` must pass with zero errors
- Run `npm run lint:all` before committing (ESLint + Stylelint + HTMLHint + markdownlint)
- Run `npm run format` to auto-format with Prettier
- Domain logic (`src/domain/`) must be pure functions — no DOM, no fetch, no side effects
- Write tests for all domain logic changes
- Never commit API keys, tokens, or secrets

## Quality Gates

All of the following must pass before merging:

| Gate       | Command                 | Requirement             |
| ---------- | ----------------------- | ----------------------- |
| Type check | `npm run typecheck`     | Zero errors             |
| Lint       | `npm run lint:all`      | Zero warnings           |
| Format     | `npm run format:check`  | Exit 0                  |
| Tests      | `npm run test:coverage` | All pass, ≥90% coverage |
| Build      | `npm run build`         | Successful              |
| Bundle     | `npm run check:bundle`  | Under 200 KB            |

Or run everything at once: `npm run ci`

## Pull Request Process

1. Create a feature branch from `main`
2. Make changes with clear, atomic commits
3. Ensure all quality gates pass: `npm run ci`
4. Update documentation if your change affects public behavior
5. Submit a PR with a clear description

## Reporting Issues

Use GitHub Issues. Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
- Console errors (if any)
- Screenshots (if applicable)

## Commit Conventions

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

Common scopes: `watchlist`, `chart`, `screener`, `portfolio`, `core`, `worker`, `ci`, `docs`

## Architecture Overview

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

## Testing Guidelines

| Test type     | Location         | Framework        | Run command            |
| ------------- | ---------------- | ---------------- | ---------------------- |
| Unit tests    | `tests/unit/`    | Vitest           | `npm test`             |
| Browser tests | `tests/browser/` | Vitest + browser | `npm run test:browser` |
| E2E tests     | `tests/e2e/`     | Playwright       | `npm run test:e2e`     |

**Rules:**

- Domain logic: always add unit tests (aim for 100% branch coverage)
- UI changes: add at least one integration test
- New cards: add both unit test and E2E smoke test
- Mock external APIs — never hit real networks in tests
- Use `makeCandles()` from `tests/helpers/` for fixture data

## File Naming

- TypeScript: `kebab-case.ts` (e.g., `signal-dsl.ts`)
- Tests: `<module-name>.test.ts` (e.g., `signal-dsl.test.ts`)
- CSS: layer-based in `src/styles/`
- Docs: `kebab-case.mdx` in `docs-site/src/content/docs/`

## Getting Help

- Read `docs/ARCHITECTURE.md` for the full system design
- Check `docs/COPILOT_GUIDE.md` for AI-assisted development tips
- Browse the [Astro docs-site](https://crosstide.pages.dev/docs) for user guides
