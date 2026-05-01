/**
 * Screener worker facade — runs screener filter operations off-thread.
 *
 * Lazily creates one shared Worker instance via the existing compute-worker.
 * Falls back to synchronous applyFilters() when Worker API is unavailable.
 */
import { createWorkerClient, type WorkerClient } from "./worker-rpc";
import type { ComputeApi } from "./compute-worker";
import type { ScreenerInput, ScreenerFilter, ScreenerRow } from "../cards/screener";

let _worker: Worker | null = null;
let _client: WorkerClient<ComputeApi> | null = null;

function getClient(): WorkerClient<ComputeApi> {
  if (!_client) {
    _worker = new Worker(new URL("./compute-worker.ts", import.meta.url), {
      type: "module",
    });
    _client = createWorkerClient<ComputeApi>(_worker);
  }
  return _client;
}

/**
 * Run screener filters asynchronously in the compute worker.
 * Falls back to synchronous execution if Worker API is unavailable.
 */
export async function runScreenerAsync(
  inputs: readonly ScreenerInput[],
  filters: readonly ScreenerFilter[],
): Promise<ScreenerRow[]> {
  if (typeof Worker === "undefined") {
    const { applyFilters } = await import("../cards/screener");
    return applyFilters(inputs, filters);
  }
  return getClient().call("runScreener", inputs, filters);
}

export function disposeScreenerWorker(): void {
  _client?.terminate();
  _client = null;
  _worker = null;
}
