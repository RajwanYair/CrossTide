/**
 * Optimistic mutation helper. Applies a local change immediately and
 * either commits it or rolls it back depending on the outcome of an
 * async operation.
 *
 * Pure module — works with any state container that supports
 * snapshot-style get/set.
 */

export interface MutationStore<S> {
  get(): S;
  set(next: S): void;
}

export interface MutationOptions<S, T> {
  /** Pure function that produces the optimistic next state. */
  readonly apply: (state: S) => S;
  /** Async work whose success/failure decides whether to commit. */
  readonly commit: () => Promise<T>;
  /** Optional callback when the operation succeeds. */
  readonly onSuccess?: (result: T) => void;
  /** Optional callback when the operation fails. */
  readonly onError?: (err: unknown) => void;
}

export interface MutationResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: unknown;
}

export async function optimisticMutation<S, T>(
  store: MutationStore<S>,
  options: MutationOptions<S, T>,
): Promise<MutationResult<T>> {
  const snapshot = store.get();
  store.set(options.apply(snapshot));
  try {
    const value = await options.commit();
    options.onSuccess?.(value);
    return { ok: true, value };
  } catch (error) {
    store.set(snapshot);
    options.onError?.(error);
    return { ok: false, error };
  }
}

/**
 * Helper for the common case where the optimistic state is computed
 * from current state and a payload object.
 */
export function withPayload<S, P>(
  apply: (state: S, payload: P) => S,
): (payload: P) => (state: S) => S {
  return (payload) => (state) => apply(state, payload);
}
