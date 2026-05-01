/**
 * Finnhub WebSocket streaming — real-time trade quotes via Finnhub's WSS API.
 *
 * Protocol: Finnhub sends JSON messages:
 *   { type: "trade", data: [{ s: ticker, p: price, t: timestamp, v: volume }] }
 *   { type: "ping" }  (heartbeat — no response needed)
 *
 * Usage:
 *   const stream = createFinnhubStream({ apiKey: "your-key", tickers: ["AAPL","MSFT"] });
 *   stream.onTrade((tick) => console.log(tick.ticker, tick.price));
 *   stream.destroy();
 *
 * In a browser-only deployment without a Cloudflare Worker, the API key must
 * be passed explicitly. Prefer the Worker proxy in production to avoid key exposure.
 *
 * Rate limiting: Finnhub free tier allows subscribing to unlimited tickers per
 * connection but throttles messages to ~1/s per ticker.
 */
import { createReconnectingWS } from "./reconnecting-ws";
import type { ReconnectingWS } from "./reconnecting-ws";

export interface FinnhubTradeTick {
  /** Ticker symbol (e.g. "AAPL"). */
  readonly ticker: string;
  /** Last trade price. */
  readonly price: number;
  /** Trade volume. */
  readonly volume: number;
  /** Unix ms timestamp of the trade. */
  readonly timestamp: number;
}

export interface FinnhubStreamOptions {
  /**
   * Finnhub API key. In browser-only mode, pass the key directly.
   * When behind a Worker proxy, leave undefined and set wssUrl to your proxy.
   */
  readonly apiKey?: string;
  /** Override the default Finnhub WSS URL (e.g. for Worker proxy). */
  readonly wssUrl?: string;
  /** Tickers to subscribe to on connect. */
  readonly tickers?: readonly string[];
  /** Injectable WebSocket constructor for tests. */
  readonly WebSocketImpl?: typeof WebSocket;
  /** Max reconnect attempts. Default: Infinity. */
  readonly maxAttempts?: number;
}

export interface FinnhubStream {
  /** Add a ticker subscription at runtime. */
  subscribe(ticker: string): void;
  /** Remove a ticker subscription at runtime. */
  unsubscribe(ticker: string): void;
  /** Register a trade tick callback. */
  onTrade(cb: (tick: FinnhubTradeTick) => void): void;
  /** Register a connection status callback. */
  onStatus(cb: (status: "connected" | "disconnected" | "error") => void): void;
  /** Current connection state. */
  readonly isConnected: boolean;
  /** Tear down the connection. */
  destroy(): void;
}

const DEFAULT_WSS = "wss://ws.finnhub.io";

function buildWssUrl(opts: FinnhubStreamOptions): string {
  const base = opts.wssUrl ?? DEFAULT_WSS;
  if (opts.apiKey) return `${base}?token=${opts.apiKey}`;
  return base;
}

export function createFinnhubStream(opts: FinnhubStreamOptions = {}): FinnhubStream {
  const activeTickers = new Set<string>(opts.tickers ?? []);
  const tradeCallbacks: Array<(tick: FinnhubTradeTick) => void> = [];
  const statusCallbacks: Array<(s: "connected" | "disconnected" | "error") => void> = [];
  let connected = false;

  const url = buildWssUrl(opts);
  const reconnectOpts = {
    ...(opts.WebSocketImpl !== undefined && { WebSocketImpl: opts.WebSocketImpl }),
    ...(opts.maxAttempts !== undefined && { maxAttempts: opts.maxAttempts }),
  };
  const ws: ReconnectingWS = createReconnectingWS(url, reconnectOpts);

  function sendSubscribe(ticker: string): void {
    ws.send(JSON.stringify({ type: "subscribe", symbol: ticker }));
  }

  function sendUnsubscribe(ticker: string): void {
    ws.send(JSON.stringify({ type: "unsubscribe", symbol: ticker }));
  }

  function emitStatus(s: "connected" | "disconnected" | "error"): void {
    for (const cb of statusCallbacks) cb(s);
  }

  ws.on("open", () => {
    connected = true;
    emitStatus("connected");
    // Re-subscribe all active tickers after connect / reconnect
    for (const ticker of activeTickers) sendSubscribe(ticker);
  });

  ws.on("close", () => {
    connected = false;
    emitStatus("disconnected");
  });

  ws.on("error", () => {
    emitStatus("error");
  });

  ws.on("message", ({ data }) => {
    if (typeof data !== "string") return;
    let msg: unknown;
    try {
      msg = JSON.parse(data) as unknown;
    } catch {
      return;
    }
    if (
      !msg ||
      typeof msg !== "object" ||
      (msg as Record<string, unknown>)["type"] !== "trade"
    ) {
      return; // ping or unknown
    }
    const trades = (msg as Record<string, unknown>)["data"];
    if (!Array.isArray(trades)) return;
    for (const raw of trades) {
      if (!raw || typeof raw !== "object") continue;
      const r = raw as Record<string, unknown>;
      const ticker = typeof r["s"] === "string" ? r["s"] : null;
      const price = typeof r["p"] === "number" ? r["p"] : null;
      const volume = typeof r["v"] === "number" ? r["v"] : 0;
      const timestamp = typeof r["t"] === "number" ? r["t"] : Date.now();
      if (!ticker || price === null) continue;
      const tick: FinnhubTradeTick = { ticker, price, volume, timestamp };
      for (const cb of tradeCallbacks) cb(tick);
    }
  });

  return {
    subscribe(ticker: string): void {
      if (activeTickers.has(ticker)) return;
      activeTickers.add(ticker);
      if (connected) sendSubscribe(ticker);
    },

    unsubscribe(ticker: string): void {
      if (!activeTickers.has(ticker)) return;
      activeTickers.delete(ticker);
      if (connected) sendUnsubscribe(ticker);
    },

    onTrade(cb: (tick: FinnhubTradeTick) => void): void {
      tradeCallbacks.push(cb);
    },

    onStatus(cb: (s: "connected" | "disconnected" | "error") => void): void {
      statusCallbacks.push(cb);
    },

    get isConnected(): boolean {
      return connected;
    },

    destroy(): void {
      ws.close();
      tradeCallbacks.length = 0;
      statusCallbacks.length = 0;
    },
  };
}
