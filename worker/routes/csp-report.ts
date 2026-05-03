/**
 * CSP violation report endpoint (K11).
 *
 * Accepts `POST /api/csp-report` with a JSON body conforming to the
 * Content-Security-Policy reporting format. Logs the violation for
 * monitoring (in production this would forward to a logging service).
 *
 * Rate-limited separately at 10 reports/min per IP via the shared limiter.
 */

export interface CspReport {
  readonly "csp-report"?: {
    readonly "document-uri"?: string;
    readonly "violated-directive"?: string;
    readonly "blocked-uri"?: string;
    readonly "original-policy"?: string;
    readonly "source-file"?: string;
    readonly "line-number"?: number;
    readonly "column-number"?: number;
  };
}

/**
 * Handle an incoming CSP violation report.
 * Returns 204 on success or 400 on malformed bodies.
 */
export async function handleCspReport(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (
    !contentType.includes("application/csp-report") &&
    !contentType.includes("application/json")
  ) {
    return new Response(JSON.stringify({ error: "Invalid content-type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate shape minimally
  const report = body as CspReport;
  if (!report?.["csp-report"]) {
    return new Response(JSON.stringify({ error: "Missing csp-report field" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Log the violation (in production, forward to analytics/Sentry/Loki)
  console.info("[CSP-Violation]", JSON.stringify(report["csp-report"]));

  return new Response(null, { status: 204 });
}
