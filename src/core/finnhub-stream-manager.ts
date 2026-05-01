/**
 * Finnhub Stream Manager — B1: live WebSocket streaming overlay for the watchlist.
 *
 * Wraps {@link createFinnhubStream} with:
 *   - Persistent API key via `localStorage` (key: {@link FINNHUB_KEY_STORAGE})
 *   - In-memory live price map keyed by ticker (overrides last poll price)
 *   - Connection-status signal so the UI can show a "LIVE" badge
 *   - Clean start/stop/restart lifecycle
 *
 * Security: the API key is stored only in `localStorage` on the user's device
 * and is transmitted only to `wss://ws.finnhub.io`. It is **never** sent to
 * any CrossTide backend. Users who wish to avoid key exposure should set up the
 * Cloudflare Worker proxy and supply the proxy WSS URL instead.
 */
import { createFinnhubStream } from "./finnhub-ws";
import type { FinnhubStream, FinnhubTradeTick, FinnhubStreamOptions } from "./finnhub-ws";

export const FINNHUB_KEY_STORAGE = "crosstide-finnhub-key";

export type StreamStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface LiveTick {
  readonly ticker: string;
  readonly price: number;
  readonly volume: number;
  readonly timestamp: number;
}

export interface StreamManagerOptions {
  /** Override WebSocket constructor (for tests). */
  readonly WebSocketImpl?: typeof WebSocket;
  /** Override WSS URL (for Worker proxy or tests). */
  readonly wssUrl?: string;
}

export interface StreamManager {
  /**
   * Start streaming for the given tickers.
   * @param apiKey  - Finnhub API key (will be persisted in localStorage)
   * @param tickers - Initial ticker list to subscribe to
   */
  start(apiKey: string, tickers: readonly string[]): void;
  /** Update the active ticker subscriptions without restarting the connection. */
  setTickers(tickers: readonly string[]): void;
  /** Tear down the active stream. Preserves the stored API key. */
  stop(): void;
  /** Return the latest live price for a ticker, or undefined if not yet received. */
  getLivePrice(ticker: string): number | undefined;
  /** Current connection status. */
  getStatus(): StreamStatus;
  /** Whether a stream is currently active. */
  isActive(): boolean;
  /** Register a callback for every incoming trade tick. */
  onLiveTick(cb: (tick: LiveTick) => void): void;
  /** Register a callback for connection status changes. */
  onStatusChange(cb: (status: StreamStatus) => void): void;
}

export function createStreamManager(opts: StreamManagerOptions = {}): StreamManager {
  let stream: FinnhubStream | null = null;
  let status: StreamStatus = "idle";
  let activeTickers: Set<string> = new Set();

  const livePrices = new Map<string, number>();
  const tickCallbacks: Array<(tick: LiveTick) => void> = [];
  const statusCallbacks: Array<(s: StreamStatus) => void> = [];

  function setStatus(s: StreamStatus): void {
    if (status === s) return;
    status = s;
    for (const cb of statusCallbacks) cb(s);
  }

  function start(apiKey: string, tickers: readonly string[]): void {
    stop();

    const trimmedKey = apiKey.trim();
    if (!trimmedKey) return;

    try {
      localStorage.setItem(FINNHUB_KEY_STORAGE, trimmedKey);
    } catch {
      // localStorage may be unavailable in tests or restricted environments — ignore
    }

    activeTickers = new Set(tickers);
    setStatus("connecting");

    const streamOpts: FinnhubStreamOptions = {
      apiKey: trimmedKey,
      tickers: [...activeTickers],
      ...(opts.WebSocketImpl !== undefined && { WebSocketImpl: opts.WebSocketImpl }),
      ...(opts.wssUrl !== undefined && { wssUrl: opts.wssUrl }),
    };

    stream = createFinnhubStream(streamOpts);

    stream.onStatus((s) => {
      if (s === "connected") setStatus("connected");
      else if (s === "disconnected") setStatus("disconnected");
      else setStatus("error");
    });

    stream.onTrade((tick: FinnhubTradeTick) => {
      livePrices.set(tick.ticker, tick.price);
      const live: LiveTick = {
        ticker: tick.ticker,
        price: tick.price,
        volume: tick.volume,
        timestamp: tick.timestamp,
      };
      for (const cb of tickCallbacks) cb(live);
    });
  }

  function setTickers(tickers: readonly string[]): void {
    const next = new Set(tickers);
    if (!stream) {
      activeTickers = next;
      return;
    }
    // Unsubscribe removed tickers
    for (const t of activeTickers) {
      if (!next.has(t)) stream.unsubscribe(t);
    }
    // Subscribe new tickers
    for (const t of next) {
      if (!activeTickers.has(t)) stream.subscribe(t);
    }
    activeTickers = next;
  }

  function stop(): void {
    if (stream) {
      stream.destroy();
      stream = null;
    }
    setStatus("idle");
  }

  function getLivePrice(ticker: string): number | undefined {
    return livePrices.get(ticker);
  }

  function getStatus(): StreamStatus {
    return status;
  }

  function isActive(): boolean {
    return stream !== null;
  }

  function onLiveTick(cb: (tick: LiveTick) => void): void {
    tickCallbacks.push(cb);
  }

  function onStatusChange(cb: (s: StreamStatus) => void): void {
    statusCallbacks.push(cb);
  }

  return { start, setTickers, stop, getLivePrice, getStatus, isActive, onLiveTick, onStatusChange };
}

/** Read the stored Finnhub API key (or null if not set). */
export function getStoredFinnhubKey(): string | null {
  try {
    return localStorage.getItem(FINNHUB_KEY_STORAGE);
  } catch {
    return null;
  }
}

/** Remove the stored Finnhub API key. */
export function clearStoredFinnhubKey(): void {
  try {
    localStorage.removeItem(FINNHUB_KEY_STORAGE);
  } catch {
    // ignore
  }
}
