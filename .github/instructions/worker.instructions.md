---
applyTo: "worker/**,tests/unit/worker/**"
---

# Worker Layer Rules

Hono on Cloudflare Workers. Every route handler lives in `worker/routes/`, wired in `worker/index.ts`.

## Critical Requirements

- **`.js` extension** on ALL imports — CF Workers ESM mandates explicit extensions
- **Validate first** — reject invalid input with `Response.json({ error }, { status: 400 })`
- **`Response.json(data)`** for JSON — never `new Response(JSON.stringify(data))`
- **KV cache** every external fetch — see TTL strategy below
- **Wire in `worker/index.ts`** — `app.get("/api/path", (c) => handler(param, c.env))`

## Route Handler Pattern

```typescript
// worker/routes/my-route.ts
import type { Env } from "../index.js";
import { getKvCache, setKvCache } from "../kv-cache.js";

export async function handleMyRoute(symbol: string, env: Env): Promise<Response> {
  // 1. Validate
  if (!symbol || !/^[A-Z]{1,10}$/.test(symbol)) {
    return Response.json({ error: "invalid symbol" }, { status: 400 });
  }

  // 2. KV cache check
  const cacheKey = `my-route:${symbol}`;
  const cached = await getKvCache(env.KV, cacheKey);
  if (cached) return Response.json(cached);

  // 3. Fetch from provider
  const raw = await fetch(`https://provider.com/api/${encodeURIComponent(symbol)}`);
  if (!raw.ok) return Response.json({ error: "upstream error" }, { status: 502 });
  const data: unknown = await raw.json();

  // 4. Validate response shape, then cache
  // validateMyShape(data) throws on bad shape
  await setKvCache(env.KV, cacheKey, data, { ttl: 300 });

  // 5. Return
  return Response.json(data);
}
```

## KV TTL Strategy

```typescript
import { isMarketHours } from "../kv-cache.js";
const ttl = isMarketHours() ? 60 : 86400; // 1 min market hours, 24 h otherwise
```

## Rate Limiting

- Middleware applied in `worker/index.ts` via `app.use("*", rateLimitMiddleware)`
- KV-backed sliding window — 100 req/min per IP
- See `worker/rate-limit.ts` for implementation

## Environment Bindings (`Env` type in `worker/index.ts`)

| Binding       | Type                   | Purpose                   |
| ------------- | ---------------------- | ------------------------- |
| `KV`          | KVNamespace            | Cache storage             |
| `DB`          | D1Database             | Alert history, migrations |
| `TICKER_DO`   | DurableObjectNamespace | WS fan-out                |
| `YAHOO_KEY`   | string                 | Yahoo Finance API key     |
| `FINNHUB_KEY` | string                 | Finnhub API key           |

## Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleMyRoute } from "../../../worker/routes/my-route.js";

const mockEnv = { KV: { get: vi.fn(), put: vi.fn() } } as unknown as Env;

describe("handleMyRoute", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for invalid symbol", async () => {
    const res = await handleMyRoute("!!!", mockEnv);
    expect(res.status).toBe(400);
  });

  it("returns cached data without fetching upstream", async () => {
    mockEnv.KV.get = vi.fn().mockResolvedValue(JSON.stringify({ price: 100 }));
    const res = await handleMyRoute("AAPL", mockEnv);
    expect(res.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });
});
```

- `vi.stubGlobal("fetch", vi.fn())` — **never** make real network calls in tests
- Mock `env.KV.get` returning `null` to simulate cache miss
- Test: 400 invalid, 200 cached, 200 fresh, 502 upstream error

## Common Pitfalls

- Missing `.js` on imports — will fail silently in CF Workers
- `new Response(JSON.stringify(x))` — use `Response.json(x)` instead
- Forgetting to wire route in `worker/index.ts` — route exists but is never reachable
- Real fetch in tests — always use `vi.stubGlobal("fetch", vi.fn())`
- Missing input validation — sanitize symbol/pair/id with regex before use
