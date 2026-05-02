/**
 * Vitest browser-mode configuration.  (G17)
 *
 * Runs tests in tests/browser/ inside a real Chromium instance via Playwright.
 * Requires: `npx playwright install chromium` (one-time setup).
 *
 * Run with: npx vitest run --config vitest.browser.config.ts
 *       or: npm run test:browser
 */
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    name: "browser",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    include: ["tests/browser/**/*.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 10_000,
  },
});
