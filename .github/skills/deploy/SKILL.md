# Skill: Deploy CrossTide

## When to use

- Deploying CrossTide to Cloudflare (Worker + Pages)
- Provisioning new Cloudflare resources (KV, D1, R2)
- Verifying production health after deployment
- Troubleshooting failed deployments

## Prerequisites

- `wrangler` CLI authenticated (`wrangler login`)
- `worker/wrangler.toml` has real binding IDs (not PLACEHOLDERs)
- All quality gates pass (`npm run ci`)

## Deployment Playbook

### 1. Pre-flight checks

```bash
# Verify all gates pass
npm run ci

# Verify wrangler auth
npx wrangler whoami
```

### 2. Deploy Worker

```bash
cd worker
npx wrangler deploy --env production

# Verify
curl https://crosstide-api.workers.dev/api/health
```

### 3. Deploy Pages (automatic via CF Pages)

Push to `main` branch triggers CF Pages deployment automatically.

Manual trigger:

```bash
npx wrangler pages deploy dist --project-name crosstide
```

### 4. Post-deployment verification

```bash
# Health check
curl -s https://crosstide-api.workers.dev/api/health | jq .

# Quote endpoint
curl -s https://crosstide-api.workers.dev/api/quote/AAPL | jq .status

# Pages
curl -sI https://crosstide.pages.dev | head -5
```

### 5. Rollback

CF Pages has instant rollback via the dashboard or:

```bash
npx wrangler pages deployment rollback --project-name crosstide
```

## Provisioning New Resources

### KV Namespace

```bash
npx wrangler kv namespace create QUOTE_CACHE
npx wrangler kv namespace create QUOTE_CACHE --preview
# Copy IDs to worker/wrangler.toml
```

### D1 Database

```bash
npx wrangler d1 create crosstide-db
npx wrangler d1 migrations apply crosstide-db
```

### R2 Bucket

```bash
npx wrangler r2 bucket create crosstide-ohlcv
```

## Common Failures

| Symptom | Cause | Fix |
|---|---|---|
| 500 on all routes | Missing KV binding | Check wrangler.toml IDs |
| CORS error | Missing origin in cors.ts | Add origin to allowlist |
| Rate limit 429 | KV write limit (1K/day free) | Increase TTL or upgrade plan |
| D1 error | Missing migration | Run `wrangler d1 migrations apply` |
| Stale data | KV cache not expiring | Check TTL values |

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `FINNHUB_API_KEY` | CF Worker secret | Finnhub provider auth |
| `GLITCHTIP_DSN` | CF Worker secret | Error reporting |
| `PLAUSIBLE_DOMAIN` | CF Worker secret | Analytics domain |
