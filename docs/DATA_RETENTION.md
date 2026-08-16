# Data Retention And Privacy Policy

> **Owner:** Security and operations maintainers · **Related:** [`SECRET_LIFECYCLE.md`](SECRET_LIFECYCLE.md),
> [`adr/0003-d1-user-persistence.md`](adr/0003-d1-user-persistence.md),
> [`adr/0017-threat-model.md`](adr/0017-threat-model.md)

This document defines what CrossTide stores about a user, for how long, and how a
user removes it. It closes roadmap item S04. [ADR-0017](adr/0017-threat-model.md)
already established that "no default retention policy is promised until D1-backed
persistence is deployed" — this document is that policy.

## What Is Stored

| Data | Store | Table / key | Contains PII? |
|---|---|---|---|
| Passkey credential | Cloudflare D1 | `credentials` (migration `0003_passkey_auth.sql`) | WebAuthn public key + credential ID; no biometric data ever reaches the server |
| Provider API keys (BYOK) | Cloudflare D1 | `user_api_keys` (migration `0004_byok.sql`) | AES-256-GCM ciphertext only; server never holds a decryption key (see [`SECRET_LIFECYCLE.md`](SECRET_LIFECYCLE.md)) |
| Fired alert log | Cloudflare D1 | `alert_history` (migration `0002_alert_history.sql`) | Ticker, condition, and value that triggered the alert; keyed by `user_id`, not email/name |
| Watchlist, theme, layout preferences | Browser `localStorage` | client-side only | Never transmitted to the Worker |
| Anonymous usage analytics | Plausible (cookieless) | `src/core/plausible.ts`, gated by `VITE_PLAUSIBLE_URL`/`VITE_PLAUSIBLE_SITE` | No cookies, no IP storage (Plausible's standard cookieless model); disabled entirely unless both env vars are set at build time |
| Client error reports | GlitchTip | `src/core/telemetry.ts`, gated by `VITE_GLITCHTIP_DSN`, 25% sample rate | Error message, stack, source; no request bodies or user input captured |

## Retention

| Data | Retention | Deletion mechanism |
|---|---|---|
| `alert_history` | 180 days | Enforced by a daily Cloudflare Cron Trigger (`0 3 * * *`, see `worker/wrangler.toml`'s `[triggers]`) that calls `purgeExpiredAlertHistory()` in `worker/routes/alert-history.ts` — not a database TTL, but no longer an operator-run manual step |
| `user_api_keys` | Until the user removes the key or deletes their passkey credential | Cascades via `ON DELETE CASCADE` on `credentials.credential_id` |
| `credentials` (passkey) | Until the user revokes it | User-initiated delete removes the row and cascades to `user_api_keys` |
| Plausible analytics events | Governed by the operator's own Plausible instance retention (default 30 days on plausible.io-hosted accounts; self-hosted instances configure their own) | Not controllable per-user; CrossTide sends no user identifier that would allow row-level deletion |
| GlitchTip error events | Governed by the operator's own GlitchTip/Sentry-compatible instance retention | Same as above |

Closed (S04): the daily purge cron above enforces the 180-day window automatically;
it no longer depends on an operator remembering to run a manual query.

## Consent And Opt-Out

- Passkey, BYOK, and alert-history storage are **opt-in by construction**: none of
  these tables gain a row unless the user completes a passkey registration, submits a
  provider key, or creates an alert rule. There is nothing to opt out of because
  nothing is written by default.
- Analytics and error reporting are **build-time opt-in for the operator**, not a
  runtime per-visitor consent toggle: `initTelemetry()` in `src/main.ts` only wires a
  sink when its corresponding `VITE_*` variable is defined at build time. A fork or
  self-hosted deployment that does not set `VITE_PLAUSIBLE_URL`/`VITE_GLITCHTIP_DSN`
  ships with both sinks fully absent from the bundle.
- When a deployment does enable those sinks, a visitor can opt out at runtime from
  Settings → "Anonymous analytics". The toggle (`src/cards/settings.ts`,
  `src/core/telemetry-preference.ts`) persists the choice in `localStorage` and calls
  `AnalyticsClient.setEnabled(false)` immediately, and the preference is re-applied on
  every subsequent load before the first analytics event fires.
- **What is collected and why:** Plausible receives cookieless pageviews and named
  events (route changes, feature usage) to understand which workflows are used;
  GlitchTip receives a 25%-sampled error message, stack, and source to catch
  regressions. Neither sink receives ticker symbols, watchlist contents, or any other
  user-entered data — see `src/core/telemetry.ts` for the exact payload shape.

## Export And Deletion Requests

A user (or the operator on a user's behalf) can remove or export all D1-backed data by:

1. Deleting the passkey credential (removes `credentials` row and cascades to
   `user_api_keys`).
2. Calling `DELETE /api/alerts/history?user_id=<id>` — deletes every `alert_history`
   row for that user and returns `{ deleted: <count> }`. There is no partial-delete
   mode; an operator-run `wrangler d1 execute` query is no longer required.
3. Calling `GET /api/alerts/history/export?user_id=<id>` (add `&format=csv` for a
   CSV download) to export up to 10,000 rows of that user's alert history as JSON
   or CSV before deleting it.

Both endpoints are documented in `worker/routes/openapi.ts` / `/openapi.json`. No
authentication is required beyond knowing the `user_id` — the same trust model the
existing `GET /api/alerts/history` query endpoint already used.

## Metrics Purpose Catalog (G05)

G05 asks CrossTide to measure adoption, reliability, and documentation success
without compromising privacy. Retention and opt-out are already covered above;
this section states each metric's actual purpose so "we track things" cannot
silently drift into tracking things nobody uses for anything.

| Surface | Metric | Purpose | Source |
|---|---|---|---|
| Adoption | `search`, `chart-range`, `card-view`, `theme-change`, `passkey-register`, `export` events | Identify which workflows are actually used, to prioritize maintenance and future work over unused surfaces | `src/core/plausible.ts` (`trackEvent` and its named helpers) |
| Reliability | 25%-sampled client error reports (message, stack, source) | Catch regressions in production that unit/E2E tests did not | `src/core/telemetry.ts` (GlitchTip sink) |
| Reliability | Daily smoke test (`smoke.yml`) and CI's MCP health check (`check:mcp-health`, roadmap P06) | Catch upstream schema drift and broken builds before a user reports them | `.github/workflows/smoke.yml`, `scripts/check-mcp-health.mjs` |
| Documentation success | *(none yet)* | Not measured today. `docs-site` (Astro Starlight) has no analytics of any kind — it ships no `VITE_PLAUSIBLE_URL`-gated script and is a fully separate build from the app that carries `src/core/plausible.ts`. Its only real deployment is GitHub Pages at `https://rajwanyair.github.io/CrossTide/docs/` (`pages.yml`; `cf-pages.yml` does not build `docs-site` at all, despite its own comment implying Cloudflare Pages is primary — confirmed by reading both workflows). Adding a page-view metric requires first registering that exact domain as a Plausible site, an operator/account action outside this repository, not a code gap. | N/A — do not add a script tag speculatively; an unregistered domain accepts events silently and reports nothing, the "gate that cannot fail" pattern this project rejects elsewhere |

Every row above with a live metric is subject to the same retention, consent,
and opt-out rules already defined in this document — this table does not add a
new data-handling policy, it names why each existing metric exists.

## Acceptance Evidence

- This document is linked from [`docs/OWNERSHIP.md`](OWNERSHIP.md) and
  [`.github/SECURITY.md`](../.github/SECURITY.md).
- Any new D1 table that stores user-identifying data must add a row to the "What Is
  Stored" table in the same migration's pull request.
