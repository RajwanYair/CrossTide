/**
 * Plugin Integrity (T4).
 *
 * SHA-256 manifest verification for plugin modules. Ensures that
 * loaded plugin code matches the expected hash before execution.
 *
 * Flow:
 *   1. Plugin author publishes a manifest (`plugin-manifest.json`)
 *      containing SHA-256 hashes for each module file.
 *   2. CrossTide fetches the manifest, then fetches each module.
 *   3. Before evaluating any module, its content is hashed and
 *      compared against the manifest entry.
 *   4. If any hash mismatches, the plugin is rejected entirely.
 */

import { computeIntegrity, isValidSriValue } from "./sri.js";
import type { SriAlgorithm } from "./sri.js";

// ── Types ─────────────────────────────────────────────────────────────────

export interface PluginManifestEntry {
  /** Relative path to the module file. */
  readonly path: string;
  /** SRI integrity value (e.g. "sha256-abc123..."). */
  readonly integrity: string;
  /** File size in bytes (optional, for display). */
  readonly size?: number;
}

export interface PluginManifest {
  /** Plugin id (must match the plugin's declared id). */
  readonly id: string;
  /** Plugin version. */
  readonly version: string;
  /** Hash algorithm used (default sha256). */
  readonly algorithm?: SriAlgorithm;
  /** Entry point module (relative path). */
  readonly main: string;
  /** All files with their integrity hashes. */
  readonly files: readonly PluginManifestEntry[];
  /** ISO timestamp when the manifest was generated. */
  readonly generatedAt?: string;
}

export interface IntegrityCheckResult {
  readonly file: string;
  readonly expected: string;
  readonly actual: string;
  readonly ok: boolean;
}

export interface ManifestVerificationResult {
  readonly pluginId: string;
  readonly version: string;
  readonly ok: boolean;
  readonly results: readonly IntegrityCheckResult[];
  readonly errors: readonly string[];
}

// ── Validation ────────────────────────────────────────────────────────────

/** Validate the structural shape of a manifest. */
export function validateManifest(manifest: unknown): readonly string[] {
  const errors: string[] = [];
  if (!manifest || typeof manifest !== "object") {
    return ["Manifest must be a non-null object."];
  }
  const m = manifest as Record<string, unknown>;
  if (typeof m.id !== "string" || m.id.length === 0) {
    errors.push("Manifest must have a non-empty 'id' string.");
  }
  if (typeof m.version !== "string" || !/^\d+\.\d+\.\d+/.test(m.version)) {
    errors.push("Manifest must have a valid semver 'version'.");
  }
  if (typeof m.main !== "string" || m.main.length === 0) {
    errors.push("Manifest must have a non-empty 'main' entry point.");
  }
  if (!Array.isArray(m.files) || m.files.length === 0) {
    errors.push("Manifest must have a non-empty 'files' array.");
  } else {
    for (const entry of m.files as unknown[]) {
      if (!entry || typeof entry !== "object") {
        errors.push("Each file entry must be an object.");
        continue;
      }
      const e = entry as Record<string, unknown>;
      if (typeof e.path !== "string" || e.path.length === 0) {
        errors.push("File entry must have a non-empty 'path'.");
      }
      if (typeof e.integrity !== "string" || !isValidSriValue(e.integrity)) {
        errors.push(`File entry "${e.path}" has invalid integrity value.`);
      }
    }
    // Ensure main is listed in files
    if (
      typeof m.main === "string" &&
      !(m.files as { path: string }[]).some((f) => f.path === m.main)
    ) {
      errors.push(`Main entry point "${m.main}" is not listed in files.`);
    }
  }
  return errors;
}

// ── Integrity Verification ────────────────────────────────────────────────

/**
 * Verify a single file's content against its expected integrity hash.
 */
export async function verifyFileIntegrity(
  content: ArrayBuffer | Uint8Array | string,
  expectedIntegrity: string,
  algorithm: SriAlgorithm = "sha256",
): Promise<IntegrityCheckResult> {
  const actual = await computeIntegrity(content, algorithm);
  return {
    file: "",
    expected: expectedIntegrity,
    actual,
    ok: actual === expectedIntegrity,
  };
}

/**
 * Verify all files in a manifest against provided content.
 * `contentMap` keys are relative paths matching manifest entries.
 */
export async function verifyManifest(
  manifest: PluginManifest,
  contentMap: ReadonlyMap<string, ArrayBuffer | Uint8Array | string>,
): Promise<ManifestVerificationResult> {
  const algorithm = manifest.algorithm ?? "sha256";
  const results: IntegrityCheckResult[] = [];
  const errors: string[] = [];

  for (const entry of manifest.files) {
    const content = contentMap.get(entry.path);
    if (content === undefined) {
      errors.push(`Missing file: "${entry.path}"`);
      results.push({
        file: entry.path,
        expected: entry.integrity,
        actual: "",
        ok: false,
      });
      continue;
    }
    const actual = await computeIntegrity(content, algorithm);
    const ok = actual === entry.integrity;
    if (!ok) {
      errors.push(
        `Integrity mismatch for "${entry.path}": expected ${entry.integrity}, got ${actual}`,
      );
    }
    results.push({ file: entry.path, expected: entry.integrity, actual, ok });
  }

  return {
    pluginId: manifest.id,
    version: manifest.version,
    ok: results.every((r) => r.ok) && errors.length === 0,
    results,
    errors,
  };
}

// ── Manifest Generation ───────────────────────────────────────────────────

/**
 * Generate a plugin manifest from a map of file paths to content.
 * Used by plugin authors at build time.
 */
export async function generateManifest(
  id: string,
  version: string,
  main: string,
  files: ReadonlyMap<string, ArrayBuffer | Uint8Array | string>,
  algorithm: SriAlgorithm = "sha256",
): Promise<PluginManifest> {
  const entries: PluginManifestEntry[] = [];
  for (const [path, content] of files) {
    const integrity = await computeIntegrity(content, algorithm);
    const size =
      typeof content === "string"
        ? new TextEncoder().encode(content).byteLength
        : content instanceof Uint8Array
          ? content.byteLength
          : content.byteLength;
    entries.push({ path, integrity, size });
  }
  return {
    id,
    version,
    algorithm,
    main,
    files: entries,
    generatedAt: new Date().toISOString(),
  };
}
