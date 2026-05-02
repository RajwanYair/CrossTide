/**
 * Unit tests for WebSocket fan-out channel manager (H10).
 */
import { describe, it, expect, vi } from "vitest";
import { createChannelManager, WS_OPEN } from "../../../src/core/ws-fanout";
import type { WsLike } from "../../../src/core/ws-fanout";

// ── helpers ──────────────────────────────────────────────────────────────

function mockWs(readyState = WS_OPEN): WsLike & { send: ReturnType<typeof vi.fn> } {
  return { send: vi.fn(), readyState };
}

// ── join / leave ─────────────────────────────────────────────────────────

describe("join / leave", () => {
  it("adds subscriber to a channel", () => {
    const mgr = createChannelManager();
    const ws = mockWs();
    mgr.join("AAPL", ws);
    expect(mgr.subscriberCount("AAPL")).toBe(1);
  });

  it("ignores duplicate join", () => {
    const mgr = createChannelManager();
    const ws = mockWs();
    mgr.join("AAPL", ws);
    mgr.join("AAPL", ws);
    expect(mgr.subscriberCount("AAPL")).toBe(1);
  });

  it("leave returns true on success", () => {
    const mgr = createChannelManager();
    const ws = mockWs();
    mgr.join("AAPL", ws);
    expect(mgr.leave("AAPL", ws)).toBe(true);
    expect(mgr.subscriberCount("AAPL")).toBe(0);
  });

  it("leave returns false if not subscribed", () => {
    const mgr = createChannelManager();
    expect(mgr.leave("AAPL", mockWs())).toBe(false);
  });

  it("removes empty channel after last leave", () => {
    const mgr = createChannelManager();
    const ws = mockWs();
    mgr.join("AAPL", ws);
    mgr.leave("AAPL", ws);
    expect(mgr.hasChannel("AAPL")).toBe(false);
  });
});

// ── leaveAll ─────────────────────────────────────────────────────────────

describe("leaveAll", () => {
  it("removes ws from all channels", () => {
    const mgr = createChannelManager();
    const ws = mockWs();
    mgr.join("AAPL", ws);
    mgr.join("MSFT", ws);
    mgr.join("GOOG", ws);
    const count = mgr.leaveAll(ws);
    expect(count).toBe(3);
    expect(mgr.channels()).toHaveLength(0);
  });

  it("returns 0 for unknown ws", () => {
    const mgr = createChannelManager();
    expect(mgr.leaveAll(mockWs())).toBe(0);
  });
});

// ── broadcast ────────────────────────────────────────────────────────────

describe("broadcast", () => {
  it("sends to all open subscribers in channel", () => {
    const mgr = createChannelManager();
    const ws1 = mockWs();
    const ws2 = mockWs();
    mgr.join("AAPL", ws1);
    mgr.join("AAPL", ws2);
    const sent = mgr.broadcast("AAPL", '{"p":150}');
    expect(sent).toBe(2);
    expect(ws1.send).toHaveBeenCalledWith('{"p":150}');
    expect(ws2.send).toHaveBeenCalledWith('{"p":150}');
  });

  it("skips closed connections", () => {
    const mgr = createChannelManager();
    const open = mockWs(WS_OPEN);
    const closed = mockWs(3); // CLOSED
    mgr.join("AAPL", open);
    mgr.join("AAPL", closed);
    const sent = mgr.broadcast("AAPL", "data");
    expect(sent).toBe(1);
    expect(closed.send).not.toHaveBeenCalled();
  });

  it("excludes specified connection", () => {
    const mgr = createChannelManager();
    const ws1 = mockWs();
    const ws2 = mockWs();
    mgr.join("AAPL", ws1);
    mgr.join("AAPL", ws2);
    mgr.broadcast("AAPL", "data", ws1);
    expect(ws1.send).not.toHaveBeenCalled();
    expect(ws2.send).toHaveBeenCalled();
  });

  it("returns 0 for nonexistent channel", () => {
    const mgr = createChannelManager();
    expect(mgr.broadcast("NONE", "data")).toBe(0);
  });
});

