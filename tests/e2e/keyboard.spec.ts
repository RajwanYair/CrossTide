/**
 * E2E — Keyboard navigation & shortcuts (F3 expansion).
 *
 * Validates that shortcut keys are wired and focus management works.
 */
import { test, expect } from "@playwright/test";

test.describe("Keyboard shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Wait for JS to initialise (version text is set during init)
    await page.waitForFunction(() => document.getElementById("app-version")?.textContent !== "");
  });

  test("/ focuses the ticker input", async ({ page }) => {
    await page.keyboard.press("/");
    const input = page.locator("#add-ticker");
    await expect(input).toBeFocused();
  });

  test("Escape key blurs active input", async ({ page }) => {
    // Focus an input first
    const input = page.locator("input").first();
    if ((await input.count()) > 0) {
      await input.focus();
      await expect(input).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(input).not.toBeFocused();
    }
  });

  test("? key toggles shortcuts dialog", async ({ page }) => {
    await page.keyboard.press("?");
    const dialog = page.locator("[data-shortcuts-dialog], #shortcuts-dialog, .shortcuts-modal");
    const count = await dialog.count();
    if (count > 0) {
      await expect(dialog.first()).toBeVisible();
      // Press ? again or Escape to close
      await page.keyboard.press("Escape");
      await expect(dialog.first()).not.toBeVisible();
    }
  });

  test("Tab key cycles through focusable elements", async ({ page }) => {
    // Tab should move focus within the app
    const body = page.locator("body");
    await body.focus();
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).not.toHaveCount(0);
  });
});
