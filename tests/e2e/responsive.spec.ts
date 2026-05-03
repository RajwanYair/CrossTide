/**
 * Cross-browser responsive layout E2E tests.
 *
 * Verifies the app renders correctly at desktop, tablet, and mobile viewports
 * across all configured browser projects (Chromium, Firefox, WebKit, mobile).
 */
import { test, expect } from "@playwright/test";

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

// ---------------------------------------------------------------------------
// App shell renders at all viewports
// ---------------------------------------------------------------------------
for (const [label, size] of Object.entries(VIEWPORTS)) {
  test(`app shell renders at ${label} viewport (${size.width}x${size.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.locator("#app-header")).toBeVisible();
    await expect(page.locator("#app-footer")).toBeVisible();
    await expect(page.locator("h1")).toContainText("CrossTide");
  });
}

// ---------------------------------------------------------------------------
// Navigation is reachable at all viewport sizes
// ---------------------------------------------------------------------------
test("navigation is accessible at mobile viewport", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.mobile);
  await page.goto("/");
  // Nav may be behind a hamburger menu at mobile — check it exists in DOM
  const nav = page.locator("#app-nav");
  await expect(nav).toBeAttached();
});

test("navigation links are visible at desktop viewport", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.desktop);
  await page.goto("/");
  const nav = page.locator("#app-nav");
  await expect(nav).toBeVisible();
  for (const route of ["watchlist", "chart", "settings"]) {
    await expect(nav.locator(`a[data-route="${route}"]`)).toBeVisible();
  }
});

// ---------------------------------------------------------------------------
// No horizontal overflow at any viewport
// ---------------------------------------------------------------------------
for (const [label, size] of Object.entries(VIEWPORTS)) {
  test(`no horizontal overflow at ${label} viewport`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(size.width + 1); // 1px tolerance
  });
}

// ---------------------------------------------------------------------------
// Touch events work on mobile
// ---------------------------------------------------------------------------
test("tap navigation works on mobile viewport", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.mobile);
  await page.goto("/");
  // Wait for JS to initialise
  await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "");
  const nav = page.locator("#app-nav");
  // If nav is visible, tap a link
  if (await nav.isVisible()) {
    const link = nav.locator('a[data-route="settings"]');
    if (await link.isVisible()) {
      await link.tap();
      await expect(page.locator("#view-settings")).toHaveClass(/active/);
    }
  }
});

// ---------------------------------------------------------------------------
// Meta viewport tag is present (prevents zoom issues on mobile)
// ---------------------------------------------------------------------------
test("meta viewport tag is set correctly", async ({ page }) => {
  await page.goto("/");
  const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewport).toContain("width=device-width");
  expect(viewport).toContain("initial-scale=1");
});

// ---------------------------------------------------------------------------
// Prefers-color-scheme media query doesn't crash
// ---------------------------------------------------------------------------
test("dark mode emulation does not break the app", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("#app-header")).toBeVisible();
});

test("light mode emulation does not break the app", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("#app-header")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Reduced motion preference is respected
// ---------------------------------------------------------------------------
test("prefers-reduced-motion does not break the app", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#app-header")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Font rendering — text is visible and not clipped
// ---------------------------------------------------------------------------
test("header text is rendered and has non-zero dimensions", async ({ page }) => {
  await page.goto("/");
  const h1 = page.locator("h1");
  const box = await h1.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);
});
