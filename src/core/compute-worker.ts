/**
 * Compute Worker — runs CPU-intensive domain operations off the main thread.
 *
 * Exposed API: ComputeApi
 *   runBacktest(config, candles) → BacktestResult
 *
 * Instantiate via:
 *   new Worker(new URL("./compute-worker.ts", import.meta.url), { type: "module" })
 *
 * The worker is served via Vite's worker inlining in development and as a
 * hashed chunk in production builds.
 */
import type { DailyCandle } from "../types/domain";
import type { BacktestConfig, BacktestResult } from "../domain/backtest-engine";
import { runBacktest } from "../domain/backtest-engine";
import { serveWorkerRpc, type WorkerApi } from "./worker-rpc";

export interface ComputeApi extends WorkerApi {
  runBacktest(config: BacktestConfig, candles: readonly DailyCandle[]): BacktestResult;
}

serveWorkerRpc<ComputeApi>({
  runBacktest(config, candles) {
    return runBacktest(candles, config);
  },
});
