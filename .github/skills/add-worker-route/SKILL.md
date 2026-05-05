---
name: add-worker-route
description: "Add a new Hono route to the CrossTide Cloudflare Worker. Use when: adding a new API endpoint, integrating a new market data provider, exposing a new server-side calculation, or adding a new WebSocket fan-out. Produces a complete, production-ready integration with KV cache, Valibot validation, rate limit, OpenAPI entry, and tests."
argument-hint: "Describe the route: path, HTTP method, upstream provider, response shape, cache TTL"
---

# Add Worker Route — CrossTide

Use this skill when shipping a complete, maintainable worker route — not just "make a fetch work".

## Step 1 — Plan

| Decision      | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Route path    | `/api/<noun>` or `/api/<noun>/:param` — kebab-case                           |
| HTTP method   | `GET` for reads (cacheable), `POST` for compute / mutations                  |
| Cache key     | Stable string for KV (e.g. `quote:AAPL`, `chart:AAPL:1d`)                    |
| Cache TTL     | `quoteTtl(marketState)` for live quotes; fixed seconds for ref data          |
| Provider      | Yahoo, Finnhub, CoinGecko, ECB, etc. — file in `worker/providers/`           |
| Rate limit    | Default per-IP budget; raise or lower in `worker/rate-limit.ts` if justified |
| OpenAPI entry | New `paths.<route>.<method>` block in `worker/openapi.yaml`                  |

## Step 2 — Provider Module

Create or extend `worker/providers/<provider>.ts`:

```ts
import * as v from "valibot";

const ResponseSchema = v.object({
  // describe upstream shape, use v.passthrough() temporarily then tighten
});

export type ProviderResult = v.InferOutput<typeof ResponseSchema>;

export async function fetch<Provider><Resource>(symbol: string): Promise<ProviderResult> {
  const url = new URL(`https://upstream.example.com/quote/${encodeURIComponent(symbol)}`);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  const json = await res.json();
  return v.parse(ResponseSchema, json);
}
```

## Step 3 — Route Handler

Create `worker/routes/<route>.ts`:

```ts
import type { Context } from "hono";
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";
import { fetch<Provider><Resource> } from "../providers/<provider>.js";

const TTL = 60; // seconds

export async function handle<Route>(c: Context<{ Bindings: Env }>): Promise<Response> {
  const symbol = c.req.param("symbol");
  if (!symbol || !/^[A-Z0-9.-]{1,8}$/.test(symbol)) {
    return c.json({ error: "invalid symbol" }, 400);
  }
  const cacheKey = `<resource>:${symbol}`;

  if (c.env.QUOTE_CACHE) {
    const cached = await kvGet<ProviderResult>(c.env.QUOTE_CACHE, cacheKey);
    if (cached) return c.json({ data: cached, source: "cache", ts: Date.now() });
  }

  try {
    const data = await fetch<Provider><Resource>(symbol);
    if (c.env.QUOTE_CACHE) await kvPut(c.env.QUOTE_CACHE, cacheKey, data, TTL);
    return c.json({ data, source: "<provider>", ts: Date.now() });
  } catch (err) {
    return c.json({ error: "upstream", detail: (err as Error).message }, 502);
  }
}
```

## Step 4 — Wire In `worker/index.ts`

```ts
import { handle<Route> } from "./routes/<route>.js";
// ...
app.get("/api/<route>/:symbol", handle<Route>);
```

## Step 5 — OpenAPI

Add the route to `worker/openapi.yaml`:

```yaml
/api/<route>/{symbol}:
  get:
    summary: <one-line description>
    parameters:
      - name: symbol
        in: path
        required: true
        schema: { type: string, pattern: "^[A-Z0-9.-]{1,8}$" }
    responses:
      "200":
        description: OK
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/<Schema>"
      "400": { description: invalid input }
      "502": { description: upstream error }
```

Then regenerate the client types:

```powershell
npm run gen:api-types
```

## Step 6 — Tests

Create `tests/unit/worker/<route>.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handle<Route> } from "../../../worker/routes/<route>.js";

describe("<route>", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns 400 on invalid symbol", async () => {
    const c = makeCtx({ symbol: "***" });
    const res = await handle<Route>(c);
    expect(res.status).toBe(400);
  });

  it("calls upstream and caches", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ /* fixture */ })),
    );
    // assert KV write + envelope shape
  });

  it("serves from cache on second call", async () => {
    // mock kvGet to return fixture
    // assert no fetch called
  });
});
```

NEVER make real network calls — always mock `globalThis.fetch`.

## Step 7 — Validate

```powershell
npx tsc --project worker/tsconfig.json --noEmit
npx vitest run tests/unit/worker/<route>.test.ts
cd worker; npx wrangler deploy --dry-run; cd ..
```

## Step 8 — Commit

```text
feat(worker): add /api/<route> with kv cache and valibot validation
```
