/**
 * Worker RPC — lightweight typed postMessage channel.
 *
 * No external dependencies (`comlink` is unavailable). Uses a sequential
 * request-id scheme with `Promise` resolution.
 *
 * Usage (caller, main thread):
 *   const rpc = createWorkerClient<ComputeApi>(new Worker(...));
 *   const result = await rpc.call("runBacktest", config, candles);
 *
 * Usage (inside the worker):
 *   serveWorkerRpc<ComputeApi>({ runBacktest, ... });
 */

// ── message shapes ──────────────────────────────────────────────────────────

export interface RpcRequest {
  readonly __rpc: true;
  readonly id: number;
  readonly method: string;
  readonly args: readonly unknown[];
}

export interface RpcResponse {
  readonly __rpc: true;
  readonly id: number;
  readonly ok: true;
  readonly result: unknown;
}

export interface RpcError {
  readonly __rpc: true;
  readonly id: number;
  readonly ok: false;
  readonly message: string;
}

export type RpcMessage = RpcRequest | RpcResponse | RpcError;

// ── API shape helpers ────────────────────────────────────────────────────────

export type AnyFn = (...args: never[]) => unknown;
export type WorkerApi = { [K: string]: AnyFn };

export type WorkerClient<Api extends WorkerApi> = {
  call<K extends keyof Api>(
    method: K,
    ...args: Parameters<Api[K]>
  ): Promise<Awaited<ReturnType<Api[K]>>>;
  terminate(): void;
};

// ── client (main thread) ─────────────────────────────────────────────────────

let nextId = 1;

export function createWorkerClient<Api extends WorkerApi>(worker: Worker): WorkerClient<Api> {
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  worker.addEventListener("message", (e: MessageEvent<unknown>) => {
    const msg = e.data as RpcMessage;
    if (!msg || typeof msg !== "object" || !("__rpc" in msg) || !("id" in msg)) return;
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if ("ok" in msg) {
      if (msg.ok) p.resolve(msg.result);
      else p.reject(new Error(msg.message));
    }
  });

  return {
    call<K extends keyof Api>(
      method: K,
      ...args: Parameters<Api[K]>
    ): Promise<Awaited<ReturnType<Api[K]>>> {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, {
          resolve: (v) => resolve(v as Awaited<ReturnType<Api[K]>>),
          reject,
        });
        const req: RpcRequest = {
          __rpc: true,
          id,
          method: method as string,
          args,
        };
        worker.postMessage(req);
      });
    },
    terminate(): void {
      worker.terminate();
      for (const p of pending.values()) p.reject(new Error("Worker terminated"));
      pending.clear();
    },
  };
}

// ── server (inside worker) ───────────────────────────────────────────────────

export function serveWorkerRpc<Api extends Record<string, AnyFn>>(api: Api): void {
  // `self` is the global inside a Web Worker
  const ctx = self as unknown as Worker & {
    onmessage: ((e: MessageEvent) => void) | null;
  };
  const handler = (e: MessageEvent<unknown>): void => {
    const msg = e.data as RpcMessage;
    if (!msg || typeof msg !== "object" || !("__rpc" in msg) || !msg.__rpc) return;
    const req = msg as RpcRequest;
    const fn: AnyFn | undefined = api[req.method];
    if (typeof fn !== "function") {
      const err: RpcError = {
        __rpc: true,
        id: req.id,
        ok: false,
        message: `Unknown method: ${req.method}`,
      };
      (self as unknown as Worker).postMessage(err);
      return;
    }
    void Promise.resolve()
      .then(() => fn(...(req.args as never[])))
      .then((result) => {
        const res: RpcResponse = {
          __rpc: true,
          id: req.id,
          ok: true,
          result,
        };
        (self as unknown as Worker).postMessage(res);
      })
      .catch((ex: unknown) => {
        const err: RpcError = {
          __rpc: true,
          id: req.id,
          ok: false,
          message: ex instanceof Error ? ex.message : String(ex),
        };
        (self as unknown as Worker).postMessage(err);
      });
  };
  ctx.onmessage = handler;
}
