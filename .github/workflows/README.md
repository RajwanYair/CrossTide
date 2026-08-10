# GitHub Actions Workflows

This directory contains the repository's GitHub Actions workflows. Keep this map aligned with the filenames on disk and update it whenever a workflow is added, removed, or renamed.

| Workflow | Purpose | Trigger |
| --- | --- | --- |
| `auto-label.yml` | Apply labels to pull requests | Pull request |
| `branch-protection.yml` | Audit branch protection settings | Manual, scheduled |
| `cf-pages.yml` | Build and deploy the app to Cloudflare Pages when credentials are available | Push, pull request |
| `ci.yml` | Unified typecheck, lint, tests, security, build, and bundle gate | Push, pull request, manual |
| `codeql.yml` | Run CodeQL analysis | Push, pull request, scheduled |
| `copilot-setup-steps.yml` | Prepare the Copilot coding environment | Manual |
| `data-accuracy.yml` | Check market-data fixture accuracy | Scheduled, manual |
| `dependabot-auto-merge.yml` | Auto-merge eligible Dependabot updates | Dependabot pull request |
| `docs.yml` | Build the Astro documentation site | Push, manual |
| `lighthouse.yml` | Run Lighthouse CI audits | Push, pull request |
| `link-check.yml` | Check local documentation links and report issues | Scheduled, manual |
| `pages.yml` | Build and publish the GitHub Pages documentation site | Push, manual |
| `perf-regression.yml` | Compare bundle size and Web Vitals | Push, pull request |
| `pr-coverage.yml` | Report pull-request coverage delta | Pull request, push |
| `pr-sbom-diff.yml` | Compare the pull-request software bill of materials | Pull request |
| `publish-domain.yml` | Build and publish `@crosstide/domain` | Version tag, manual |
| `release.yml` | Build tagged release assets and publish release notes | Version tag |
| `scorecard.yml` | Run OpenSSF Scorecard analysis | Push, scheduled |
| `security.yml` | Run dependency and application security checks | Scheduled, push, pull request, manual |
| `smoke.yml` | Run production smoke checks | Scheduled, manual |
| `stale.yml` | Manage stale issues and pull requests | Scheduled, manual |
| `supply-chain.yml` | Run supply-chain and license checks | Push, pull request, scheduled |
| `trivy.yml` | Scan the repository and images with Trivy | Scheduled, push, pull request |
| `trufflehog.yml` | Scan history for verified secrets | Push, pull request, scheduled, manual |
| `visual-baselines.yml` | Generate visual-regression baselines | Manual |
| `visual-regression.yml` | Run visual-regression tests | Pull request |
| `wasm.yml` | Build available WASM modules and enforce their size budget | Push, pull request |
| `zap-baseline.yml` | Run the informational OWASP ZAP baseline scan | Scheduled, manual |

`ci.yml` is the unified quality gate. Deployment, publishing, scheduled security, and reporting workflows are separate by design and must not be described as replacements for that gate.
