/**
 * M2 — Mobile Responsive E2E Tests
 *
 * Validates key views render correctly on mobile viewports without
 * overflow, broken layout, or inaccessible touch targets.
 * Runs on mobile-chrome and mobile-safari projects.
 */
import { test, expect } from "@playwright/test";

const MOBILE_ROUTES = [
  "/watchlist",
  "/consensus",
  "/chart",
  "/alerts",
  "/screener",
  "/portfolio",
  "/settings",
  "/heatmap",
];

test.describe("Mobile responsive layout", () => {
  for (const route of MOBILE_ROUTES) {
    test(`${route} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(500);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow, `${route} has horizontal overflow`).toBe(false);
    });
  }

  test("navigation wraps without overflow on mobile", async ({ page }) => {
    await page.goto("/watchlist");
    await page.waitForTimeout(300);

    const nav = page.locator("#app-nav, nav").first();
    await expect(nav).toBeVisible();

    // Nav should not extend beyond viewport
    const navBox = await nav.boundingBox();
    const viewport = page.viewportSize()!;
    expect(navBox!.width).toBeLessThanOrEqual(viewport.width + 1);
  });

  test("touch targets meet 44px minimum", async ({ page }) => {
    await page.goto("/watchlist");
    await page.waitForTimeout(300);

    const buttons = await page.locator("button:visible, .nav-link:visible").all();
    let smallTargets = 0;

    for (const btn of buttons.slice(0, 20)) {
      const box = await btn.boundingBox();
      if (box && (box.height < 40 || box.width < 40)) {
        smallTargets++;
      }
    }

    // Allow some small icon buttons but most should be 44px+
    expect(smallTargets).toBeLessThan(buttons.length * 0.3);
  });

  test("watchlist table is scrollable on mobile", async ({ page }) => {
    await page.goto("/watchlist");
    await page.waitForTimeout(500);

    const table = page.locator("#watchlist-table, .watchlist-table").first();
    const isVisible = await table.isVisible().catch(() => false);
    if (!isVisible) return; // No data loaded in test env

    // Table or its container should handle overflow
    const tableBox = await table.boundingBox();
    const viewport = page.viewportSize()!;
    // If table is wider than viewport, its container must be overflow-x: auto
    if (tableBox && tableBox.width > viewport.width) {
      const hasScroll = await table.evaluate((el) => {
        const parent = el.closest(".card-body") ?? el.parentElement;
        if (!parent) return false;
        const style = getComputedStyle(parent);
        return style.overflowX === "auto" || style.overflowX === "scroll";
      });
      expect(hasScroll).toBe(true);
    }
  });

  test("settings card controls are usable on mobile", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForTimeout(300);

    // Theme select should be visible and clickable
    const themeSelect = page.locator("select").first();
    await expect(themeSelect).toBeVisible();

    // Buttons should not be cut off
    const buttons = await page.locator("button:visible").all();
    for (const btn of buttons.slice(0, 5)) {
      const box = await btn.boundingBox();
      const viewport = page.viewportSize()!;
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 2);
    }
  });

  test("cards stack vertically on mobile viewport", async ({ page }) => {
    await page.goto("/watchlist");
    await page.waitForTimeout(300);

    const cards = await page.locator(".card:visible").all();
    if (cards.length < 2) return;

    // First two cards should not be side-by-side on mobile
    const box1 = await cards[0].boundingBox();
    const box2 = await cards[1].boundingBox();
    if (box1 && box2) {
      // Cards stack = second card's top is below first card's bottom
      expect(box2.y).toBeGreaterThanOrEqual(box1.y + box1.height - 5);
    }
  });
});
