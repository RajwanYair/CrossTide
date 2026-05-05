/**
 * Vitest browser-mode configuration.  (G17)
 *
 * Runs tests in tests/browser/ inside a real Chromium instance via Playwright.
 * Requires: `npx playwright install chromium` (one-time setup).
 *
 * Run with: npx vitest run --config vitest.browser.config.ts
 *       or: npm run test:browser
 *
 * Optional env flags:
 *   TEST_EDGE=1      also run against Microsoft Edge (requires Edge installed):
 *                      TEST_EDGE=1 npm run test:browser
 *   TEST_SAMSUNG=1   also run against Samsung Internet channel via Chromium
 *                    (Samsung Internet 23+ is Chromium-based; this validates the
 *                    same Chromium engine with Samsung-specific UA detection):
 *                      TEST_SAMSUNG=1 npm run test:browser
 *
 * Note: Opera (105+), Samsung Internet (23+), and most Android browsers are
 * Chromium-based and are therefore covered by the Chromium instance above.
 * Firefox for Android (Gecko) is covered via the Playwright E2E projects
 * (firefox-android + firefox-android-landscape in playwright.config.ts).
 */
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

const edgeInstance =
  process.env["TEST_EDGE"] === "1"
    ? [{ browser: "chromium" as const, launch: { channel: "msedge" } }]
    : [];

// Samsung Internet 23+ is Chromium-based; test via a Chromium instance with
// Samsung Internet's user agent string to exercise UA-sniffing code paths.
const samsungInstance =
  process.env["TEST_SAMSUNG"] === "1"
    ? [
        {
          browser: "chromium" as const,
          launch: {
            args: [
              "--user-agent=Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36",
            ],
          },
        },
      ]
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
        ...samsungInstance,
      ],
    },
    include: ["tests/browser/**/*.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 10_000,
  },
});
