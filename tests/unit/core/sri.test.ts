import { describe, it, expect } from "vitest";
import {
  computeIntegrity,
  integrityAttr,
  isValidSriValue,
  buildSriManifest,
} from "../../../src/core/sri";

describe("sri", () => {
  it("computeIntegrity returns sha384 by default", async () => {
    const v = await computeIntegrity("hello");
    expect(v.startsWith("sha384-")).toBe(true);
    expect(isValidSriValue(v)).toBe(true);
  });

  it("supports sha256 and sha512", async () => {
    expect((await computeIntegrity("x", "sha256")).startsWith("sha256-")).toBe(true);
    expect((await computeIntegrity("x", "sha512")).startsWith("sha512-")).toBe(true);
  });

  it("same input yields same hash", async () => {
    const a = await computeIntegrity("hello");
    const b = await computeIntegrity("hello");
    expect(a).toBe(b);
  });

  it("different input yields different hash", async () => {
    const a = await computeIntegrity("hello");
    const b = await computeIntegrity("world");
    expect(a).not.toBe(b);
  });

  it("accepts Uint8Array and ArrayBuffer", async () => {
    const u = new Uint8Array([1, 2, 3]);
    const v1 = await computeIntegrity(u);
    const v2 = await computeIntegrity(u.buffer);
    expect(v1).toBe(v2);
  });

  it("integrityAttr formats both attributes", () => {
    const v = "sha384-AAAA";
    expect(integrityAttr(v)).toBe('integrity="sha384-AAAA" crossorigin="anonymous"');
  });

  it("isValidSriValue rejects garbage", () => {
    expect(isValidSriValue("garbage")).toBe(false);
    expect(isValidSriValue("md5-abc")).toBe(false);
    expect(isValidSriValue("sha384-Zm9vYmFy")).toBe(true);
  });

  it("buildSriManifest hashes each file", async () => {
    const files = new Map<string, string>([
      ["a.js", "alert(1)"],
      ["b.css", "body{}"],
    ]);
    const m = await buildSriManifest(files);
    expect(m.size).toBe(2);
    expect(isValidSriValue(m.get("a.js")!)).toBe(true);
    expect(m.get("a.js")).not.toBe(m.get("b.css"));
  });
});
