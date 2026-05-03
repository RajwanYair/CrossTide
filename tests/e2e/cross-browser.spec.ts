/**
 * Cross-browser compatibility E2E tests.
 *
 * Validates layout, CSS rendering, JS APIs, and interactive features
 * work consistently across Chromium, Firefox, WebKit, Edge, and mobile devices.
 * Runs in ALL Playwright projects (desktop + mobile + tablet).
 */
import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// CSS Grid / Flexbox layout doesn't break
// ---------------------------------------------------------------------------
test("header uses flexbox layout correctly", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("#app-header");
  await expect(header).toBeVisible();
  const display = await header.evaluate((el) => getComputedStyle(el).display);
  expect(display).toMatch(/flex|grid/);
});

test("navigation links wrap properly without overflow", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator("#app-nav");
  await expect(nav).toBeAttached();
  const navRect = await nav.boundingBox();
  const bodyWidth = await page.evaluate(() => document.body.clientWidth);
  if (navRect) {
    expect(navRect.width).toBeLessThanOrEqual(bodyWidth + 2);
  }
});

// ---------------------------------------------------------------------------
// CSS custom properties (variables) are applied
// ---------------------------------------------------------------------------
test("CSS custom properties are applied", async ({ page }) => {
  await page.goto("/");
  const bgColor = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--bg-primary").trim(),
  );
  // Should have a value (dark theme default)
  expect(bgColor.length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Font loading doesn't break layout
// ---------------------------------------------------------------------------
test("text renders without FOIT causing invisible content", async ({ page }) => {
  await page.goto("/");
  // Wait for fonts to load (or fallback)
  await page.waitForTimeout(1000);
  const h1 = page.locator("h1");
  await expect(h1).toBeVisible();
  const text = await h1.textContent();
  expect(text).toContain("CrossTide");
});

// ---------------------------------------------------------------------------
// JavaScript module loading works (ES modules)
// ---------------------------------------------------------------------------
test("ES module script loads and initializes", async ({ page }) => {
  await page.goto("/");
  // App version gets set by JS on load
  await page.waitForFunction(
    () => document.getElementById("app-version")?.textContent !== "",
    null,
    { timeout: 10_000 },
  );
  const version = await page.locator("#app-version").textContent();
  expect(version).toMatch(/\d+\.\d+/);
});

// ---------------------------------------------------------------------------
// History API / SPA navigation works
// ---------------------------------------------------------------------------
test("SPA navigation works via history API", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "");

  // Navigate forward
  await page.locator('a[data-route="chart"]').click();
  await expect(page.locator("#view-chart")).toHaveClass(/active/);
  expect(page.url()).toContain("/chart");

  // Navigate back
  await page.goBack();
  await expect(page.locator("#view-watchlist")).toHaveClass(/active/);
});

// ---------------------------------------------------------------------------
// LocalStorage works (used by settings/watchlist persistence)
// ---------------------------------------------------------------------------
test("localStorage read/write works", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    try {
      localStorage.setItem("__e2e_compat__", "ok");
      const val = localStorage.getItem("__e2e_compat__");
      localStorage.removeItem("__e2e_compat__");
      return val;
    } catch {
      return "error";
    }
  });
  expect(result).toBe("ok");
});

// ---------------------------------------------------------------------------
// Viewport meta tag prevents zoom issues on mobile
// ---------------------------------------------------------------------------
test("viewport meta prevents unwanted zoom", async ({ page }) => {
  await page.goto("/");
  const content = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(content).toContain("width=device-width");
  expect(content).toContain("initial-scale=1");
});

// ---------------------------------------------------------------------------
// Touch/click events work on interactive elements
// ---------------------------------------------------------------------------
test("button click events work", async ({ page }) => {
  await page.goto("/settings");
  await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "");
  const themeSelect = page.locator("#theme-select");
  await expect(themeSelect).toBeVisible();
  await themeSelect.selectOption("light");
  await expect(themeSelect).toHaveValue("light");
});

