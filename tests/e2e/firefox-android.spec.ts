/**
 * Firefox for Android E2E tests.
 *
 * These tests run exclusively on the `firefox-android` and
 * `firefox-android-landscape` Playwright projects (Gecko engine, mobile
 * viewport). They validate that:
 *
 *   1. Core app functionality works on Gecko (not just Chromium/WebKit)
 *   2. Firefox-specific CSS/JS behaviors render correctly
 *   3. The app respects Firefox Android's reduced UA capabilities
 *   4. No Gecko-specific console errors arise from incompatible APIs
 *
 * Run: npx playwright test tests/e2e/firefox-android.spec.ts
 *      --project=firefox-android --project=firefox-android-landscape
 */
import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Baseline load — app initialises on Gecko without errors
// ---------------------------------------------------------------------------
test("app loads on Firefox for Android without JS errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "", {
    timeout: 15_000,
  });

  const critical = errors.filter(
    (e) =>
      !e.includes("fetch") &&
      !e.includes("NetworkError") &&
      !e.includes("Failed to fetch") &&
      !e.includes("ERR_CONNECTION_REFUSED"),
  );
  expect(critical, "Critical JS errors on Firefox Android").toEqual([]);
});

// ---------------------------------------------------------------------------
// CSS custom properties applied on Gecko
// ---------------------------------------------------------------------------
test("CSS custom properties render on Gecko", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "");

  const bgColor = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--bg-primary").trim(),
  );
  expect(bgColor.length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Flexbox and Grid layout on Gecko
// ---------------------------------------------------------------------------
test("header uses flexbox or grid on Gecko", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("#app-header");
  await expect(header).toBeVisible();
  const display = await header.evaluate((el) => getComputedStyle(el).display);
  expect(display).toMatch(/flex|grid/);
});

// ---------------------------------------------------------------------------
// SPA navigation on Gecko (History API)
// ---------------------------------------------------------------------------
test("SPA navigation works on Gecko", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "");

  await page.locator('a[data-route="chart"]').click();
  await expect(page.locator("#view-chart")).toHaveClass(/active/);
  expect(page.url()).toContain("/chart");

  await page.goBack();
  await expect(page.locator("#view-watchlist")).toHaveClass(/active/);
});

// ---------------------------------------------------------------------------
// LocalStorage persistence on Gecko
// ---------------------------------------------------------------------------
test("localStorage works on Firefox for Android", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    try {
      localStorage.setItem("__ff_android_test__", "ok");
      const val = localStorage.getItem("__ff_android_test__");
      localStorage.removeItem("__ff_android_test__");
      return val;
    } catch {
      return "error";
    }
  });
  expect(result).toBe("ok");
});

// ---------------------------------------------------------------------------
// Touch input works on Gecko (Firefox 55+ PointerEvents)
// ---------------------------------------------------------------------------
test("PointerEvent is supported on Gecko", async ({ page }) => {
  await page.goto("/");
  const hasPointerEvent = await page.evaluate(() => typeof PointerEvent === "function");
  expect(hasPointerEvent).toBe(true);
});

// ---------------------------------------------------------------------------
// fetch + AbortController on Gecko (Baseline 2017)
// ---------------------------------------------------------------------------
test("fetch AbortController works on Gecko", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const controller = new AbortController();
    controller.abort();
    try {
      await fetch("/manifest.json", { signal: controller.signal });
      return "not-aborted";
    } catch (e: unknown) {
      return (e as Error).name;
    }
  });
  expect(result).toBe("AbortError");
});

// ---------------------------------------------------------------------------
// No horizontal overflow on mobile Gecko viewport
// ---------------------------------------------------------------------------
test("watchlist has no horizontal overflow on Gecko mobile", async ({ page }) => {
  await page.goto("/watchlist");
  await page.waitForTimeout(500);
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
});

// ---------------------------------------------------------------------------
// Font rendering — no FOIT on Gecko
// ---------------------------------------------------------------------------
test("text visible without FOIT on Gecko", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1000);
  const h1 = page.locator("h1");
  await expect(h1).toBeVisible();
  const text = await h1.textContent();
  expect(text).toContain("CrossTide");
});

// ---------------------------------------------------------------------------
// Service Worker — Gecko supports SW since Firefox 44
// ---------------------------------------------------------------------------
test("service worker registration does not crash on Gecko", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/");
  await page.waitForTimeout(2000);
  const critical = errors.filter(
    (e) => !e.includes("fetch") && !e.includes("NetworkError") && !e.includes("Failed to fetch"),
  );
  expect(critical).toEqual([]);
});

// ---------------------------------------------------------------------------
// Viewport meta — prevents unwanted zoom on Firefox Android
// ---------------------------------------------------------------------------
test("viewport meta prevents zoom on Firefox Android", async ({ page }) => {
  await page.goto("/");
  const content = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(content).toContain("width=device-width");
  expect(content).toContain("initial-scale=1");
});

// ---------------------------------------------------------------------------
// Firefox-specific CSS features
// ---------------------------------------------------------------------------
test("CSS scroll-snap works on Gecko", async ({ page }) => {
  await page.goto("/");
  const supported = await page.evaluate(
    () =>
      CSS.supports("scroll-snap-type", "x mandatory") && CSS.supports("scroll-snap-align", "start"),
  );
  expect(supported).toBe(true);
});

test("CSS grid is functional on Gecko", async ({ page }) => {
  await page.goto("/");
  const supported = await page.evaluate(() => CSS.supports("display", "grid"));
  expect(supported).toBe(true);
});

test("CSS custom properties work on Gecko", async ({ page }) => {
  await page.goto("/");
  const supported = await page.evaluate(() => CSS.supports("--x", "1"));
  expect(supported).toBe(true);
});

// ---------------------------------------------------------------------------
// Landscape orientation — layout doesn't break
// ---------------------------------------------------------------------------
test("no horizontal overflow in landscape on Gecko", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(500);
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
});

// ---------------------------------------------------------------------------
// Intl APIs on Gecko
// ---------------------------------------------------------------------------
test("Intl.NumberFormat formats correctly on Gecko", async ({ page }) => {
  await page.goto("/");
  const formatted = await page.evaluate(() => {
    const f = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    return f.format(1234.56);
  });
  expect(formatted).toContain("1,234.56");
});

// ---------------------------------------------------------------------------
// Web Animations API on Gecko (supported since Firefox 48)
// ---------------------------------------------------------------------------
test("element.animate() works on Gecko", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    try {
      const anim = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 100 });
      el.remove();
      return anim !== null;
    } catch {
      el.remove();
      return false;
    }
  });
  expect(result).toBe(true);
});
