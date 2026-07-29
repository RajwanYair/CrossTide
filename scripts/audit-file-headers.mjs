/**
 * File-header audit — reports source files that lack a leading `/** ... *\/` docblock.
 *
 * A one-line summary at the top of every file lets an AI assistant identify a
 * file's purpose from its first tokens instead of parsing the whole body, which
 * measurably reduces the context needed to navigate the repo.
 *
 * Usage: node scripts/audit-file-headers.mjs [--list]
 * Exits 1 when any file is missing a header.
 */
import { globSync, readFileSync } from "node:fs";

const ROOTS = ["src/**/*.ts", "worker/**/*.ts", "scripts/**/*.mjs"];
const IGNORE = /node_modules|\.d\.ts$/;

const files = ROOTS.flatMap((pattern) => globSync(pattern)).filter((f) => !IGNORE.test(f));

const missing = files.filter((file) => {
  // A shebang or triple-slash directive legitimately precedes the docblock.
  const head = readFileSync(file, "utf8")
    .slice(0, 2000)
    .replace(/^#!.*\r?\n/, "")
    .replace(/^(\s*\/\/\/.*\r?\n)+/, "")
    .trimStart();
  return !head.startsWith("/**");
});

const total = files.length;
const covered = total - missing.length;
const pct = total === 0 ? 100 : ((covered / total) * 100).toFixed(1);

if (process.argv.includes("--list")) {
  for (const file of missing) console.warn(file.replace(/\\/g, "/"));
}

console.warn(`File headers: ${covered}/${total} (${pct}%) — ${missing.length} missing`);
process.exit(missing.length > 0 ? 1 : 0);
