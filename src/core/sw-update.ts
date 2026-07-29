/**
 * Service Worker update orchestration.
 *
 * Watches a registration for waiting / installing workers and surfaces an
 * "update available" notification via callback. The caller drives the UI
 * (toast, banner, etc.) and decides when to activate the new worker.
 */

export interface SwUpdateHandle {
  /** Tell the waiting worker to skipWaiting. Returns false if none is waiting. */
  applyUpdate(): boolean;
  /** Stop watching. */
  dispose(): void;
}

/** Fallback delay before reloading anyway when `controllerchange` never fires. */
export const ACTIVATION_TIMEOUT_MS = 4_000;

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
  update(): Promise<ServiceWorkerRegistration | void>;
  addEventListener(type: "updatefound", listener: () => void): void;
}

interface ServiceWorkerController {
  addEventListener(
    type: "controllerchange",
    listener: () => void,
    options?: AddEventListenerOptions,
  ): void;
}

function makeHandle(reg: UpdatableRegistration, cleanup: () => void): SwUpdateHandle {
  return {
    applyUpdate(): boolean {
      const waiting = reg.waiting;
      if (!waiting) return false;
      waiting.postMessage({ type: "SKIP_WAITING" });
      return true;
    },
    dispose: cleanup,
  };
}

/**
 * Activate a waiting worker and run the callback once it controls the page.
 *
 * `controllerchange` is not guaranteed: the page may be uncontrolled, the
 * waiting worker may have vanished, or the browser may swallow the event.
 * A timeout therefore always runs `onActivated` so the UI never dead-ends.
 */
export function activateServiceWorkerUpdate(
  handle: SwUpdateHandle,
  controller: ServiceWorkerController,
  onActivated: () => void,
  timeoutMs: number = ACTIVATION_TIMEOUT_MS,
): void {
  let activated = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const finish = (): void => {
    if (activated) return;
    activated = true;
    if (timer !== null) clearTimeout(timer);
    handle.dispose();
    onActivated();
  };

  controller.addEventListener("controllerchange", finish, { once: true });

  if (!handle.applyUpdate()) {
    finish();
    return;
  }

  timer = setTimeout(finish, timeoutMs);
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
