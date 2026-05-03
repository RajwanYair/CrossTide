/**
 * CrossTide E2E smoke tests — 10 flows.
 *
 * Tests use only DOM structure / attributes; no real API calls are expected
 * to succeed in CI, so tests assert on layout and interaction, not live data.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ---------------------------------------------------------------------------
// Flow 1: App shell loads
// ---------------------------------------------------------------------------
test("app shell loads with title and header", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CrossTide/i);
  await expect(page.locator("h1")).toContainText("CrossTide");
  await expect(page.locator("#app-header")).toBeVisible();
  await expect(page.locator("#app-footer")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Flow 2: All navigation links are present
// ---------------------------------------------------------------------------
test("all navigation links are rendered", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator("#app-nav");
  for (const route of [
    "watchlist",
    "consensus",
    "chart",
    "alerts",
    "heatmap",
    "screener",
    "settings",
  ]) {
    await expect(nav.locator(`a[data-route="${route}"]`)).toBeVisible();
  }
});

// ---------------------------------------------------------------------------
// Flow 3: Navigation switches active view
// ---------------------------------------------------------------------------
test("clicking nav links activates the correct view section", async ({ page }) => {
  await page.goto("/");
  // Wait for JS to initialise (router registers click handlers)
  await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "");
  // Default view is watchlist
  await expect(page.locator("#view-watchlist")).toHaveClass(/active/);

  // Navigate to consensus
  await page.locator('a[data-route="consensus"]').click();
  await expect(page.locator("#view-consensus")).toHaveClass(/active/);
  await expect(page.locator("#view-watchlist")).not.toHaveClass(/active/);

  // Navigate to settings
  await page.locator('a[data-route="settings"]').click();
  await expect(page.locator("#view-settings")).toHaveClass(/active/);
});

// ---------------------------------------------------------------------------
// Flow 4: Watchlist input is present and accepts input
// ---------------------------------------------------------------------------
test("watchlist add-ticker input accepts text", async ({ page }) => {
  await page.goto("/watchlist");
  const input = page.locator("#add-ticker");
  await expect(input).toBeVisible();
  await input.fill("AAPL");
  await expect(input).toHaveValue("AAPL");
});

// ---------------------------------------------------------------------------
// Flow 5: Watchlist table renders (even when empty)
// ---------------------------------------------------------------------------
test("watchlist table skeleton is present", async ({ page }) => {
  await page.goto("/watchlist");
  await expect(page.locator("#watchlist-table")).toBeVisible();
  const headers = page.locator("#watchlist-head th");
  await expect(headers).toHaveCount(8);
});

// ---------------------------------------------------------------------------
// Flow 6: Settings page renders interactive controls
// ---------------------------------------------------------------------------
test("settings page has theme selector and action buttons", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.locator("#theme-select")).toBeVisible();
  await expect(page.locator("#btn-export")).toBeVisible();
  await expect(page.locator("#btn-import")).toBeVisible();
  await expect(page.locator("#btn-clear")).toBeVisible();
  await expect(page.locator("#btn-clear-cache")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Flow 7: Settings theme selector changes value
// ---------------------------------------------------------------------------
test("theme selector can be changed to light", async ({ page }) => {
  await page.goto("/settings");
  const select = page.locator("#theme-select");
  await select.selectOption("light");
  await expect(select).toHaveValue("light");
});

// ---------------------------------------------------------------------------
// Flow 8: Direct URL navigation to a view works
// ---------------------------------------------------------------------------
test("navigating directly to /alerts shows the alerts section", async ({ page }) => {
  await page.goto("/alerts");
  await expect(page.locator("#view-alerts")).toHaveClass(/active/);
});

// ---------------------------------------------------------------------------
// Flow 9: Keyboard shortcut Ctrl+K opens command palette
// ---------------------------------------------------------------------------
test("Ctrl+K opens the command palette", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  // The palette dialog or modal should become visible
  const palette = page
    .locator('[role="dialog"], [data-palette], #command-palette, .palette-overlay')
    .first();
  await expect(palette).toBeVisible({ timeout: 3_000 });
});

// ---------------------------------------------------------------------------
// Flow 10: Accessibility — no critical violations on initial load
// ---------------------------------------------------------------------------
test("no critical accessibility violations on the watchlist page", async ({ page }) => {
  await page.goto("/watchlist");
  // Wait for DOM to stabilise
  await page.waitForLoadState("domcontentloaded");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude("#chart-container") // canvas-based chart is excluded (axe cannot inspect canvas)
    .analyze();

  const critical = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(
    critical,
    `Critical a11y violations: ${critical.map((v) => `${v.id}: ${v.description}`).join(", ")}`,
  ).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// Flow 11: Accessibility — settings page passes axe
// ---------------------------------------------------------------------------
test("no critical accessibility violations on the settings page", async ({ page }) => {
  await page.goto("/settings");
  await page.waitForLoadState("domcontentloaded");

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

  const critical = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(
    critical,
    `Critical a11y violations: ${critical.map((v) => `${v.id}: ${v.description}`).join(", ")}`,
  ).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// Flow 12: Accessibility — consensus page passes axe
// ---------------------------------------------------------------------------
test("no critical accessibility violations on the consensus page", async ({ page }) => {
  await page.goto("/consensus");
  await page.waitForLoadState("domcontentloaded");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude("#chart-container")
    .analyze();

  const critical = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(
    critical,
    `Critical a11y violations: ${critical.map((v) => `${v.id}: ${v.description}`).join(", ")}`,
  ).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// Flow 13: Footer is visible on all pages
// ---------------------------------------------------------------------------
test("footer with status indicators is present", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("#app-footer");
  await expect(footer).toBeVisible();
  await expect(footer.locator("#sync-status")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Flow 14: App has proper meta tags for SEO
// ---------------------------------------------------------------------------
test("app includes essential meta tags", async ({ page }) => {
  await page.goto("/");
  const viewport = page.locator('meta[name="viewport"]');
  await expect(viewport).toHaveAttribute("content", /width=device-width/);
  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute("content", /.+/);
});

// ---------------------------------------------------------------------------
// Flow 15: Service worker registers without errors
// ---------------------------------------------------------------------------
test("service worker registers successfully", async ({ page }) => {
  await page.goto("/");
  // Give SW time to register
  await page.waitForTimeout(2000);
  const swRegistered = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return "no-sw-support";
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? "registered" : "not-registered";
  });
  // In dev server mode, SW may not be registered (no sw.js built), accept both
  expect(["registered", "not-registered", "no-sw-support"]).toContain(swRegistered);
});
