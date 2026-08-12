/**
 * Verify that every maintained Markdown or MDX document matches an ownership
 * pattern in docs/OWNERSHIP.md.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OWNERSHIP_FILE = join(ROOT, "docs", "OWNERSHIP.md");
const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);

function walkMarkdown(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdown(fullPath));
    } else if (/\.(?:md|mdx)$/u.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function patternToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`^${escaped.replaceAll("*", ".*")}$`, "u");
}

function readOwnershipPatterns() {
  return readFileSync(OWNERSHIP_FILE, "utf8")
    .split(/\r?\n/u)
    .flatMap((line) => {
      const match = line.match(/^\| `([^`]+)` \|/u);
      return match?.[1] ? [match[1]] : [];
    })
    .map(patternToRegExp);
}

function main() {
  const patterns = readOwnershipPatterns();
  const documents = walkMarkdown(ROOT).map((file) => relative(ROOT, file).replaceAll("\\", "/"));
  const uncovered = documents.filter(
    (document) => !patterns.some((pattern) => pattern.test(document)),
  );

  if (uncovered.length > 0) {
    console.error("Documentation ownership is missing for:");
    for (const document of uncovered) console.error(`- ${document}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Documentation ownership covers ${documents.length} Markdown/MDX files.`);
}

main();
