/**
 * Lightweight OpenTelemetry OTLP/HTTP JSON trace exporter — R9.
 *
 * Emits OTLP-compatible trace spans to `OTEL_EXPORTER_OTLP_ENDPOINT` (if
 * configured) using `ctx.waitUntil()` so the export never blocks response
 * delivery. When the endpoint is absent the tracer is a no-op.
 *
 * No third-party OTel SDK is required — this is a minimal subset that covers
 * the HTTP request pipeline (one root span per request plus child spans).
 *
 * Wire-format: OTLP/HTTP JSON  (Content-Type: application/json)
 * Spec: https://opentelemetry.io/docs/specs/otlp/
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SpanAttributes {
  [key: string]: string | number | boolean;
}

export interface SpanData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: SpanAttributes;
  /** 0 = unset, 1 = ok, 2 = error */
  statusCode: 0 | 1 | 2;
  statusMessage?: string;
}

export interface Tracer {
  /** Run `fn` inside a child span. Returns the fn's return value. */
  span<T>(name: string, attrs: SpanAttributes, fn: () => Promise<T>): Promise<T>;
  /** Finalise the root span and schedule export via waitUntil (if available). */
  finish(ctx?: { waitUntil(p: Promise<unknown>): void }): void;
  /** The W3C traceparent header value for this request. */
  traceparent: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a random hex string of `byteLen` bytes (2× char length). */
function randomHex(byteLen: number): string {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Parse a W3C traceparent header into traceId + parentSpanId.
 * Returns null if the header is absent or malformed.
 */
function parseTraceparent(header: string | null): { traceId: string; parentSpanId: string } | null {
  if (!header) return null;
  const parts = header.split("-");
  if (parts.length !== 4 || parts[0] !== "00") return null;
  const [, traceId, spanId] = parts;
  if (!traceId || traceId.length !== 32 || !spanId || spanId.length !== 16) return null;
  return { traceId, parentSpanId: spanId };
}

/** Current time as nanosecond string (BigInt-free, sufficient precision for spans). */
function nowNano(): string {
  return String(Math.floor(Date.now() * 1_000_000));
}

// ── OTLP serialisation ────────────────────────────────────────────────────────

function toOtlpAttribute(key: string, value: string | number | boolean): object {
  if (typeof value === "string") return { key, value: { stringValue: value } };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { key, value: { intValue: value } }
      : { key, value: { doubleValue: value } };
  }
  return { key, value: { boolValue: value } };
}

export function buildOtlpPayload(spans: SpanData[], serviceName: string): object {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [{ key: "service.name", value: { stringValue: serviceName } }],
        },
        scopeSpans: [
          {
            scope: { name: "crosstide-worker", version: "1" },
            spans: spans.map((s) => ({
              traceId: s.traceId,
              spanId: s.spanId,
              ...(s.parentSpanId ? { parentSpanId: s.parentSpanId } : {}),
              name: s.name,
              kind: 2, // SERVER
              startTimeUnixNano: s.startTimeUnixNano,
              endTimeUnixNano: s.endTimeUnixNano,
              attributes: Object.entries(s.attributes).map(([k, v]) => toOtlpAttribute(k, v)),
              status: {
                code: s.statusCode,
                ...(s.statusMessage ? { message: s.statusMessage } : {}),
              },
            })),
          },
        ],
      },
    ],
  };
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a per-request tracer.
 *
 * @param endpoint     OTLP/HTTP JSON collector URL (e.g. https://otel.example.com)
 *                     If falsy the tracer is a complete no-op.
 * @param requestId    Correlation ID for the root span.
 * @param traceparentHeader  Incoming W3C traceparent header (optional).
 * @param serviceName  Resource `service.name` attribute. Default: "crosstide-worker".
 */
export function createTracer(
  endpoint: string | undefined,
  requestId: string,
  traceparentHeader: string | null = null,
  serviceName = "crosstide-worker",
): Tracer {
  const collected: SpanData[] = [];

  // Propagate or generate traceId
  const incoming = parseTraceparent(traceparentHeader);
  const traceId = incoming?.traceId ?? randomHex(16);
  const rootSpanId = randomHex(8);
  const rootParentSpanId = incoming?.parentSpanId;
  const rootStart = nowNano();

  // Root span (populated on finish())
  const rootSpan: SpanData = {
    traceId,
    spanId: rootSpanId,
    ...(rootParentSpanId ? { parentSpanId: rootParentSpanId } : {}),
    name: "http.request",
    startTimeUnixNano: rootStart,
    endTimeUnixNano: rootStart, // updated on finish()
    attributes: { "request.id": requestId },
    statusCode: 0,
  };
  collected.push(rootSpan);

  const traceparent = `00-${traceId}-${rootSpanId}-01`;

  const tracer: Tracer = {
    traceparent,

    async span<T>(name: string, attrs: SpanAttributes, fn: () => Promise<T>): Promise<T> {
      if (!endpoint) return fn();

      const spanId = randomHex(8);
      const startNano = nowNano();
      let statusCode: 0 | 1 | 2 = 1;
      let statusMessage: string | undefined;

      try {
        const result = await fn();
        return result;
      } catch (err) {
        statusCode = 2;
        statusMessage = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        collected.push({
          traceId,
          spanId,
          parentSpanId: rootSpanId,
          name,
          startTimeUnixNano: startNano,
          endTimeUnixNano: nowNano(),
          attributes: attrs,
          statusCode,
          ...(statusMessage ? { statusMessage } : {}),
        });
      }
    },

    finish(ctx?: { waitUntil(p: Promise<unknown>): void }): void {
      if (!endpoint) return;
      rootSpan.endTimeUnixNano = nowNano();
      const payload = buildOtlpPayload(collected, serviceName);
      const exportPromise = fetch(`${endpoint}/v1/traces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Swallow export errors — telemetry must never affect response delivery
      });
      if (ctx) {
        ctx.waitUntil(exportPromise);
      }
    },
  };

  return tracer;
}
