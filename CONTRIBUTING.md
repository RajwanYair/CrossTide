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
