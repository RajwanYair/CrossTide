# Cloudflare Resource Provisioning Guide

This document walks through creating all Cloudflare resources required by CrossTide and
wiring their IDs into `worker/wrangler.toml`.

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
  installed and authenticated:
  ```powershell
  npx wrangler login
  ```

---

## Step 1 — KV Namespace (QUOTE_CACHE)

Caches quote, chart, and search responses with market-hours-aware TTLs.

```powershell
# Create production namespace
npx wrangler kv namespace create QUOTE_CACHE
# Output: { id: "abc123..." }

# Create preview namespace (used by PR preview deployments)
npx wrangler kv namespace create QUOTE_CACHE --preview
# Output: { preview_id: "def456..." }
```

Paste the IDs into `worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "QUOTE_CACHE"
id = "abc123..."          # replace PLACEHOLDER_KV_NAMESPACE_ID
preview_id = "def456..."  # replace PLACEHOLDER_KV_PREVIEW_ID
```

---

## Step 2 — D1 Database (DB)

Stores user watchlists, portfolios, alert rules, and CSP violation reports.

```powershell
# Create the database
npx wrangler d1 create crosstide-db
# Output: { database_id: "ghi789..." }
```

Paste into `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "crosstide-db"
database_id = "ghi789..."   # replace PLACEHOLDER_D1_DATABASE_ID
migrations_dir = "migrations"
```

### Apply migrations

```powershell
# Staging / preview
npx wrangler d1 migrations apply crosstide-db --env staging

# Production
npx wrangler d1 migrations apply crosstide-db
```

Migration files live in `worker/migrations/`:

| File                      | Contents                                       |
| ------------------------- | ---------------------------------------------- |
| `0001_initial_schema.sql` | watchlists, portfolios, alerts, settings, sync |
| `0002_alert_history.sql`  | alert_history table + indexes                  |

To check migration status:

```powershell
# Local (requires D1 binding)
curl http://localhost:8787/api/migrations/status

# Via wrangler
npx wrangler d1 migrations list crosstide-db
```

---

## Step 3 — Rate Limiter (RATE_LIMITER)

The `[[unsafe.bindings]]` block for the Rate Limiting API does **not** require a separate
create step — Cloudflare provisions it automatically on `wrangler deploy`. The `namespace_id`
(`1001`) is an arbitrary identifier you choose; it scopes the rate limit counters to this worker.

No action required — the binding in `worker/wrangler.toml` is ready as-is.

---

## Step 4 — Durable Object (TICKER_FANOUT)

The `TickerFanout` Durable Object class is declared in `worker/index.ts` and exported via
`[[durable_objects]]` + `[[migrations]]` in `worker/wrangler.toml`. Cloudflare creates the
namespace automatically on first `wrangler deploy`. No separate provisioning step needed.

---

## Step 5 — Local development

```powershell
# Copy the example file
Copy-Item worker\.dev.vars.example worker\.dev.vars
# Edit worker/.dev.vars with any optional API keys

# Start the worker locally (hot-reload, KV/D1 in-memory stubs)
cd worker
npx wrangler dev
```

The worker runs at `http://localhost:8787`. Vite proxies `/api/*` to it when running
`npx vite` (see `vite.config.ts`).

---

## Step 6 — Deploy

```powershell
# Deploy worker
cd worker
npx wrangler deploy

# Deploy Pages (static build)
cd ..
npm run build
npx wrangler pages deploy dist --project-name crosstide
```

---

## Environment matrix

| Env          | KV Binding | D1 Binding | Data source  |
| ------------ | :--------: | :--------: | ------------ |
| `dev`        |    None    |    None    | Yahoo (real) |
| `preview`    |  Preview   |    None    | Fixture data |
| `staging`    |  Prod KV   |  Prod D1   | Yahoo (real) |
| `production` |  Prod KV   |  Prod D1   | Yahoo (real) |

When `ENVIRONMENT=preview` (set automatically on Cloudflare Pages PR deployments), the
worker serves deterministic fixture data so CI never hits Yahoo rate limits.
