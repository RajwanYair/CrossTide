/**
 * Vitest browser-mode configuration.  (G17)
 *
 * Runs tests in tests/browser/ inside a real Chromium instance via Playwright.
 * Requires: `npx playwright install chromium` (one-time setup).
 *
 * Run with: npx vitest run --config vitest.browser.config.ts
 *       or: npm run test:browser
 *
 * Optional: set TEST_EDGE=1 to also run against Microsoft Edge (requires Edge installed):
 *       TEST_EDGE=1 npm run test:browser
 */
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

const edgeInstance =
  process.env["TEST_EDGE"] === "1"
    ? [{ browser: "chromium" as const, launch: { channel: "msedge" } }]
    : [];

export default defineConfig({
  test: {
    name: "browser",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [
        { browser: "chromium" },
        { browser: "firefox" },
        { browser: "webkit" },
        ...edgeInstance,
      ],
    },
    include: ["tests/browser/**/*.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 10_000,
  },
});
