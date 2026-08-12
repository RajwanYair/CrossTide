/**
 * Verify that declared package export targets exist and remain consumable.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PACKAGE_FILES = [
  join(ROOT, "package.json"),
  join(ROOT, "packages", "domain", "package.json"),
];
const EXPECTED_EXPORTS = new Map([
  [join(ROOT, "package.json"), [".", "./core", "./domain"]],
  [join(ROOT, "packages", "domain", "package.json"), [".", "./browser", "./package.json"]],
]);

function collectTargets(value) {
  if (typeof value === "string") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectTargets);
}

function checkPackage(packageFile) {
  const packageData = JSON.parse(readFileSync(packageFile, "utf8"));
  const packageRoot = resolve(packageFile, "..");
  const exportsValue = packageData.exports;
  if (exportsValue === undefined) return [];

  const declaredKeys = Object.keys(exportsValue);
  const expectedKeys = EXPECTED_EXPORTS.get(packageFile) ?? [];
  const missingKeys = expectedKeys.filter((key) => !declaredKeys.includes(key));
  const unexpectedKeys = declaredKeys.filter((key) => !expectedKeys.includes(key));
  if (missingKeys.length > 0 || unexpectedKeys.length > 0) {
    throw new Error(
      `${packageData.name} export inventory drift: missing [${missingKeys.join(", ")}], unexpected [${unexpectedKeys.join(", ")}]`,
    );
  }

  return collectTargets(exportsValue).map((target) => {
    const targetPath = resolve(packageRoot, target);
    return { packageName: packageData.name, target, exists: existsSync(targetPath) };
  });
}

function main() {
  let results;
  try {
    results = PACKAGE_FILES.flatMap(checkPackage);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  const missing = results.filter((result) => !result.exists);

  if (missing.length > 0) {
    console.error("Declared package export targets are missing:");
    for (const result of missing) console.error(`- ${result.packageName}: ${result.target}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${results.length} declared package export targets.`);
}

main();
