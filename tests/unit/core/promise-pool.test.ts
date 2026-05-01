import { describe, it, expect } from "vitest";
import { runPromisePool, runPromisePoolSettled } from "../../../src/core/promise-pool";

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe("promise-pool", () => {
  it("rejects bad concurrency", async () => {
    await expect(runPromisePool([], { concurrency: 0 })).rejects.toThrow(RangeError);
    await expect(runPromisePoolSettled([], 0)).rejects.toThrow(RangeError);
  });

  it("preserves order even with out-of-order completion", async () => {
    const tasks = [
      async () => {
        await wait(20);
        return "a";
      },
      async () => {
        await wait(1);
        return "b";
      },
      async () => {
        await wait(10);
        return "c";
      },
    ];
    const out = await runPromisePool(tasks, { concurrency: 3 });
    expect(out).toEqual(["a", "b", "c"]);
  });

  it("respects concurrency limit", async () => {
    let active = 0;
    let peak = 0;
    const tasks = Array.from({ length: 20 }, () => async () => {
      active++;
      peak = Math.max(peak, active);
      await wait(5);
      active--;
      return 1;
    });
    await runPromisePool(tasks, { concurrency: 4 });
    expect(peak).toBeLessThanOrEqual(4);
  });

  it("handles empty input", async () => {
    expect(await runPromisePool([], { concurrency: 4 })).toEqual([]);
    expect(await runPromisePoolSettled([], 4)).toEqual([]);
  });

  it("rejects on first failure (non-settled)", async () => {
    const tasks = [
      async () => "ok",
      async () => {
        throw new Error("boom");
      },
      async () => "after",
    ];
    await expect(runPromisePool(tasks, { concurrency: 1 })).rejects.toThrow("boom");
  });

  it("settled mode collects ok/error per task", async () => {
    const tasks = [
      async () => 1,
      async () => {
        throw new Error("x");
      },
      async () => 3,
    ];
    const out = await runPromisePoolSettled(tasks, 2);
    expect(out[0]).toEqual({ ok: true, value: 1 });
    expect(out[1]!.ok).toBe(false);
    expect(out[2]).toEqual({ ok: true, value: 3 });
  });

  it("concurrency higher than task count works", async () => {
    const tasks = [async () => 1, async () => 2];
    expect(await runPromisePool(tasks, { concurrency: 100 })).toEqual([1, 2]);
  });
});
