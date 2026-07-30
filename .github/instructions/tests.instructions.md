---
applyTo: "tests/**"
---

# 🧪 Test Conventions

## 📍 Test Type Locations

| Type    | Location         | Framework             | Command                |
| ------- | ---------------- | --------------------- | ---------------------- |
| Unit    | `tests/unit/`    | Vitest (node or happy-dom, see below) | `npm test` |
| Browser | `tests/browser/` | Vitest + real browser | `npm run test:browser` |
| E2E     | `tests/e2e/`     | Playwright            | `npm run test:e2e`     |

File mirrors source: `src/domain/foo.ts` → `tests/unit/domain/foo.test.ts`

## ⚡ Test Environments (two Vitest projects)

Unit tests are split so DOM-free suites skip happy-dom construction — this is
what keeps the suite fast, so keep new tests on the correct side.

| Project | Paths | Environment | Network guard |
| ------- | ----- | ----------- | ------------- |
| `node` | `tests/unit/{domain,worker,providers,types,helpers}/**` | `node` | `tests/helpers/node-network.ts` |
| `dom`  | all other `tests/**` | `happy-dom` | `tests/helpers/happy-dom-network.ts` |

- **No DOM globals in the `node` project** — `document`, `window`, `localStorage`,
  `customElements` and `navigator` are unavailable there by design.
- If a DOM-free-by-path test genuinely needs browser globals (`self`,
  `WebAssembly`), add `@vitest-environment happy-dom` to its file docblock.
  Config-level `exclude` beats `include`, so this cannot be expressed as a glob.
- Both guards block unstubbed outbound `fetch`. Stub `fetch` in the suite itself
  (module scope, `beforeAll`, or `beforeEach`) — the guard is only a default.
- Wall-clock budget assertions must use `{ retry: 2 }` or live in `tests/bench/`;
  they flake under the parallel suite.
- **Reading a repo file from a test?** Resolve from the Vitest root:
  `readFileSync(resolve(process.cwd(), "tests/e2e/cards.spec.ts"))`. happy-dom
  rewrites `import.meta.url` to a non-`file:` scheme, so `fileURLToPath` throws
  `ERR_INVALID_URL_SCHEME` in the `dom` project.

## 🧮 Domain Tests (pure — no mocks)

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

## 🔌 Worker Tests (mock fetch + KV)

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

## 🃏 Card Tests (mock localStorage/DOM APIs)

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

## 📊 Coverage Requirements

| Metric     | Threshold |
| ---------- | --------- |
| Statements | ≥ 90%     |
| Lines      | ≥ 90%     |
| Functions  | ≥ 90%     |
| Branches   | ≥ 80%     |

Run: `npm run test:coverage` — fails CI if thresholds not met.

## 📏 Rules

- **`it.each`** for parameterized cases — never repeat `it` blocks with only data differences
- **Never** make real network calls — `vi.stubGlobal("fetch", vi.fn())`
- **`afterEach(() => vi.restoreAllMocks())`** — always clean up stubs
- **Import paths**: 3 levels up from `tests/unit/domain/` → `../../../src/domain/`
- **Worker imports**: `.js` extension — `from "../../../worker/routes/foo.js"`
- **`describe` mirrors** source file path: `describe("computeEma", ...)` not `describe("EMA indicator", ...)`

## 🎭 Playwright Matrix Rules (`tests/e2e/`)

- Prefer data-driven route matrices for card coverage, but keep assertions aligned with actual DOM contracts:
  - Views with static card shells in `index.html` should assert heading + card visibility.
  - Container-only views should assert non-empty rendered content, not pre-existing `<h2>`.
- When testing watchlist symbol entry, dismiss autocomplete (`Escape`) before pressing Enter if the test is validating typed-symbol acceptance.
- Add and maintain a unit guard that every card route in `src/cards/registry.ts` round-trips through router parsing/building.
- `tests/e2e/cards.spec.ts` hand-mirrors the registry (importing the card graph
  into the Node runner would pull in DOM-only modules). `tests/unit/cards/registry.test.ts`
  parses that spec as text and fails on drift in either direction — when you add
  a card, add its `{ route, viewId }` entry to the matrix.
- The `webServer` command must be `npm run dev -- --port 4173`, never `npx vite`.
- Ensure deep-link E2E scenarios subscribe to route changes before initial router dispatch in app code.
- Gate every spec on `waitForAppReady` from `tests/e2e/app-ready.ts`. Never hand-roll
  `getElementById(id)?.textContent !== ""` — it is `undefined !== ""` when the element
  is absent, so it resolves instantly and races the bootstrap.
- Visual baselines are platform-specific (`<name>-<project>-linux.png`) and must be
  generated in CI, not on Windows. See `.github/instructions/browser.instructions.md`.
