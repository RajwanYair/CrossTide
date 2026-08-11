/**
 * Build a deterministic source reachability inventory from the application entry points.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_ROOT = resolve(ROOT, "src");
const REPORT_PATH = resolve(ROOT, "docs/REACHABILITY.md");
const COVERAGE_PATH = resolve(ROOT, "coverage/coverage-summary.json");
const REACHABLE_COVERAGE_BASELINE = {
  statements: 89.8,
  branches: 80.1,
  functions: 91.4,
  lines: 91.6,
  maxUnmeasuredModules: 38,
};
const REACHABILITY_GATE_BASELINE = {
  maxHardOrphans: 44,
};
const ENTRY_POINTS = [resolve(SRC_ROOT, "main.ts"), resolve(SRC_ROOT, "sw.ts")];
const IMPORT_PATTERN = /(?:from\s+|import\s*\(\s*|import\s*)["']([^"']+)["']/g;
const compareStrings = (left, right) => left.localeCompare(right);

function sourceFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(path));
    else if (extname(entry.name) === ".ts" && !entry.name.endsWith(".d.ts")) files.push(path);
  }
  return files.sort(compareStrings);
}

function resolveImport(source, specifier) {
  if (!specifier.startsWith(".")) return undefined;
  const base = resolve(dirname(source), specifier.replace(/\.js$/u, ""));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, resolve(base, "index.ts")];
  return candidates.find((candidate) => candidate.endsWith(".ts") && sourceFileExists(candidate));
}

function sourceFileExists(path) {
  try {
    return readFileSync(path, "utf8") !== undefined;
  } catch {
    return false;
  }
}

function relativeSource(path) {
  return relative(ROOT, path).replaceAll("\\", "/");
}

function defaultDisposition(path, hardOrphan) {
  if (path.startsWith("src/domain/")) return "PUBLISH";
  if (path.includes("/_experimental/")) return "DEFER";
  if (hardOrphan) return "WIRE";
  return "PUBLISH";
}

/**
 * Analyze source imports reachable from `src/main.ts` and `src/sw.ts`.
 *
 * The result intentionally excludes test-only imports: a module referenced only
 * by its test remains visible as an orphan and cannot be mistaken for shipped code.
 */
export function buildInventory() {
  const files = sourceFiles(SRC_ROOT);
  const fileSet = new Set(files);
  const graph = new Map(files.map((file) => [file, new Set()]));
  const reverse = new Map(files.map((file) => [file, new Set()]));

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const target = resolveImport(file, match[1]);
      if (target && fileSet.has(target)) {
        graph.get(file).add(target);
        reverse.get(target).add(file);
      }
    }
  }

  const reachable = new Set();
  const pending = [...ENTRY_POINTS.filter((entry) => fileSet.has(entry))];
  while (pending.length > 0) {
    const current = pending.pop();
    if (reachable.has(current)) continue;
    reachable.add(current);
    for (const target of graph.get(current)) pending.push(target);
  }

  const modules = files.map((file) => {
    const importers = [...reverse.get(file)].map(relativeSource).sort(compareStrings);
    const path = relativeSource(file);
    const isReachable = reachable.has(file);
    const hardOrphan = !isReachable && importers.length === 0;
    const barrelOnly =
      !isReachable &&
      importers.length > 0 &&
      importers.every((importer) => importer.endsWith("/index.ts"));
    let category = "UNREACHABLE";
    if (isReachable) category = "REACHABLE";
    else if (hardOrphan) category = "HARD_ORPHAN";
    else if (barrelOnly) category = "BARREL_ONLY";
    return {
      path,
      reachable: isReachable,
      importers,
      category,
      disposition: defaultDisposition(path, hardOrphan),
    };
  });

  const unreachable = modules.filter((module) => !module.reachable);
  return {
    entryPoints: ENTRY_POINTS.map(relativeSource),
    totals: {
      sourceModules: modules.length,
      reachable: reachable.size,
      unreachable: unreachable.length,
      hardOrphans: modules.filter((module) => module.category === "HARD_ORPHAN").length,
      barrelOnly: modules.filter((module) => module.category === "BARREL_ONLY").length,
    },
    modules,
  };
}

