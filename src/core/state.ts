/**
 * Reactive State Store — EventTarget-based pub/sub.
 * Pattern borrowed from FamilyDashBoard's proven state.ts.
 */

type Listener<T> = (value: T) => void;

export interface Store<T extends Record<string, unknown>> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  on<K extends keyof T>(key: K, listener: Listener<T[K]>): () => void;
  snapshot(): Readonly<T>;
}

export function createStore<T extends Record<string, unknown>>(initial: T): Store<T> {
  const data = { ...initial };
  const listeners = new Map<keyof T, Set<Listener<unknown>>>();

  return {
    get<K extends keyof T>(key: K): T[K] {
      return data[key];
    },

    set<K extends keyof T>(key: K, value: T[K]): void {
      data[key] = value;
      const set = listeners.get(key);
      if (set) {
        for (const fn of set) {
          fn(value);
        }
      }
    },

    on<K extends keyof T>(key: K, listener: Listener<T[K]>): () => void {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      const wrapped = listener as Listener<unknown>;
      set.add(wrapped);
      return (): void => {
        set?.delete(wrapped);
      };
    },

    snapshot(): Readonly<T> {
      return { ...data };
    },
  };
}
