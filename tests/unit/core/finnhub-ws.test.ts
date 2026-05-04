/**
 * Finnhub WebSocket streaming tests (B1).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFinnhubStream } from "../../../src/core/finnhub-ws";

// ── Mock WebSocket ────────────────────────────────────────────────────────────

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
}

let lastWs: MockWebSocket | null = null;

function MockWSImpl(url: string): MockWebSocket {
  lastWs = new MockWebSocket(url);
  return lastWs;
}

describe("createFinnhubStream", () => {
  beforeEach(() => {
    lastWs = null;
  });

  it("creates with correct WSS URL including api key", () => {
    createFinnhubStream({
      apiKey: "test-key",
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    expect(lastWs?.url).toContain("test-key");
    expect(lastWs?.url).toContain("wss://ws.finnhub.io");
  });

  it("uses custom wssUrl when provided", () => {
    createFinnhubStream({
      wssUrl: "wss://my-proxy.example.com",
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    expect(lastWs?.url).toBe("wss://my-proxy.example.com");
  });

  it("subscribes to tickers on open", () => {
    createFinnhubStream({
      tickers: ["AAPL", "MSFT"],
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    lastWs!.simulateOpen();
    const sent = lastWs!.sent.map((s) => JSON.parse(s) as { type: string; symbol: string });
    expect(sent).toContainEqual({ type: "subscribe", symbol: "AAPL" });
    expect(sent).toContainEqual({ type: "subscribe", symbol: "MSFT" });
  });

  it("onStatus fires 'connected' on open", () => {
    const statusCb = vi.fn();
    const stream = createFinnhubStream({
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    stream.onStatus(statusCb);
    lastWs!.simulateOpen();
    expect(statusCb).toHaveBeenCalledWith("connected");
  });

  it("onStatus fires 'disconnected' on close", () => {
    const statusCb = vi.fn();
    const stream = createFinnhubStream({
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    stream.onStatus(statusCb);
    lastWs!.simulateOpen();
    lastWs!.simulateClose();
    expect(statusCb).toHaveBeenCalledWith("disconnected");
  });

  it("isConnected reflects connection state", () => {
    const stream = createFinnhubStream({
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    expect(stream.isConnected).toBe(false);
    lastWs!.simulateOpen();
    expect(stream.isConnected).toBe(true);
    lastWs!.simulateClose();
    expect(stream.isConnected).toBe(false);
  });

  it("onTrade fires with correct FinnhubTradeTick on trade message", () => {
    const tradeCb = vi.fn();
    const stream = createFinnhubStream({
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    stream.onTrade(tradeCb);
    lastWs!.simulateOpen();
    const msg = JSON.stringify({
      type: "trade",
      data: [{ s: "AAPL", p: 189.5, v: 1200, t: 1716000000000 }],
    });
    lastWs!.simulateMessage(msg);
    expect(tradeCb).toHaveBeenCalledWith({
      ticker: "AAPL",
      price: 189.5,
      volume: 1200,
      timestamp: 1716000000000,
    });
  });

  it("ignores ping messages without calling onTrade", () => {
    const tradeCb = vi.fn();
    const stream = createFinnhubStream({
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    stream.onTrade(tradeCb);
    lastWs!.simulateOpen();
    lastWs!.simulateMessage(JSON.stringify({ type: "ping" }));
    expect(tradeCb).not.toHaveBeenCalled();
  });

  it("subscribe() at runtime sends subscribe message when connected", () => {
    const stream = createFinnhubStream({
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    lastWs!.simulateOpen();
    lastWs!.sent = []; // clear initial subs
    stream.subscribe("GOOG");
    const sent = lastWs!.sent.map((s) => JSON.parse(s) as { type: string; symbol: string });
    expect(sent).toContainEqual({ type: "subscribe", symbol: "GOOG" });
  });

  it("unsubscribe() sends unsubscribe message when connected", () => {
    const stream = createFinnhubStream({
      tickers: ["AAPL"],
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    lastWs!.simulateOpen();
    lastWs!.sent = [];
    stream.unsubscribe("AAPL");
    const sent = lastWs!.sent.map((s) => JSON.parse(s) as { type: string; symbol: string });
    expect(sent).toContainEqual({ type: "unsubscribe", symbol: "AAPL" });
  });

  it("destroy() closes the connection", () => {
    const statusCb = vi.fn();
    const stream = createFinnhubStream({
      WebSocketImpl: MockWSImpl as unknown as typeof WebSocket,
    });
    stream.onStatus(statusCb);
    lastWs!.simulateOpen();
    stream.destroy();
    expect(lastWs!.readyState).toBe(MockWebSocket.CLOSED);
  });
});
