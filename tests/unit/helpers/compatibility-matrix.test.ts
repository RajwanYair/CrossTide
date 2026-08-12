/** Browser compatibility matrix contract. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("compatibility matrix", () => {
  it("documents every Playwright browser project", () => {
    const matrix = readFileSync(resolve(root, "docs/COMPATIBILITY-MATRIX.md"), "utf8");
    const playwrightConfig = readFileSync(resolve(root, "playwright.config.ts"), "utf8");
    const projectNames = [...playwrightConfig.matchAll(/name: ["']([^"']+)["']/g)].map(
      (match) => match[1],
    );

    for (const projectName of projectNames) {
      expect(matrix).toContain("`" + projectName + "`");
    }
  });

  it("documents the optional capability fallbacks covered by browser tests", () => {
    const matrix = readFileSync(resolve(root, "docs/COMPATIBILITY-MATRIX.md"), "utf8");

    for (const capability of ["Storage", "Reduced motion", "Reduced data", "Battery"]) {
      expect(matrix).toContain(`| ${capability} |`);
    }
  });
});