/** Render the non-reachable modules as an auditable disposition table. */
export function renderDispositionReport(inventory) {
  const unreachable = inventory.modules.filter((module) => !module.reachable);
  const lines = [
    "# Reachability Disposition Record",
    "",
    "> Generated from `src/main.ts` and `src/sw.ts` by `scripts/reachability-inventory.mjs`.",
    "> Every module not reachable from those entry points appears exactly once below.",
    "",
    `- Source modules: ${inventory.totals.sourceModules}`,
    `- Reachable modules: ${inventory.totals.reachable}`,
    `- Unreachable modules: ${inventory.totals.unreachable}`,
    `- Hard orphans: ${inventory.totals.hardOrphans}`,
    `- Barrel-only modules: ${inventory.totals.barrelOnly}`,
    "",
    "| Module | Category | Importers | Disposition |",
    "| --- | --- | --- | --- |",
  ];

  for (const module of unreachable) {
    lines.push(
      `| \`${module.path}\` | ${module.category} | ${module.importers.join("<br>") || "-"} | ${module.disposition} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

/**
 * Aggregate V8 coverage only across reachable source modules with coverage data.
 * Reachable modules missing from the report remain visible as unmeasured.
 */
export function calculateReachableCoverage(inventory, coverageSummary) {
  const coverageByPath = new Map(
    Object.entries(coverageSummary)
      .filter(([path]) => path !== "total")
      .map(([path, summary]) => [relativeSource(resolve(path)), summary]),
  );
  const reachable = inventory.modules.filter((module) => module.reachable);
  const measured = reachable.filter((module) => coverageByPath.has(module.path));
  const totals = ["lines", "statements", "functions", "branches"].reduce((result, metric) => {
    const counters = measured.reduce(
      (sum, module) => {
        const value = coverageByPath.get(module.path)[metric];
        return {
          covered: sum.covered + value.covered,
          total: sum.total + value.total,
        };
      },
      { covered: 0, total: 0 },
    );
    result[metric] = {
      ...counters,
      pct: counters.total === 0 ? 100 : (counters.covered / counters.total) * 100,
    };
    return result;
  }, {});

  return {
    reachableModules: reachable.length,
    measuredModules: measured.length,
    unmeasuredModules: reachable.length - measured.length,
    totals,
  };
}

/** Validate the reachable-graph coverage ratchet against its verified baseline. */
export function validateReachableCoverage(result) {
  const failures = [];
  for (const metric of ["statements", "branches", "functions", "lines"]) {
    if (result.totals[metric].pct < REACHABLE_COVERAGE_BASELINE[metric]) {
      failures.push(
        `${metric} ${result.totals[metric].pct.toFixed(2)}% < ${REACHABLE_COVERAGE_BASELINE[metric]}% baseline`,
      );
    }
  }
  if (result.unmeasuredModules > REACHABLE_COVERAGE_BASELINE.maxUnmeasuredModules) {
    failures.push(
      `unmeasured modules ${result.unmeasuredModules} > ${REACHABLE_COVERAGE_BASELINE.maxUnmeasuredModules} baseline`,
    );
  }
  return failures;
}

/** Validate that unreachable-module debt does not grow without a disposition. */
export function validateReachabilityGate(inventory) {
  const failures = [];
  if (inventory.totals.hardOrphans > REACHABILITY_GATE_BASELINE.maxHardOrphans) {
    failures.push(
      `hard orphans ${inventory.totals.hardOrphans} > ${REACHABILITY_GATE_BASELINE.maxHardOrphans} baseline`,
    );
  }
  const allowedDispositions = new Set(["WIRE", "PUBLISH", "PROMOTE", "MERGE", "DEFER"]);
  for (const module of inventory.modules) {
    if (!module.reachable && !allowedDispositions.has(module.disposition)) {
      failures.push(`${module.path} has invalid disposition ${module.disposition}`);
    }
  }
  return failures;
}

const inventory = buildInventory();
if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
} else if (process.argv.includes("--markdown")) {
  process.stdout.write(renderDispositionReport(inventory));
} else if (process.argv.includes("--check-markdown")) {
  const expected = renderDispositionReport(inventory);
  const actual = readFileSync(REPORT_PATH, "utf8");
  if (actual !== expected) {
    process.stderr.write(`Reachability report is stale: ${relative(ROOT, REPORT_PATH)}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Reachability report is current: ${relative(ROOT, REPORT_PATH)}\n`);
  }
} else if (process.argv.includes("--reachability-gate")) {
  const failures = validateReachabilityGate(inventory);
  if (failures.length > 0) {
    process.stderr.write(`${failures.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write("Reachability gate passed.\n");
  }
} else if (process.argv.includes("--reachable-coverage")) {
  const coverageSummary = JSON.parse(readFileSync(COVERAGE_PATH, "utf8"));
  const result = calculateReachableCoverage(inventory, coverageSummary);
  const failures = validateReachableCoverage(result);
  process.stdout.write(`${JSON.stringify({ ...result, failures }, null, 2)}\n`);
  if (failures.length > 0) process.exitCode = 1;
} else {
  process.stdout.write(
    `Reachability: ${inventory.totals.reachable}/${inventory.totals.sourceModules} reachable; ` +
      `${inventory.totals.hardOrphans} hard orphans; ${inventory.totals.barrelOnly} barrel-only\n`,
  );
}
