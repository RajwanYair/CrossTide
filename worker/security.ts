/**
 * Security headers middleware for the CrossTide API Worker (A20).
 *
 * Applies CSP, Permissions-Policy, and other security headers to every
 * response. Inline implementation (no src/ imports) — the Worker is a
 * separate compilation unit from the app.
 *
 * API routes serve JSON; the CSP targets the SPA itself when used as a
 * Pages Functions header override. For pure API responses the headers
 * are still valuable for defence-in-depth and Cloudflare Pages header
 * inheritance.
 */

const API_CONNECT_SRC =
  "'self' https://api.crosstide.dev wss://api.crosstide.dev https://query1.finance.yahoo.com";

/** Build the Content-Security-Policy value for the API worker. */
function buildCsp(): string {
  const directives: Array<[string, string]> = [
    ["default-src", "'self'"],
    ["script-src", "'self' blob:"],
    ["style-src", "'self' 'unsafe-inline'"],
    ["img-src", "'self' data: blob:"],
    ["font-src", "'self' data:"],
    ["connect-src", API_CONNECT_SRC],
    ["worker-src", "'self' blob:"],
    ["manifest-src", "'self'"],
    ["frame-ancestors", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["object-src", "'none'"],
    ["upgrade-insecure-requests", ""],
  ];
  return directives.map(([k, v]) => (v ? `${k} ${v}` : k)).join("; ");
}

function buildPermissionsPolicy(): string {
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

/** The fixed set of security headers added to every API response. */
const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": buildCsp(),
  "Permissions-Policy": buildPermissionsPolicy(),
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "cross-origin", // allow /api/og images
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

/**
 * Clone the response and inject security headers.
 * Existing headers are preserved; security headers win on conflict.
 */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Exported for unit tests — returns the security headers record.
 * @internal
 */
export function _getSecurityHeaders(): Record<string, string> {
  return { ...SECURITY_HEADERS };
}
