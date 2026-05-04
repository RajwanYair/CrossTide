/**
 * Worker RPC unit tests — exercises the RPC protocol in-process using
 * fake Worker objects that echo messages synchronously.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createWorkerClient,
  serveWorkerRpc,
  type WorkerApi,
  type RpcRequest,
  type RpcResponse,
  type RpcError,
} from "../../../src/core/worker-rpc";

// ── fake Worker (minimal EventTarget) ────────────────────────────────────────

type Handler = (e: MessageEvent) => void;

class FakeWorker {
  private listeners: Handler[] = [];
  /** Messages received by the worker side. */
  public received: RpcRequest[] = [];
  /** Override to control what the worker sends back. */
  public reply: ((req: RpcRequest) => RpcResponse | RpcError) | null = null;

  addEventListener(_type: string, fn: Handler): void {
    this.listeners.push(fn);
  }

  postMessage(msg: unknown): void {
    const req = msg as RpcRequest;
    this.received.push(req);
    if (this.reply) {
      const response = this.reply(req);
      // Deliver synchronously to simulate a worker that responds immediately.
      for (const fn of this.listeners) {
        fn(new MessageEvent("message", { data: response }));
      }
    }
  }

  terminate(): void {
    this.terminated = true;
  }

  public terminated = false;
}

// ── helpers ───────────────────────────────────────────────────────────────────

interface CalcApi extends WorkerApi {
  add(a: number, b: number): number;
  fail(): never;
}

function makeSuccessWorker(): FakeWorker {
  const w = new FakeWorker();
  w.reply = (req) =>
    ({
      __rpc: true,
      id: req.id,
      ok: true,
      result: (req.args[0] as number) + (req.args[1] as number),
    }) satisfies RpcResponse;
  return w;
}

function makeErrorWorker(): FakeWorker {
  const w = new FakeWorker();
  w.reply = (req) =>
    ({
      __rpc: true,
      id: req.id,
      ok: false,
      message: "boom",
    }) satisfies RpcError;
  return w;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("createWorkerClient", () => {
  it("sends a correctly shaped RpcRequest", async () => {
    const w = makeSuccessWorker();
    const client = createWorkerClient<CalcApi>(w as unknown as Worker);
    await client.call("add", 3, 4);
    expect(w.received[0]).toMatchObject({
      __rpc: true,
      method: "add",
      args: [3, 4],
    });
    expect(typeof w.received[0]!.id).toBe("number");
  });

  it("resolves with the result", async () => {
    const w = makeSuccessWorker();
    const client = createWorkerClient<CalcApi>(w as unknown as Worker);
    const result = await client.call("add", 10, 5);
    expect(result).toBe(15);
  });

  it("rejects when worker returns ok: false", async () => {
    const w = makeErrorWorker();
    const client = createWorkerClient<CalcApi>(w as unknown as Worker);
    await expect(client.call("fail")).rejects.toThrow("boom");
  });

  it("increments request ids across calls", async () => {
    const w = makeSuccessWorker();
    const client = createWorkerClient<CalcApi>(w as unknown as Worker);
    await client.call("add", 1, 2);
    await client.call("add", 3, 4);
    const [first, second] = w.received;
    expect(second!.id).toBeGreaterThan(first!.id);
  });

  it("terminate rejects pending calls", async () => {
    // Worker that never replies
    const w = new FakeWorker();
    const client = createWorkerClient<CalcApi>(w as unknown as Worker);
    const p = client.call("add", 1, 2);
    client.terminate();
    await expect(p).rejects.toThrow("Worker terminated");
  });

  it("ignores non-RPC messages", async () => {
    const w = makeSuccessWorker();
    const client = createWorkerClient<CalcApi>(w as unknown as Worker);
    const p = client.call("add", 1, 1);
    // Inject a random message that should not interfere
    (w as unknown as { listeners: Handler[] }).listeners.forEach((fn) =>
      fn(new MessageEvent("message", { data: { unrelated: true } })),
    );
    const result = await p;
    expect(result).toBe(2);
  });
});

describe("serveWorkerRpc", () => {
  let selfMessages: unknown[] = [];
  let handler: ((e: MessageEvent) => void) | null = null;

  beforeEach(() => {
    selfMessages = [];
    // Patch globalThis.self to capture outbound messages
    const fakeSelf = {
      onmessage: null as ((e: MessageEvent) => void) | null,
      postMessage: (msg: unknown): void => {
        selfMessages.push(msg);
      },
    };

    (globalThis as any).self = fakeSelf;
    handler = null;
  });

  it("dispatches to registered method and replies ok", async () => {
    const api: CalcApi = {
      add: (a, b) => a + b,
      fail: () => {
        throw new Error("boom");
      },
    };
    serveWorkerRpc(api);

    handler = (globalThis as any).self.onmessage;
    const req: RpcRequest = {
      __rpc: true,
      id: 42,
      method: "add",
      args: [7, 3],
    };
    handler!(new MessageEvent("message", { data: req }));
    await new Promise((r) => setTimeout(r, 0));
    const reply = selfMessages[0] as RpcResponse;
    expect(reply.ok).toBe(true);
    expect(reply.result).toBe(10);
    expect(reply.id).toBe(42);
  });

  it("replies with ok: false on thrown error", async () => {
    const api: CalcApi = {
      add: (a, b) => a + b,
      fail: () => {
        throw new Error("test error");
      },
    };
    serveWorkerRpc(api);

    handler = (globalThis as any).self.onmessage;
    const req: RpcRequest = { __rpc: true, id: 9, method: "fail", args: [] };
    handler!(new MessageEvent("message", { data: req }));
    await new Promise((r) => setTimeout(r, 0));
    const reply = selfMessages[0] as RpcError;
    expect(reply.ok).toBe(false);
    expect(reply.message).toContain("test error");
  });

  it("replies unknown method error", async () => {
    serveWorkerRpc({} as WorkerApi);

    handler = (globalThis as any).self.onmessage;
    const req: RpcRequest = { __rpc: true, id: 1, method: "nope", args: [] };
    handler!(new MessageEvent("message", { data: req }));
    await new Promise((r) => setTimeout(r, 0));
    const reply = selfMessages[0] as RpcError;
    expect(reply.ok).toBe(false);
    expect(reply.message).toContain("Unknown method");
  });

  it("ignores non-rpc messages", async () => {
    serveWorkerRpc({} as WorkerApi);

    handler = (globalThis as any).self.onmessage;
    handler!(new MessageEvent("message", { data: { unrelated: true } }));
    await new Promise((r) => setTimeout(r, 0));
    expect(selfMessages).toHaveLength(0);
  });
});

// G12 — Symbol.dispose on WorkerClient
describe("WorkerClient Symbol.dispose", () => {
  it("implements Symbol.dispose", () => {
    const w = new FakeWorker();
    const client = createWorkerClient<CalcApi>(w as unknown as Worker);
    expect(typeof client[Symbol.dispose]).toBe("function");
  });

  it("Symbol.dispose terminates the worker", () => {
    const w = new FakeWorker();
    const client = createWorkerClient<CalcApi>(w as unknown as Worker);
    client[Symbol.dispose]();
    expect(w.terminated).toBe(true);
  });

  it("is usable with the using keyword", () => {
    const w = new FakeWorker();
    {
      using client = createWorkerClient<CalcApi>(w as unknown as Worker);
      void client;
    }
    expect(w.terminated).toBe(true);
  });
});
