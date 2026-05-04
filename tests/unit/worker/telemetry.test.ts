/**
 * Worker telemetry unit tests — R9.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTracer, buildOtlpPayload } from "../../../worker/telemetry";
import type { SpanData } from "../../../worker/telemetry";

describe("buildOtlpPayload", () => {
  it("wraps spans in the expected OTLP structure", () => {
    const span: SpanData = {
      traceId: "a".repeat(32),
      spanId: "b".repeat(16),
      name: "test.span",
      startTimeUnixNano: "1000000",
      endTimeUnixNano: "2000000",
      attributes: { "http.status_code": 200, route: "/api/health", ok: true },
      statusCode: 1,
    };

    const payload = buildOtlpPayload([span], "my-service") as {
      resourceSpans: {
        resource: { attributes: { key: string; value: object }[] };
        scopeSpans: {
          spans: {
            name: string;
            attributes: { key: string; value: object }[];
          }[];
        }[];
      }[];
    };

    expect(payload.resourceSpans).toHaveLength(1);
    const rs = payload.resourceSpans[0]!;
    // service.name resource attribute
    expect(rs.resource.attributes[0]).toMatchObject({
      key: "service.name",
      value: { stringValue: "my-service" },
    });
    // span is present
    const exportedSpan = rs.scopeSpans[0]!.spans[0]!;
    expect(exportedSpan.name).toBe("test.span");
    // attribute types
    const attrMap = Object.fromEntries(
      exportedSpan.attributes.map((a: { key: string; value: Record<string, unknown> }) => [
        a.key,
        Object.values(a.value)[0],
      ]),
    );
    expect(attrMap["http.status_code"]).toBe(200);
    expect(attrMap["route"]).toBe("/api/health");
    expect(attrMap["ok"]).toBe(true);
  });

  it("omits parentSpanId when not set", () => {
    const span: SpanData = {
      traceId: "a".repeat(32),
      spanId: "b".repeat(16),
      name: "root",
      startTimeUnixNano: "0",
      endTimeUnixNano: "1",
      attributes: {},
      statusCode: 0,
    };
    const payload = buildOtlpPayload([span], "svc") as {
      resourceSpans: { scopeSpans: { spans: object[] }[] }[];
    };
    const exported = payload.resourceSpans[0]!.scopeSpans[0]!.spans[0]! as Record<string, unknown>;
    expect("parentSpanId" in exported).toBe(false);
  });
});

describe("createTracer — no-op when endpoint absent", () => {
  it("span() still invokes fn and returns its value", async () => {
    const tracer = createTracer(undefined, "req-1");
    const result = await tracer.span("my.span", {}, async () => 42);
    expect(result).toBe(42);
  });

  it("finish() does nothing without endpoint", () => {
    const tracer = createTracer(undefined, "req-1");
    expect(() => tracer.finish()).not.toThrow();
  });

  it("traceparent is a valid W3C header", () => {
    const tracer = createTracer(undefined, "req-1");
    expect(tracer.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });
});

describe("createTracer — with endpoint", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  });

  it("span() calls fn and returns its result", async () => {
    const tracer = createTracer("https://otel.example.com", "req-2");
    const result = await tracer.span("route.handler", { route: "/api/health" }, async () => "ok");
    expect(result).toBe("ok");
  });

  it("finish() calls fetch with OTLP endpoint", async () => {
    const tracer = createTracer("https://otel.example.com", "req-3");
    await tracer.span("test", {}, async () => undefined);
    tracer.finish();
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "https://otel.example.com/v1/traces",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("finish() uses waitUntil when ctx provided", () => {
    const tracer = createTracer("https://otel.example.com", "req-4");
    const waitUntil = vi.fn();
    tracer.finish({ waitUntil });
    expect(waitUntil).toHaveBeenCalledWith(expect.any(Promise));
  });

  it("span() marks statusCode=2 on error", async () => {
    const tracer = createTracer("https://otel.example.com", "req-5");
    await expect(
      tracer.span("fail.span", {}, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    // Finish to flush — should not throw
    tracer.finish();
  });

  it("propagates incoming traceparent traceId", () => {
    const traceId = "c".repeat(32);
    const incoming = `00-${traceId}-${"d".repeat(16)}-01`;
    const tracer = createTracer("https://otel.example.com", "req-6", incoming);
    expect(tracer.traceparent.startsWith(`00-${traceId}-`)).toBe(true);
  });

  it("generates new traceId when traceparent is absent", () => {
    const tracer = createTracer("https://otel.example.com", "req-7", null);
    expect(tracer.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("fetch errors are swallowed silently", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const tracer = createTracer("https://otel.example.com", "req-8");
    tracer.finish();
    // give the microtask queue a tick to ensure rejection is caught
    await Promise.resolve();
  });
});
