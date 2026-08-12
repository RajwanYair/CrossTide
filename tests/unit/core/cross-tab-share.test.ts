/**
 * Cross-Tab Share Sync (B11) tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCrossTabSync } from "../../../src/core/broadcast-channel";
import { createCrossTabShareSync } from "../../../src/core/cross-tab-share";

// ── BroadcastChannel mock (same pattern as broadcast-channel.test.ts) ─────────

type MsgListener = (ev: MessageEvent) => void;

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
        const ev = { data } as MessageEvent;
        for (const l of peer.listeners) l(ev);
      }
    }
  }

  close(): void {
    this.closed = true;
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
  }
}

beforeEach(() => {
  MockBroadcastChannel.channels.clear();
  vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("createCrossTabShareSync", () => {
  it("delivers share-state to another tab", () => {
    const tab1 = createCrossTabShareSync();
    const tab2 = createCrossTabShareSync();

    const received: unknown[] = [];
    tab2.onShareState((s) => received.push(s));

    tab1.broadcastShareState({ symbol: "AAPL", range: "1y" });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ symbol: "AAPL", range: "1y" });

    tab1.destroy();
    tab2.destroy();
  });

  it("does not deliver state to sender tab (no echo)", () => {
    const tab1 = createCrossTabShareSync();
    const received: unknown[] = [];
    tab1.onShareState((s) => received.push(s));
    tab1.broadcastShareState({ symbol: "MSFT" });
    expect(received).toHaveLength(0);
    tab1.destroy();
  });

  it("keeps share-state isolated from config synchronization", () => {
    const configSync = createCrossTabSync();
    const shareSync = createCrossTabShareSync();
    const received: unknown[] = [];

    configSync.onConfigChange((cfg) => received.push(cfg));
    shareSync.broadcastShareState({ symbol: "AAPL" });

    expect(received).toHaveLength(0);

    configSync.destroy();
    shareSync.destroy();
  });

  it("supports multiple receivers", () => {
    const tab1 = createCrossTabShareSync();
    const tab2 = createCrossTabShareSync();
    const tab3 = createCrossTabShareSync();

    const r2: unknown[] = [];
    const r3: unknown[] = [];
    tab2.onShareState((s) => r2.push(s));
    tab3.onShareState((s) => r3.push(s));

    tab1.broadcastShareState({ card: "screener" });

    expect(r2).toHaveLength(1);
    expect(r3).toHaveLength(1);

    tab1.destroy();
    tab2.destroy();
    tab3.destroy();
  });

  it("unsubscribe stops receiving events", () => {
    const tab1 = createCrossTabShareSync();
    const tab2 = createCrossTabShareSync();

    const received: unknown[] = [];
    const unsub = tab2.onShareState((s) => received.push(s));

    tab1.broadcastShareState({ symbol: "GOOG" });
    expect(received).toHaveLength(1);

    unsub();
    tab1.broadcastShareState({ symbol: "META" });
    expect(received).toHaveLength(1);

    tab1.destroy();
    tab2.destroy();
  });

  it("destroy stops receiving events", () => {
    const tab1 = createCrossTabShareSync();
    const tab2 = createCrossTabShareSync();

    const received: unknown[] = [];
    tab2.onShareState((s) => received.push(s));
    tab2.destroy();

    tab1.broadcastShareState({ symbol: "TSLA" });
    expect(received).toHaveLength(0);
    tab1.destroy();
  });

  it("ignores non-object payloads", () => {
    const tab1 = createCrossTabShareSync();
    const tab2 = createCrossTabShareSync();

    const received: unknown[] = [];
    tab2.onShareState((s) => received.push(s));

    // Directly broadcast a non-object via underlying sync
    // (simulate a rogue message from a different app)
    tab1.broadcastShareState(null as unknown as Record<string, string>);

    // null is not a plain object — handler should not be called
    expect(received).toHaveLength(0);

    tab1.destroy();
    tab2.destroy();
  });

  it("gracefully degrades when BroadcastChannel is unavailable", () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    const sync = createCrossTabShareSync();
    const handler = vi.fn();
    const unsub = sync.onShareState(handler);

    expect(() => sync.broadcastShareState({ symbol: "AMD" })).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
    expect(() => unsub()).not.toThrow();
    expect(() => sync.destroy()).not.toThrow();
  });
});
