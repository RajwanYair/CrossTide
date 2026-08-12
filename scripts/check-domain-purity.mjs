/**
 * Verify that the publishable domain package does not import application layers.
 */

import { globSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DOMAIN_ROOT = resolve(ROOT, "src", "domain");
const TYPES_ROOT = resolve(ROOT, "src", "types");
const DOMAIN_FILES = globSync("src/domain/**/*.ts", { cwd: ROOT, absolute: true }).filter(
  (file) => !file.endsWith(".d.ts") && !file.endsWith(".test.ts"),
);
const IMPORT_PATTERN = /(?:import|export)\s+(?:[^"']+?\s+from\s+)?["'](\.[^"']+)["']/gu;
const failures = [];

function isInside(path, root) {
  const relativePath = relative(resolve(root), resolve(path));
  return relativePath !== "" && !relativePath.startsWith("..") && !relativePath.includes(":");
}

for (const file of DOMAIN_FILES) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const importedPath = resolve(dirname(file), match[1]);
    const candidatePaths = [
      importedPath,
      `${importedPath}.ts`,
      `${importedPath}.js`,
      resolve(importedPath, "index.ts"),
    ];
    const target = candidatePaths.find(
      (candidate) => isInside(candidate, DOMAIN_ROOT) || isInside(candidate, TYPES_ROOT),
    );
    if (target === undefined) {
      failures.push(
        `${file.replace(`${ROOT}\\`, "")}: relative import escapes domain/types: ${match[1]}`,
      );
    }
  }
}

const packageData = JSON.parse(readFileSync(resolve(ROOT, "packages/domain/package.json"), "utf8"));
if (packageData.dependencies !== undefined && Object.keys(packageData.dependencies).length > 0) {
  failures.push("packages/domain/package.json: runtime dependencies must remain empty");
}

if (failures.length > 0) {
  console.error("Domain purity check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Domain purity check passed: ${DOMAIN_FILES.length} source files stay within domain/types.`,
  );
}
