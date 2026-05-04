/**
 * Tiny reactive primitive — fine-grained signals with computed and effect.
 *
 * Design goals:
 *   - Zero runtime dependencies (vanilla TS).
 *   - Lazy `computed` (only re-derives when read after a dependency changed).
 *   - Auto-tracking inside `effect` and `computed` (no manual `subscribe`).
 *   - Equality short-circuit (default `Object.is`) to avoid notification storms.
 *   - Persistent signals via `persistedSignal` (sync + cross-tab).
 *
 * This module deliberately implements the subset of the Preact/Solid signal
 * API that CrossTide needs, without taking a dependency on any framework.
 */

export interface ReadSignal<T> {
  /** Read current value and (when called inside an effect/computed) subscribe. */
  (): T;
  /** Read without subscribing. */
  readonly peek: () => T;
  /** Manually subscribe; returns unsubscribe. */
  readonly subscribe: (fn: (value: T) => void) => () => void;
}

export interface WriteSignal<T> extends ReadSignal<T> {
  /** Set a new value. */
  readonly set: (value: T) => void;
  /** Update via a function of the current value. */
  readonly update: (fn: (prev: T) => T) => void;
}

interface Subscriber {
  /** Bumped whenever this subscriber is re-run; stale links self-prune. */
  version: number;
  /** Sources this subscriber currently depends on. */
  sources: Set<SignalNode<unknown>>;
  /** Re-run the effect or invalidate the computed. */
  notify: () => void;
}

interface SignalNode<T> {
  value: T;
  equals: (a: T, b: T) => boolean;
  subscribers: Map<Subscriber, number>;
  /** External (non-tracking) listeners. */
  listeners: Set<(value: T) => void>;
}

const stack: Subscriber[] = [];
let batching = 0;
const pendingNotifications = new Set<Subscriber>();

function track<T>(node: SignalNode<T>): void {
  const sub = stack[stack.length - 1];
  if (!sub) return;
  node.subscribers.set(sub, sub.version);
  sub.sources.add(node as SignalNode<unknown>);
}

function notify<T>(node: SignalNode<T>, value: T): void {
  // External listeners first (sync, in registration order).
  for (const fn of node.listeners) fn(value);
  // Tracking subscribers — if batching, defer notifications.
  if (node.subscribers.size === 0) return;
  if (batching > 0) {
    for (const sub of node.subscribers.keys()) {
      pendingNotifications.add(sub);
    }
  } else {
    const subs = Array.from(node.subscribers.keys());
    for (const sub of subs) sub.notify();
  }
}

export interface SignalOptions<T> {
  equals?: (a: T, b: T) => boolean;
}

export function signal<T>(initial: T, options: SignalOptions<T> = {}): WriteSignal<T> {
  const node: SignalNode<T> = {
    value: initial,
    equals: options.equals ?? Object.is,
    subscribers: new Map(),
    listeners: new Set(),
  };

  const read = ((): T => {
    track(node);
    return node.value;
  }) as WriteSignal<T>;

  Object.defineProperty(read, "peek", { value: (): T => node.value });
  Object.defineProperty(read, "set", {
    value: (next: T): void => {
      if (node.equals(node.value, next)) return;
      node.value = next;
      notify(node, next);
    },
  });
  Object.defineProperty(read, "update", {
    value: (fn: (prev: T) => T): void => {
      const next = fn(node.value);
      if (node.equals(node.value, next)) return;
      node.value = next;
      notify(node, next);
    },
  });
  Object.defineProperty(read, "subscribe", {
    value: (fn: (value: T) => void): (() => void) => {
      node.listeners.add(fn);
      return (): void => {
        node.listeners.delete(fn);
      };
    },
  });

  return read;
}

