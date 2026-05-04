/**
 * Signal Store — structured reactive stores with actions and derived selectors.
 *
 * P6: Provides a `createStore()` factory that wraps signal primitives into
 * a cohesive store pattern (inspired by Zustand/Pinia but zero-dep).
 *
 * Usage:
 *   const counterStore = createStore({ count: 0 }, (get, set) => ({
 *     increment: () => set({ count: get().count + 1 }),
 *     decrement: () => set({ count: get().count - 1 }),
 *   }));
 *
 *   counterStore.state();       // { count: 0 }
 *   counterStore.actions.increment();
 *   counterStore.select(s => s.count); // ReadSignal<number>
 */

import { signal, computed, batch, type ReadSignal, type WriteSignal } from "./signals";

export interface Store<TState, TActions> {
  /** Read current state (reactive — tracks inside effects/computed). */
  readonly state: ReadSignal<TState>;
  /** Peek at state without subscribing. */
  readonly peek: () => TState;
  /** Bound action methods that can mutate state. */
  readonly actions: TActions;
  /** Create a derived selector (memoized computed). */
  readonly select: <R>(selector: (state: TState) => R) => ReadSignal<R>;
  /** Subscribe to state changes (non-tracking). */
  readonly subscribe: (fn: (state: TState) => void) => () => void;
  /** Reset to initial state. */
  readonly reset: () => void;
}

type ActionFactory<TState, TActions> = (
  get: () => TState,
  set: (partial: Partial<TState>) => void,
  update: (fn: (prev: TState) => Partial<TState>) => void,
) => TActions;

/**
 * Create a structured reactive store with typed state and actions.
 *
 * @param initialState - The initial state object
 * @param actionFactory - Factory that receives (get, set, update) and returns action methods
 */
export function createStore<TState extends object, TActions extends object>(
  initialState: TState,
  actionFactory: ActionFactory<TState, TActions>,
): Store<TState, TActions> {
  const $state = signal<TState>({ ...initialState });

  const get = (): TState => $state.peek();

  const set = (partial: Partial<TState>): void => {
    $state.set({ ...$state.peek(), ...partial });
  };

  const update = (fn: (prev: TState) => Partial<TState>): void => {
    const prev = $state.peek();
    $state.set({ ...prev, ...fn(prev) });
  };

  const actions = actionFactory(get, set, update);

  const select = <R>(selector: (state: TState) => R): ReadSignal<R> => {
    return computed(() => selector($state()));
  };

  const reset = (): void => {
    $state.set({ ...initialState });
  };

  return {
    state: $state,
    peek: get,
    actions,
    select,
    subscribe: $state.subscribe,
    reset,
  };
}

/**
 * Create a persisted store that saves to localStorage and syncs across tabs.
 */
export function createPersistedStore<TState extends object, TActions extends object>(
  key: string,
  initialState: TState,
  actionFactory: ActionFactory<TState, TActions>,
): Store<TState, TActions> {
  // Load persisted state
  let loaded = initialState;
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (raw) {
      loaded = { ...initialState, ...(JSON.parse(raw) as Partial<TState>) };
    }
  } catch {
    // Use initial state on parse failure
  }

  const store = createStore(loaded, actionFactory);

  // Persist on changes
  store.subscribe((state) => {
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(state));
    } catch {
      // Quota exceeded — silent
    }
  });

  // Cross-tab sync
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(`store:${key}`);
    let broadcasting = false;

    store.subscribe((state) => {
      if (!broadcasting) {
        broadcasting = true;
        channel.postMessage(state);
        broadcasting = false;
      }
    });

    channel.onmessage = (event: MessageEvent): void => {
      broadcasting = true;
      batch(() => {
        const incoming = event.data as TState;
        const writable = store.state as unknown as WriteSignal<TState>;
        writable.set(incoming);
      });
      broadcasting = false;
    };
  }

  return store;
}
