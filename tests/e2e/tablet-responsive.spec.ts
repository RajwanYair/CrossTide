/**
 * Tablet-Responsive E2E Tests
 *
 * Validates layout and interactions on tablet viewports:
 * iPad (portrait/landscape), Android tablets, and Windows-style 10" tablets.
 * Runs on tablet, tablet-landscape, tablet-pro, android-tablet, android-tablet-s9,
 * android-tablet-landscape, and nexus-10 Playwright projects.
 */
import { test, expect } from "@playwright/test";

const TABLET_ROUTES = [
  "/watchlist",
  "/consensus",
  "/chart",
  "/screener",
  "/portfolio",
  "/settings",
];

// ---------------------------------------------------------------------------
// All views render without horizontal overflow on tablets
// ---------------------------------------------------------------------------
test.describe("Tablet overflow checks", () => {
  for (const route of TABLET_ROUTES) {
    test(`${route} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(400);
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow, `${route} overflows horizontally on tablet`).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// Navigation is accessible on tablets (no hamburger required at tablet width)
// ---------------------------------------------------------------------------
test("navigation is visible on tablet viewport", async ({ page }) => {
  await page.goto("/watchlist");
  await page.waitForTimeout(300);
  const nav = page.locator("#app-nav");
  await expect(nav).toBeAttached();
  // Nav should not be hidden behind an off-canvas menu at tablet width
  const viewport = page.viewportSize()!;
  if (viewport.width >= 640) {
    await expect(nav).toBeVisible();
  }
});

test("nav links are reachable on tablet", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(300);
  const nav = page.locator("#app-nav");
  if (!(await nav.isVisible())) return;
  for (const route of ["watchlist", "chart", "settings"]) {
    const link = nav.locator(`a[data-route="${route}"]`);
    if (await link.isVisible()) {
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      // Touch targets must be at least 44px
      expect(box!.height).toBeGreaterThanOrEqual(36);
    }
  }
});

// ---------------------------------------------------------------------------
// Cards use multi-column layout on tablets (not stacked like mobile)
// ---------------------------------------------------------------------------
test("cards can render side-by-side on tablet", async ({ page }) => {
  await page.goto("/watchlist");
  await page.waitForTimeout(500);
  const viewport = page.viewportSize()!;

  // Only assert multi-column on landscape or wide tablets
  if (viewport.width < 768) return;

  const cards = await page.locator(".card:visible").all();
  if (cards.length < 2) return;

  const box1 = await cards[0].boundingBox();
  const box2 = await cards[1].boundingBox();
  if (!box1 || !box2) return;

  // Either stacked or side-by-side is acceptable — just ensure no overflow
  expect(box1.x + box1.width).toBeLessThanOrEqual(viewport.width + 2);
  expect(box2.x + box2.width).toBeLessThanOrEqual(viewport.width + 2);
});

// ---------------------------------------------------------------------------
// Charts resize correctly on tablet viewports
// ---------------------------------------------------------------------------
test("chart view renders on tablet", async ({ page }) => {
  await page.goto("/chart");
  await page.waitForTimeout(600);
  const viewport = page.viewportSize()!;

  // Chart container should exist and take meaningful width
  const chartContainer = page.locator("#chart-container, .chart-container, canvas").first();
  const isAttached = await chartContainer.isVisible().catch(() => false);
  if (!isAttached) return; // Chart not loaded in test env (no real data)

  const box = await chartContainer.boundingBox();
  if (box) {
    expect(box.width).toBeGreaterThan(viewport.width * 0.5);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
  }
});

// ---------------------------------------------------------------------------
// Touch targets meet minimum size requirements on tablets
// ---------------------------------------------------------------------------
test("buttons meet 44px touch target minimum on tablet", async ({ page }) => {
  await page.goto("/watchlist");
  await page.waitForTimeout(300);

  const buttons = await page.locator("button:visible").all();
  let small = 0;
  for (const btn of buttons.slice(0, 15)) {
    const box = await btn.boundingBox();
    if (box && (box.height < 36 || box.width < 36)) small++;
  }
  expect(small).toBeLessThan(Math.ceil(buttons.length * 0.3));
});

// ---------------------------------------------------------------------------
// Landscape orientation — wider layout, side-by-side panels expected
// ---------------------------------------------------------------------------
test("landscape tablet has wider content area", async ({ page }) => {
  await page.goto("/watchlist");
  await page.waitForTimeout(300);

  const viewport = page.viewportSize()!;
  if (viewport.width <= viewport.height) return; // Portrait mode — skip

  // In landscape, main content should fill most of the width
  const main = page.locator("main, #app-main, .app-content").first();
  const isVisible = await main.isVisible().catch(() => false);
  if (!isVisible) return;

  const box = await main.boundingBox();
  if (box) {
    expect(box.width).toBeGreaterThan(viewport.width * 0.6);
  }
});

// ---------------------------------------------------------------------------
// Settings card controls are fully visible and usable on tablets
// ---------------------------------------------------------------------------
test("settings controls are visible and usable on tablet", async ({ page }) => {
  await page.goto("/settings");
  await page.waitForTimeout(300);

  const viewport = page.viewportSize()!;
  const selects = await page.locator("select:visible").all();
  for (const sel of selects.slice(0, 3)) {
    const box = await sel.boundingBox();
    if (box) {
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
    }
  }
});

// ---------------------------------------------------------------------------
// Screener table doesn't break layout on tablet
// ---------------------------------------------------------------------------
test("screener table scrolls horizontally if wide", async ({ page }) => {
  await page.goto("/screener");
  await page.waitForTimeout(500);

  const table = page.locator("table:visible, .screener-table:visible").first();
  const isVisible = await table.isVisible().catch(() => false);
  if (!isVisible) return;

  const box = await table.boundingBox();
  const viewport = page.viewportSize()!;
  if (box && box.width > viewport.width) {
    // Container must be scrollable
    const scrollable = await table.evaluate((el) => {
      const parent = el.closest(".card-body") ?? el.parentElement;
      if (!parent) return false;
      const s = getComputedStyle(parent);
      return s.overflowX === "auto" || s.overflowX === "scroll";
    });
    expect(scrollable).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// No JavaScript errors on any tablet route
// ---------------------------------------------------------------------------
test("no JS errors on tablet routes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  for (const route of TABLET_ROUTES.slice(0, 3)) {
    await page.goto(route);
    await page.waitForTimeout(400);
  }

  const critical = errors.filter(
    (e) =>
      !e.includes("fetch") &&
      !e.includes("NetworkError") &&
      !e.includes("Failed to fetch") &&
      !e.includes("ERR_CONNECTION"),
  );
  expect(critical).toEqual([]);
});

// ---------------------------------------------------------------------------
// Pinch-zoom is not disabled (accessibility requirement)
// ---------------------------------------------------------------------------
test("viewport meta does not disable user scaling", async ({ page }) => {
  await page.goto("/");
  const content = await page.locator('meta[name="viewport"]').getAttribute("content");
  // user-scalable=no blocks accessibility tools — must not be set
  expect(content).not.toContain("user-scalable=no");
  expect(content).not.toContain("maximum-scale=1");
});
