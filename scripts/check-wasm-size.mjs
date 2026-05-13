/**
 * WASM size budget enforcement (S13).
 *
 * Checks that total WASM output in dist/wasm/ stays under 200 KB.
 * Used by CI (.github/workflows/wasm.yml) and `npm run check:wasm`.
 */

import { readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const WASM_DIR = resolve(import.meta.dirname ?? ".", "../dist/wasm");
const BUDGET_BYTES = 200 * 1024; // 200 KB

if (!existsSync(WASM_DIR)) {
  console.log("⚠ No WASM output directory found at dist/wasm/");
  console.log("  Run AssemblyScript compilation first.");
  process.exit(0); // Not an error — modules haven't been compiled yet
}

const files = readdirSync(WASM_DIR).filter((f) => f.endsWith(".wasm"));

if (files.length === 0) {
  console.log("⚠ No .wasm files found in dist/wasm/");
  process.exit(0);
}

let total = 0;
console.log("\nWASM Module Sizes:");
console.log("─".repeat(50));

for (const file of files) {
  const size = statSync(join(WASM_DIR, file)).size;
  total += size;
  const kb = (size / 1024).toFixed(1);
  console.log(`  ${file.padEnd(35)} ${kb.padStart(8)} KB`);
}

console.log("─".repeat(50));
console.log(`  ${"Total".padEnd(35)} ${(total / 1024).toFixed(1).padStart(8)} KB`);
console.log(`  ${"Budget".padEnd(35)} ${(BUDGET_BYTES / 1024).toFixed(1).padStart(8)} KB`);
console.log();

if (total > BUDGET_BYTES) {
  console.error(
    `❌ WASM size budget exceeded: ${(total / 1024).toFixed(1)} KB > ${(BUDGET_BYTES / 1024).toFixed(1)} KB`,
  );
  process.exit(1);
} else {
  const pct = ((total / BUDGET_BYTES) * 100).toFixed(0);
  console.log(`✅ WASM size within budget (${pct}% used)`);
}
