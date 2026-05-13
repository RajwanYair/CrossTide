import { describe, it, expect } from "vitest";
import {
  validateManifest,
  verifyFileIntegrity,
  verifyManifest,
  generateManifest,
} from "../../../src/core/plugin-integrity.js";
import type { PluginManifest } from "../../../src/core/plugin-integrity.js";
import { computeIntegrity } from "../../../src/core/sri.js";

describe("plugin-integrity", () => {
  const sampleContent = "export default { id: 'test', version: '1.0.0' };";

  describe("validateManifest", () => {
    it("should accept a valid manifest", async () => {
      const integrity = await computeIntegrity(sampleContent, "sha256");
      const manifest = {
        id: "test-plugin",
        version: "1.0.0",
        main: "index.mjs",
        files: [{ path: "index.mjs", integrity }],
      };
      expect(validateManifest(manifest)).toEqual([]);
    });

    it("should reject non-object input", () => {
      expect(validateManifest(null)).toContainEqual("Manifest must be a non-null object.");
      expect(validateManifest("string")).toContainEqual("Manifest must be a non-null object.");
    });

    it("should require id, version, main, files", () => {
      const errors = validateManifest({});
      expect(errors.length).toBeGreaterThanOrEqual(4);
    });

    it("should reject invalid semver", () => {
      const errors = validateManifest({
        id: "a",
        version: "bad",
        main: "x",
        files: [{ path: "x", integrity: "sha256-abc=" }],
      });
      expect(errors.some((e) => e.includes("semver"))).toBe(true);
    });

    it("should reject invalid integrity value", () => {
      const errors = validateManifest({
        id: "a",
        version: "1.0.0",
        main: "x.mjs",
        files: [{ path: "x.mjs", integrity: "not-valid" }],
      });
      expect(errors.some((e) => e.includes("invalid integrity"))).toBe(true);
    });

    it("should reject main not in files", () => {
      const errors = validateManifest({
        id: "a",
        version: "1.0.0",
        main: "missing.mjs",
        files: [{ path: "other.mjs", integrity: "sha256-abc=" }],
      });
      expect(errors.some((e) => e.includes("not listed"))).toBe(true);
    });
  });

  describe("verifyFileIntegrity", () => {
    it("should pass for matching content", async () => {
      const integrity = await computeIntegrity(sampleContent, "sha256");
      const result = await verifyFileIntegrity(sampleContent, integrity, "sha256");
      expect(result.ok).toBe(true);
      expect(result.actual).toBe(result.expected);
    });

    it("should fail for mismatched content", async () => {
      const integrity = await computeIntegrity("original", "sha256");
      const result = await verifyFileIntegrity("tampered", integrity, "sha256");
      expect(result.ok).toBe(false);
      expect(result.actual).not.toBe(result.expected);
    });
  });

  describe("verifyManifest", () => {
    it("should verify all files in manifest", async () => {
      const file1 = "export const a = 1;";
      const file2 = "export const b = 2;";
      const manifest: PluginManifest = {
        id: "my-plugin",
        version: "1.0.0",
        algorithm: "sha256",
        main: "index.mjs",
        files: [
          { path: "index.mjs", integrity: await computeIntegrity(file1, "sha256") },
          { path: "utils.mjs", integrity: await computeIntegrity(file2, "sha256") },
        ],
      };
      const contentMap = new Map([
        ["index.mjs", file1],
        ["utils.mjs", file2],
      ]);
      const result = await verifyManifest(manifest, contentMap);
      expect(result.ok).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect tampered files", async () => {
      const manifest: PluginManifest = {
        id: "my-plugin",
        version: "1.0.0",
        main: "index.mjs",
        files: [{ path: "index.mjs", integrity: await computeIntegrity("original", "sha256") }],
      };
      const contentMap = new Map([["index.mjs", "tampered"]]);
      const result = await verifyManifest(manifest, contentMap);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("mismatch"))).toBe(true);
    });

    it("should report missing files", async () => {
      const manifest: PluginManifest = {
        id: "my-plugin",
        version: "1.0.0",
        main: "index.mjs",
        files: [{ path: "index.mjs", integrity: "sha256-abc=" }],
      };
      const result = await verifyManifest(manifest, new Map());
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("Missing file"))).toBe(true);
    });
  });

  describe("generateManifest", () => {
    it("should produce a valid manifest with correct hashes", async () => {
      const file1 = "export const a = 1;";
      const file2 = "export const b = 2;";
      const files = new Map([
        ["index.mjs", file1],
        ["utils.mjs", file2],
      ]);
      const manifest = await generateManifest("my-plugin", "1.0.0", "index.mjs", files);
      expect(manifest.id).toBe("my-plugin");
      expect(manifest.version).toBe("1.0.0");
      expect(manifest.main).toBe("index.mjs");
      expect(manifest.files).toHaveLength(2);
      expect(manifest.generatedAt).toBeDefined();
      // Verify generated hashes are correct
      const verification = await verifyManifest(manifest, files);
      expect(verification.ok).toBe(true);
    });

    it("should include file sizes", async () => {
      const content = "hello world";
      const files = new Map([["main.mjs", content]]);
      const manifest = await generateManifest("test", "1.0.0", "main.mjs", files);
      expect(manifest.files[0]!.size).toBe(new TextEncoder().encode(content).byteLength);
    });
  });
});
