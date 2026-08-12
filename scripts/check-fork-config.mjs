/**
 * Verify that runtime configuration remains portable for forks and local development.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const runtimeFiles = [
  "vite.config.ts",
  "src/core/data-service.ts",
  "src/providers/provider-registry.ts",
];
const envExampleFiles = [".env.example", "worker/.dev.vars.example", "docker/.env.example"];
const organizationProxyPattern = /https?:\/\/[^\s"'`]+proxy[^\s"'`]*/iu;
const embeddedCredentialPattern = /https?:\/\/[^\s"'`]+:[^\s"'`]+@/u;
const requiredEnvExamples = ["VITE_WORKER_BASE_URL", "HTTP_PROXY", "HTTPS_PROXY"];

function read(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

const failures = [];

for (const relativePath of runtimeFiles) {
  const content = read(relativePath);
  if (organizationProxyPattern.test(content)) {
    failures.push(`${relativePath}: contains a hardcoded proxy URL`);
  }
  if (embeddedCredentialPattern.test(content)) {
    failures.push(`${relativePath}: contains credentials embedded in a URL`);
  }
}

const envExamples = envExampleFiles.map((relativePath) => read(relativePath)).join("\n");
for (const variable of requiredEnvExamples) {
  if (!envExamples.includes(variable)) {
    failures.push(`environment examples do not document ${variable}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(
    `Fork configuration check failed:\n${failures.map((item) => `- ${item}`).join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  console.log("Fork configuration is portable: no embedded proxy or URL credentials found.");
}
