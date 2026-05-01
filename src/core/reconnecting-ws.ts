/**
 * Reconnecting WebSocket helper. Wraps a native WebSocket with
 * exponential backoff, message queueing while disconnected, and
 * lifecycle callbacks. The class accepts an injectable WebSocket
 * constructor for tests.
 */

export type WSEventHandler = (ev: { type: string; data?: unknown }) => void;

export interface ReconnectOptions {
  /** Min retry delay (ms). Default 500. */
  readonly minDelayMs?: number;
  /** Max retry delay (ms). Default 30000. */
  readonly maxDelayMs?: number;
  /** Backoff multiplier. Default 2. */
  readonly backoffMultiplier?: number;
  /** Random jitter [0..1] multiplied into delay. Default 0.2. */
  readonly jitter?: number;
  /** Max attempts before giving up. Default Infinity. */
  readonly maxAttempts?: number;
  /** Injectable constructor (defaults to globalThis.WebSocket). */
  readonly WebSocketImpl?: typeof WebSocket;
  /** Random source [0..1) — injectable for tests. */
  readonly random?: () => number;
}

const DEFAULT_OPTIONS: Required<Omit<ReconnectOptions, "WebSocketImpl" | "random" | "maxAttempts">> = {
  minDelayMs: 500,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
  jitter: 0.2,
};

export function nextBackoff(attempt: number, opts: ReconnectOptions = {}): number {
  const o = { ...DEFAULT_OPTIONS, ...opts };
  const random = opts.random ?? Math.random;
  const base = o.minDelayMs * Math.pow(o.backoffMultiplier, attempt);
  const capped = Math.min(o.maxDelayMs, base);
  const jitter = capped * o.jitter * random();
  return Math.round(capped + jitter);
}

export interface ReconnectingWS {
  send(msg: string): void;
  close(): void;
  readonly readyState: number;
  readonly attempt: number;
  on(event: "open" | "close" | "error" | "message", handler: WSEventHandler): void;
}

export function createReconnectingWS(
  url: string,
  options: ReconnectOptions = {},
): ReconnectingWS {
  const Impl =
    options.WebSocketImpl ??
    (globalThis as { WebSocket?: typeof WebSocket }).WebSocket;
  if (typeof Impl !== "function") {
    throw new Error("WebSocket implementation not available");
  }
  const handlers: Record<string, WSEventHandler[]> = {
    open: [],
    close: [],
    error: [],
    message: [],
  };
  const queue: string[] = [];
  let ws: WebSocket | null = null;
  let attempt = 0;
  let closedByUser = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const emit = (type: string, data?: unknown): void => {
    for (const h of handlers[type] ?? []) h({ type, data });
  };

  const connect = (): void => {
    if (closedByUser) return;
    const max = options.maxAttempts ?? Infinity;
    if (attempt >= max) {
      emit("error", new Error("max-attempts-reached"));
      return;
    }
    ws = new Impl(url);
    ws.addEventListener("open", () => {
      attempt = 0;
      while (queue.length > 0) {
        const msg = queue.shift();
        if (msg !== undefined) ws?.send(msg);
      }
      emit("open");
    });
    ws.addEventListener("message", (ev: MessageEvent) => {
      emit("message", ev.data);
    });
    ws.addEventListener("error", () => emit("error"));
    ws.addEventListener("close", () => {
      emit("close");
      if (closedByUser) return;
      const delay = nextBackoff(attempt, options);
      attempt++;
      timer = setTimeout(connect, delay);
    });
  };

  connect();

  return {
    send(msg: string): void {
      if (ws?.readyState === 1) {
        ws.send(msg);
      } else {
        queue.push(msg);
      }
    },
    close(): void {
      closedByUser = true;
      if (timer) clearTimeout(timer);
      ws?.close();
    },
    get readyState(): number {
      return ws?.readyState ?? 3;
    },
    get attempt(): number {
      return attempt;
    },
    on(event, handler): void {
      handlers[event]?.push(handler);
    },
  };
}
