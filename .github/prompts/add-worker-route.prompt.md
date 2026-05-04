---
description: "Add a new Hono worker API route with KV caching and tests"
mode: "agent"
tools: ["read_file", "create_file", "replace_string_in_file", "run_in_terminal", "runTests"]
---

# Add Worker API Route

Create a new worker route following the established pattern.

## Steps

1. Create `worker/routes/{name}.ts` following the `fundamentals.ts` pattern
2. Validate input with Valibot schema — reject malformed requests with 400
3. Check KV cache with market-hours-aware TTL
4. Fetch from upstream provider on cache miss
5. Validate upstream response with Valibot schema
6. Store in KV with appropriate TTL
7. Return `Response.json(data)`
8. Wire the handler in `worker/index.ts`: `app.get("/api/{path}", ...)`
9. Use `.js` extension on all imports (CF Workers ESM requirement)

## Tests

Write tests in `tests/unit/worker/{name}.test.ts`:

- Mock `globalThis.fetch` — **never make real network calls**
- Test: valid response cached and returned
- Test: cache hit returns without upstream call
- Test: invalid input returns 400
- Test: upstream failure handled gracefully

## Validation

Run `npm run ci` to verify all quality gates pass.

## User Request

{{input}}
