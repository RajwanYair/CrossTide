#!/usr/bin/env node
/**
 * scripts/arch-check.mjs — Enforce ESLint-style import-direction rules as a
 * standalone script (complements eslint-plugin-import-x with an explicit
 * violation log that CI can surface without running full ESLint).
 *
 * Layer architecture (outermost can only import inward):
 *   types ← domain ← core ← providers ← cards ← ui ← worker
 *
 * Run: node scripts/arch-check.mjs [--strict]
 *   --strict  exits 1 on any violation (CI mode)
 *
 * Usage in CI:
 *   - name: Architecture layer check
 *     run: node scripts/arch-check.mjs --strict
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const STRICT = process.argv.includes("--strict");

// Layer order (index = allowed-import-depth; lower = more primitive)
const LAYERS = [
  { name: "types", pattern: /^src\/types\// },
  { name: "domain", pattern: /^src\/domain\// },
  { name: "core", pattern: /^src\/core\// },
  { name: "providers", pattern: /^src\/providers\// },
  { name: "cards", pattern: /^src\/cards\// },
  { name: "ui", pattern: /^src\/ui\// },
  { name: "worker", pattern: /^worker\// },
];

/**
 * Return the layer index of a file path, or -1 if not in a tracked layer.
 * @param {string} rel - workspace-relative path with forward slashes
 * @returns {number}
 */
function layerOf(rel) {
  for (let i = 0; i < LAYERS.length; i++) {
    if (LAYERS[i].pattern.test(rel)) return i;
  }
  return -1;
}

/** Collect all .ts files under a directory (recursive). */
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
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectTs(full));
    } else if (entry.endsWith(".ts") || entry.endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

/** Extract static import/export source strings from a file. */
function extractImports(content) {
  const re = /(?:^|\n)\s*(?:import|export)\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const srcs = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    srcs.push(m[1]);
  }
  return srcs;
}

/**
 * Resolve a relative import to a workspace-relative path.
 * @param {string} fromFile - absolute path of the importing file
 * @param {string} importSrc - the import specifier (may be relative)
 * @returns {string|null}
 */
function resolveRel(fromFile, importSrc) {
  if (!importSrc.startsWith(".")) return null; // third-party
  const fromDir = join(fromFile, "..");
  const resolved = join(fromDir, importSrc);
  return relative(ROOT, resolved).replaceAll("\\", "/");
}

let violations = 0;

const srcDir = join(ROOT, "src");
const workerDir = join(ROOT, "worker");
const files = [...collectTs(srcDir), ...collectTs(workerDir)];

for (const absFile of files) {
  const rel = relative(ROOT, absFile).replaceAll("\\", "/");
  const fromLayer = layerOf(rel);
  if (fromLayer === -1) continue;

  let content;
  try {
    content = readFileSync(absFile, "utf-8");
  } catch {
    continue;
  }

  for (const src of extractImports(content)) {
    const resolvedRel = resolveRel(absFile, src);
    if (!resolvedRel) continue;

    const toLayer = layerOf(resolvedRel);
    if (toLayer === -1) continue;

    // Violation: importing from a higher (outer) layer
    if (toLayer > fromLayer) {
      console.error(
        `[arch-check] VIOLATION: ${rel}\n` +
          `  imports from higher layer (${LAYERS[toLayer].name}): ${src}\n`,
      );
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\n[arch-check] ${violations} layer violation(s) found.`);
  if (STRICT) process.exit(1);
} else {
  console.log("[arch-check] All import directions are valid.");
}
