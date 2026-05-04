/**
 * Durable Object WebSocket fan-out — R3.
 *
 * One Durable Object per ticker symbol. Clients connect via WebSocket;
 * the DO maintains a single upstream connection (or receives pushes from
 * a scheduled fetcher) and fans out updates to all connected clients.
 *
 * Protocol:
 *   Client → Server: { type: "subscribe", symbol: "AAPL" }
 *   Server → Client: { type: "quote", symbol, price, change, changePercent, time }
 *   Server → Client: { type: "error", message }
 *
 * The DO uses Cloudflare's WebSocket Hibernation API for cost efficiency.
 */

export interface QuoteMessage {
  type: "quote";
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  time: number;
}

export interface SubscribeMessage {
  type: "subscribe";
  symbol: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type WsOutbound = QuoteMessage | ErrorMessage;
export type WsInbound = SubscribeMessage;

// ── Durable Object class ──────────────────────────────────────────────────────

export class TickerFanout {
  private state: DurableObjectState;
  private sessions: Set<WebSocket> = new Set();
  private symbol = "";

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      return this.handleWebSocket(request);
    }

    if (url.pathname === "/broadcast" && request.method === "POST") {
      return this.handleBroadcast(request);
    }

    return new Response("Not found", { status: 404 });
  }

  /**
   * Upgrade HTTP → WebSocket with hibernation support.
   */
  private handleWebSocket(request: Request): Response {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    // Accept with hibernation tags for efficient hibernation/wake
    this.state.acceptWebSocket(server, ["ticker"]);
    this.sessions.add(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  /**
   * Receive a quote update from the worker (e.g. via scheduled cron or upstream)
   * and broadcast to all connected WebSocket clients.
   */
  private async handleBroadcast(request: Request): Promise<Response> {
    const data = (await request.json()) as QuoteMessage;
    this.symbol = data.symbol;
    this.broadcast(data);
    return new Response("OK", { status: 200 });
  }

  /**
   * WebSocket Hibernation API: called when a message arrives on a hibernated socket.
   */
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    try {
      const msg = JSON.parse(
        typeof message === "string" ? message : new TextDecoder().decode(message),
      ) as WsInbound;
      if (msg.type === "subscribe" && msg.symbol) {
        this.symbol = msg.symbol;
        // Send acknowledgement
        ws.send(JSON.stringify({ type: "subscribed", symbol: msg.symbol }));
      }
    } catch {
      ws.send(
        JSON.stringify({ type: "error", message: "Invalid message format" } satisfies ErrorMessage),
      );
    }
  }

  /**
   * WebSocket Hibernation API: called when a WebSocket closes.
   */
  webSocketClose(ws: WebSocket): void {
    this.sessions.delete(ws);
  }

  /**
   * WebSocket Hibernation API: called on WebSocket error.
   */
  webSocketError(ws: WebSocket): void {
    this.sessions.delete(ws);
  }

  /**
   * Fan-out a message to all connected sessions.
   */
  private broadcast(msg: WsOutbound): void {
    const payload = JSON.stringify(msg);
    // Use hibernation-aware getWebSockets() for all sessions (including hibernated)
    const sockets = this.state.getWebSockets("ticker");
    for (const ws of sockets) {
      try {
        ws.send(payload);
      } catch {
        // Client disconnected — remove from tracking
        this.sessions.delete(ws);
      }
    }
  }
}

// ── Type stubs for Cloudflare Durable Objects runtime ─────────────────────────

export interface DurableObjectState {
  acceptWebSocket(ws: WebSocket, tags?: string[]): void;
  getWebSockets(tag?: string): WebSocket[];
}

// ── Helper: route a WebSocket connection to the correct DO ────────────────────

export interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

export interface DurableObjectId {
  toString(): string;
}

export interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

/**
 * Get or create the Durable Object stub for a given ticker symbol.
 * Usage from worker route:
 *   const stub = getTickerStub(env.TICKER_FANOUT, "AAPL");
 *   return stub.fetch(request);
 */
export function getTickerStub(ns: DurableObjectNamespace, symbol: string): DurableObjectStub {
  const id = ns.idFromName(symbol.toUpperCase());
  return ns.get(id);
}
