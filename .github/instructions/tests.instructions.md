---
applyTo: "tests/**"
---

# Test Conventions

## Test Type Locations

| Type    | Location         | Framework             | Command                |
| ------- | ---------------- | --------------------- | ---------------------- |
| Unit    | `tests/unit/`    | Vitest + happy-dom    | `npm test`             |
| Browser | `tests/browser/` | Vitest + real browser | `npm run test:browser` |
| E2E     | `tests/e2e/`     | Playwright            | `npm run test:e2e`     |

File mirrors source: `src/domain/foo.ts` → `tests/unit/domain/foo.test.ts`

## Domain Tests (pure — no mocks)

```typescript
import { describe, it, expect } from "vitest";
import { makeCandles } from "../../helpers/candle-factory";
import { computeMyIndicator } from "../../../src/domain/indicators/my-indicator";

describe("computeMyIndicator", () => {
  it.each([
    { prices: [1, 2, 3, 4, 5], period: 3, expected: [2, 3, 4] },
    { prices: [10, 20, 30], period: 2, expected: [15, 25] },
  ])("period=$period on $prices.length prices → $expected", ({ prices, period, expected }) => {
    expect(computeMyIndicator(makeCandles(prices), period)).toEqual(expected);
  });

  it("returns null when candles < period", () => {
    expect(computeMyIndicator(makeCandles([1, 2]), 5)).toBeNull();
  });
});
```

- `makeCandles(prices: number[])` — helper in `tests/helpers/candle-factory.ts`
- No mocks, no stubs — pure functions have no side effects to mock

## Worker Tests (mock fetch + KV)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleMyRoute } from "../../../worker/routes/my-route.js";

const mockKV = { get: vi.fn(), put: vi.fn() };
const mockEnv = { KV: mockKV } as unknown as Env;

describe("handleMyRoute", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("400 for invalid input", async () => {
    const res = await handleMyRoute("!!!", mockEnv);
    expect(res.status).toBe(400);
  });

  it("serves cache without upstream fetch", async () => {
    mockKV.get.mockResolvedValue(JSON.stringify({ data: "cached" }));
    const res = await handleMyRoute("AAPL", mockEnv);
    expect(res.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("502 when upstream fails", async () => {
    mockKV.get.mockResolvedValue(null);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 503 });
    const res = await handleMyRoute("AAPL", mockEnv);
    expect(res.status).toBe(502);
  });
});
```

## Card Tests (mock localStorage/DOM APIs)

```typescript
import { describe, it, expect, vi } from "vitest";
import card from "../../../src/cards/my-card";

describe("my-card", () => {
  it("renders on mount", async () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => null), setItem: vi.fn() });
    const el = document.createElement("div");
    card.mount(el, {} as CardContext);
    await Promise.resolve(); // flush microtasks
    expect(el.querySelector("[data-action]")).toBeTruthy();
    vi.restoreAllMocks();
  });
});
```

## Coverage Requirements

| Metric     | Threshold |
| ---------- | --------- |
| Statements | ≥ 90%     |
| Lines      | ≥ 90%     |
| Functions  | ≥ 90%     |
| Branches   | ≥ 80%     |

Run: `npm run test:coverage` — fails CI if thresholds not met.

## Rules

- **`it.each`** for parameterized cases — never repeat `it` blocks with only data differences
- **Never** make real network calls — `vi.stubGlobal("fetch", vi.fn())`
- **`afterEach(() => vi.restoreAllMocks())`** — always clean up stubs
- **Import paths**: 3 levels up from `tests/unit/domain/` → `../../../src/domain/`
- **Worker imports**: `.js` extension — `from "../../../worker/routes/foo.js"`
- **`describe` mirrors** source file path: `describe("computeEma", ...)` not `describe("EMA indicator", ...)`
