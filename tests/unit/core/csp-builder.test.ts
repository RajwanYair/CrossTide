import { describe, it, expect } from "vitest";
import {
  buildCsp,
  buildPermissionsPolicy,
  buildSecurityHeaders,
  generateNonce,
} from "../../../src/core/csp-builder";

describe("csp-builder", () => {
  it("default CSP locks down the basics", () => {
    const csp = buildCsp();
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/object-src 'none'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/upgrade-insecure-requests/);
  });

  it("merges extra origins, deduped", () => {
    const csp = buildCsp({
      scriptSrc: ["https://cdn.example.com", "https://cdn.example.com"],
      connectSrc: ["https://api.example.com"],
    });
    const scriptDir = /script-src ([^;]+)/.exec(csp)![1];
    expect(scriptDir).toContain("'self'");
    expect(scriptDir).toContain("https://cdn.example.com");
    expect(scriptDir.match(/cdn\.example\.com/g)?.length).toBe(1);
    expect(csp).toContain("connect-src 'self' https://api.example.com");
  });

  it("includes nonce when provided", () => {
    const csp = buildCsp({ nonce: "abc123" });
    expect(csp).toMatch(/script-src [^;]*'nonce-abc123'/);
  });

  it("includes report-uri when provided", () => {
    const csp = buildCsp({ reportUri: "/csp-report" });
    expect(csp).toContain("report-uri /csp-report");
  });

  it("buildPermissionsPolicy disables sensitive APIs", () => {
    const pp = buildPermissionsPolicy();
    expect(pp).toContain("camera=()");
    expect(pp).toContain("geolocation=()");
    expect(pp).toContain("microphone=()");
  });

  it("buildSecurityHeaders enforces by default", () => {
    const h = buildSecurityHeaders();
    expect(h["Content-Security-Policy"]).toBeDefined();
    expect(h["Content-Security-Policy-Report-Only"]).toBeUndefined();
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Strict-Transport-Security"]).toMatch(/max-age=\d+/);
  });

  it("buildSecurityHeaders supports report-only mode", () => {
    const h = buildSecurityHeaders({ reportOnly: true });
    expect(h["Content-Security-Policy-Report-Only"]).toBeDefined();
    expect(h["Content-Security-Policy"]).toBeUndefined();
  });

  it("generateNonce is base64url and unique", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
