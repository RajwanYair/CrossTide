---
applyTo: "tests/browser/**,tests/e2e/**,.browserslistrc,playwright.config.ts,vitest.browser.config.ts"
---

# 🌐 Browser Compatibility Rules

CrossTide targets progressive enhancement across all major browsers — never break gracefully.

## 📌 Canonical Source Files (all four must stay in sync)

| File                                      | Purpose                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `.browserslistrc`                         | Authoritative browser target list (Autoprefixer and compatibility tooling)     |
| `playwright.config.ts`                    | E2E browser project definitions                                               |
| `vitest.browser.config.ts`                | Vitest browser-mode instances                                                 |
| `package.json` → `lint`                   | Oxlint TypeScript 7 lint command                                                |

**When adding a new browser target, update ALL four files.**

## 🧪 Two Test Types

### 🔬 Browser Unit Tests — `tests/browser/*.browser.test.ts`

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

### 🎭 Playwright E2E Tests — `tests/e2e/*.spec.ts`

Run across ALL projects defined in `playwright.config.ts` (chromium, firefox, webkit + mobile variants).

```typescript
import { test, expect } from "@playwright/test";

test("graceful degradation — page renders without JS", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
});
```

Run: `npm run test:e2e` (all projects)
Run specific: `./node_modules/.bin/playwright test --project=firefox tests/e2e/cross-browser.spec.ts`

Never `npx playwright` — it can fetch a different version than the lockfile pins.
Locally, Playwright browsers live in `C:\ProgramData\ms-playwright`; set
`PLAYWRIGHT_BROWSERS_PATH` if the runner cannot find them.

### ⏳ Waiting for the app to boot

Always gate interaction on `waitForAppReady` from `tests/e2e/app-ready.ts`:

```typescript
import { waitForAppReady } from "./app-ready";

await page.goto("/");
await waitForAppReady(page);
```

Do **not** hand-roll the guard. This form is vacuous and silently resolves
immediately, letting the test race `main()`:

```typescript
// ✗ Wrong — `undefined !== ""` is true, so this passes before the app exists
await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "");
```

That defect dropped the `/` shortcut keypress before its `keydown` listener was
attached, which surfaced as an intermittent CI flake rather than a hard failure.

## 🔍 Feature Detection Rules

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

## ✅ Test Assertion Style

```typescript
// ✓ Test that the detection mechanism works
expect(typeof CSS.supports("container-type", "size")).toBe("boolean");

// ✗ Wrong — asserts specific browser capability (fails on older browsers)
expect(CSS.supports("container-type", "size")).toBe(true);
```

## 🎯 Browser Targets (from .browserslistrc)

```text
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

## 🖼️ Visual Regression Baselines

Baselines are named `<name>-<project>-<platform>.png` and live in
`tests/e2e/visual.spec.ts-snapshots/`. CI runs on linux, so **only `*-linux.png`
baselines matter** — they cannot be generated on Windows.

To (re)generate:

```powershell
gh workflow run ci.yml --ref main -f update_snapshots=true
gh run download <run-id> -n visual-snapshots -D .snap-tmp
```

Then move the PNGs into `tests/e2e/visual.spec.ts-snapshots/` and commit them.
Never commit locally produced `*-win32.png` files — CI never validates them.
Run locally with `--ignore-snapshots` to exercise everything else.

## ⚠️ Common Pitfalls

- Asserting `toBe(true)` on `CSS.supports(...)` — use `typeof` check instead
- Adding a new Playwright project without mirroring in `.browserslistrc`
- Forgetting `TEST_SAMSUNG=1` env var for Samsung Internet UA test paths
- Cross-origin restrictions in mobile emulation — use `page.context().addCookies()` carefully
- **`isVisible()` does not mean clickable.** At mobile widths the sidebar is parked
  off-canvas with `translateX(-220px)`; its links report `visible: true` (non-empty
  box, `visibility: visible`) but sit at negative x, so `click()` hangs until the
  test times out. Compare `boundingBox()` against `page.viewportSize()` first, or
  navigate directly.
- **Forward `Tab` does not start at the top of the document.** After a route change
  the router moves focus into `<main>` for the WCAG 2.4.3 announcement, which also
  sets the sequential focus navigation starting point; `blur()` does not reset it.
  To reach header/nav elements from there, walk backwards with `Shift+Tab`.
- A failing early gate **skips** later jobs. Markdownlint failures once caused the
  Playwright job to be skipped, which read as "not failing" — compare job-level
  conclusions across runs, not just overall status.
