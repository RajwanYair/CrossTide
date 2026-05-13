/**
 * Visual regression tests — P15: baseline screenshot comparisons.
 *
 * Captures key views at desktop and mobile breakpoints, comparing against
 * golden screenshots stored in tests/visual/__snapshots__/.
 *
 * Update baselines:  npx playwright test tests/visual/ --update-snapshots
 * Run checks:        npx playwright test tests/visual/
 */
import { test, expect } from "@playwright/test";

// Wait for dashboard to fully render (charts, data, animations)
const SETTLE_MS = 2000;

test.describe("visual regression — desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("dashboard default view", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveScreenshot("dashboard-desktop.png", {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test("dark theme", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveScreenshot("dashboard-dark-desktop.png", {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test("screener card", async ({ page }) => {
    await page.goto("/#/screener");
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveScreenshot("screener-desktop.png", {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });
});

test.describe("visual regression — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("dashboard mobile view", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveScreenshot("dashboard-mobile.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });

  test("dark theme mobile", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveScreenshot("dashboard-dark-mobile.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });
});

test.describe("visual regression — tablet", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("dashboard tablet view", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveScreenshot("dashboard-tablet.png", {
      maxDiffPixelRatio: 0.015,
      fullPage: true,
    });
  });
});
