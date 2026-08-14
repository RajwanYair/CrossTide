import { describe, it, expect, vi, beforeEach } from "vitest";
import { nextBackoff, createReconnectingWS } from "../../../src/core/reconnecting-ws";
import { getPerfMetrics, resetCustomMetrics } from "../../../src/core/perf-metrics";

class FakeWS {
  static instances: FakeWS[] = [];
  readyState = 0;
  url: string;
  private listeners: Record<string, ((ev: unknown) => void)[]> = {};
  constructor(url: string) {
    this.url = url;
    FakeWS.instances.push(this);
  }
  addEventListener(type: string, h: (ev: unknown) => void): void {
    (this.listeners[type] ??= []).push(h);
  }
  fire(type: string, ev: unknown = {}): void {
    for (const h of this.listeners[type] ?? []) h(ev);
  }
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
    this.fire("close");
  });
}

describe("reconnecting-ws", () => {
  beforeEach(() => {
    resetCustomMetrics();
  });

  it("nextBackoff grows exponentially", () => {
    const r = (): number => 0; // no jitter
    expect(nextBackoff(0, { random: r })).toBe(500);
    expect(nextBackoff(1, { random: r })).toBe(1000);
    expect(nextBackoff(2, { random: r })).toBe(2000);
  });

  it("nextBackoff clamps at maxDelayMs", () => {
    expect(nextBackoff(20, { maxDelayMs: 5000, random: () => 0 })).toBe(5000);
  });

  it("nextBackoff adds jitter when random > 0", () => {
    const a = nextBackoff(0, { random: () => 0 });
    const b = nextBackoff(0, { random: () => 1 });
    expect(b).toBeGreaterThan(a);
  });

  it("createReconnectingWS opens and forwards messages", () => {
    FakeWS.instances = [];
    const onOpen = vi.fn();
    const onMessage = vi.fn();
    const r = createReconnectingWS("wss://x", {
      WebSocketImpl: FakeWS as unknown as typeof WebSocket,
    });
    r.on("open", onOpen);
    r.on("message", onMessage);
    const ws = FakeWS.instances[0]!;
    ws.readyState = 1;
    ws.fire("open");
    ws.fire("message", { data: "hi" });
    expect(onOpen).toHaveBeenCalled();
    expect(onMessage).toHaveBeenCalledWith({ type: "message", data: "hi" });
  });

  it("queues sends while disconnected and flushes on open", () => {
    FakeWS.instances = [];
    const r = createReconnectingWS("wss://x", {
      WebSocketImpl: FakeWS as unknown as typeof WebSocket,
    });
    r.send("a");
    r.send("b");
    const ws = FakeWS.instances[0]!;
    ws.readyState = 1;
    ws.fire("open");
    expect(ws.send).toHaveBeenCalledTimes(2);
  });

  it("close() prevents reconnection", () => {
    FakeWS.instances = [];
    vi.useFakeTimers();
    const r = createReconnectingWS("wss://x", {
      WebSocketImpl: FakeWS as unknown as typeof WebSocket,
    });
    r.close();
    const ws = FakeWS.instances[0]!;
    ws.fire("close");
    vi.advanceTimersByTime(60_000);
    expect(FakeWS.instances).toHaveLength(1);
    vi.useRealTimers();
  });

  it("reconnects after server-initiated close", () => {
    FakeWS.instances = [];
    vi.useFakeTimers();
    createReconnectingWS("wss://x", {
      WebSocketImpl: FakeWS as unknown as typeof WebSocket,
      random: () => 0,
    });
    const first = FakeWS.instances[0]!;
    first.fire("close");
    vi.advanceTimersByTime(1000);
    expect(FakeWS.instances.length).toBe(2);
    vi.useRealTimers();
  });

  it("records recovery duration after a server-initiated close", () => {
    FakeWS.instances = [];
    vi.useFakeTimers();
    createReconnectingWS("wss://x", {
      WebSocketImpl: FakeWS as unknown as typeof WebSocket,
      random: () => 0,
    });
    const first = FakeWS.instances[0]!;
    first.readyState = 1;
    first.fire("open");
    first.fire("close");
    vi.advanceTimersByTime(500);
    const recovered = FakeWS.instances[1]!;
    recovered.readyState = 1;
    recovered.fire("open");
    expect(getPerfMetrics().traces.websocketRecoveryMs).toBeGreaterThanOrEqual(0);
    vi.useRealTimers();
  });

  it("respects maxAttempts", () => {
    FakeWS.instances = [];
    vi.useFakeTimers();
    const onError = vi.fn();
    const r = createReconnectingWS("wss://x", {
      WebSocketImpl: FakeWS as unknown as typeof WebSocket,
      maxAttempts: 2,
      random: () => 0,
    });
    r.on("error", onError);
    FakeWS.instances[0]!.fire("close");
    vi.advanceTimersByTime(1000);
    FakeWS.instances[1]!.fire("close");
    vi.advanceTimersByTime(5000);
    // Third attempt hits max-attempts and emits error
    expect(onError).toHaveBeenCalled();
    vi.useRealTimers();
  });

  // G12 — `using` keyword support
  it("implements Symbol.dispose which calls close()", () => {
    FakeWS.instances = [];
    const ws = createReconnectingWS("wss://dispose-test", {
      WebSocketImpl: FakeWS as unknown as typeof WebSocket,
    });
    expect(typeof ws[Symbol.dispose]).toBe("function");
    ws[Symbol.dispose]();
    expect(ws.readyState).toBe(3); // CLOSED
  });

  it("is usable with the using keyword", () => {
    FakeWS.instances = [];
    let ref: ReturnType<typeof createReconnectingWS> | null = null;
    {
      using ws = createReconnectingWS("wss://using-test", {
        WebSocketImpl: FakeWS as unknown as typeof WebSocket,
      });
      ref = ws;
    }
    // After the block, dispose was called → readyState 3 (CLOSED)
    expect(ref!.readyState).toBe(3);
  });
});
