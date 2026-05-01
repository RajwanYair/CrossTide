import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCrossTabSync } from "../../../src/core/broadcast-channel";

// ── BroadcastChannel mock ─────────────────────────────────────────────────────

type MsgListener = (ev: MessageEvent) => void;

/** Simple in-process BroadcastChannel simulation. */
class MockBroadcastChannel {
  static channels = new Map<string, Set<MockBroadcastChannel>>();

  private listeners = new Set<MsgListener>();
  closed = false;

  constructor(readonly name: string) {
    let set = MockBroadcastChannel.channels.get(name);
    if (!set) {
      set = new Set();
      MockBroadcastChannel.channels.set(name, set);
    }
    set.add(this);
  }

  addEventListener(_type: string, listener: MsgListener): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: MsgListener): void {
    this.listeners.delete(listener);
  }

  postMessage(data: unknown): void {
    if (this.closed) throw new DOMException("Channel closed", "InvalidStateError");
    const peers = MockBroadcastChannel.channels.get(this.name) ?? new Set();
    for (const peer of peers) {
      if (peer !== this && !peer.closed) {
        // Simulate async delivery synchronously for test simplicity
        const ev = { data } as MessageEvent;
        for (const listener of peer.listeners) {
          listener(ev);
        }
      }
    }
  }

  close(): void {
    this.closed = true;
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("createCrossTabSync", () => {
  beforeEach(() => {
    MockBroadcastChannel.channels.clear();
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("delivers config-change to another tab instance", () => {
    const tab1 = createCrossTabSync();
    const tab2 = createCrossTabSync();

    const received: unknown[] = [];
    tab2.onConfigChange((cfg) => received.push(cfg));

    const payload = { watchlist: ["AAPL"] };
    tab1.broadcastConfig(payload);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(payload);

    tab1.destroy();
    tab2.destroy();
  });

  it("does NOT deliver config-change to the same instance (no echo)", () => {
    const tab1 = createCrossTabSync();

    const received: unknown[] = [];
    tab1.onConfigChange((cfg) => received.push(cfg));

    tab1.broadcastConfig({ watchlist: [] });

    expect(received).toHaveLength(0);
    tab1.destroy();
  });

  it("supports multiple receivers", () => {
    const tab1 = createCrossTabSync();
    const tab2 = createCrossTabSync();
    const tab3 = createCrossTabSync();

    const r2: unknown[] = [];
    const r3: unknown[] = [];
    tab2.onConfigChange((c) => r2.push(c));
    tab3.onConfigChange((c) => r3.push(c));

    tab1.broadcastConfig({ x: 1 });

    expect(r2).toHaveLength(1);
    expect(r3).toHaveLength(1);

    tab1.destroy();
    tab2.destroy();
    tab3.destroy();
  });

  it("unsubscribe stops receiving events", () => {
    const tab1 = createCrossTabSync();
    const tab2 = createCrossTabSync();

    const received: unknown[] = [];
    const unsub = tab2.onConfigChange((c) => received.push(c));

    tab1.broadcastConfig({ a: 1 });
    expect(received).toHaveLength(1);

    unsub();
    tab1.broadcastConfig({ a: 2 });
    expect(received).toHaveLength(1); // still 1, not 2

    tab1.destroy();
    tab2.destroy();
  });

  it("destroy clears handlers and closes channel", () => {
    const tab1 = createCrossTabSync();
    const tab2 = createCrossTabSync();

    const received: unknown[] = [];
    tab2.onConfigChange((c) => received.push(c));

    tab2.destroy();
    tab1.broadcastConfig({ after: "destroy" });

    expect(received).toHaveLength(0);
    tab1.destroy();
  });

  it("gracefully degrades when BroadcastChannel is unavailable", () => {
    vi.stubGlobal("BroadcastChannel", undefined);

    const bc = createCrossTabSync();
    const handler = vi.fn();
    const unsub = bc.onConfigChange(handler);

    expect(() => bc.broadcastConfig({ x: 1 })).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
    expect(() => unsub()).not.toThrow();
    expect(() => bc.destroy()).not.toThrow();
  });
});