// ── broadcastAll ─────────────────────────────────────────────────────────

describe("broadcastAll", () => {
  it("sends to all channels", () => {
    const mgr = createChannelManager();
    const ws1 = mockWs();
    const ws2 = mockWs();
    mgr.join("AAPL", ws1);
    mgr.join("MSFT", ws2);
    const total = mgr.broadcastAll("tick");
    expect(total).toBe(2);
  });

  it("respects exclude across channels", () => {
    const mgr = createChannelManager();
    const ws = mockWs();
    mgr.join("AAPL", ws);
    mgr.join("MSFT", ws);
    expect(mgr.broadcastAll("tick", ws)).toBe(0);
  });
});

// ── getMeta ──────────────────────────────────────────────────────────────

describe("getMeta", () => {
  it("stores and retrieves metadata", () => {
    const mgr = createChannelManager<{ userId: string }>();
    const ws = mockWs();
    mgr.join("AAPL", ws, { userId: "u1" });
    expect(mgr.getMeta("AAPL", ws)).toEqual({ userId: "u1" });
  });

  it("returns undefined for unknown ws", () => {
    const mgr = createChannelManager();
    expect(mgr.getMeta("AAPL", mockWs())).toBeUndefined();
  });

  it("returns undefined for unknown channel", () => {
    const mgr = createChannelManager();
    expect(mgr.getMeta("NONE", mockWs())).toBeUndefined();
  });
});

// ── hasChannel / subscriberCount / channels ──────────────────────────────

describe("hasChannel", () => {
  it("returns true for active channels", () => {
    const mgr = createChannelManager();
    mgr.join("AAPL", mockWs());
    expect(mgr.hasChannel("AAPL")).toBe(true);
  });

  it("returns false for empty/missing channels", () => {
    const mgr = createChannelManager();
    expect(mgr.hasChannel("AAPL")).toBe(false);
  });
});

describe("channels", () => {
  it("lists all active channel names", () => {
    const mgr = createChannelManager();
    mgr.join("AAPL", mockWs());
    mgr.join("MSFT", mockWs());
    expect(mgr.channels().sort()).toEqual(["AAPL", "MSFT"]);
  });
});

// ── prune ────────────────────────────────────────────────────────────────

describe("prune", () => {
  it("removes closed connections", () => {
    const mgr = createChannelManager();
    const open = mockWs(WS_OPEN);
    const closing = mockWs(2);
    const closed = mockWs(3);
    mgr.join("AAPL", open);
    mgr.join("AAPL", closing);
    mgr.join("AAPL", closed);
    const pruned = mgr.prune();
    expect(pruned).toBe(2);
    expect(mgr.subscriberCount("AAPL")).toBe(1);
  });

  it("removes empty channels after prune", () => {
    const mgr = createChannelManager();
    mgr.join("AAPL", mockWs(3));
    mgr.prune();
    expect(mgr.hasChannel("AAPL")).toBe(false);
  });
});

// ── clear ────────────────────────────────────────────────────────────────

describe("clear", () => {
  it("removes all channels and subscribers", () => {
    const mgr = createChannelManager();
    mgr.join("AAPL", mockWs());
    mgr.join("MSFT", mockWs());
    mgr.clear();
    expect(mgr.channels()).toHaveLength(0);
    expect(mgr.stats().totalSubscribers).toBe(0);
  });
});

// ── stats ────────────────────────────────────────────────────────────────

describe("stats", () => {
  it("returns snapshot of manager state", () => {
    const mgr = createChannelManager();
    mgr.join("AAPL", mockWs());
    mgr.join("AAPL", mockWs());
    mgr.join("MSFT", mockWs());
    const s = mgr.stats();
    expect(s.channels).toBe(2);
    expect(s.totalSubscribers).toBe(3);
    expect(s.perChannel).toHaveLength(2);
  });
});
