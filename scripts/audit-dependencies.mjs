/**
 * Audit each deployable workspace and emit a deterministic vulnerability inventory.
 */

import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const auditTargets = [
  { name: "root-runtime", args: ["--workspaces=false"] },
  { name: "mcp-server", args: ["--workspace", "mcp-server"] },
  { name: "docs-site", args: ["--workspace", "docs-site"] },
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

if (highOrCritical.length > 0) {
  process.stderr.write(
    `Dependency audit found ${highOrCritical.length} high or critical finding(s).\n`,
  );
  process.exitCode = 1;
}
