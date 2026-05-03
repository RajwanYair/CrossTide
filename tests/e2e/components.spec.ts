/**
 * Component catalog E2E test — validates dev/components.html renders
 * all sections without errors and passes basic accessibility checks.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Component Catalog (dev/components.html)", () => {
  test("renders all expected sections", async ({ page }) => {
    await page.goto("/docs/components-preview.html");
    await expect(page).toHaveTitle(/Component Preview/);

    // Verify key sections
    await expect(page.locator("text=Color Tokens")).toBeVisible();
    await expect(page.locator("text=Typography Scale")).toBeVisible();
    await expect(page.locator("text=Buttons")).toBeVisible();
    await expect(page.locator("text=Badges")).toBeVisible();
    await expect(page.locator("text=Card Shells")).toBeVisible();
    await expect(page.locator("text=Sparklines")).toBeVisible();
    await expect(page.locator("text=Toasts")).toBeVisible();
    await expect(page.locator("text=Inputs")).toBeVisible();
    await expect(page.locator("text=Data Table")).toBeVisible();
  });

  test("theme toggle switches work", async ({ page }) => {
    await page.goto("/docs/components-preview.html");

    // Switch to light theme
    await page.locator("#btn-light").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    // Switch to high-contrast
    await page.locator("#btn-hc").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "high-contrast");

    // Switch back to dark
    await page.locator("#btn-dark").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("no critical accessibility violations in catalog", async ({ page }) => {
    await page.goto("/docs/components-preview.html");
    await page.waitForLoadState("domcontentloaded");

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(
      critical,
      `Critical a11y violations: ${critical.map((v) => `${v.id}: ${v.description}`).join(", ")}`,
    ).toHaveLength(0);
  });
});
