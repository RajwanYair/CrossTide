/**
 * Multi-chart sync tests — R6.
 */
import { describe, it, expect, vi } from "vitest";
import { createChartSync, snapToTimeframe } from "../../../src/core/multi-chart-sync";

describe("snapToTimeframe", () => {
  it("snaps daily time to midnight", () => {
    const time = 1_700_100_000; // some random Unix timestamp
    const snapped = snapToTimeframe(time, "1d");
    expect(snapped % 86400).toBe(0);
    expect(snapped).toBeLessThanOrEqual(time);
    expect(snapped + 86400).toBeGreaterThan(time);
  });

  it("snaps hourly time to the hour", () => {
    const time = 1_700_003_700; // 1h + extra seconds
    expect(snapToTimeframe(time, "1h") % 3600).toBe(0);
  });

  it("passes through unknown timeframe unchanged", () => {
    expect(snapToTimeframe(1234567, "custom")).toBe(1234567);
  });
});

describe("createChartSync — register / broadcast", () => {
  it("does not call the broadcasting participant's own handler", () => {
    const sync = createChartSync();
    const calls: string[] = [];
    sync.register("1d", () => calls.push("1d"));
    sync.register("1w", () => calls.push("1w"));
    sync.broadcast("1d", 1_700_000_000);
    expect(calls).toEqual(["1w"]);
    sync.dispose();
  });

  it("notifies all other participants", () => {
    const sync = createChartSync();
    const received: string[] = [];
    sync.register("1d", (_t, src) => received.push(`1d<${src}`));
    sync.register("1h", (_t, src) => received.push(`1h<${src}`));
    sync.register("1w", (_t, src) => received.push(`1w<${src}`));
    sync.broadcast("1d", 1_700_000_000);
    expect(received).toContain("1h<1d");
    expect(received).toContain("1w<1d");
    expect(received).not.toContain("1d<1d");
    sync.dispose();
  });

  it("maps time to the target timeframe", () => {
    const sync = createChartSync();
    const times: number[] = [];
    sync.register("1d", (t) => times.push(t));
    sync.register("1h", () => undefined);
    const time = 1_700_003_700;
    sync.broadcast("1h", time);
    // received time should be snapped to the nearest day
    expect(times[0]! % 86400).toBe(0);
    sync.dispose();
  });

  it("passes source timeframe to handler", () => {
    const sync = createChartSync();
    const sources: string[] = [];
    sync.register("1w", (_t, src) => sources.push(src));
    sync.register("1d", () => undefined);
    sync.broadcast("1d", 1_700_000_000);
    expect(sources).toContain("1d");
    sync.dispose();
  });
});

describe("createChartSync — dispose participant", () => {
  it("removes participant so it no longer receives events", () => {
    const sync = createChartSync();
    const calls: number[] = [];
    const p = sync.register("1w", (t) => calls.push(t));
    sync.register("1d", () => undefined);
    sync.broadcast("1d", 1_700_000_000);
    expect(calls).toHaveLength(1);
    p.dispose();
    sync.broadcast("1d", 1_700_086_400);
    expect(calls).toHaveLength(1); // no new calls
    sync.dispose();
  });

  it("dispose() is idempotent", () => {
    const sync = createChartSync();
    const p = sync.register("1h", () => undefined);
    expect(() => {
      p.dispose();
      p.dispose();
    }).not.toThrow();
    sync.dispose();
  });
});

describe("createChartSync — clearAll", () => {
  it("sends -1 to all participants", () => {
    const sync = createChartSync();
    const times: number[] = [];
    sync.register("1d", (t) => times.push(t));
    sync.register("1h", (t) => times.push(t));
    sync.clearAll();
    expect(times).toHaveLength(2);
    expect(times.every((t) => t === -1)).toBe(true);
    sync.dispose();
  });
});

describe("createChartSync — dispose sync", () => {
  it("after dispose, broadcast does nothing", () => {
    const sync = createChartSync();
    const calls: number[] = [];
    sync.register("1w", (t) => calls.push(t));
    sync.register("1d", () => undefined);
    sync.dispose();
    sync.broadcast("1d", 1_700_000_000);
    expect(calls).toHaveLength(0);
  });

  it("register throws after dispose", () => {
    const sync = createChartSync();
    sync.dispose();
    expect(() => sync.register("1h", vi.fn())).toThrow();
  });

  it("multiple participants with same timeframe all receive broadcast", () => {
    const sync = createChartSync();
    const a: number[] = [];
    const b: number[] = [];
    sync.register("1d", (t) => a.push(t));
    sync.register("1d", (t) => b.push(t));
    sync.register("1h", () => undefined);
    sync.broadcast("1h", 1_700_000_000);
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    sync.dispose();
  });
});
