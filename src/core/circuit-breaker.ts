/**
 * Three-state circuit breaker (closed / open / half-open) for provider
 * fault isolation. Pure logic — caller decides what to do with the
 * decision. State is serializable so it can be persisted in IndexedDB.
 */

export type BreakerState = "closed" | "open" | "half-open";

export interface BreakerConfig {
  /** Consecutive failures that trip from closed → open. Default 5. */
  readonly failureThreshold?: number;
  /** Ms to wait before half-open probe. Default 30_000. */
  readonly cooldownMs?: number;
  /** Successes in half-open required to close. Default 2. */
  readonly halfOpenSuccesses?: number;
}

export interface BreakerSnapshot {
  readonly state: BreakerState;
  readonly failures: number;
  readonly successes: number;
  readonly openedAt: number | null;
}

export interface CircuitBreaker {
  readonly snapshot: () => BreakerSnapshot;
  /** Returns true if a call should be allowed at `now`. */
  readonly allow: (now?: number) => boolean;
  readonly recordSuccess: (now?: number) => void;
  readonly recordFailure: (now?: number) => void;
  readonly reset: () => void;
}

const DEFAULTS = {
  failureThreshold: 5,
  cooldownMs: 30_000,
  halfOpenSuccesses: 2,
} as const;

export function createCircuitBreaker(
  config: BreakerConfig = {},
  initial?: BreakerSnapshot,
): CircuitBreaker {
  const failureThreshold = config.failureThreshold ?? DEFAULTS.failureThreshold;
  const cooldownMs = config.cooldownMs ?? DEFAULTS.cooldownMs;
  const halfOpenSuccesses = config.halfOpenSuccesses ?? DEFAULTS.halfOpenSuccesses;

  let state: BreakerState = initial?.state ?? "closed";
  let failures = initial?.failures ?? 0;
  let successes = initial?.successes ?? 0;
  let openedAt: number | null = initial?.openedAt ?? null;

  const tryHalfOpen = (now: number): void => {
    if (state === "open" && openedAt !== null && now - openedAt >= cooldownMs) {
      state = "half-open";
      successes = 0;
    }
  };

  return {
    snapshot: (): BreakerSnapshot => ({ state, failures, successes, openedAt }),
    allow: (now = Date.now()): boolean => {
      tryHalfOpen(now);
      return state !== "open";
    },
    recordSuccess: (now = Date.now()): void => {
      tryHalfOpen(now);
      if (state === "half-open") {
        successes++;
        if (successes >= halfOpenSuccesses) {
          state = "closed";
          failures = 0;
          successes = 0;
          openedAt = null;
        }
      } else if (state === "closed") {
        failures = 0;
      }
    },
    recordFailure: (now = Date.now()): void => {
      tryHalfOpen(now);
      if (state === "half-open") {
        state = "open";
        openedAt = now;
        successes = 0;
      } else if (state === "closed") {
        failures++;
        if (failures >= failureThreshold) {
          state = "open";
          openedAt = now;
        }
      }
    },
    reset: (): void => {
      state = "closed";
      failures = 0;
      successes = 0;
      openedAt = null;
    },
  };
}
