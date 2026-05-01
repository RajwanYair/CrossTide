/**
 * Service Worker update orchestration.
 *
 * Watches a registration for waiting / installing workers and surfaces an
 * "update available" notification via callback. The caller drives the UI
 * (toast, banner, etc.) and decides when to activate the new worker.
 */

export interface SwUpdateHandle {
  /** Tell the waiting worker to skipWaiting and become active. */
  applyUpdate(): void;
  /** Stop watching. */
  dispose(): void;
}

export interface SwUpdateOptions {
  /** Notified when an update is ready to be applied. */
  readonly onUpdateReady: (handle: SwUpdateHandle) => void;
  /** Polling interval (ms) for `registration.update()`. Default 60_000. */
  readonly pollIntervalMs?: number;
}

interface UpdatableRegistration {
  waiting: ServiceWorker | null;
  installing: ServiceWorker | null;
  active: ServiceWorker | null;
  update(): Promise<void>;
  addEventListener(type: "updatefound", listener: () => void): void;
}

function makeHandle(reg: UpdatableRegistration, cleanup: () => void): SwUpdateHandle {
  return {
    applyUpdate(): void {
      reg.waiting?.postMessage({ type: "SKIP_WAITING" });
    },
    dispose: cleanup,
  };
}

/**
 * Begin watching a SW registration for updates. Returns a disposer.
 */
export function watchServiceWorkerUpdates(
  registration: UpdatableRegistration,
  options: SwUpdateOptions,
): () => void {
  const interval = options.pollIntervalMs ?? 60_000;
  let timer: ReturnType<typeof setInterval> | null = null;
  let notified = false;

  const fire = (): void => {
    if (notified || !registration.waiting) return;
    notified = true;
    options.onUpdateReady(makeHandle(registration, dispose));
  };

  const onUpdateFound = (): void => {
    const w = registration.installing;
    if (!w) {
      // installing may already be active
      if (registration.waiting) fire();
      return;
    }
    w.addEventListener("statechange", () => {
      if (w.state === "installed" && registration.waiting) fire();
    });
  };

  registration.addEventListener("updatefound", onUpdateFound);

  // Initial: maybe already waiting
  if (registration.waiting) fire();

  // Periodic update probe
  timer = setInterval(() => {
    void registration.update();
  }, interval);

  function dispose(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  return dispose;
}
