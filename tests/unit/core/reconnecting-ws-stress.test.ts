/**
 * WebSocket reconnect stress tests (J16).
 *
 * Simulates rapid network flaps, max-attempt exhaustion, concurrent
 * message bursts during reconnection, and validates circuit-breaker-style
 * recovery behaviour in the reconnecting-ws module.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createReconnectingWS } from "../../../src/core/reconnecting-ws";

// ---------------------------------------------------------------------------
// FakeWS — deterministic WebSocket mock
// ---------------------------------------------------------------------------
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

const Impl = FakeWS as unknown as typeof WebSocket;

beforeEach(() => {
  FakeWS.instances = [];
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("reconnect stress — rapid flap recovery", () => {
  it("survives 20 rapid disconnect/reconnect cycles", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
      minDelayMs: 100,
      maxDelayMs: 1000,
    });
    ws.on("open", onOpen);
    ws.on("close", onClose);

    for (let i = 0; i < 20; i++) {
      const inst = FakeWS.instances[FakeWS.instances.length - 1]!;
      // Server drops the connection immediately
      inst.fire("close");
      // Advance past backoff
      vi.advanceTimersByTime(2000);
    }

    // Should have attempted at least 20 reconnections
    expect(FakeWS.instances.length).toBeGreaterThanOrEqual(20);
    expect(onClose).toHaveBeenCalledTimes(20);

    // Now simulate stable connection
    const last = FakeWS.instances[FakeWS.instances.length - 1]!;
    last.readyState = 1;
    last.fire("open");
    expect(onOpen).toHaveBeenCalled();
  });

  it("resets attempt counter after successful connection", () => {
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
      minDelayMs: 100,
    });

    // First 5 flaps
    for (let i = 0; i < 5; i++) {
      FakeWS.instances[FakeWS.instances.length - 1]!.fire("close");
      vi.advanceTimersByTime(30_000);
    }

    expect(ws.attempt).toBe(5);

    // Successful connect
    const stable = FakeWS.instances[FakeWS.instances.length - 1]!;
    stable.readyState = 1;
    stable.fire("open");
    expect(ws.attempt).toBe(0);

    // Next flap should start from attempt 0 again
    stable.fire("close");
    vi.advanceTimersByTime(200);
    expect(ws.attempt).toBe(1);
  });
});

describe("reconnect stress — max attempts exhaustion", () => {
  it("stops retrying after maxAttempts and emits error", () => {
    const onError = vi.fn();
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
      maxAttempts: 3,
      minDelayMs: 50,
    });
    ws.on("error", onError);

    // First connection (attempt 0) succeeds in being created
    // Simulate 3 connection failures
    for (let i = 0; i < 3; i++) {
      FakeWS.instances[FakeWS.instances.length - 1]!.fire("close");
      vi.advanceTimersByTime(30_000);
    }

    // At this point attempt === 3 which equals maxAttempts
    // The next connect() call should emit error instead of opening
    expect(onError).toHaveBeenCalled();
    const errorArg = onError.mock.calls[onError.mock.calls.length - 1]![0];
    expect(errorArg.data).toBeInstanceOf(Error);
    expect((errorArg.data as Error).message).toContain("max-attempts-reached");
  });
});

describe("reconnect stress — message burst during reconnection", () => {
  it("queues 100 messages while disconnected and flushes on reconnect", () => {
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
      minDelayMs: 50,
    });

    // Disconnect
    FakeWS.instances[0]!.fire("close");

    // Queue 100 messages while disconnected
    for (let i = 0; i < 100; i++) {
      ws.send(`msg-${i}`);
    }

    // Advance timer to trigger reconnect
    vi.advanceTimersByTime(1000);

    // New connection opens
    const newInst = FakeWS.instances[FakeWS.instances.length - 1]!;
    newInst.readyState = 1;
    newInst.fire("open");

    // All 100 messages should have been flushed
    expect(newInst.send).toHaveBeenCalledTimes(100);
    expect(newInst.send).toHaveBeenNthCalledWith(1, "msg-0");
    expect(newInst.send).toHaveBeenNthCalledWith(100, "msg-99");
  });

  it("sends immediately when connected", () => {
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
    });
    const inst = FakeWS.instances[0]!;
    inst.readyState = 1;
    inst.fire("open");

    ws.send("direct-1");
    ws.send("direct-2");

    expect(inst.send).toHaveBeenCalledTimes(2);
    expect(inst.send).toHaveBeenCalledWith("direct-1");
    expect(inst.send).toHaveBeenCalledWith("direct-2");
  });
});

describe("reconnect stress — interleaved open/close events", () => {
  it("handles close event immediately after open (flaky connection)", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
      minDelayMs: 50,
    });
    ws.on("open", onOpen);
    ws.on("close", onClose);

    // 10 cycles of: open → immediate close
    for (let i = 0; i < 10; i++) {
      const inst = FakeWS.instances[FakeWS.instances.length - 1]!;
      inst.readyState = 1;
      inst.fire("open");
      inst.readyState = 3;
      inst.fire("close");
      vi.advanceTimersByTime(30_000);
    }

    expect(onOpen).toHaveBeenCalledTimes(10);
    expect(onClose).toHaveBeenCalledTimes(10);
    // Should still be trying to reconnect (not closed by user)
    expect(FakeWS.instances.length).toBeGreaterThan(10);
  });
});

describe("reconnect stress — Symbol.dispose auto-close", () => {
  it("disposes cleanly via Symbol.dispose", () => {
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
    });

    ws[Symbol.dispose]();

    const inst = FakeWS.instances[0]!;
    expect(inst.close).toHaveBeenCalled();

    // Should not reconnect after dispose
    inst.fire("close");
    vi.advanceTimersByTime(60_000);
    expect(FakeWS.instances).toHaveLength(1);
  });
});

describe("reconnect stress — error event forwarding", () => {
  it("emits error events from underlying WebSocket", () => {
    const onError = vi.fn();
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
    });
    ws.on("error", onError);

    FakeWS.instances[0]!.fire("error", new Error("network failure"));
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("reconnect stress — readyState reporting", () => {
  it("reports readyState from underlying socket", () => {
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
    });

    expect(ws.readyState).toBe(0); // CONNECTING

    const inst = FakeWS.instances[0]!;
    inst.readyState = 1;
    inst.fire("open");
    expect(ws.readyState).toBe(1); // OPEN

    inst.readyState = 3;
    inst.fire("close");
    // After close + before reconnect timer fires
    expect(ws.readyState).toBe(3); // CLOSED
  });
});

describe("reconnect stress — backoff ceiling", () => {
  it("never exceeds maxDelayMs regardless of attempt count", () => {
    const _ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0, // no jitter
      minDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
    });

    // Simulate 50 rapid failures — attempt counter should climb but delay capped
    for (let i = 0; i < 50; i++) {
      const inst = FakeWS.instances[FakeWS.instances.length - 1]!;
      inst.fire("close");
      // Advance enough for even the max delay
      vi.advanceTimersByTime(6000);
    }

    // 51 total connections: 1 initial + 50 reconnects
    expect(FakeWS.instances.length).toBe(51);
  });
});

describe("reconnect stress — concurrent listener registration", () => {
  it("supports multiple handlers on same event", () => {
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
    });

    const handlers = Array.from({ length: 10 }, () => vi.fn());
    for (const h of handlers) ws.on("message", h);

    const inst = FakeWS.instances[0]!;
    inst.readyState = 1;
    inst.fire("open");
    inst.fire("message", { data: "hello" });

    for (const h of handlers) {
      expect(h).toHaveBeenCalledTimes(1);
    }
  });

  it("does not lose handlers across reconnections", () => {
    const onMsg = vi.fn();
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
      minDelayMs: 50,
    });
    ws.on("message", onMsg);

    // First connection — receive message
    const inst1 = FakeWS.instances[0]!;
    inst1.readyState = 1;
    inst1.fire("open");
    inst1.fire("message", { data: "msg-1" });
    expect(onMsg).toHaveBeenCalledTimes(1);

    // Disconnect + reconnect
    inst1.fire("close");
    vi.advanceTimersByTime(1000);

    const inst2 = FakeWS.instances[FakeWS.instances.length - 1]!;
    inst2.readyState = 1;
    inst2.fire("open");
    inst2.fire("message", { data: "msg-2" });

    // Handler still active on new connection
    expect(onMsg).toHaveBeenCalledTimes(2);
  });
});

describe("reconnect stress — 100 rapid flaps in 1 second", () => {
  it("handles extremely fast disconnect/reconnect without crashing", () => {
    const ws = createReconnectingWS("wss://stress", {
      WebSocketImpl: Impl,
      random: () => 0,
      minDelayMs: 10,
      maxDelayMs: 100,
    });

    for (let i = 0; i < 100; i++) {
      const inst = FakeWS.instances[FakeWS.instances.length - 1]!;
      inst.readyState = 1;
      inst.fire("open");
      inst.readyState = 3;
      inst.fire("close");
      vi.advanceTimersByTime(10);
    }

    // Verify no unhandled exceptions — module survived 100 flaps
    expect(FakeWS.instances.length).toBe(101); // 1 initial + 100 reconnects

    // Verify it can still stabilize
    const final = FakeWS.instances[FakeWS.instances.length - 1]!;
    final.readyState = 1;
    final.fire("open");
    expect(ws.readyState).toBe(1);
    expect(ws.attempt).toBe(0);
  });
});
