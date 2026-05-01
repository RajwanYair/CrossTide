/**
 * Type-safe pub/sub event bus.
 *   Define a map of event-name -> payload type, then `createEventBus<Map>()`.
 *   `on(name, handler)` returns an unsubscribe fn. `emit(name, payload)`
 *   invokes handlers synchronously in registration order. Handler errors are
 *   isolated (logged via optional `onError`) so one failing subscriber cannot
 *   break others.
 */

export type EventMap = Record<string, unknown>;

export interface EventBus<M extends EventMap> {
  on<K extends keyof M>(name: K, handler: (payload: M[K]) => void): () => void;
  off<K extends keyof M>(name: K, handler: (payload: M[K]) => void): void;
  once<K extends keyof M>(name: K, handler: (payload: M[K]) => void): () => void;
  emit<K extends keyof M>(name: K, payload: M[K]): void;
  listenerCount<K extends keyof M>(name: K): number;
  removeAllListeners<K extends keyof M>(name?: K): void;
}

export interface EventBusOptions {
  readonly onError?: (error: unknown, eventName: string) => void;
}

export function createEventBus<M extends EventMap>(
  options: EventBusOptions = {},
): EventBus<M> {
  const handlers = new Map<keyof M, Set<(payload: unknown) => void>>();
  const onError = options.onError;

  const getSet = <K extends keyof M>(name: K): Set<(payload: unknown) => void> => {
    let s = handlers.get(name);
    if (!s) {
      s = new Set();
      handlers.set(name, s);
    }
    return s;
  };

  return {
    on(name, handler): () => void {
      const wrapped = handler as (payload: unknown) => void;
      getSet(name).add(wrapped);
      return (): void => {
        handlers.get(name)?.delete(wrapped);
      };
    },
    off(name, handler): void {
      handlers.get(name)?.delete(handler as (payload: unknown) => void);
    },
    once(name, handler): () => void {
      const wrapped = (payload: unknown): void => {
        handlers.get(name)?.delete(wrapped);
        (handler as (p: unknown) => void)(payload);
      };
      getSet(name).add(wrapped);
      return (): void => {
        handlers.get(name)?.delete(wrapped);
      };
    },
    emit(name, payload): void {
      const set = handlers.get(name);
      if (!set || set.size === 0) return;
      // snapshot so handlers can safely add/remove during iteration
      for (const h of [...set]) {
        try {
          h(payload);
        } catch (err) {
          if (onError) onError(err, String(name));
        }
      }
    },
    listenerCount(name): number {
      return handlers.get(name)?.size ?? 0;
    },
    removeAllListeners(name): void {
      if (name === undefined) handlers.clear();
      else handlers.delete(name);
    },
  };
}
