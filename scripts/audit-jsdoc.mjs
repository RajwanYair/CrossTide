#!/usr/bin/env node
/**
 * scripts/audit-jsdoc.mjs — Enforce JSDoc presence on all exported functions
 * and interfaces in src/ and worker/.
 *
 * Run: node scripts/audit-jsdoc.mjs [--enforce]
 *   --enforce  exits 1 if coverage drops below the BASELINE threshold
 *
 * Usage in CI:
 *   - name: JSDoc coverage audit
 *     run: node scripts/audit-jsdoc.mjs --enforce
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ENFORCE = process.argv.includes("--enforce");

// Minimum JSDoc coverage % for exported symbols (ratchet floor — never lower)
const BASELINE_PCT = 70;

/** Collect .ts files under a directory (recursive). */
function collectTs(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectTs(full));
    } else if (entry.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

// Match: export function / export const foo = () => / export class / export interface / export type
const EXPORT_RE =
  /^export\s+(?:(?:async\s+)?function\s+(\w+)|(?:const|let)\s+(\w+)\s*(?::\s*\S+\s*)?=\s*(?:async\s+)?\(?|(?:class|interface|type)\s+(\w+))/gm;
// JSDoc block immediately before a line (/** ... */)
const JSDOC_BEFORE_RE = /\/\*\*[\s\S]*?\*\/\s*\n/g;

let totalExports = 0;
let documentedExports = 0;
const missing = [];

const files = [...collectTs(join(ROOT, "src")), ...collectTs(join(ROOT, "worker"))];

for (const absFile of files) {
  const rel = relative(ROOT, absFile).replaceAll("\\", "/");
  let content;
  try {
    content = readFileSync(absFile, "utf-8");
  } catch {
    continue;
  }

  const lines = content.split("\n");

  let m;
  EXPORT_RE.lastIndex = 0;
  while ((m = EXPORT_RE.exec(content)) !== null) {
    const exportName = m[1] ?? m[2] ?? m[3];
    if (!exportName) continue;

    // Find line number of match
    const before = content.slice(0, m.index);
    const lineNo = before.split("\n").length;

    // Check whether the line immediately before is part of a JSDoc comment
    const precedingLines = lines.slice(Math.max(0, lineNo - 10), lineNo - 1);
    const hasJsDoc = precedingLines.some(
      (l) => l.trimStart().startsWith("*/") || l.trimStart().startsWith("/**"),
    );

    totalExports++;
    if (hasJsDoc) {
      documentedExports++;
    } else {
      missing.push({ file: rel, line: lineNo, name: exportName });
    }
  }
}

const pct = totalExports === 0 ? 100 : Math.round((documentedExports / totalExports) * 100);

console.log(
  `[audit-jsdoc] ${documentedExports}/${totalExports} exported symbols have JSDoc (${pct}%)`,
);

if (missing.length > 0) {
  console.log("\nMissing JSDoc:");
  for (const { file, line, name } of missing.slice(0, 30)) {
    console.log(`  ${file}:${line}  export ${name}`);
  }
  if (missing.length > 30) {
    console.log(`  … and ${missing.length - 30} more`);
  }
}

if (ENFORCE && pct < BASELINE_PCT) {
  console.error(
    `\n[audit-jsdoc] Coverage ${pct}% is below the ${BASELINE_PCT}% baseline. Add JSDoc to exported symbols.`,
  );
  process.exit(1);
} else if (ENFORCE) {
  console.log(`\n[audit-jsdoc] Coverage ${pct}% meets the ${BASELINE_PCT}% baseline.`);
}
