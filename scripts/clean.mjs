/**
 * Clean build artifacts (dist, coverage).
 */
import { rmSync } from "node:fs";

for (const dir of ["dist", "coverage"]) {
  rmSync(dir, { recursive: true, force: true });
}
console.log("Removed dist/ and coverage/.");
