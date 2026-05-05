---
name: debug-fetch
description: "Debug broken API calls and fetch failures in CrossTide. Use when: a card shows an error state, data is not loading or stale, worker route returns 502, provider chain failing, or fetch never resolves. Covers worker tail logs, KV state inspection, fixture comparison, and common failure patterns."
argument-hint: "Which route or card is broken? (e.g. /api/quote/AAPL, screener-card)"
---

# Debug Fetch — CrossTide

Use this skill when the problem is in transport, provider chain, worker validation, KV cache state, or response envelope shape.

## Step 1 — Worker Tail

```powershell
cd worker
npx wrangler tail
```

Watch for:

- Status code (200 / 4xx / 5xx)
- Validation errors from Valibot
- Provider upstream errors
- Rate-limit hits

## Step 2 — Identify the Layer

| Symptom                            | Likely Cause                                      |
| ---------------------------------- | ------------------------------------------------- |
| Worker returns 502                 | Upstream provider error or schema mismatch        |
| Worker returns 400                 | Client request validation failed                  |
| Worker returns 429                 | Rate limit exceeded                               |
| Worker returns demo / fixture data | KV binding missing — check `worker/wrangler.toml` |
| Card shows stale data forever      | TTL too long or `unmount()` not clearing timer    |
| All routes red after deploy        | `wrangler deploy --dry-run` schema error          |
| OpenAPI client mismatch            | `worker/openapi.yaml` drift — regenerate          |

## Step 3 — Check Bindings

```powershell
Get-Content worker/wrangler.toml
```

Verify NO line still says `PLACEHOLDER_KV_NAMESPACE_ID` or `PLACEHOLDER_D1_DATABASE_ID`. Run the provisioning script if needed.

## Step 4 — Test Route Directly

```powershell
cd worker
npx wrangler dev --local
```

In another terminal:

```powershell
curl "http://localhost:8787/api/quote/AAPL"
curl "http://localhost:8787/api/health"
```

Expected envelope:

```json
{ "data": { ... }, "source": "yahoo|cache|demo", "ts": 1730000000000 }
```

## Step 5 — Inspect Browser-Side Cache

```javascript
// In DevTools console
Object.keys(localStorage).filter((k) => k.startsWith("crosstide_"));
// Inspect a key:
JSON.parse(localStorage.getItem("crosstide_quote_AAPL"));
```

Or for the IDB-backed signal stores:

```javascript
indexedDB.open("crosstide");
```

Delete the key + reload to force re-fetch.

## Step 6 — Schema Drift

If a 502 mentions Valibot:

1. Open `worker/providers/<provider>.ts`
2. Find the schema near the failing field
3. Add `v.passthrough()` to the parent object
4. Redeploy and call the route — log the raw response
5. Tighten the schema with the new field shape
6. Update `tests/unit/worker/<route>.test.ts` fixture
7. Remove `v.passthrough()` again

## Step 7 — Run Targeted Tests

```powershell
npx vitest run tests/unit/worker/<route>.test.ts --reporter=verbose
```

If tests pass but production fails, the difference is real upstream — capture the response body via `wrangler tail` and update the fixture.

## Step 8 — Common Fixes

| Problem                       | Fix                                                         |
| ----------------------------- | ----------------------------------------------------------- |
| 502 with `validation` in body | Schema too strict — add field, retry, tighten               |
| Always returns demo data      | `env.QUOTE_CACHE` not bound — fix `worker/wrangler.toml` ID |
| 429 on every request          | Rate-limit budget too low — tune `worker/rate-limit.ts`     |
| Client fails CORS preflight   | Add origin to allowlist in `worker/cors.ts`                 |
| Stale cache served past TTL   | KV TTL not honoured — check `kvPut` `expirationTtl`         |
| OpenAPI schema drift          | Run `npm run gen:api-types`; update `worker/openapi.yaml`   |
| Card never updates            | `unmount()` missing — timer leak, multiple loaders racing   |

## Step 9 — Commit

When the fix is in:

```text
fix(worker): tighten <provider> schema for <field> drift
fix(cards): clear refresh timer on unmount in <name>-card
```
