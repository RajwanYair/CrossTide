/**
 * Finnhub Stream Manager tests (B1).
 *
 * Tests the high-level stream manager wrapper without touching real WebSockets.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createStreamManager,
  getStoredFinnhubKey,
  clearStoredFinnhubKey,
  FINNHUB_KEY_STORAGE,
} from "../../../src/core/finnhub-stream-manager";

// ── Minimal MockWebSocket ─────────────────────────────────────────────────────
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((e: Event) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  sent: string[] = [];
  private listeners = new Map<string, Array<(e: Event) => void>>();

  constructor(url: string) {
    this.url = url;
  }

  send(data: string): void {
    this.sent.push(data);
  }
  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ type: "close" } as CloseEvent);
  }
  addEventListener(event: string, cb: (e: Event) => void): void {
    const list = this.listeners.get(event) ?? [];
    list.push(cb);
    this.listeners.set(event, list);
  }
  removeEventListener(event: string, cb: (e: Event) => void): void {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(
      event,
      list.filter((x) => x !== cb),
    );
  }
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.({ type: "open" } as Event);
    for (const cb of this.listeners.get("open") ?? []) cb({ type: "open" } as Event);
  }
  simulateMessage(data: string): void {
    const e = { type: "message", data } as MessageEvent;
    this.onmessage?.(e);
    for (const cb of this.listeners.get("message") ?? []) cb(e as unknown as Event);
  }
  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ type: "close" } as CloseEvent);
    for (const cb of this.listeners.get("close") ?? []) cb({ type: "close" } as Event);
  }
  simulateError(): void {
    this.onerror?.({ type: "error" } as Event);
    for (const cb of this.listeners.get("error") ?? []) cb({ type: "error" } as Event);
  }
}

let lastWs: MockWebSocket | null = null;
function MockWSImpl(url: string): MockWebSocket {
  lastWs = new MockWebSocket(url);
  return lastWs;
}

// ── localStorage stub ─────────────────────────────────────────────────────────
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
};
vi.stubGlobal("localStorage", localStorageMock);

describe("createStreamManager", () => {
  beforeEach(() => {
    lastWs = null;
    for (const k of Object.keys(store)) delete store[k];
  });
  afterEach(() => {
    for (const k of Object.keys(store)) delete store[k];
  });

  it("starts in idle state", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    expect(mgr.getStatus()).toBe("idle");
    expect(mgr.isActive()).toBe(false);
  });

  it("transitions to connecting when started", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    const statuses: string[] = [];
    mgr.onStatusChange((s) => statuses.push(s));
    mgr.start("test-key", ["AAPL"]);
    expect(statuses).toContain("connecting");
    expect(mgr.isActive()).toBe(true);
  });

  it("stores the API key in localStorage", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    mgr.start("my-secret-key", []);
    expect(localStorage.getItem(FINNHUB_KEY_STORAGE)).toBe("my-secret-key");
  });

  it("transitions to connected when WebSocket opens", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    const statuses: string[] = [];
    mgr.onStatusChange((s) => statuses.push(s));
    mgr.start("key", ["AAPL"]);
    lastWs!.simulateOpen();
    expect(statuses).toContain("connected");
    expect(mgr.getStatus()).toBe("connected");
  });

  it("subscribes to tickers after connect", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    mgr.start("key", ["AAPL", "TSLA"]);
    lastWs!.simulateOpen();
    const subs = lastWs!.sent.map((s: string) => JSON.parse(s) as Record<string, unknown>);
    const subscribed = subs.filter((m) => m["type"] === "subscribe").map((m) => m["symbol"]);
    expect(subscribed).toContain("AAPL");
    expect(subscribed).toContain("TSLA");
  });

  it("emits live price tick on trade message", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    const ticks: Array<{ ticker: string; price: number }> = [];
    mgr.onLiveTick((tick) => ticks.push({ ticker: tick.ticker, price: tick.price }));
    mgr.start("key", ["AAPL"]);
    lastWs!.simulateOpen();
    lastWs!.simulateMessage(
      JSON.stringify({ type: "trade", data: [{ s: "AAPL", p: 195.5, v: 100, t: Date.now() }] }),
    );
    expect(ticks).toHaveLength(1);
    expect(ticks[0]!.ticker).toBe("AAPL");
    expect(ticks[0]!.price).toBe(195.5);
  });

  it("updates live price store", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    mgr.start("key", ["MSFT"]);
    lastWs!.simulateOpen();
    lastWs!.simulateMessage(
      JSON.stringify({ type: "trade", data: [{ s: "MSFT", p: 420.0, v: 200, t: Date.now() }] }),
    );
    expect(mgr.getLivePrice("MSFT")).toBe(420.0);
  });

  it("getLivePrice returns undefined for unknown tickers", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    expect(mgr.getLivePrice("AAPL")).toBeUndefined();
  });

  it("transitions to disconnected when WebSocket closes", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    const statuses: string[] = [];
    mgr.onStatusChange((s) => statuses.push(s));
    mgr.start("key", []);
    lastWs!.simulateOpen();
    lastWs!.simulateClose();
    expect(statuses).toContain("disconnected");
  });

  it("transitions to error on WebSocket error", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    const statuses: string[] = [];
    mgr.onStatusChange((s) => statuses.push(s));
    mgr.start("key", []);
    lastWs!.simulateError();
    expect(statuses).toContain("error");
  });

  it("stop() tears down the stream and returns to idle", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    const statuses: string[] = [];
    mgr.onStatusChange((s) => statuses.push(s));
    mgr.start("key", ["AAPL"]);
    lastWs!.simulateOpen();
    mgr.stop();
    expect(mgr.isActive()).toBe(false);
    expect(statuses).toContain("idle");
  });

  it("setTickers subscribes new tickers while connected", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    mgr.start("key", ["AAPL"]);
    lastWs!.simulateOpen();
    const sentBefore = lastWs!.sent.length;
    mgr.setTickers(["AAPL", "GOOG"]);
    const newSent = lastWs!.sent
      .slice(sentBefore)
      .map((s: string) => JSON.parse(s) as Record<string, unknown>);
    const subscribed = newSent.filter((m) => m["type"] === "subscribe").map((m) => m["symbol"]);
    expect(subscribed).toContain("GOOG");
    expect(subscribed).not.toContain("AAPL"); // already subscribed
  });

  it("setTickers unsubscribes removed tickers while connected", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    mgr.start("key", ["AAPL", "TSLA"]);
    lastWs!.simulateOpen();
    const sentBefore = lastWs!.sent.length;
    mgr.setTickers(["AAPL"]); // remove TSLA
    const newSent = lastWs!.sent
      .slice(sentBefore)
      .map((s: string) => JSON.parse(s) as Record<string, unknown>);
    const unsubbed = newSent.filter((m) => m["type"] === "unsubscribe").map((m) => m["symbol"]);
    expect(unsubbed).toContain("TSLA");
  });

  it("ignores ping messages", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    const ticks: unknown[] = [];
    mgr.onLiveTick((t) => ticks.push(t));
    mgr.start("key", []);
    lastWs!.simulateOpen();
    lastWs!.simulateMessage(JSON.stringify({ type: "ping" }));
    expect(ticks).toHaveLength(0);
  });

  it("restart: stop then start creates a new connection", () => {
    const mgr = createStreamManager({ WebSocketImpl: MockWSImpl as unknown as typeof WebSocket });
    mgr.start("key", ["AAPL"]);
    const first = lastWs;
    lastWs!.simulateOpen();
    mgr.stop();
    mgr.start("key", ["TSLA"]);
    expect(lastWs).not.toBe(first);
    expect(mgr.isActive()).toBe(true);
  });
});

describe("getStoredFinnhubKey / clearStoredFinnhubKey", () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
  });

  it("returns null when nothing stored", () => {
    expect(getStoredFinnhubKey()).toBeNull();
  });

  it("returns stored key", () => {
    localStorage.setItem(FINNHUB_KEY_STORAGE, "abc123");
    expect(getStoredFinnhubKey()).toBe("abc123");
  });

  it("clearStoredFinnhubKey removes the key", () => {
    localStorage.setItem(FINNHUB_KEY_STORAGE, "abc123");
    clearStoredFinnhubKey();
    expect(getStoredFinnhubKey()).toBeNull();
  });
});
