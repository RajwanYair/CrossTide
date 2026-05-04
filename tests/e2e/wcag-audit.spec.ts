/**
 * WCAG 2.2 AA formal audit — axe-core across all 19 routes.
 *
 * K15: Ensures 0 serious/critical violations on every view.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ALL_ROUTES = [
  "/watchlist",
  "/consensus",
  "/chart",
  "/alerts",
  "/heatmap",
  "/screener",
  "/portfolio",
  "/risk",
  "/backtest",
  "/consensus-timeline",
  "/signal-dsl",
  "/multi-chart",
  "/correlation",
  "/market-breadth",
  "/earnings-calendar",
  "/macro-dashboard",
  "/sector-rotation",
  "/relative-strength",
  "/settings",
  "/provider-health",
  "/seasonality",
  "/comparison",
  "/strategy-comparison",
];

for (const route of ALL_ROUTES) {
  test(`WCAG 2.2 AA: ${route} has no serious/critical violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForTimeout(500); // allow cards to render

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    if (serious.length > 0) {
      const summary = serious
        .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`)
        .join("\n");
      expect(serious, `Route ${route} has violations:\n${summary}`).toHaveLength(0);
    }
  });
}

test("all views have proper heading hierarchy", async ({ page }) => {
  await page.goto("/");
  const h1 = await page.locator("h1").count();
  expect(h1).toBe(1); // Only one h1 per page

  // Each view section should have h2
  for (const route of ALL_ROUTES.slice(0, 5)) {
    await page.goto(route);
    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(1);
  }
});

test("all interactive elements have accessible names", async ({ page }) => {
  await page.goto("/");
  // Check buttons without accessible names
  const buttons = await page.locator("button:not([aria-label]):not([aria-labelledby])").all();
  for (const btn of buttons) {
    const text = await btn.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  }
});

test("navigation has aria-current on active link", async ({ page }) => {
  await page.goto("/watchlist");
  await page.waitForTimeout(300);
  const activeLink = page.locator('.nav-link[aria-current="page"]');
  await expect(activeLink).toHaveCount(1);
});
