/** Verify documented repository facts against the source tree. */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function filesUnder(directory, predicate) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

function countTypescript(directory) {
  return filesUnder(directory, (path) => extname(path) === ".ts" && !path.endsWith(".d.ts")).length;
}

function countDirectTypescript(directory) {
  return readdirSync(directory).filter((name) => name.endsWith(".ts") && !name.endsWith(".d.ts"))
    .length;
}

function countTests() {
  return filesUnder(resolve(ROOT, "tests"), (path) => /\.(test|spec)\.ts$/u.test(path)).length;
}

function countRegisteredCards() {
  const registry = readFileSync(resolve(ROOT, "src/cards/registry.ts"), "utf8");
  return [...registry.matchAll(/\n\s*route:\s*["']([^"']+)["']/gu)].length;
}

/** Derive facts used by the canonical documentation. */
export function collectDocumentedFacts() {
  return {
    version: JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")).version,
    sourceModules: countTypescript(resolve(ROOT, "src")),
    domainModules: countDirectTypescript(resolve(ROOT, "src/domain")),
    coreModules: countDirectTypescript(resolve(ROOT, "src/core")),
    uiModules: countDirectTypescript(resolve(ROOT, "src/ui")),
    cardFiles: countDirectTypescript(resolve(ROOT, "src/cards")),
    registeredCards: countRegisteredCards(),
    testFiles: countTests(),
  };
}

function requireFact(document, label, pattern) {
  if (!pattern.test(document)) throw new Error(`${label} is stale or missing`);
}

/** Validate the roadmap and architecture documents against current source facts. */
export function validateDocumentFacts() {
  const facts = collectDocumentedFacts();
  const roadmap = readFileSync(resolve(ROOT, "docs/ROADMAP.md"), "utf8");
  const architecture = readFileSync(resolve(ROOT, "docs/ARCHITECTURE.md"), "utf8");
  const checks = [
    [
      roadmap,
      "roadmap version",
      new RegExp(`Current release:.*v${facts.version.replaceAll(".", "\\.")}`),
    ],
    [
      roadmap,
      "roadmap source modules",
      new RegExp(`Source modules under.*\\| ${facts.sourceModules} TypeScript files`),
    ],
    [roadmap, "roadmap domain modules", new RegExp(`Domain modules.*\\| ${facts.domainModules},`)],
    [roadmap, "roadmap core modules", new RegExp(`Core modules.*\\| ${facts.coreModules} `)],
    [roadmap, "roadmap ui modules", new RegExp(`UI modules.*\\| ${facts.uiModules} `)],
    [roadmap, "roadmap card files", new RegExp(`Card files.*\\| ${facts.cardFiles} `)],
    [
      roadmap,
      "roadmap registered cards",
      new RegExp(`Registered card routes.*\\| ${facts.registeredCards} `),
    ],
    [roadmap, "roadmap test files", new RegExp(`Test files.*\\| ${facts.testFiles} `)],
    [architecture, "architecture version", new RegExp(`v${facts.version.replaceAll(".", "\\.")}`)],
    [architecture, "architecture test files", new RegExp(`${facts.testFiles} test files`)],
  ];
  for (const [document, label, pattern] of checks) requireFact(document, label, pattern);
  return facts;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const facts = validateDocumentFacts();
  process.stdout.write(`Documentation facts match source: ${JSON.stringify(facts)}\n`);
}
