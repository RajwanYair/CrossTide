/**
 * Content Security Policy header builder.
 *
 * Generates CSP, Permissions-Policy, and a small bundle of related security
 * headers suitable for serving the SPA from any static host (Cloudflare
 * Pages/Workers, Netlify, Vercel, nginx).
 *
 * Pure module — no side effects, easy to unit test and call from a build
 * step or edge worker.
 */

export interface CspOptions {
  /** Extra script-src origins (e.g. analytics CDN). */
  readonly scriptSrc?: readonly string[];
  /** Extra connect-src origins (provider APIs, websockets). */
  readonly connectSrc?: readonly string[];
  /** Extra img-src origins. */
  readonly imgSrc?: readonly string[];
  /** Extra style-src origins. */
  readonly styleSrc?: readonly string[];
  /** Per-request nonce for inline bootstrap scripts (recommended). */
  readonly nonce?: string;
  /** Send Content-Security-Policy-Report-Only instead of enforcing. */
  readonly reportOnly?: boolean;
  /** Endpoint to receive CSP violation reports. */
  readonly reportUri?: string;
}

export interface SecurityHeaders {
  readonly [name: string]: string;
}

function joinSources(...lists: readonly (readonly string[])[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const s of list) {
      if (!s) continue;
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
  }
  return out.join(" ");
}

export function buildCsp(options: CspOptions = {}): string {
  const nonce = options.nonce ? [`'nonce-${options.nonce}'`] : [];
  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": joinSources(["'self'"], nonce, options.scriptSrc ?? []),
    "style-src": joinSources(
      ["'self'", "'unsafe-inline'"],
      options.styleSrc ?? [],
    ),
    "img-src": joinSources(
      ["'self'", "data:", "blob:"],
      options.imgSrc ?? [],
    ),
    "font-src": "'self' data:",
    "connect-src": joinSources(["'self'"], options.connectSrc ?? []),
    "worker-src": "'self' blob:",
    "manifest-src": "'self'",
    "frame-ancestors": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "object-src": "'none'",
    "upgrade-insecure-requests": "",
  };
  if (options.reportUri) {
    directives["report-uri"] = options.reportUri;
  }
  return Object.entries(directives)
    .map(([k, v]) => (v ? `${k} ${v}` : k))
    .join("; ");
}

export function buildPermissionsPolicy(): string {
  return [
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
}

export function buildSecurityHeaders(options: CspOptions = {}): SecurityHeaders {
  const cspName = options.reportOnly
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";
  return {
    [cspName]: buildCsp(options),
    "Permissions-Policy": buildPermissionsPolicy(),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

/** Generate a cryptographically random nonce (32 chars base64url). */
export function generateNonce(): string {
  const buf = new Uint8Array(18);
  crypto.getRandomValues(buf);
  let bin = "";
  for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
