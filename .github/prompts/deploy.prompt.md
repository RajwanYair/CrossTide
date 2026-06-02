---
description: "Deploy CrossTide to Cloudflare production"
---

# Deploy to Production

Follow the deployment playbook in `.github/skills/deploy/SKILL.md`.

## Pre-flight

1. Run `npm run ci` — all gates must pass
2. Verify `worker/wrangler.toml` has real binding IDs (no PLACEHOLDERs)
3. Run `npx wrangler whoami` to confirm authentication

## Deploy

1. Deploy Worker: `cd worker && npx wrangler deploy`
2. Pages deploys automatically on push to `main`
3. Verify: `curl https://crosstide-api.workers.dev/api/health`

## Post-deploy verification

- `/api/health` returns 200 with provider status
- `/api/quote/AAPL` returns live data
- Pages loads at `crosstide.pages.dev`
- No errors in Worker logs (`wrangler tail`)
