import { describe, it, expect, vi, afterEach } from "vitest";
import {
  activateServiceWorkerUpdate,
  watchServiceWorkerUpdates,
} from "../../../src/core/sw-update";

interface FakeWorker {
  state: ServiceWorkerState;
  postMessage: (msg: unknown) => void;
  addEventListener: (type: "statechange", listener: () => void) => void;
  _emit: () => void;
}

function makeWorker(state: ServiceWorkerState = "installing"): FakeWorker {
  let listener: (() => void) | null = null;
  return {
    state,
    postMessage: vi.fn(),
    addEventListener: (_t, l): void => {
      listener = l;
    },
    _emit: (): void => {
      listener?.();
    },
  };
}

interface FakeReg {
  waiting: FakeWorker | null;
  installing: FakeWorker | null;
  active: FakeWorker | null;
  update: () => Promise<void>;
  addEventListener: (type: "updatefound", listener: () => void) => void;
  _emitUpdateFound: () => void;
}

function makeReg(): FakeReg {
  let listener: (() => void) | null = null;
  return {
    waiting: null,
    installing: null,
    active: null,
    update: vi.fn().mockResolvedValue(undefined),
    addEventListener: (_t, l): void => {
      listener = l;
    },
    _emitUpdateFound: (): void => listener?.(),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("sw-update", () => {
  it("reloads only after the new worker controls the page", () => {
    const calls: string[] = [];
    let onControllerChange: (() => void) | null = null;
    const handle = {
      applyUpdate: vi.fn(() => calls.push("apply")),
      dispose: vi.fn(() => calls.push("dispose")),
    };
    const controller = {
      addEventListener: vi.fn(
        (_type: "controllerchange", listener: () => void, options?: AddEventListenerOptions) => {
          calls.push("listen");
          onControllerChange = listener;
          expect(options).toEqual({ once: true });
        },
      ),
    };
    const reload = vi.fn(() => calls.push("reload"));

    activateServiceWorkerUpdate(handle, controller, reload);

    expect(calls).toEqual(["listen", "apply"]);
    expect(reload).not.toHaveBeenCalled();
    onControllerChange!();
    onControllerChange!();
    expect(calls).toEqual(["listen", "apply", "dispose", "reload"]);
  });

  it("notifies when waiting worker already exists", () => {
    const reg = makeReg();
    reg.waiting = makeWorker("installed");
    const ready = vi.fn();
    const dispose = watchServiceWorkerUpdates(
      reg as unknown as Parameters<typeof watchServiceWorkerUpdates>[0],
      { onUpdateReady: ready },
    );
    expect(ready).toHaveBeenCalledOnce();
    dispose();
  });

  it("notifies after updatefound + installed state", () => {
    const reg = makeReg();
    const installing = makeWorker("installing");
    reg.installing = installing;
    const ready = vi.fn();
    const dispose = watchServiceWorkerUpdates(
      reg as unknown as Parameters<typeof watchServiceWorkerUpdates>[0],
      { onUpdateReady: ready },
    );
    reg._emitUpdateFound();
    // simulate transition to installed and waiting now exists
    installing.state = "installed";
    reg.waiting = installing;
    installing._emit();
    expect(ready).toHaveBeenCalledOnce();
    dispose();
  });

  it("applyUpdate posts SKIP_WAITING", () => {
    const reg = makeReg();
    const w = makeWorker("installed");
    reg.waiting = w;
    let handle: { applyUpdate(): void; dispose(): void } | null = null;
    const dispose = watchServiceWorkerUpdates(
      reg as unknown as Parameters<typeof watchServiceWorkerUpdates>[0],
      {
        onUpdateReady: (h) => {
          handle = h;
        },
      },
    );
    handle!.applyUpdate();
    expect(w.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    dispose();
  });

  it("polls for updates", () => {
    vi.useFakeTimers();
    const reg = makeReg();
    const dispose = watchServiceWorkerUpdates(
      reg as unknown as Parameters<typeof watchServiceWorkerUpdates>[0],
      { onUpdateReady: vi.fn(), pollIntervalMs: 1000 },
    );
    vi.advanceTimersByTime(2500);
    expect(reg.update).toHaveBeenCalledTimes(2);
    dispose();
  });

  it("dispose stops polling", () => {
    vi.useFakeTimers();
    const reg = makeReg();
    const dispose = watchServiceWorkerUpdates(
      reg as unknown as Parameters<typeof watchServiceWorkerUpdates>[0],
      { onUpdateReady: vi.fn(), pollIntervalMs: 100 },
    );
    dispose();
    vi.advanceTimersByTime(1000);
    expect(reg.update).not.toHaveBeenCalled();
  });

  it("applyUpdate reports false when nothing is waiting", () => {
    const reg = makeReg();
    let handle: { applyUpdate(): boolean; dispose(): void } | null = null;
    const dispose = watchServiceWorkerUpdates(
      reg as unknown as Parameters<typeof watchServiceWorkerUpdates>[0],
      {
        onUpdateReady: (h) => {
          handle = h;
        },
      },
    );
    reg.waiting = makeWorker("installed");
    reg._emitUpdateFound();
    reg.waiting = null;
    expect(handle!.applyUpdate()).toBe(false);
    dispose();
  });

  it("activates immediately when there is no waiting worker", () => {
    const handle = { applyUpdate: vi.fn(() => false), dispose: vi.fn() };
    const controller = { addEventListener: vi.fn() };
    const reload = vi.fn();

    activateServiceWorkerUpdate(handle, controller, reload);

    expect(handle.dispose).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("reloads anyway when controllerchange never fires", () => {
    vi.useFakeTimers();
    const handle = { applyUpdate: vi.fn(() => true), dispose: vi.fn() };
    const controller = { addEventListener: vi.fn() };
    const reload = vi.fn();

    activateServiceWorkerUpdate(handle, controller, reload, 1000);

    expect(reload).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(reload).toHaveBeenCalledOnce();
  });

  it("does not double-fire when controllerchange beats the timeout", () => {
    vi.useFakeTimers();
    let onControllerChange: (() => void) | null = null;
    const handle = { applyUpdate: vi.fn(() => true), dispose: vi.fn() };
    const controller = {
      addEventListener: vi.fn((_t: "controllerchange", l: () => void) => {
        onControllerChange = l;
      }),
    };
    const reload = vi.fn();

    activateServiceWorkerUpdate(handle, controller, reload, 1000);
    onControllerChange!();
    vi.advanceTimersByTime(5000);

    expect(reload).toHaveBeenCalledOnce();
  });
});
