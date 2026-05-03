import { defineConfig, devices } from "@playwright/test";

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
  },
  projects: [
    // ── Desktop browsers ──────────────────────────────────────────
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "edge",
      use: { ...devices["Desktop Edge"] },
    },
    // ── Mobile viewports ──────────────────────────────────────────
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "mobile-safari-mini",
      use: { ...devices["iPhone SE"] },
    },
    {
      name: "android-galaxy",
      use: { ...devices["Galaxy S9+"] },
    },
    // ── Tablets ───────────────────────────────────────────────────
    {
      name: "tablet",
      use: { ...devices["iPad (gen 7)"] },
    },
    {
      name: "tablet-landscape",
      use: { ...devices["iPad (gen 7) landscape"] },
    },
    {
      name: "tablet-pro",
      use: { ...devices["iPad Pro 11"] },
    },
    {
      name: "android-tablet",
      use: { ...devices["Galaxy Tab S4"] },
    },
  ],
  webServer: {
    command: "npx vite --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
  },
});