export function computed<T>(fn: () => T, options: SignalOptions<T> = {}): ReadSignal<T> {
  let cached: T;
  let dirty = true;
  let initialized = false;
  const equals = options.equals ?? Object.is;

  const node: SignalNode<T> = {
    value: undefined as T,
    equals,
    subscribers: new Map(),
    listeners: new Set(),
  };

  const sub: Subscriber = {
    version: 0,
    sources: new Set(),
    notify: (): void => {
      if (dirty) return;
      dirty = true;
      // Propagate invalidation to anyone depending on this computed.
      notify(node, node.value);
    },
  };

  const recompute = (): T => {
    sub.version += 1;
    const oldSources = sub.sources;
    sub.sources = new Set();
    stack.push(sub);
    try {
      cached = fn();
    } finally {
      stack.pop();
    }
    // Prune sources we no longer depend on.
    for (const src of oldSources) {
      if (!sub.sources.has(src)) src.subscribers.delete(sub);
    }
    dirty = false;
    return cached;
  };

  const read = ((): T => {
    if (dirty) {
      const next = recompute();
      if (initialized && equals(node.value, next)) {
        // Value unchanged — clear dirty without notifying again.
      }
      node.value = next;
      initialized = true;
    }
    track(node);
    return node.value;
  }) as ReadSignal<T>;

  Object.defineProperty(read, "peek", {
    value: (): T => {
      if (dirty) {
        node.value = recompute();
        initialized = true;
      }
      return node.value;
    },
  });
  Object.defineProperty(read, "subscribe", {
    value: (fn: (value: T) => void): (() => void) => {
      node.listeners.add(fn);
      // Ensure we are computed at least once so subsequent invalidations fire.
      read.peek();
      return (): void => {
        node.listeners.delete(fn);
      };
    },
  });

  return read;
}

/**
 * Run `fn` and re-run whenever any signal it reads changes. Returns a
 * disposer that unsubscribes from all current sources.
 */
export function effect(fn: () => void): () => void {
  const sub: Subscriber = {
    version: 0,
    sources: new Set(),
    notify: (): void => {
      run();
    },
  };

  const run = (): void => {
    sub.version += 1;
    const old = sub.sources;
    sub.sources = new Set();
    stack.push(sub);
    try {
      fn();
    } finally {
      stack.pop();
    }
    for (const src of old) {
      if (!sub.sources.has(src)) src.subscribers.delete(sub);
    }
  };

  run();

  return (): void => {
    for (const src of sub.sources) src.subscribers.delete(sub);
    sub.sources.clear();
  };
}

/**
 * Read a signal without tracking, even from inside an effect.
 */
export function untracked<T>(fn: () => T): T {
  stack.push({ version: 0, sources: new Set(), notify: (): void => {} });
  try {
    return fn();
  } finally {
    stack.pop();
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Persistence
 * ──────────────────────────────────────────────────────────────────────── */

export interface PersistAdapter<T> {
  load: () => T | undefined;
  save: (value: T) => void;
}

/**
 * Default adapter backed by `localStorage` with JSON serialization.
 * Safe in non-browser environments (no-ops).
 */
export function localStorageAdapter<T>(key: string): PersistAdapter<T> {
  return {
    load: (): T | undefined => {
      try {
        const raw = globalThis.localStorage?.getItem(key);
        return raw == null ? undefined : (JSON.parse(raw) as T);
      } catch {
        return undefined;
      }
    },
    save: (value: T): void => {
      try {
        globalThis.localStorage?.setItem(key, JSON.stringify(value));
      } catch {
        // Quota / private mode — silently ignore.
      }
    },
  };
}

export interface PersistedSignalOptions<T> extends SignalOptions<T> {
  adapter?: PersistAdapter<T>;
  /** When set, sync changes across tabs via BroadcastChannel. */
  channel?: string;
}

export function persistedSignal<T>(
  key: string,
  initial: T,
  options: PersistedSignalOptions<T> = {},
): WriteSignal<T> {
  const adapter = options.adapter ?? localStorageAdapter<T>(key);
  const loaded = adapter.load();
  const sig = signal<T>(loaded === undefined ? initial : loaded, options);

  let suspendBroadcast = false;
  const channelName = options.channel ?? `crosstide:${key}`;
  const bc = typeof BroadcastChannel === "function" ? new BroadcastChannel(channelName) : undefined;

  sig.subscribe((value) => {
    adapter.save(value);
    if (!suspendBroadcast && bc) bc.postMessage(value);
  });

  if (bc) {
    bc.onmessage = (ev: MessageEvent<T>): void => {
      suspendBroadcast = true;
      try {
        sig.set(ev.data);
      } finally {
        suspendBroadcast = false;
      }
    };
  }

  return sig;
}

/**
 * Batch multiple signal writes — effects fire once at the end, deduplicating
 * subscribers that were notified multiple times within the batch. Nested
 * `batch()` calls are supported; only the outermost flush triggers effects.
 *
 * P5: Full implementation with deferred notify threading.
 */
export function batch<T>(fn: () => T): T {
  batching += 1;
  try {
    return fn();
  } finally {
    batching -= 1;
    if (batching === 0 && pendingNotifications.size > 0) {
      const queue = Array.from(pendingNotifications);
      pendingNotifications.clear();
      for (const sub of queue) sub.notify();
    }
  }
}
