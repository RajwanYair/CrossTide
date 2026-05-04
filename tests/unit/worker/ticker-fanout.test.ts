/**
 * Tests for ticker-fanout Durable Object helper — R3.
 */
import { describe, it, expect } from "vitest";
import { getTickerStub, TickerFanout } from "../../../worker/ticker-fanout";
import type {
  DurableObjectNamespace,
  DurableObjectStub,
  DurableObjectState,
} from "../../../worker/ticker-fanout";

describe("getTickerStub", () => {
  it("normalizes symbol to uppercase", () => {
    let capturedName = "";
    const mockNs: DurableObjectNamespace = {
      idFromName(name: string) {
        capturedName = name;
        return { toString: () => name };
      },
      get() {
        return { fetch: async () => new Response() } as DurableObjectStub;
      },
    };
    getTickerStub(mockNs, "aapl");
    expect(capturedName).toBe("AAPL");
  });

  it("returns stub from namespace", () => {
    const mockStub = { fetch: async () => new Response("OK") } as DurableObjectStub;
    const mockNs: DurableObjectNamespace = {
      idFromName: (name: string) => ({ toString: () => name }),
      get: () => mockStub,
    };
    const stub = getTickerStub(mockNs, "MSFT");
    expect(stub).toBe(mockStub);
  });
});

describe("TickerFanout", () => {
  function createMockState(): DurableObjectState {
    const sockets: WebSocket[] = [];
    return {
      acceptWebSocket(ws: WebSocket) {
        sockets.push(ws);
      },
      getWebSockets() {
        return sockets;
      },
    };
  }

  it("returns 404 for unknown paths", async () => {
    const state = createMockState();
    const obj = new TickerFanout(state, {});
    const res = await obj.fetch(new Request("http://localhost/unknown"));
    expect(res.status).toBe(404);
  });

  it("returns 426 for non-WebSocket upgrade on /ws", async () => {
    const state = createMockState();
    const obj = new TickerFanout(state, {});
    const res = await obj.fetch(new Request("http://localhost/ws"));
    expect(res.status).toBe(426);
  });

  it("broadcasts quote to all sessions via /broadcast", async () => {
    const state = createMockState();
    const obj = new TickerFanout(state, {});

    const quote = {
      type: "quote",
      symbol: "AAPL",
      price: 150,
      change: 2,
      changePercent: 1.35,
      time: Date.now(),
    };
    const req = new Request("http://localhost/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    });
    const res = await obj.fetch(req);
    expect(res.status).toBe(200);
  });

  it("webSocketMessage handles subscribe message", () => {
    const state = createMockState();
    const obj = new TickerFanout(state, {});
    const sent: string[] = [];
    const mockWs = { send: (msg: string) => sent.push(msg) } as unknown as WebSocket;

    obj.webSocketMessage(mockWs, JSON.stringify({ type: "subscribe", symbol: "TSLA" }));
    expect(sent.length).toBe(1);
    expect(JSON.parse(sent[0]!)).toMatchObject({ type: "subscribed", symbol: "TSLA" });
  });

  it("webSocketMessage sends error on invalid JSON", () => {
    const state = createMockState();
    const obj = new TickerFanout(state, {});
    const sent: string[] = [];
    const mockWs = { send: (msg: string) => sent.push(msg) } as unknown as WebSocket;

    obj.webSocketMessage(mockWs, "not json");
    expect(sent.length).toBe(1);
    expect(JSON.parse(sent[0]!)).toMatchObject({ type: "error" });
  });

  it("webSocketClose removes session", () => {
    const state = createMockState();
    const obj = new TickerFanout(state, {});
    const mockWs = {} as WebSocket;
    obj.webSocketClose(mockWs);
    // No throw
  });

  it("webSocketError removes session", () => {
    const state = createMockState();
    const obj = new TickerFanout(state, {});
    const mockWs = {} as WebSocket;
    obj.webSocketError(mockWs);
    // No throw
  });
});
