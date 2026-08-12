/** Contract guard for public package exports versus runtime-only barrels. */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type PackageJson = {
  readonly exports?: Record<string, string>;
};

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
) as PackageJson;
const contractDoc = readFileSync(resolve(process.cwd(), "docs/PACKAGE_CONTRACTS.md"), "utf8");
const exportsMap = packageJson.exports ?? {};

describe("package contract boundaries", () => {
  it("documents every package export", () => {
    for (const [subpath, target] of Object.entries(exportsMap)) {
      const documentedTarget = target.replace(/^\.\//, "");
      expect(contractDoc, `missing contract documentation for ${subpath}`).toContain(
        `\`${documentedTarget}\``,
      );
    }
  });

  it("does not publish runtime-only card and UI barrels as package subpaths", () => {
    expect(exportsMap["./cards"]).toBeUndefined();
    expect(exportsMap["./ui"]).toBeUndefined();
  });

  it("keeps the domain and core public entry points explicit", () => {
    expect(exportsMap["./domain"]).toBe("./src/domain/index.ts");
    expect(exportsMap["./core"]).toBe("./src/core/index.ts");
  });
});
