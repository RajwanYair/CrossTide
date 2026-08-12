/**
 * Verify that the roadmap's declared next-ten queue is ordered and executable.
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { validateDocumentFacts } from "./check-doc-facts.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const ROADMAP = join(ROOT, "docs", "ROADMAP.md");
const NEXT_TEN = ["D03", "P04", "P05", "A05", "A06", "U06", "U07", "F01", "F02", "D04"];

function readRoadmapRows() {
  return readFileSync(ROADMAP, "utf8")
    .split(/\r?\n/u)
    .flatMap((line) => {
      const match = line.match(/^\| ([A-Z]\d+) \| .* \| (P\d) \| .* \| ([^|]+) \|$/u);
      return match?.[1] && match[2] && match[3]
        ? [{ id: match[1], priority: match[2], status: match[3].trim() }]
        : [];
    });
}

function readDeclaredQueue() {
  const document = readFileSync(ROADMAP, "utf8");
  const section = document.match(/## Next Ten Priorities\n([\s\S]*?)(?=\n## Phase 0:)/u)?.[1] ?? "";
  return [...section.matchAll(/^\| \d+ \| ([A-Z]\d+) \|/gmu)].map((match) => match[1]);
}

function main() {
  validateDocumentFacts();
  const rows = new Map(readRoadmapRows().map((row) => [row.id, row]));
  const declaredQueue = readDeclaredQueue();
  const missing = NEXT_TEN.filter((id) => !rows.has(id));
  const blocked = NEXT_TEN.filter((id) => rows.get(id)?.status === "Blocked");
  const priorities = NEXT_TEN.map((id) => rows.get(id)?.priority).filter(
    (priority) => priority !== undefined,
  );
  const queueMismatch =
    declaredQueue.length !== NEXT_TEN.length ||
    declaredQueue.some((id, index) => id !== NEXT_TEN[index]);
  const invalidPriority = priorities.some(
    (priority, index) => index > 0 && priority < priorities[index - 1],
  );

  if (missing.length > 0 || blocked.length > 0 || queueMismatch || invalidPriority) {
    if (missing.length > 0) console.error(`Missing roadmap IDs: ${missing.join(", ")}`);
    if (blocked.length > 0)
      console.error(`Blocked roadmap IDs in next-ten queue: ${blocked.join(", ")}`);
    if (queueMismatch) console.error("Roadmap Next Ten Priorities table does not match the queue.");
    if (invalidPriority) console.error("Next-ten queue contains an invalid priority order.");
    process.exitCode = 1;
    return;
  }

  console.log(`Roadmap next-ten queue is valid: ${NEXT_TEN.join(" -> ")}.`);
}

main();
