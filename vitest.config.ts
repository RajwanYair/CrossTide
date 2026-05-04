import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify("test"),
  },
  test: {
    environment: "happy-dom",
    globals: true,
    pool: "forks",
    testTimeout: 10000,
    hookTimeout: 10000,
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/browser/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/main.ts",
        "src/sw.ts",
        "src/**/*.d.ts",
        "src/**/index.ts",
        "src/types/**",
        // DOM card mount functions — tested via E2E/Playwright, not unit tests
        "src/cards/**-card.ts",
        "src/cards/screener-data.ts",
        // Network I/O / IndexedDB — integration-tested
        "src/core/data-service.ts",
        "src/core/idb.ts",
        "src/core/app-store.ts",
        // Worker entry points
        "src/core/backtest-worker.ts",
        "src/core/compute-worker.ts",
        // Provider runtime type helpers
        "src/providers/types.ts",
        // DOM overlay component
        "src/ui/palette-overlay.ts",
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "coverage",
    },
  },
});
