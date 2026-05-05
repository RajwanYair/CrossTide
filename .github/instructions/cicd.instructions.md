---
applyTo: ".github/**,**/*.yml,**/*.yaml"
description: "Use when: editing CI/CD workflows, GitHub Actions, or any YAML config in CrossTide."
---

# CI/CD Instructions — CrossTide

## Workflow Standards

- Use **`actions/checkout@v4`** and **`actions/setup-node@v4`** — current stable major versions. Do NOT use `@v5`/`@v6` (they don't exist for these actions).
- Node.js version in CI: **24** — set via `node-version: '24'` in `actions/setup-node@v4`.
- Set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` in `env:` block when any step uses older GitHub Actions that bundle Node 16/20.
- Set `permissions: contents: read` as default (least privilege); elevate per-job only when needed.
- All npm installs in CI use `npm ci` (deterministic lock-file). Never `npm install` in workflows.
- Bundle size violations must `exit 1` — never use `::warning::` for budget failures.
- Deploy via Cloudflare Pages on push to `main` (`deploy.yml`).
- Worker deploy via `deploy-worker.yml` when `worker/**` changes.
- Single quality gate: `ci.yml` covers typecheck, lint, tests, security, build. Do not create secondary CI files.

## Workflow Map

| Workflow                    | Purpose                                                       | Trigger                               |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| `ci.yml`                    | Typecheck, lint, format, tests, security, build, bundle check | push, pull_request, manual            |
| `deploy.yml`                | Build and publish Cloudflare Pages artifact                   | push to `main`, manual                |
| `deploy-worker.yml`         | Deploy Cloudflare Worker via wrangler                         | `worker/**` changes on `main`, manual |
| `release.yml`               | Build tagged release, generate GitHub Release notes           | tag push `vX.Y.Z`                     |
| `auto-label.yml`            | Label PRs and issues by type                                  | GitHub PR / issue events              |
| `dependabot-auto-merge.yml` | Auto-merge patch-level Dependabot PRs after CI green          | Dependabot PR events                  |
| `copilot-setup-steps.yml`   | Copilot Coding Agent environment setup                        | GitHub Copilot agent invocations      |

Keep `.github/workflows/README.md` aligned with any workflow additions or deletions.

## Copilot Code Review

GitHub Copilot can perform automated PR code reviews:

- Request via `@github-copilot review` in a PR comment, or enable auto-review in repository settings.
- Copilot review runs after CI passes — treat output like any reviewer comment.
- Suggestions are advisory — apply only those that match project rules.
- Do not suppress Copilot review feedback with `copilot:ignore` without a comment explaining why.

## Copilot Coding Agent (`copilot-setup-steps.yml`)

The `copilot-setup-steps.yml` workflow pre-installs Node 24, `npm ci`, and any global CLI tools needed for autonomous Copilot agent runs. Keep it in sync with local dev requirements.

- Confirm `npx wrangler` version matches `wrangler` in `package.json`
- Worker bindings used in Copilot agent tests must use local-dev fake IDs, not production IDs
- The agent runs in an isolated container — do not assume Windows PowerShell syntax in `copilot-setup-steps.yml`; use POSIX shell (`bash`) there

## Security

- Never log secrets in CI output.
- Use `${{ secrets.TOKEN }}` for credentials — never hard-coded.
- Pin GitHub Actions to commit SHAs via Renovate (`actions/<name>@<sha> # vX.Y.Z`) for SLSA L2 supply chain.
- Prefer explicit job-level `permissions:` if a workflow needs more than `contents: read`.
- `npm audit --omit=dev --audit-level=high` must exit 0 in CI.
- `npm audit signatures` must exit 0 in CI (registry signature check).
- All `npm ci` calls in CI use `--ignore-scripts` to satisfy SLSA L3 requirement.

## Editing Rules for `.github/**`

- If you change a workflow, update the table in this file and any markdown that documents it.
- If you add a new secret, document where it is required and which workflow consumes it.
- If you bump an action version, update the SHA pin via Renovate or update manually with a `# vX.Y.Z` comment.
- Preserve bash syntax inside GitHub Actions steps — local developer commands in this repository use PowerShell, but CI runs in Linux containers.
- Do not create workflow files with names matching deleted workflows (`ci-v*.yml`, `test-only.yml`).

## Shell Context

> **Local dev: Windows · Shell: PowerShell** — all commands in this file assume PowerShell for local runs.
> **CI / copilot-setup-steps.yml: Linux · Shell: bash** — use POSIX syntax in workflow YAML.
