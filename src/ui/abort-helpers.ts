/**
 * AbortSignal helpers (DOM-free, runtime-agnostic).
 *  - combineSignals: returns an AbortSignal that aborts when ANY input
 *    signal aborts. Honors signals already aborted at call time.
 *  - withTimeout: returns an AbortSignal that aborts after `ms`.
 *  - isAbortError: type-guard for the standard AbortError DOMException.
 */

export function combineSignals(
  ...signals: readonly (AbortSignal | undefined | null)[]
): AbortSignal {
  const ctrl = new AbortController();
  const filtered: AbortSignal[] = [];
  for (const s of signals) if (s) filtered.push(s);

  for (const s of filtered) {
    if (s.aborted) {
      ctrl.abort(s.reason);
      return ctrl.signal;
    }
  }
  const onAbort = (ev: Event): void => {
    const target = ev.target as AbortSignal;
    ctrl.abort(target.reason);
    for (const s of filtered) s.removeEventListener("abort", onAbort);
  };
  for (const s of filtered) s.addEventListener("abort", onAbort, { once: true });
  return ctrl.signal;
}

export function withTimeout(ms: number, reason: unknown = new Error("Timeout")): AbortSignal {
  const ctrl = new AbortController();
  if (ms <= 0) {
    ctrl.abort(reason);
    return ctrl.signal;
  }
  const id = setTimeout(() => ctrl.abort(reason), ms);
  ctrl.signal.addEventListener("abort", () => clearTimeout(id), { once: true });
  return ctrl.signal;
}

export function isAbortError(err: unknown): boolean {
  if (err === null || typeof err !== "object") return false;
  const name = (err as { name?: unknown }).name;
  return name === "AbortError";
}
