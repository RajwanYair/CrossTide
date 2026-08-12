/**
 * Scan browser build artifacts for credential-shaped values before release.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = resolve(ROOT, process.argv[2] ?? "dist");
const TEXT_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".map", ".mjs"]);
const secretPatterns = [
  { name: "private key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/u },
  { name: "AWS access key", pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/u },
  { name: "GitHub token", pattern: /\b(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{20,}\b/u },
  { name: "OpenAI-style key", pattern: /\bsk-[A-Za-z0-9]{20,}\b/u },
  {
    name: "credential assignment",
    pattern:
      /\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*["'][^"']{16,}["']/iu,
  },
];

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(path);
    return TEXT_EXTENSIONS.has(path.slice(path.lastIndexOf(".")).toLowerCase()) ? [path] : [];
  });
}

if (!statSync(DIST, { throwIfNoEntry: false })?.isDirectory()) {
  console.error(`Bundle secret scan skipped: ${relative(ROOT, DIST)} does not exist.`);
  process.exitCode = 1;
} else {
  const findings = [];
  for (const filePath of collectFiles(DIST)) {
    const content = readFileSync(filePath, "utf8");
    for (const secret of secretPatterns) {
      const match = secret.pattern.exec(content);
      if (match) findings.push(`${relative(ROOT, filePath)}: ${secret.name}`);
    }
  }

  if (findings.length > 0) {
    console.error(`Bundle secret scan failed:\n${findings.map((item) => `- ${item}`).join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Bundle secret scan passed: ${collectFiles(DIST).length} text artifacts inspected.`,
    );
  }
}
