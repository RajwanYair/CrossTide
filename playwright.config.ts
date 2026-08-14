import { defineConfig, devices } from "@playwright/test";

/**
 * Engine-agnostic suites. The card matrix sweeps every route on every
 * instrument type; running it on all 20 device projects would multiply the
 * suite by ~700 tests for no extra signal, so device projects skip it and the
 * four desktop engines cover it instead.
 */
const DESKTOP_ONLY = [/cards\.spec\.ts$/];

/** Build a device-emulation project that skips the desktop-only suites. */
function deviceProject(
  name: string,
  use: Record<string, unknown>,
  testMatch?: RegExp,
): {
  name: string;
  use: Record<string, unknown>;
  testIgnore: RegExp[];
  testMatch?: RegExp;
} {
  return testMatch === undefined
    ? { name, use, testIgnore: DESKTOP_ONLY }
    : { name, use, testIgnore: DESKTOP_ONLY, testMatch };
}

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Pre-dismiss the first-run onboarding tour so its overlay never
    // intercepts clicks during navigation-heavy tests.
    storageState: "tests/e2e/storage-state.json",
  },
  projects: [
    // ── Desktop browsers ──────────────────────────────────────────
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Touch-target/viewport tests below require real device emulation
      // (hasTouch + mobile viewport) — they run under their own projects instead.
      testIgnore: [/mobile-responsive\.spec\.ts$/, /tablet-responsive\.spec\.ts$/],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: [/mobile-responsive\.spec\.ts$/, /tablet-responsive\.spec\.ts$/],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: [/mobile-responsive\.spec\.ts$/, /tablet-responsive\.spec\.ts$/],
    },
    {
      name: "edge",
      use: { ...devices["Desktop Edge"] },
      testIgnore: [/mobile-responsive\.spec\.ts$/, /tablet-responsive\.spec\.ts$/],
    },
    // ── Mobile viewports ──────────────────────────────────────────
    deviceProject("mobile-chrome", { ...devices["Pixel 7"] }, /mobile-responsive\.spec\.ts$/),
    deviceProject("mobile-chrome-landscape", { ...devices["Pixel 7 landscape"] }),
    deviceProject("mobile-safari", { ...devices["iPhone 14"] }),
    deviceProject("mobile-safari-pro", { ...devices["iPhone 15 Pro"] }),
    deviceProject("mobile-safari-landscape", { ...devices["iPhone 15 landscape"] }),
    deviceProject("mobile-safari-mini", { ...devices["iPhone SE"] }),
    deviceProject("android-galaxy", { ...devices["Galaxy S9+"] }),
    deviceProject("android-galaxy-s24", { ...devices["Galaxy S24"] }),
    deviceProject("android-galaxy-landscape", { ...devices["Galaxy S9+ landscape"] }),
    deviceProject("android-galaxy-a55", { ...devices["Galaxy A55"] }),
    deviceProject("android-galaxy-a55-landscape", { ...devices["Galaxy A55 landscape"] }),
    // ── Firefox for Android (Gecko engine — different from Chromium) ──
    deviceProject("firefox-android", { browserName: "firefox", ...devices["Pixel 7"] }),
    deviceProject("firefox-android-landscape", {
      browserName: "firefox",
      ...devices["Pixel 7 landscape"],
    }),
    // ── Tablets ───────────────────────────────────────────────────
    // iPad device presets default to the WebKit engine, but CI only installs
    // Chromium — force Chromium so tablet viewport/touch emulation runs
    // without requiring a WebKit browser install.
    deviceProject(
      "tablet",
      { ...devices["iPad (gen 7)"], browserName: "chromium" },
      /tablet-responsive\.spec\.ts$/,
    ),
    deviceProject("tablet-landscape", { ...devices["iPad (gen 7) landscape"] }),
    deviceProject("tablet-pro", { ...devices["iPad Pro 11"] }),
    deviceProject("tablet-pro-landscape", { ...devices["iPad Pro 11 landscape"] }),
    deviceProject("android-tablet", { ...devices["Galaxy Tab S4"] }),
    deviceProject("android-tablet-s9", { ...devices["Galaxy Tab S9"] }),
    deviceProject("android-tablet-landscape", { ...devices["Galaxy Tab S9 landscape"] }),
    // ── Windows tablet ────────────────────────────────────────────
    deviceProject("nexus-10", { ...devices["Nexus 10"] }),
  ],
  webServer: {
    // `npm run` resolves node_modules/.bin cross-platform; `npx` may fetch a
    // different Vite from the registry.
    command: "npm run dev -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
  },
});
