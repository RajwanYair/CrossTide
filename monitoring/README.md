# CrossTide Uptime Monitoring (K17)

Uptime Kuma instance deployed on Fly.io for monitoring CrossTide API health.

## Monitored Endpoints

| Endpoint                     | Interval | Expected                       |
| ---------------------------- | -------- | ------------------------------ |
| `GET /api/health`            | 60s      | HTTP 200, body contains `"ok"` |
| `GET /api/quote?ticker=AAPL` | 120s     | HTTP 200, valid JSON           |
| `GET /` (SPA)                | 300s     | HTTP 200, `<title>` present    |

## Deployment

```bash
# First-time setup
cd monitoring
flyctl launch --config fly.toml --no-deploy
flyctl volumes create uptime_kuma_data --size 1 --region iad
flyctl deploy --config fly.toml

# Status page URL (after setup in Uptime Kuma UI):
# https://crosstide-status.fly.dev/status/crosstide
```

## Initial Configuration

After first deploy, visit `https://crosstide-status.fly.dev` to:

1. Create admin account
2. Add monitors for the endpoints above
3. Create a public status page named `crosstide`
4. The status page badge URL will be:
   ```
   https://crosstide-status.fly.dev/api/badge/1/status
   ```

## README Badge

Add to README.md:

```markdown
[![Status](https://crosstide-status.fly.dev/api/badge/1/status?label=API)](https://crosstide-status.fly.dev/status/crosstide)
```
