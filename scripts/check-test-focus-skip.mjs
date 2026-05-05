#!/usr/bin/env node
/**
 * check-test-focus-skip.mjs
 *
 * Prevents accidental `.only` / `.skip` modifiers from reaching CI by scanning
 * all test files. These patterns are useful locally but break coverage reporting
 * and hide regressions when committed.
 *
 * Exits with code 1 and prints file:line references for every violation found.
 * Run: node scripts/check-test-focus-skip.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TEST_DIRS = ["tests/unit", "tests/browser", "tests/e2e"];

/** Patterns that must NOT appear in committed test files. */
const FORBIDDEN = [
  /\bit\.only\s*\(/g,
  /\btest\.only\s*\(/g,
  /\bdescribe\.only\s*\(/g,
  /\bfit\s*\(/g, // Jest alias
  /\bfdescribe\s*\(/g, // Jest alias
  /\bit\.skip\s*\(/g,
  /\btest\.skip\s*\(/g,
  /\bdescribe\.skip\s*\(/g,
  /\bxit\s*\(/g, // Jasmine alias
  /\bxdescribe\s*\(/g, // Jasmine alias
];

/**
 * Recursively collect `.ts` / `.mts` / `.spec.ts` files under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function collectFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results; // directory may not exist yet
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (/\.[mc]?tsx?$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

let violations = 0;

for (const dir of TEST_DIRS) {
  const abs = join(ROOT, dir);
  for (const file of collectFiles(abs)) {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    const rel = relative(ROOT, file).replaceAll("\\", "/");

    for (const pattern of FORBIDDEN) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(src)) !== null) {
        // Compute line number from char offset
        const before = src.slice(0, match.index);
        const line = before.split("\n").length;
        process.stderr.write(
          `::error file=${rel},line=${line}::Forbidden test modifier \`${match[0].trim()}\` — remove before merging (${rel}:${line})\n`,
        );
        violations++;
      }
    }
  }
}

if (violations > 0) {
  process.stderr.write(
    `\n❌  Found ${violations} forbidden test modifier${violations === 1 ? "" : "s"}. Remove all .only / .skip before merging.\n`,
  );
  process.exit(1);
} else {
  process.stdout.write("✅  No focused or skipped tests found.\n");
}