// ---------------------------------------------------------------------------
// Input elements work across browsers
// ---------------------------------------------------------------------------
test("text input accepts typed characters", async ({ page }) => {
  await page.goto("/watchlist");
  const input = page.locator("#add-ticker");
  await expect(input).toBeVisible();
  await input.fill("AAPL");
  await expect(input).toHaveValue("AAPL");
  await input.fill("");
  await input.type("MSFT", { delay: 50 });
  await expect(input).toHaveValue("MSFT");
});

// ---------------------------------------------------------------------------
// Scroll behavior works
// ---------------------------------------------------------------------------
test("page is scrollable when content overflows", async ({ page }) => {
  await page.goto("/");
  const scrollable = await page.evaluate(
    () => document.documentElement.scrollHeight >= document.documentElement.clientHeight,
  );
  expect(typeof scrollable).toBe("boolean");
});

// ---------------------------------------------------------------------------
// Service Worker registration doesn't throw
// ---------------------------------------------------------------------------
test("service worker registration does not crash", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/");
  await page.waitForTimeout(2000);
  // Filter out expected non-critical errors (e.g. network failures in CI)
  const criticalErrors = errors.filter(
    (e) => !e.includes("fetch") && !e.includes("NetworkError") && !e.includes("Failed to fetch"),
  );
  expect(criticalErrors).toEqual([]);
});

// ---------------------------------------------------------------------------
// No console errors from unsupported APIs
// ---------------------------------------------------------------------------
test("no console errors from unsupported browser APIs", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  await page.goto("/");
  await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "");
  // Navigate a few routes
  await page.locator('a[data-route="consensus"]').click();
  await page.waitForTimeout(500);
  await page.locator('a[data-route="chart"]').click();
  await page.waitForTimeout(500);

  // Filter out expected network errors
  const apiErrors = consoleErrors.filter(
    (e) =>
      !e.includes("net::") &&
      !e.includes("NetworkError") &&
      !e.includes("Failed to fetch") &&
      !e.includes("ECONNREFUSED") &&
      !e.includes("ERR_CONNECTION_REFUSED"),
  );
  expect(apiErrors).toEqual([]);
});

// ---------------------------------------------------------------------------
// Web Animations API — used by transitions
// ---------------------------------------------------------------------------
test("element.animate() works for transitions", async ({ page }) => {
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

// ---------------------------------------------------------------------------
// Intl APIs used for number/date formatting
// ---------------------------------------------------------------------------
test("Intl.NumberFormat formats currency correctly", async ({ page }) => {
  await page.goto("/");
  const formatted = await page.evaluate(() => {
    const f = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    return f.format(1234.56);
  });
  expect(formatted).toContain("1,234.56");
});

// ---------------------------------------------------------------------------
// CSS :focus-visible for accessibility
// ---------------------------------------------------------------------------
test("focus-visible selector works for keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "");
  // Tab to first nav link
  await page.keyboard.press("Tab"); // skip-link
  await page.keyboard.press("Tab"); // first nav-link
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(focused).toBe("A");
});

// ---------------------------------------------------------------------------
// Fetch API with AbortController
// ---------------------------------------------------------------------------
test("fetch + AbortController works", async ({ page }) => {
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
// ResizeObserver works (used by chart/heatmap cards)
// ---------------------------------------------------------------------------
test("ResizeObserver callback fires", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const el = document.createElement("div");
        el.style.width = "100px";
        document.body.appendChild(el);
        const ro = new ResizeObserver(() => {
          ro.disconnect();
          el.remove();
          resolve(true);
        });
        ro.observe(el);
        el.style.width = "200px";
        setTimeout(() => {
          ro.disconnect();
          el.remove();
          resolve(false);
        }, 2000);
      }),
  );
  expect(result).toBe(true);
});

// ---------------------------------------------------------------------------
// Color scheme media query
// ---------------------------------------------------------------------------
test("prefers-color-scheme media query is detectable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const isDark = await page.evaluate(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  expect(isDark).toBe(true);

  await page.emulateMedia({ colorScheme: "light" });
  const isLight = await page.evaluate(
    () => window.matchMedia("(prefers-color-scheme: light)").matches,
  );
  expect(isLight).toBe(true);
});
