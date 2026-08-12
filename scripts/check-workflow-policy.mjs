/** Validate GitHub Actions workflow parsing and repository install policy. */

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { load } from "js-yaml";

const ROOT = resolve(import.meta.dirname, "..");
const WORKFLOW_DIRECTORY = resolve(ROOT, ".github/workflows");

function workflowFiles() {
  return readdirSync(WORKFLOW_DIRECTORY)
    .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
    .sort()
    .map((name) => join(WORKFLOW_DIRECTORY, name));
}

/** Validate one workflow's YAML and security-sensitive package commands. */
export function validateWorkflowSource(source, relativePath) {
  const failures = [];
  try {
    const document = load(source);
    if (document === null || typeof document !== "object") {
      failures.push(`${relativePath} does not contain a workflow document`);
    }
  } catch (error) {
    failures.push(
      `${relativePath} is invalid YAML: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  for (const command of source.matchAll(/\bnpm\s+ci\b[^\n]*/gu)) {
    if (!command[0].includes("--ignore-scripts")) {
      failures.push(`${relativePath} uses npm ci without --ignore-scripts`);
    }
  }
  const executableSource = source
    .split("\n")
    .filter((line) => !/^\s*#/u.test(line))
    .join("\n");
  if (/\bnpx\s+(?!--no-install\b)/u.test(executableSource)) {
    failures.push(`${relativePath} uses npx; invoke declared tools from node_modules/.bin`);
  }

  return failures;
}

/** Validate workflow YAML and security-sensitive package commands. */
export function validateWorkflowPolicy() {
  const failures = [];
  const files = workflowFiles();

  for (const file of files) {
    const relativePath = file.slice(ROOT.length + 1).replaceAll("\\", "/");
    failures.push(...validateWorkflowSource(readFileSync(file, "utf8"), relativePath));
  }

  const ciPath = resolve(WORKFLOW_DIRECTORY, "ci.yml");
  if (!readFileSync(ciPath, "utf8").includes("npm audit signatures")) {
    failures.push(".github/workflows/ci.yml is missing npm audit signatures");
  }

  return failures;
}

const failures = validateWorkflowPolicy();
if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Workflow policy passed.\n");
}
