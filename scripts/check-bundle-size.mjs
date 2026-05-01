/**
 * Bundle size check — ensures production build stays under budget.
 * Budget: 200 KB gzipped JS (matches the figure quoted in README/ROADMAP).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_BYTES = 200 * 1024; // 200 KB gzipped
const DIST_DIR = "dist";
const ASSETS_DIR = join(DIST_DIR, "assets");

function getJsSize() {
  try {
    const files = readdirSync(ASSETS_DIR);
    let raw = 0;
    let gz = 0;
    for (const file of files) {
      if (file.endsWith(".js")) {
        const path = join(ASSETS_DIR, file);
        raw += statSync(path).size;
        gz += gzipSync(readFileSync(path)).length;
      }
    }
    return { raw, gz };
  } catch {
    console.error("No dist/assets directory found. Run `npm run build` first.");
    process.exit(1);
  }
}

const { raw, gz } = getJsSize();
const rawKB = (raw / 1024).toFixed(1);
const gzKB = (gz / 1024).toFixed(1);
const budgetKB = (BUDGET_BYTES / 1024).toFixed(0);

if (gz > BUDGET_BYTES) {
  console.error(
    `FAIL: JS bundle ${gzKB} KB gzipped (raw ${rawKB} KB) exceeds budget of ${budgetKB} KB`,
  );
  process.exit(1);
} else {
  console.log(`PASS: JS bundle ${gzKB} KB gzipped (raw ${rawKB} KB) — budget ${budgetKB} KB`);
}
