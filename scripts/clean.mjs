/**
 * Clean reproducible build, test, documentation, and local runtime artifacts.
 */
import { rmSync } from "node:fs";

const generatedDirectories = [
  "dist",
  "coverage",
  "test-results",
  "playwright-report",
  ".playwright-mcp",
  ".vitest-attachments",
  "docs-site/.astro",
  "docs-site/dist",
  "mcp-server/dist",
  "worker/.wrangler",
];

for (const dir of generatedDirectories) {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`Removed ${generatedDirectories.length} generated directories.`);
