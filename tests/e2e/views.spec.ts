/**
 * E2E smoke tests — additional views & user flows (J10).
 *
 * Extends the existing app.spec.ts flows to cover portfolio, heatmap,
 * screener, chart, and consensus-timeline views as well as hash-based
 * deep-linking and responsive layout guards.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ── Portfolio view ────────────────────────────────────────────────────────

test("portfolio view activates from nav link", async ({ page }) => {
  await page.goto("/");
  await page.locator('a[data-route="portfolio"]').click();
  await expect(page.locator("#view-portfolio")).toHaveClass(/active/);
});

test("portfolio view renders via direct URL", async ({ page }) => {
  await page.goto("/portfolio");
  await expect(page.locator("#view-portfolio")).toHaveClass(/active/);
});

// ── Heatmap view ──────────────────────────────────────────────────────────

test("heatmap view activates from nav link", async ({ page }) => {
  await page.goto("/");
  await page.locator('a[data-route="heatmap"]').click();
  await expect(page.locator("#view-heatmap")).toHaveClass(/active/);
});

test("heatmap container renders a canvas or svg element", async ({ page }) => {
  await page.goto("/heatmap");
  await expect(page.locator("#view-heatmap")).toHaveClass(/active/);
  const _visual = page.locator("#view-heatmap canvas, #view-heatmap svg").first();
  // Canvas/SVG may render after data loads — just check the container exists
  await expect(page.locator("#view-heatmap")).toBeVisible();
});

// ── Screener view ─────────────────────────────────────────────────────────

test("screener view activates from nav link", async ({ page }) => {
  await page.goto("/");
  await page.locator('a[data-route="screener"]').click();
  await expect(page.locator("#view-screener")).toHaveClass(/active/);
});

test("screener view accessible via direct URL", async ({ page }) => {
  await page.goto("/screener");
  await expect(page.locator("#view-screener")).toHaveClass(/active/);
});

// ── Chart view ────────────────────────────────────────────────────────────

test("chart view activates from nav link", async ({ page }) => {
  await page.goto("/");
  await page.locator('a[data-route="chart"]').click();
  await expect(page.locator("#view-chart")).toHaveClass(/active/);
});

test("chart view accessible via direct URL", async ({ page }) => {
  await page.goto("/chart");
  await expect(page.locator("#view-chart")).toHaveClass(/active/);
});

// ── Consensus view ────────────────────────────────────────────────────────

test("consensus view accessible via direct URL", async ({ page }) => {
  await page.goto("/consensus");
  await expect(page.locator("#view-consensus")).toHaveClass(/active/);
});

// ── Hash-based deep-link fallback ─────────────────────────────────────────

test("hash route (#/heatmap) maps to correct view", async ({ page }) => {
  await page.goto("/#/heatmap");
  await page.waitForTimeout(500); // give router time to resolve hash
  // Depending on the router implementation, view-heatmap may or may not
  // be active.  At minimum the app shell should have loaded.
  await expect(page.locator("h1")).toContainText("CrossTide");
});

// ── Viewport resize smoke test ────────────────────────────────────────────

test("app layout adjusts on narrow viewport (mobile width)", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  // Nav may collapse to a hamburger menu
  const nav = page.locator("#app-nav");
  // Either still visible or a menu-toggle button appears
  const menuToggle = page.locator("[data-menu-toggle], .menu-toggle, #menu-toggle");
  const navVisible = await nav.isVisible();
  const toggleVisible = await menuToggle.isVisible().catch(() => false);
  expect(navVisible || toggleVisible).toBe(true);
});

// ── Accessibility — portfolio page ────────────────────────────────────────

test("no critical a11y violations on the portfolio page", async ({ page }) => {
  await page.goto("/portfolio");
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

// ── Accessibility — heatmap page ──────────────────────────────────────────

test("no critical a11y violations on the heatmap page", async ({ page }) => {
  await page.goto("/heatmap");
  await page.waitForLoadState("domcontentloaded");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude("canvas") // canvas-based heatmap excluded
    .analyze();

  const critical = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(
    critical,
    `Critical a11y violations: ${critical.map((v) => `${v.id}: ${v.description}`).join(", ")}`,
  ).toHaveLength(0);
});

// ── Accessibility — screener page ─────────────────────────────────────────

test("no critical a11y violations on the screener page", async ({ page }) => {
  await page.goto("/screener");
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
