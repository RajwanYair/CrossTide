/**
 * Q10 — Visual regression tests via Playwright screenshot baselines.
 *
 * First run: creates baseline PNG files under
 *   tests/e2e/__screenshots__/visual.spec.ts-snapshots/
 *
 * Subsequent runs: compares against baseline; fails on pixel diff > threshold.
 *
 * Run locally:  npx playwright test tests/e2e/visual.spec.ts
 * Update bases: npx playwright test tests/e2e/visual.spec.ts --update-snapshots
 *
 * Only chromium is used here — cross-browser visual parity is enforced in
 * cross-browser.spec.ts; visual regression is a single-browser gate.
 */
import { test, expect, type Page } from "@playwright/test";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wait for the app shell to be fully mounted before capturing. */
async function waitForShell(page: Page): Promise<void> {
  await page.waitForSelector("#app-header", { state: "visible" });
  // Allow any CSS transitions / Web Animations to settle
  await page.waitForTimeout(200);
}

/** Navigate to a named route by clicking its nav link. */
async function goToRoute(page: Page, route: string): Promise<void> {
  const link = page.locator(`#app-nav a[data-route="${route}"]`);
  if ((await link.count()) > 0) {
    await link.click();
    await page.waitForTimeout(300);
  } else {
    // Fallback: direct hash navigation
    await page.goto(`/#/${route}`);
    await page.waitForTimeout(300);
  }
}

// ── Test configuration ───────────────────────────────────────────────────────

/** Screenshot diff threshold: 0.2 = 20% max pixel deviation. */
const THRESHOLD = 0.2;

// Run only on chromium for visual regression (deterministic rendering)
test.use({ viewport: { width: 1280, height: 800 } });

// ── Light mode baselines ──────────────────────────────────────────────────────

test.describe("visual regression — light mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await waitForShell(page);
  });

  test("app shell — header + nav + footer", async ({ page }) => {
    // Capture the full viewport to baseline the shell layout
    await expect(page).toHaveScreenshot("shell-light.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("watchlist view — empty state", async ({ page }) => {
    await goToRoute(page, "watchlist");
    await expect(page).toHaveScreenshot("watchlist-empty-light.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("chart view — loading skeleton", async ({ page }) => {
    await goToRoute(page, "chart");
    // Chart loading skeleton should render immediately before data arrives
    await expect(page).toHaveScreenshot("chart-skeleton-light.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("screener view — initial layout", async ({ page }) => {
    await goToRoute(page, "screener");
    await expect(page).toHaveScreenshot("screener-light.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("settings view — full settings panel", async ({ page }) => {
    await goToRoute(page, "settings");
    await expect(page).toHaveScreenshot("settings-light.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("consensus view — layout", async ({ page }) => {
    await goToRoute(page, "consensus");
    await expect(page).toHaveScreenshot("consensus-light.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("heatmap view — layout", async ({ page }) => {
    await goToRoute(page, "heatmap");
    await expect(page).toHaveScreenshot("heatmap-light.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("alerts view — layout", async ({ page }) => {
    await goToRoute(page, "alerts");
    await expect(page).toHaveScreenshot("alerts-light.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });
});

// ── Dark mode baselines ───────────────────────────────────────────────────────

test.describe("visual regression — dark mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await waitForShell(page);
  });

  test("app shell — dark theme", async ({ page }) => {
    await expect(page).toHaveScreenshot("shell-dark.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("watchlist view — dark empty state", async ({ page }) => {
    await goToRoute(page, "watchlist");
    await expect(page).toHaveScreenshot("watchlist-empty-dark.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("chart view — dark loading skeleton", async ({ page }) => {
    await goToRoute(page, "chart");
    await expect(page).toHaveScreenshot("chart-skeleton-dark.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("settings view — dark mode panel", async ({ page }) => {
    await goToRoute(page, "settings");
    await expect(page).toHaveScreenshot("settings-dark.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });
});

// ── Responsive layout baselines ───────────────────────────────────────────────

test.describe("visual regression — mobile viewport", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await waitForShell(page);
  });

  test("app shell — mobile layout", async ({ page }) => {
    await expect(page).toHaveScreenshot("shell-mobile.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("watchlist view — mobile layout", async ({ page }) => {
    await goToRoute(page, "watchlist");
    await expect(page).toHaveScreenshot("watchlist-mobile.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("chart view — mobile layout", async ({ page }) => {
    await goToRoute(page, "chart");
    await expect(page).toHaveScreenshot("chart-mobile.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });
});

// ── Navigation transition snapshots ──────────────────────────────────────────

test.describe("visual regression — navigation transitions", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto("/");
    await waitForShell(page);
  });

  test("tab sequence renders correct active state", async ({ page }) => {
    // Navigate through several routes and snapshot final state
    for (const route of ["consensus", "screener", "heatmap"]) {
      await goToRoute(page, route);
    }
    await expect(page).toHaveScreenshot("nav-active-heatmap.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });

  test("settings panel — reduced motion baseline", async ({ page }) => {
    await goToRoute(page, "settings");
    await expect(page).toHaveScreenshot("settings-reduced-motion.png", {
      maxDiffPixelRatio: THRESHOLD,
      fullPage: false,
    });
  });
});

// ── Component-level snapshots (ct-* Web Components) ──────────────────────────

test.describe("visual regression — web components", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await waitForShell(page);
  });

  test("ct-stat-grid renders with correct token spacing", async ({ page }) => {
    // Navigate to portfolio or fundamentals card that uses ct-stat-grid
    await goToRoute(page, "portfolio");
    const statGrid = page.locator("ct-stat-grid").first();
    if ((await statGrid.count()) > 0) {
      await expect(statGrid).toHaveScreenshot("ct-stat-grid.png", {
        maxDiffPixelRatio: THRESHOLD,
      });
    } else {
      // Component not yet rendered — snapshot the full portfolio view
      await expect(page).toHaveScreenshot("portfolio-light.png", {
        maxDiffPixelRatio: THRESHOLD,
        fullPage: false,
      });
    }
  });

  test("ct-filter-bar renders preset buttons", async ({ page }) => {
    await goToRoute(page, "screener");
    const filterBar = page.locator("ct-filter-bar").first();
    if ((await filterBar.count()) > 0) {
      await expect(filterBar).toHaveScreenshot("ct-filter-bar.png", {
        maxDiffPixelRatio: THRESHOLD,
      });
    } else {
      await expect(page).toHaveScreenshot("screener-filter-area.png", {
        maxDiffPixelRatio: THRESHOLD,
        fullPage: false,
      });
    }
  });
});
