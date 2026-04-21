/**
 * Bundle size check — ensures production build stays under budget.
 * Budget: 200 KB gzipped total JS.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BUDGET_BYTES = 200 * 1024; // 200 KB
const DIST_DIR = "dist";
const ASSETS_DIR = join(DIST_DIR, "assets");

function getJsSize() {
  try {
    const files = readdirSync(ASSETS_DIR);
    let total = 0;
    for (const file of files) {
      if (file.endsWith(".js")) {
        const stat = statSync(join(ASSETS_DIR, file));
        total += stat.size;
      }
    }
    return total;
  } catch {
    console.error("No dist/assets directory found. Run `npm run build` first.");
    process.exit(1);
  }
}

const size = getJsSize();
const sizeKB = (size / 1024).toFixed(1);
const budgetKB = (BUDGET_BYTES / 1024).toFixed(0);

if (size > BUDGET_BYTES) {
  console.error(`FAIL: JS bundle ${sizeKB} KB exceeds budget of ${budgetKB} KB`);
  process.exit(1);
} else {
  console.log(`PASS: JS bundle ${sizeKB} KB (budget: ${budgetKB} KB)`);
}
