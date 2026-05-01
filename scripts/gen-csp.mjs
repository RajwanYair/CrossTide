/**
 * Regenerates public/_headers with canonical security headers from
 * the values defined in src/core/csp-builder.ts.
 *
 * Run: node scripts/gen-csp.mjs
 *
 * NOTE: This script intentionally does NOT import the TypeScript source
 * at runtime. Instead it inlines the same values so it can run in Node
 * without a build step. Keep in sync with src/core/csp-builder.ts.
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── CSP origin lists (keep in sync with main.ts / csp-builder.ts) ────────────
const PROVIDER_ORIGINS = [
  "https://finnhub.io",
  "https://query1.finance.yahoo.com",
  "https://www.alphavantage.co",
  "https://api.coingecko.com",
  "wss://ws.finnhub.io",
];

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${PROVIDER_ORIGINS.join(" ")}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
  "interest-cohort=()",
].join(", ");

const content = `# Cloudflare Pages / Netlify / any static host that reads _headers.
# Source of truth: src/core/csp-builder.ts — regenerate with: node scripts/gen-csp.mjs
/*
  Content-Security-Policy: ${CSP}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Permissions-Policy: ${PERMISSIONS_POLICY}
  Strict-Transport-Security: max-age=31536000; includeSubDomains
`;

const headersPath = resolve(root, "public/_headers");
writeFileSync(headersPath, content, "utf-8");
console.log("✔ public/_headers written.");
console.log("\nCSP:");
console.log(CSP);
