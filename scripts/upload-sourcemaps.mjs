#!/usr/bin/env node
/**
 * Upload source maps to GlitchTip (Sentry-compatible) after production build.
 *
 * Usage:
 *   GLITCHTIP_DSN=https://key@glitchtip.example.com/1 node scripts/upload-sourcemaps.mjs
 *
 * Environment variables:
 *   GLITCHTIP_DSN     — The DSN for the GlitchTip project
 *   RELEASE_VERSION   — Version tag (defaults to package.json version)
 *   DIST_DIR          — Build output directory (defaults to "dist")
 *
 * This script:
 * 1. Reads the DSN to extract org, project, and auth token
 * 2. Creates a release in GlitchTip
 * 3. Uploads all .map files from dist/
 * 4. Finalizes the release
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const DSN = process.env.GLITCHTIP_DSN;
const VERSION = process.env.RELEASE_VERSION || pkg.version;
const DIST_DIR = process.env.DIST_DIR || "dist";

if (!DSN) {
  console.log("⏭️  GLITCHTIP_DSN not set — skipping source map upload.");
  process.exit(0);
}

// Parse DSN: https://<key>@<host>/<project_id>
const dsnUrl = new URL(DSN);
const authToken = dsnUrl.username;
const host = dsnUrl.host;
const projectId = dsnUrl.pathname.replace("/", "");
const baseUrl = `${dsnUrl.protocol}//${host}`;

/**
 * Recursively collect all .map files in a directory.
 */
function collectMapFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectMapFiles(full, files);
    } else if (entry.endsWith(".map")) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Upload a single source map file.
 */
async function uploadFile(filePath) {
  const name = `~/${relative(DIST_DIR, filePath).replace(/\\/g, "/")}`;
  const content = readFileSync(filePath);

  const form = new FormData();
  form.append("file", new Blob([content]), name);
  form.append("name", name);

  const url = `${baseUrl}/api/0/projects/${projectId}/releases/${VERSION}/files/`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  ✗ ${name} — ${res.status}: ${text}`);
    return false;
  }

  console.log(`  ✓ ${name}`);
  return true;
}

/**
 * Create or update a release.
 */
async function createRelease() {
  const url = `${baseUrl}/api/0/projects/${projectId}/releases/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version: VERSION }),
  });

  // 409 = already exists, that's fine
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    throw new Error(`Failed to create release: ${res.status} ${text}`);
  }
}

async function main() {
  console.log(`📦 Uploading source maps for release ${VERSION}`);
  console.log(`   Host: ${host} | Project: ${projectId}`);

  await createRelease();

  const mapFiles = collectMapFiles(DIST_DIR);
  if (mapFiles.length === 0) {
    console.log("   No .map files found in", DIST_DIR);
    process.exit(0);
  }

  console.log(`   Found ${mapFiles.length} source map files\n`);

  let success = 0;
  let failed = 0;
  for (const f of mapFiles) {
    const ok = await uploadFile(f);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n✅ Done: ${success} uploaded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ Source map upload failed:", err.message);
  process.exit(1);
});
