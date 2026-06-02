/**
 * Stryker Mutation Testing Configuration (Q14).
 *
 * Targets src/domain/ — the pure-logic hot path where mutations are most
 * meaningful. Uses the TypeScript checker and Vitest runner.
 *
 * Run:  npx stryker run --configFile config/stryker.config.mjs
 */
import os from "os";
import path from "path";

const tmpDir = path.join(os.tmpdir(), "crosstide", "mutation");

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  // ── Scope ───────────────────────────────────────────────────────────────────
  mutate: [
    "src/domain/**/*.ts",
    "!src/domain/index.ts",
    "!src/domain/branded.ts",
    "!src/domain/types.ts",
    "!src/domain/_experimental/**",
  ],

  // ── Test runner ─────────────────────────────────────────────────────────────
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.ts",
  },

  // ── TypeScript ──────────────────────────────────────────────────────────────
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",

  // ── Thresholds ──────────────────────────────────────────────────────────────
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },

  // ── Performance ─────────────────────────────────────────────────────────────
  concurrency: 4,
  timeoutMS: 30000,
  timeoutFactor: 2.5,

  // ── Reporters ───────────────────────────────────────────────────────────────
  reporters: ["html", "clear-text", "progress"],
  htmlReporter: {
    fileName: path.join(tmpDir, "index.html"),
  },

  // ── Incremental ───────────────────────────────────────────────────────────────
  incremental: true,
  incrementalFile: path.join(tmpDir, ".stryker-incremental.json"),

  // ── Ignore patterns ─────────────────────────────────────────────────────────
  ignorers: ["string-literal", "regex-literal"],
  ignoreStatic: true,
};
