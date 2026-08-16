/**
 * Audit each deployable workspace and emit a deterministic vulnerability inventory.
 *
 * High/critical findings fail the gate unless every one of their advisories is
 * covered by a dated, owned entry in ACKNOWLEDGED_ADVISORIES below (roadmap S01).
 * An entry only suppresses the exact advisory URL it names — a new advisory on
 * the same package still fails — and expires, so it forces periodic re-review
 * rather than silently widening.
 */

import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const auditTargets = [
  { name: "root-runtime", args: ["--workspaces=false"] },
  { name: "mcp-server", args: ["--workspace", "mcp-server"] },
  { name: "docs-site", args: ["--workspace", "docs-site"] },
];

/**
 * Every high/critical advisory currently reachable through the dependency tree
 * has no published fix as of the review date below (verified against the npm
 * registry: the fixed version in each advisory's range does not exist yet).
 * None of these packages are part of the shipped browser bundle or Worker
 * runtime — all four are transitive dependencies of build-time tooling
 * (Astro/docs-site, Lighthouse CI, PostCSS, npm-internal packaging tools).
 */
const ACKNOWLEDGED_ADVISORIES = [
  {
    url: "https://github.com/advisories/GHSA-5p4m-2wfm-xmqj",
    package: "js-yaml",
    mitigation:
      "Build-time only (Astro/docs-site markdown frontmatter, @lhci/utils config). Never parses untrusted or user-supplied YAML at runtime.",
    owner: "security maintainers",
    reviewedOn: "2026-08-16",
    expires: "2026-11-16",
  },
  {
    url: "https://github.com/advisories/GHSA-7p8r-x3mc-p8w7",
    package: "fast-uri",
    mitigation:
      "Transitive dependency of ajv (JSON Schema validation used by build tooling only). Not used for authority/host-based security decisions in the shipped app or Worker.",
    owner: "security maintainers",
    reviewedOn: "2026-08-16",
    expires: "2026-11-16",
  },
  {
    url: "https://github.com/advisories/GHSA-2v37-7h3g-55p8",
    package: "nanoid",
    mitigation:
      "Transitive dependency of PostCSS (build-time CSS tooling). CrossTide's own ID generation (src/core/uuid.ts) does not use this nanoid instance or a zero-size custom generator.",
    owner: "security maintainers",
    reviewedOn: "2026-08-16",
    expires: "2026-11-16",
  },
  {
    url: "https://github.com/advisories/GHSA-rgw5-rvv9-x895",
    package: "brace-expansion",
    mitigation:
      "Transitive dependency of minimatch, reached only through devDependency-of-devDependency build tooling (glob, rimraf, cacache). Never receives untrusted input in production.",
    owner: "security maintainers",
    reviewedOn: "2026-08-16",
    expires: "2026-11-16",
  },
];

const report = {
  generatedAt: "deterministic",
  auditLevel: "high",
  targets: [],
};

function normalizeFixStatus(fixAvailable) {
  if (fixAvailable === true) return "AVAILABLE";
  if (fixAvailable && typeof fixAvailable === "object") return "BREAKING_OR_REPLACEMENT";
  return "NONE";
}

function normalizeAdvisories(via) {
  return (Array.isArray(via) ? via : [])
    .filter((advisory) => typeof advisory === "object" && advisory !== null)
    .map((advisory) => ({
      source: advisory.source ?? null,
      title: advisory.title ?? null,
      url: advisory.url ?? null,
      severity: advisory.severity ?? null,
      vulnerableRange: advisory.range ?? null,
    }));
}

function viaPackageNames(via) {
  return (Array.isArray(via) ? via : []).filter((entry) => typeof entry === "string");
}

for (const target of auditTargets) {
  const npmExecutable = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  const result = spawnSync(
    process.execPath,
    [npmExecutable, "audit", ...target.args, "--omit=dev", "--audit-level=high", "--json"],
    { encoding: "utf8" },
  );
  const output = String(result.stdout ?? result.stderr ?? "").trim();
  const parsed = output.length > 0 ? JSON.parse(output) : {};
  const vulnerabilities = Object.values(parsed.vulnerabilities ?? {}).map((vulnerability) => ({
    name: vulnerability.name,
    severity: vulnerability.severity,
    direct: vulnerability.isDirect,
    range: vulnerability.range,
    fixAvailable: vulnerability.fixAvailable,
    fixStatus: normalizeFixStatus(vulnerability.fixAvailable),
    nodes: vulnerability.nodes,
    advisories: normalizeAdvisories(vulnerability.via),
    viaPackages: viaPackageNames(vulnerability.via),
  }));

  report.targets.push({
    name: target.name,
    auditPath: target.args.includes("--workspace") ? target.args.at(-1) : "root",
    exitCode: result.status ?? 1,
    vulnerabilities,
  });
}

const outputPath = process.argv[2];
if (outputPath !== undefined) {
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

const highOrCritical = report.targets.flatMap((target) =>
  target.vulnerabilities.filter(
    (vulnerability) => vulnerability.severity === "high" || vulnerability.severity === "critical",
  ),
);

const today = new Date().toISOString().slice(0, 10);
const acknowledgedByUrl = new Map(ACKNOWLEDGED_ADVISORIES.map((entry) => [entry.url, entry]));
const acknowledgedPackages = new Set(ACKNOWLEDGED_ADVISORIES.map((entry) => entry.package));
const expired = ACKNOWLEDGED_ADVISORIES.filter((entry) => entry.expires < today);

function isExplained(vulnerability, byName, visited) {
  if (visited.has(vulnerability.name)) return true;
  visited.add(vulnerability.name);
  if (vulnerability.advisories.length > 0) {
    return vulnerability.advisories.every((advisory) => acknowledgedByUrl.has(advisory.url));
  }
  if (vulnerability.viaPackages.length === 0) return false;
  return vulnerability.viaPackages.every((packageName) => {
    if (acknowledgedPackages.has(packageName)) return true;
    const dependency = byName.get(packageName);
    return dependency ? isExplained(dependency, byName, visited) : false;
  });
}

const unexplained = [];
for (const target of report.targets) {
  const byName = new Map(
    target.vulnerabilities.map((vulnerability) => [vulnerability.name, vulnerability]),
  );
  for (const vulnerability of target.vulnerabilities) {
    if (vulnerability.severity !== "high" && vulnerability.severity !== "critical") continue;
    if (!isExplained(vulnerability, byName, new Set())) unexplained.push(vulnerability);
  }
}

if (expired.length > 0) {
  process.stderr.write("Dependency audit exception(s) have expired and need re-review:\n");
  for (const entry of expired) process.stderr.write(`- ${entry.package} (${entry.url})\n`);
  process.exitCode = 1;
} else if (unexplained.length > 0) {
  process.stderr.write(
    `Dependency audit found ${unexplained.length} high or critical finding(s) with no acknowledged, dated exception:\n`,
  );
  for (const vulnerability of unexplained) {
    process.stderr.write(
      `- ${vulnerability.name} (${vulnerability.severity}): ${vulnerability.advisories.map((a) => a.url).join(", ") || `via ${vulnerability.viaPackages.join(", ")}`}\n`,
    );
  }
  process.exitCode = 1;
} else if (highOrCritical.length > 0) {
  console.log(
    `Dependency audit found ${highOrCritical.length} high or critical finding(s), all covered by dated exceptions (roadmap S01): ${[...acknowledgedByUrl.keys()].join(", ")}.`,
  );
} else {
  console.log("Dependency audit found no high or critical findings.");
}
