/**
 * Coverage tests for src/core/worker-rpc.ts
 * Targets uncovered lines 105-117: callWithTransfer method body.
 */
import { describe, it, expect, vi } from "vitest";
import {
  createWorkerClient,
  type WorkerApi,
  type RpcRequest,
  type RpcResponse,
  type RpcError,
} from "../../../src/core/worker-rpc";

// ── Fake Worker that accepts an optional transfer list ────────────────────────

type Handler = (e: MessageEvent) => void;

class FakeWorkerWithTransfer {
  private listeners: Handler[] = [];
  public received: Array<{ req: RpcRequest; transfer?: Transferable[] }> = [];
  public reply: ((req: RpcRequest) => RpcResponse | RpcError) | null = null;

  addEventListener(_type: string, fn: Handler): void {
    this.listeners.push(fn);
  }

  postMessage(msg: unknown, transfer?: Transferable[]): void {
    const req = msg as RpcRequest;
    this.received.push({ req, transfer });
    if (this.reply) {
      const response = this.reply(req);
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

// ── API type ──────────────────────────────────────────────────────────────────

interface TransferApi extends WorkerApi {
  processBuffer(data: string): string;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("worker-rpc callWithTransfer (lines 105-117)", () => {
  it("resolves when the worker replies with ok:true", async () => {
    const w = new FakeWorkerWithTransfer();
    w.reply = (req) =>
      ({
        __rpc: true,
        id: req.id,
        ok: true,
        result: `processed:${String(req.args[0])}`,
      }) satisfies RpcResponse;

    const client = createWorkerClient<TransferApi>(w as unknown as Worker);
    const buf = new ArrayBuffer(8);

    const result = await client.callWithTransfer("processBuffer", [buf], "hello");
    expect(result).toBe("processed:hello");
    // The transfer list should have been passed to postMessage
    expect(w.received[0]!.transfer).toEqual([buf]);
  });

  it("rejects when the worker replies with ok:false", async () => {
    const w = new FakeWorkerWithTransfer();
    w.reply = (req) =>
      ({
        __rpc: true,
        id: req.id,
        ok: false,
        message: "transfer failed",
      }) satisfies RpcError;

    const client = createWorkerClient<TransferApi>(w as unknown as Worker);
    const buf = new ArrayBuffer(4);

    await expect(client.callWithTransfer("processBuffer", [buf], "data")).rejects.toThrow(
      "transfer failed",
    );
  });

  it("increments the RPC id for each callWithTransfer invocation", async () => {
    const w = new FakeWorkerWithTransfer();
    w.reply = (req) => ({ __rpc: true, id: req.id, ok: true, result: "ok" }) satisfies RpcResponse;

    const client = createWorkerClient<TransferApi>(w as unknown as Worker);

    await client.callWithTransfer("processBuffer", [], "a");
    await client.callWithTransfer("processBuffer", [], "b");

    const ids = w.received.map((r) => r.req.id);
    expect(ids[0]).not.toEqual(ids[1]);
  });

  it("works with empty transfer list", async () => {
    const w = new FakeWorkerWithTransfer();
    w.reply = (req) =>
      ({ __rpc: true, id: req.id, ok: true, result: "empty" }) satisfies RpcResponse;

    const client = createWorkerClient<TransferApi>(w as unknown as Worker);
    const result = await client.callWithTransfer("processBuffer", [], "no-transfer");
    expect(result).toBe("empty");
    expect(w.received[0]!.transfer).toEqual([]);
  });
});

// Suppress unused import warnings
void vi;
