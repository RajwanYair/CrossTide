import { defineConfig } from "vitest/config";

/** Suites that never touch DOM globals — running them on `node` skips happy-dom construction. */
const NODE_ONLY_SUITES = [
  "tests/unit/domain/**/*.test.ts",
  "tests/unit/worker/**/*.test.ts",
  "tests/unit/providers/**/*.test.ts",
  "tests/unit/types/**/*.test.ts",
  "tests/unit/helpers/**/*.test.ts",
  "tests/unit/mcp/**/*.test.ts",
];

const TEST_POOL = process.env["VITEST_POOL"] === "forks" ? "forks" : "threads";
const MAX_TEST_WORKERS = process.env["VITEST_MAX_WORKERS"] ?? "87.5%";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify("test"),
  },
  test: {
    globals: true,
    pool: TEST_POOL,
    maxWorkers: MAX_TEST_WORKERS,
    testTimeout: 10000,
    hookTimeout: 10000,
    projects: [
      {
        define: { __APP_VERSION__: JSON.stringify("test") },
        test: {
          name: "node",
          environment: "node",
          globals: true,
          testTimeout: 10000,
          hookTimeout: 10000,
          setupFiles: ["tests/helpers/node-network.ts"],
          include: NODE_ONLY_SUITES,
        },
      },
      {
        define: { __APP_VERSION__: JSON.stringify("test") },
        test: {
          name: "dom",
          environment: "happy-dom",
          environmentOptions: {
            happyDOM: {
              settings: {
                disableCSSFileLoading: true,
                disableIframePageLoading: true,
                disableJavaScriptFileLoading: true,
              },
            },
          },
          globals: true,
          testTimeout: 10000,
          hookTimeout: 10000,
          setupFiles: ["tests/helpers/happy-dom-network.ts"],
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/browser/**", ...NODE_ONLY_SUITES],
        },
      },
    ],
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
      reportsDirectory: process.env["VITEST_COVERAGE_DIR"] ?? "coverage",
    },
  },
});
