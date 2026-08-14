/** Worker metrics route tests — production probe contract. */
import { describe, expect, it, beforeEach } from "vitest";
import { handleMetrics, recordRequestDuration, resetMetrics } from "../../../worker/routes/metrics";

describe("handleMetrics", () => {
  beforeEach(() => resetMetrics());

  it("returns an unmeasured snapshot before requests complete", async () => {
    const response = handleMetrics();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      schemaVersion: "1",
      requestCount: 0,
      requestP95Ms: null,
      cacheHitRate: null,
      websocketRecoveryMs: null,
    });
  });

  it("reports the p95 of recorded request durations", async () => {
    [10, 20, 30, 40, 50].forEach(recordRequestDuration);

    const body = (await handleMetrics().json()) as {
      requestCount: number;
      requestP95Ms: number | null;
      limitations: string[];
    };

    expect(body.requestCount).toBe(5);
    expect(body.requestP95Ms).toBe(50);
    expect(body.limitations).toHaveLength(2);
  });
});
