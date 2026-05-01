import { describe, it, expect } from "vitest";
import {
  aggregateStats,
  aggregateAll,
  pruneOld,
  type RequestSample,
} from "../../../src/providers/health-stats";

const sample = (
  providerId: string,
  outcome: RequestSample["outcome"],
  latencyMs: number,
  timestamp = 0,
): RequestSample => ({ providerId, outcome, latencyMs, timestamp });

describe("health-stats", () => {
  it("aggregateStats handles empty input", () => {
    const s = aggregateStats([], "x");
    expect(s.total).toBe(0);
    expect(s.successRate).toBe(0);
    expect(s.p50LatencyMs).toBe(0);
  });

  it("computes success rate", () => {
    const s = aggregateStats(
      [
        sample("p", "success", 10),
        sample("p", "success", 20),
        sample("p", "error", 30),
        sample("p", "timeout", 40),
      ],
      "p",
    );
    expect(s.total).toBe(4);
    expect(s.successCount).toBe(2);
    expect(s.errorCount).toBe(1);
    expect(s.timeoutCount).toBe(1);
    expect(s.successRate).toBe(0.5);
  });

  it("filters by providerId", () => {
    const s = aggregateStats([sample("a", "success", 10), sample("b", "error", 20)], "a");
    expect(s.total).toBe(1);
  });

  it("computes p50, p95, mean latency", () => {
    const s = aggregateStats(
      [10, 20, 30, 40, 100].map((ms) => sample("p", "success", ms)),
      "p",
    );
    expect(s.p50LatencyMs).toBe(30);
    expect(s.p95LatencyMs).toBe(100);
    expect(s.meanLatencyMs).toBe(40);
  });

  it("counts rate-limit outcomes", () => {
    const s = aggregateStats([sample("p", "rate-limit", 5)], "p");
    expect(s.rateLimitCount).toBe(1);
  });

  it("aggregateAll returns one row per provider", () => {
    const rows = aggregateAll([
      sample("a", "success", 10),
      sample("b", "error", 20),
      sample("a", "success", 30),
    ]);
    expect(rows).toHaveLength(2);
    const a = rows.find((r) => r.providerId === "a");
    expect(a?.total).toBe(2);
  });

  it("pruneOld removes stale samples", () => {
    const samples = [sample("p", "success", 10, 1000), sample("p", "success", 10, 5000)];
    expect(pruneOld(samples, 6000, 2000)).toHaveLength(1);
  });
});
