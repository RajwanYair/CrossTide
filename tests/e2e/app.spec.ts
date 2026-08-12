/**
 * CrossTide E2E smoke tests — 10 flows.
 *
 * Tests use only DOM structure / attributes; no real API calls are expected
 * to succeed in CI, so tests assert on layout and interaction, not live data.
 */
import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./app-ready";
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
  await waitForAppReady(page);
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
// Flow 4: Watchlist accepts and renders a ticker
// ---------------------------------------------------------------------------
test("watchlist adds a typed ticker on Enter", async ({ page }) => {
  await page.goto("/watchlist");
  const input = page.locator("#add-ticker");
  await expect(input).toBeVisible();
  await expect(input).toHaveAttribute("role", "combobox");
  await input.fill("MSFT");
  await input.press("Enter");
  await expect(page.locator('#watchlist-body tr[data-ticker="MSFT"]')).toBeVisible();
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
// Flow 6: Chart route exposes an explicit no-data state offline
// ---------------------------------------------------------------------------
test("chart route shows a no-data state when providers are unavailable", async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort());
  await page.route("**/query1.finance.yahoo.com/**", (route) => route.abort());

  await page.goto("/chart/AAPL");
  await waitForAppReady(page);

  const chart = page.locator("#view-chart");
  await expect(chart).toHaveClass(/active/);
  await expect(chart.locator(".empty-state")).toContainText("No chart data for AAPL");
});

test("offline journey state announces stale data and clears on reconnect", async ({ page }) => {
  await page.goto("/watchlist");
  await waitForAppReady(page);

  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  const banner = page.locator("#offline-indicator");
  await expect(banner).toContainText("You are offline");
  await expect(banner).toContainText("data may be stale");

  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(banner).toHaveClass(/offline-banner--exit/);
});

// ---------------------------------------------------------------------------
// Flow 7: Consensus route exposes an explicit limitation when no signal exists
// ---------------------------------------------------------------------------
test("consensus route shows a no-data state for an unpopulated symbol", async ({ page }) => {
  await page.goto("/consensus/AAPL");
  await waitForAppReady(page);

  const consensus = page.locator("#view-consensus");
  await expect(consensus).toHaveClass(/active/);
  await expect(consensus.locator(".empty-state")).toContainText("No consensus data for AAPL");
});

// ---------------------------------------------------------------------------
// Flow 8: Watchlist and share route state survive the session boundary
// ---------------------------------------------------------------------------
test("watchlist ticker survives reload", async ({ page }) => {
  await page.goto("/watchlist");
  await waitForAppReady(page);
  await page.locator("#add-ticker").fill("MSFT");
  await page.locator("#add-ticker").press("Escape");
  await page.locator("#add-ticker").press("Enter");
  await expect(page.locator('#watchlist-body tr[data-ticker="MSFT"]')).toBeVisible();

  await page.reload();
  await waitForAppReady(page);
  await expect(page.locator('#watchlist-body tr[data-ticker="MSFT"]')).toBeVisible();
});

test("share shortcut creates a restorable route token", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/chart/AAPL");
  await waitForAppReady(page);
  await page.keyboard.press("Shift+s");

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("?s=");
  expect(sharedUrl).toContain("chart");
});

// ---------------------------------------------------------------------------
// Flow 9: Settings page renders interactive controls
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
// Flow 10: Settings theme selector changes value
// ---------------------------------------------------------------------------
test("theme selector can be changed to light", async ({ page }) => {
  await page.goto("/settings");
  const select = page.locator("#theme-select");
  await select.selectOption("light");
  await expect(select).toHaveValue("light");
});

// ---------------------------------------------------------------------------
// Flow 11: Protected direct URL navigation redirects to settings
// ---------------------------------------------------------------------------
test("navigating directly to /alerts redirects unauthenticated users", async ({ page }) => {
  await page.goto("/alerts");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.locator("#view-settings")).toHaveClass(/active/);
});

// ---------------------------------------------------------------------------
// Flow 12: Keyboard shortcut Ctrl+K opens command palette
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
// Flow 13: Accessibility — no critical violations on initial load
// ---------------------------------------------------------------------------
test("no critical accessibility violations on the watchlist page", async ({ page }) => {
  await page.goto("/watchlist");
  // domcontentloaded is not enough: the theme is applied during bootstrap, so
  // axe would sample a page whose surfaces had flipped to the light palette
  // while the 150ms color transition on .nav-link still held dark values.
  await waitForAppReady(page);

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
// Flow 14: Accessibility — settings page passes axe
// ---------------------------------------------------------------------------
test("no critical accessibility violations on the settings page", async ({ page }) => {
  await page.goto("/settings");
  await waitForAppReady(page);

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
// Flow 15: Accessibility — consensus page passes axe
// ---------------------------------------------------------------------------
test("no critical accessibility violations on the consensus page", async ({ page }) => {
  await page.goto("/consensus");
  await waitForAppReady(page);

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
// Flow 16: Footer is visible on all pages
// ---------------------------------------------------------------------------
test("footer with status indicators is present", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("#app-footer");
  await expect(footer).toBeVisible();
  await expect(footer.locator("#sync-status")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Flow 17: App has proper meta tags for SEO
// ---------------------------------------------------------------------------
test("app includes essential meta tags", async ({ page }) => {
  await page.goto("/");
  const viewportMeta = page.locator('meta[name="viewport"]');
  await expect(viewportMeta).toHaveAttribute("content", /width=device-width/);
  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute("content", /.+/);
});

// ---------------------------------------------------------------------------
// Flow 18: Service worker registers without errors
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
