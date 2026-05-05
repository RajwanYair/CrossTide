---
applyTo: "tests/browser/**,tests/e2e/**,.browserslistrc,playwright.config.ts,vitest.browser.config.ts"
---

# Browser Compatibility Rules

CrossTide targets progressive enhancement across all major browsers — never break gracefully.

## Canonical Source Files (all four must stay in sync)

| File                                      | Purpose                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `.browserslistrc`                         | Authoritative browser target list (Autoprefixer, Babel, ESLint compat plugin) |
| `playwright.config.ts`                    | E2E browser project definitions                                               |
| `vitest.browser.config.ts`                | Vitest browser-mode instances                                                 |
| `eslint.config.mjs` → `settings.browsers` | ESLint `compat/compat` browser list                                           |

**When adding a new browser target, update ALL four files.**

## Two Test Types

### Browser Unit Tests — `tests/browser/*.browser.test.ts`

Run by Vitest in a real browser via `@vitest/browser-playwright`. Tests load the actual DOM APIs.

```typescript
import { describe, it, expect } from "vitest";

describe("CSS feature detection", () => {
  it("CSS.supports returns boolean for known properties", () => {
    // Test that detection works — not that the feature IS supported (varies by browser)
    expect(typeof CSS.supports("display", "grid")).toBe("boolean");
  });
});
```

Run: `npm run test:browser`

### Playwright E2E Tests — `tests/e2e/*.spec.ts`

Run across ALL projects defined in `playwright.config.ts` (chromium, firefox, webkit + mobile variants).

```typescript
import { test, expect } from "@playwright/test";

test("graceful degradation — page renders without JS", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
});
```

Run: `npm run test:e2e` (all projects)
Run specific: `npx playwright test --project=firefox tests/e2e/cross-browser.spec.ts`

## Feature Detection Rules

- **Detect capabilities, never browsers** — `CSS.supports(...)`, `"IntersectionObserver" in window`, etc.
- **Always graceful** — detection must not throw; wrap in `typeof` or `try/catch`
- **Progressive enhancement** — missing feature → skip enhancement, app still functional
- **No UA sniffing** that changes app _behaviour_ — UA detection for analytics only

```typescript
// ✓ Correct
const hasClipboard = typeof navigator.clipboard?.writeText === "function";
if (hasClipboard) await navigator.clipboard.writeText(text);

// ✗ Wrong — throws when API absent
await navigator.clipboard.writeText(text);
```

## Test Assertion Style

```typescript
// ✓ Test that the detection mechanism works
expect(typeof CSS.supports("container-type", "size")).toBe("boolean");

// ✗ Wrong — asserts specific browser capability (fails on older browsers)
expect(CSS.supports("container-type", "size")).toBe(true);
```

## Browser Targets (from .browserslistrc)

```
last 2 Chrome versions
last 2 Edge versions
last 2 Safari versions (macOS + iOS 16.4+)
last 2 Firefox versions
last 2 Opera versions
last 2 Samsung Internet versions
last 2 UC Browser versions
last 2 QQ Browser versions
not dead
```

## Common Pitfalls

- Asserting `toBe(true)` on `CSS.supports(...)` — use `typeof` check instead
- Adding a new Playwright project without mirroring in `.browserslistrc`
- Forgetting `TEST_SAMSUNG=1` env var for Samsung Internet UA test paths
- Cross-origin restrictions in mobile emulation — use `page.context().addCookies()` carefully
