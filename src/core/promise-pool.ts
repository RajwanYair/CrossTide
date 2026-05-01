/**
 * Promise pool — bounded-concurrency runner. Submit N tasks, run at most
 * `concurrency` in parallel, resolve with results in submission order.
 *
 * Order preserved even when tasks settle out-of-order. Errors propagate
 * via `Promise.reject` from `runPromisePool`; in-flight tasks are awaited
 * but no new tasks are started after the first failure.
 */

export interface PromisePoolOptions {
  readonly concurrency: number;
  /** When true, all tasks run to completion even if some reject; result entries are
   *  `{ ok: true, value }` or `{ ok: false, error }`. Default false. */
  readonly settled?: boolean;
}

export type SettledResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: unknown };

export async function runPromisePool<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
  options: PromisePoolOptions,
): Promise<T[]> {
  const { concurrency } = options;
  if (concurrency <= 0) throw new RangeError("concurrency must be > 0");
  const results = new Array<T>(tasks.length);
  let next = 0;
  let aborted = false;

  const worker = async (): Promise<void> => {
    while (!aborted) {
      const i = next++;
      if (i >= tasks.length) return;
      try {
        results[i] = await tasks[i]!();
      } catch (err) {
        aborted = true;
        throw err;
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function runPromisePoolSettled<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
  concurrency: number,
): Promise<SettledResult<T>[]> {
  if (concurrency <= 0) throw new RangeError("concurrency must be > 0");
  const results = new Array<SettledResult<T>>(tasks.length);
  let next = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const i = next++;
      if (i >= tasks.length) return;
      try {
        const v = await tasks[i]!();
        results[i] = { ok: true, value: v };
      } catch (err) {
        results[i] = { ok: false, error: err };
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  return results;
}
