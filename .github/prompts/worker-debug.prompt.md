---
mode: "agent"
description: "Debug a broken Cloudflare Worker route: fetch failures, Valibot validation errors, KV read/write, rate-limit issues, envelope shape mismatches."
tools: ["read_file", "grep_search", "replace_string_in_file", "run_in_terminal"]
---

# Worker Route Debug — CrossTide

Diagnose and fix a failing Cloudflare Worker route. Follow this checklist in order.

## 1. Identify the Failing Route

- Which path is failing? (e.g. `/api/quote/:symbol`, `/api/chart`)
- What error are clients seeing? Check browser devtools network tab and the response body
- Is the Worker deployed? `cd worker && npx wrangler tail` to see live logs

## 2. Type Check Worker

```powershell
npx tsc --project worker/tsconfig.json --noEmit
```

Expected: **0 errors**.

## 3. Valibot Schema Mismatch

Upstream APIs (Yahoo, Finnhub, CoinGecko, ECB) may have changed shape.

- Check the relevant Valibot schema in `worker/providers/<provider>.ts` or `worker/routes/<route>.ts`
- Add `.passthrough()` temporarily to see the raw shape, log it, then tighten the schema
- Run `npx vitest run tests/unit/worker/<route>.test.ts` to verify the schema fixture still matches

## 4. KV Cache Behaviour

- Is `QUOTE_CACHE` (or the relevant binding) declared in `worker/wrangler.toml`?
- Is the namespace ID a real ID, not `PLACEHOLDER_KV_NAMESPACE_ID`?
- `kvGet()` returns `null` on miss — confirm callers handle null
- `kvPut()` failures are non-fatal (try/catch wrapped) — confirm they don't surface as 5xx
- TTL: `quoteTtl(marketState)` — verify market-hours awareness

## 5. Response Envelope Shape

Check `worker/utils/response.ts` (or equivalent):

```ts
{ data: T, source: "yahoo" | "cache" | "demo", ts: number }
```

Client-side `fetchJSON<T>()` in `src/core/fetch.ts` must unwrap `.data`.

Verify with: `Select-String -Pattern '\.data\b' -Path src/core/fetch.ts`.

## 6. Rate Limit / CORS

- Is the request hitting the rate limit? Check `X-RateLimit-Remaining` header
- Is `checkRateLimitKV` enabled when `env.QUOTE_CACHE` present? Falls back to in-memory `checkRateLimit` otherwise
- Is the client origin in the CORS allowlist? Check `worker/cors.ts`
- Per-IP rate limit: `worker/rate-limit.ts` — confirm budget appropriate for the route

## 7. Local Test

```powershell
cd worker
npx wrangler dev --local
```

Then in another terminal:

```powershell
curl "http://localhost:8787/api/quote/AAPL"
curl "http://localhost:8787/api/health"
```

## 8. Common Fixes

| Problem                       | Fix                                                             |
| ----------------------------- | --------------------------------------------------------------- |
| 502 with `validation` in body | Schema too strict — add `.passthrough()` or update field shape  |
| Always returns demo data      | `env.QUOTE_CACHE` not bound — fix `worker/wrangler.toml` ID     |
| 429 on every request          | Rate-limit budget too low or KV binding wrong                   |
| Client fails CORS preflight   | Add origin to allowlist in `worker/cors.ts`                     |
| Stale cache served past TTL   | `kvGet` reading expired entry — TTL not honoured by KV provider |
| OpenAPI schema drift          | Run `npm run gen:api-types`; update `worker/openapi.yaml`       |

## Output

- The root cause in one sentence
- The diff applied to fix it
- Confirmation that `tests/unit/worker/<route>.test.ts` passes
