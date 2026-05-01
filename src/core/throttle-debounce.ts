/**
 * Debounce: defer fn until `delayMs` has elapsed without calls.
 * Throttle: invoke at most once every `intervalMs` (leading + trailing).
 * Both return a function with `cancel()` and `flush()` helpers.
 */

export interface Cancellable<F extends (...args: never[]) => unknown> {
  (...args: Parameters<F>): void;
  readonly cancel: () => void;
  readonly flush: () => void;
}

export function debounce<F extends (...args: never[]) => unknown>(
  fn: F,
  delayMs: number,
): Cancellable<F> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<F> | null = null;

  const wrapped = ((...args: Parameters<F>): void => {
    lastArgs = args;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const a = lastArgs;
      lastArgs = null;
      if (a) fn(...a);
    }, delayMs);
  }) as Cancellable<F>;

  (wrapped as { cancel: () => void }).cancel = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };
  (wrapped as { flush: () => void }).flush = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
      const a = lastArgs;
      lastArgs = null;
      if (a) fn(...a);
    }
  };
  return wrapped;
}

export function throttle<F extends (...args: never[]) => unknown>(
  fn: F,
  intervalMs: number,
): Cancellable<F> {
  let lastInvoke = -Infinity;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<F> | null = null;

  const invoke = (args: Parameters<F>, now: number): void => {
    lastInvoke = now;
    pendingArgs = null;
    fn(...args);
  };

  const wrapped = ((...args: Parameters<F>): void => {
    const now = Date.now();
    const remaining = intervalMs - (now - lastInvoke);
    if (remaining <= 0) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      invoke(args, now);
    } else {
      pendingArgs = args;
      if (timer === null) {
        timer = setTimeout(() => {
          timer = null;
          if (pendingArgs) invoke(pendingArgs, Date.now());
        }, remaining);
      }
    }
  }) as Cancellable<F>;

  (wrapped as { cancel: () => void }).cancel = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pendingArgs = null;
    lastInvoke = -Infinity;
  };
  (wrapped as { flush: () => void }).flush = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
      if (pendingArgs) invoke(pendingArgs, Date.now());
    }
  };
  return wrapped;
}
