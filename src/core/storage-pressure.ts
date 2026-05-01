/**
 * Storage pressure — observes `navigator.storage.estimate()` usage and
 * triggers eviction callbacks once a quota threshold is crossed.
 */

export interface StorageEstimate {
  readonly usage: number;
  readonly quota: number;
  readonly ratio: number;
}

export interface StoragePressureOptions {
  /** Trigger eviction once usage/quota >= this value (0..1). Default 0.8. */
  readonly threshold?: number;
  /** Eviction callback. Async-safe. */
  readonly onPressure?: (estimate: StorageEstimate) => void | Promise<void>;
  /** Polling interval in ms. Default 60_000. */
  readonly intervalMs?: number;
  /** Optional override (tests). */
  readonly estimate?: () => Promise<StorageEstimate>;
}

export interface StoragePressureMonitor {
  start(): void;
  stop(): void;
  /** One-shot probe (also returns the current estimate). */
  check(): Promise<StorageEstimate | null>;
}

async function defaultEstimate(): Promise<StorageEstimate | null> {
  if (
    typeof navigator === "undefined" ||
    !navigator.storage ||
    typeof navigator.storage.estimate !== "function"
  ) {
    return null;
  }
  const e = await navigator.storage.estimate();
  const usage = typeof e.usage === "number" ? e.usage : 0;
  const quota = typeof e.quota === "number" && e.quota > 0 ? e.quota : 0;
  return { usage, quota, ratio: quota > 0 ? usage / quota : 0 };
}

/** Request persistent storage; returns true if granted. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.storage ||
    typeof navigator.storage.persist !== "function"
  ) {
    return false;
  }
  return navigator.storage.persist();
}

export function createStoragePressureMonitor(
  options: StoragePressureOptions = {},
): StoragePressureMonitor {
  const threshold = options.threshold ?? 0.8;
  const intervalMs = options.intervalMs ?? 60_000;
  const onPressure = options.onPressure;
  const probe = options.estimate;
  let timer: ReturnType<typeof setInterval> | null = null;

  async function check(): Promise<StorageEstimate | null> {
    const e = probe ? await probe() : await defaultEstimate();
    if (!e) return null;
    if (e.ratio >= threshold && onPressure) {
      await onPressure(e);
    }
    return e;
  }

  return {
    start(): void {
      if (timer !== null) return;
      timer = setInterval(() => {
        void check();
      }, intervalMs);
    },
    stop(): void {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    },
    check,
  };
}
